const express = require('express');
const axios = require('axios');
const router = express.Router();

// Data.gov.in API configuration
const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY;
const DATA_GOV_BASE_URL = process.env.DATA_GOV_BASE_URL || 'https://api.data.gov.in/resource';

// MGNREGA dataset IDs from data.gov.in
const DATASETS = {
  // These are example dataset IDs - you'll need to find the actual ones
  DISTRICT_WISE: '9ef84268-d588-465a-a308-a864a43d0070', // District-wise MGNREGA data
  STATE_WISE: '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69',   // State-wise MGNREGA data
  WORKS_DATA: '4c78ec33-ddd6-4d38-9b1b-7f0da7b6c0a1'    // Works completion data
};

// Helper function to make API calls to data.gov.in
const fetchFromDataGov = async (datasetId, params = {}) => {
  try {
    const response = await axios.get(`${DATA_GOV_BASE_URL}/${datasetId}`, {
      params: {
        'api-key': DATA_GOV_API_KEY,
        format: 'json',
        ...params
      },
      timeout: 10000 // 10 second timeout
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching from data.gov.in dataset ${datasetId}:`, error.message);
    throw new Error(`Failed to fetch data from government API: ${error.message}`);
  }
};

// GET /api/districts - List districts from live data
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, state, search } = req.query;
    const redis = req.app.locals.redis;

    // Create cache key
    const cacheKey = `live_districts:${limit}:${offset}:${state || 'all'}:${search || 'none'}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Fetch from data.gov.in
    const params = {
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset)
    };

    if (state) {
      params.filters = JSON.stringify({ state_name: state });
    }

    const data = await fetchFromDataGov(DATASETS.DISTRICT_WISE, params);
    
    // Transform the data to match our expected format
    let districts = [];
    if (data && data.records) {
      districts = data.records.map(record => ({
        id: record.district_code || record.id,
        name: record.district_name || record.name,
        state_name: record.state_name,
        state_code: record.state_code,
        // Add any other fields available in the API response
        ...record
      }));

      // Apply search filter if provided
      if (search) {
        const searchTerm = search.toLowerCase();
        districts = districts.filter(district => 
          district.name.toLowerCase().includes(searchTerm) ||
          (district.state_name && district.state_name.toLowerCase().includes(searchTerm))
        );
      }
    }

    const response = {
      districts,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: data.total || districts.length,
        hasNextPage: districts.length === parseInt(limit)
      },
      source: 'data.gov.in',
      last_updated: new Date().toISOString()
    };

    // Cache for 1 hour
    await redis.setEx(cacheKey, 3600, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error('Error fetching live districts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch districts from government API',
      message: error.message 
    });
  }
});

// GET /api/districts/:id/summary - District summary from live data
router.get('/:id/summary', async (req, res) => {
  try {
    const districtId = req.params.id;
    const { year, financial_year } = req.query;
    const redis = req.app.locals.redis;

    // Create cache key
    const cacheKey = `live_summary:${districtId}:${year || financial_year || 'current'}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Fetch district-specific data from data.gov.in
    const params = {
      filters: JSON.stringify({ 
        district_code: districtId 
      })
    };

    if (year) {
      params.filters = JSON.stringify({ 
        district_code: districtId,
        year: year 
      });
    } else if (financial_year) {
      params.filters = JSON.stringify({ 
        district_code: districtId,
        financial_year: financial_year 
      });
    }

    const data = await fetchFromDataGov(DATASETS.DISTRICT_WISE, params);
    
    if (!data || !data.records || data.records.length === 0) {
      return res.status(404).json({ error: 'District data not found' });
    }

    // Process and aggregate the data
    const records = data.records;
    const latestRecord = records[0]; // Assuming sorted by date

    // Calculate summary statistics
    const summary = {
      district: {
        id: districtId,
        name: latestRecord.district_name,
        state_name: latestRecord.state_name
      },
      summary: {
        total_households_registered: records.reduce((sum, r) => sum + (parseInt(r.households_registered) || 0), 0),
        total_households_work_provided: records.reduce((sum, r) => sum + (parseInt(r.households_work_provided) || 0), 0),
        total_persondays: records.reduce((sum, r) => sum + (parseInt(r.total_persondays) || 0), 0),
        total_wages_paid: records.reduce((sum, r) => sum + (parseFloat(r.wages_paid) || 0), 0),
        avg_women_participation: records.reduce((sum, r) => sum + (parseFloat(r.women_participation_pct) || 0), 0) / records.length,
        total_works_completed: records.reduce((sum, r) => sum + (parseInt(r.works_completed) || 0), 0),
        total_works_ongoing: records.reduce((sum, r) => sum + (parseInt(r.works_ongoing) || 0), 0),
        avg_wage_per_day: records.reduce((sum, r) => sum + (parseFloat(r.avg_wage_per_day) || 0), 0) / records.length,
        last_updated: latestRecord.last_updated || new Date().toISOString()
      },
      latestMonth: latestRecord,
      metadata: {
        source: 'data.gov.in',
        records_count: records.length,
        period: year || financial_year || 'Latest available',
        generated_at: new Date().toISOString()
      }
    };

    // Cache for 6 hours (government data doesn't update frequently)
    await redis.setEx(cacheKey, 21600, JSON.stringify(summary));

    res.json(summary);
  } catch (error) {
    console.error('Error fetching live district summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch district summary from government API',
      message: error.message 
    });
  }
});

// GET /api/districts/detect - Detect district from coordinates or IP
router.get('/detect', async (req, res) => {
  try {
    let { lat, lng, ip } = req.query;
    const redis = req.app.locals.redis;

    // If no coordinates provided, try to get location from IP
    if ((!lat || !lng) && !ip) {
      // Get client IP
      ip = req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
      
      // Clean up IP (remove IPv6 prefix if present)
      if (ip && ip.includes('::ffff:')) {
        ip = ip.split('::ffff:')[1];
      }
    }

    // If we have IP but no coordinates, get location from IP
    if ((!lat || !lng) && ip && ip !== '127.0.0.1' && ip !== 'localhost') {
      const ipCacheKey = `ip_location:${ip}`;
      let ipLocation = await redis.get(ipCacheKey);

      if (!ipLocation) {
        try {
          // Use IPGeolocation API
          const ipResponse = await axios.get(`https://api.ipgeolocation.io/ipgeo`, {
            params: {
              apiKey: process.env.IPGEOLOCATION_API_KEY,
              ip: ip
            },
            timeout: 5000
          });

          if (ipResponse.data && ipResponse.data.latitude && ipResponse.data.longitude) {
            ipLocation = {
              latitude: parseFloat(ipResponse.data.latitude),
              longitude: parseFloat(ipResponse.data.longitude),
              city: ipResponse.data.city,
              state: ipResponse.data.state_prov,
              country: ipResponse.data.country_name
            };
            
            // Cache IP location for 24 hours
            await redis.setEx(ipCacheKey, 86400, JSON.stringify(ipLocation));
          }
        } catch (ipError) {
          console.error('Error getting IP location:', ipError.message);
        }
      } else {
        ipLocation = JSON.parse(ipLocation);
      }

      if (ipLocation) {
        lat = ipLocation.latitude;
        lng = ipLocation.longitude;
      }
    }

    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Location coordinates required. Please provide lat/lng or enable location services.' 
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const cacheKey = `detect:${latitude.toFixed(3)}:${longitude.toFixed(3)}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Use reverse geocoding to get location details
    let locationInfo = null;
    try {
      const geoResponse = await axios.get(`https://api.ipgeolocation.io/astronomy`, {
        params: {
          apiKey: process.env.IPGEOLOCATION_API_KEY,
          lat: latitude,
          long: longitude
        },
        timeout: 5000
      });
      
      if (geoResponse.data) {
        locationInfo = geoResponse.data;
      }
    } catch (geoError) {
      console.log('Reverse geocoding failed, using coordinate-based detection');
    }

    // Fetch districts from government data and find closest match
    const allDistricts = await fetchFromDataGov(DATASETS.DISTRICT_WISE, { limit: 1000 });
    
    if (!allDistricts || !allDistricts.records) {
      return res.status(404).json({ error: 'No districts data available' });
    }

    // Find closest district using Haversine formula for better accuracy
    let closestDistrict = null;
    let minDistance = Infinity;

    allDistricts.records.forEach(district => {
      // Try different possible field names for coordinates
      const distLat = parseFloat(district.latitude || district.centroid_lat || district.lat);
      const distLng = parseFloat(district.longitude || district.centroid_lng || district.lng);
      
      if (!isNaN(distLat) && !isNaN(distLng)) {
        // Haversine formula for more accurate distance calculation
        const R = 6371; // Earth's radius in kilometers
        const dLat = (distLat - latitude) * Math.PI / 180;
        const dLng = (distLng - longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(latitude * Math.PI / 180) * Math.cos(distLat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in kilometers
        
        if (distance < minDistance) {
          minDistance = distance;
          closestDistrict = {
            id: district.district_code || district.id || district.district_id,
            name: district.district_name || district.name,
            state_name: district.state_name || district.state,
            state_code: district.state_code,
            latitude: distLat,
            longitude: distLng,
            distance_km: Math.round(distance * 100) / 100 // Round to 2 decimal places
          };
        }
      }
    });

    if (closestDistrict) {
      const result = {
        ...closestDistrict,
        detection_method: ip ? 'ip_geolocation' : 'coordinates',
        source: 'data.gov.in',
        detected_at: new Date().toISOString()
      };

      // Cache for 24 hours
      await redis.setEx(cacheKey, 86400, JSON.stringify(result));
      res.json(result);
    } else {
      res.status(404).json({ error: 'No district found for the given location' });
    }
  } catch (error) {
    console.error('Error detecting district:', error);
    res.status(500).json({ 
      error: 'Failed to detect district',
      message: error.message 
    });
  }
});

// GET /api/districts/auto-detect - Auto-detect district from user's IP
router.get('/auto-detect', async (req, res) => {
  try {
    const redis = req.app.locals.redis;
    
    // Get client IP
    let ip = req.headers['x-forwarded-for'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    // Clean up IP (remove IPv6 prefix if present)
    if (ip && ip.includes('::ffff:')) {
      ip = ip.split('::ffff:')[1];
    }

    if (!ip || ip === '127.0.0.1' || ip === 'localhost') {
      return res.status(400).json({ 
        error: 'Cannot detect location from localhost. Please use manual selection or provide coordinates.' 
      });
    }

    const cacheKey = `auto_detect:${ip}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Get location from IP using IPGeolocation API
    const ipResponse = await axios.get(`https://api.ipgeolocation.io/ipgeo`, {
      params: {
        apiKey: process.env.IPGEOLOCATION_API_KEY,
        ip: ip,
        fields: 'latitude,longitude,city,state_prov,district,country_name'
      },
      timeout: 10000
    });

    if (!ipResponse.data || !ipResponse.data.latitude || !ipResponse.data.longitude) {
      return res.status(404).json({ 
        error: 'Could not determine location from your IP address' 
      });
    }

    const latitude = parseFloat(ipResponse.data.latitude);
    const longitude = parseFloat(ipResponse.data.longitude);

    // Now find the closest district using the detected coordinates
    const detectResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/districts/detect`, {
      params: { lat: latitude, lng: longitude }
    });

    const result = {
      ...detectResponse.data,
      ip_location: {
        city: ipResponse.data.city,
        state: ipResponse.data.state_prov,
        country: ipResponse.data.country_name,
        ip: ip
      },
      detection_method: 'automatic_ip',
      confidence: ipResponse.data.district ? 'high' : 'medium'
    };

    // Cache for 6 hours (IP locations can change)
    await redis.setEx(cacheKey, 21600, JSON.stringify(result));

    res.json(result);
  } catch (error) {
    console.error('Error auto-detecting district:', error);
    res.status(500).json({ 
      error: 'Failed to auto-detect district',
      message: error.message 
    });
  }
});

// GET /api/districts/states - Get list of states
router.get('/states', async (req, res) => {
  try {
    const redis = req.app.locals.redis;
    const cacheKey = 'live_states';
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Fetch states from data.gov.in
    const data = await fetchFromDataGov(DATASETS.STATE_WISE);
    
    let states = [];
    if (data && data.records) {
      // Extract unique states
      const stateMap = new Map();
      data.records.forEach(record => {
        if (record.state_name && record.state_code) {
          stateMap.set(record.state_code, {
            code: record.state_code,
            name: record.state_name
          });
        }
      });
      states = Array.from(stateMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    const response = {
      states,
      source: 'data.gov.in',
      last_updated: new Date().toISOString()
    };

    // Cache for 24 hours
    await redis.setEx(cacheKey, 86400, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ 
      error: 'Failed to fetch states from government API',
      message: error.message 
    });
  }
});

module.exports = router;