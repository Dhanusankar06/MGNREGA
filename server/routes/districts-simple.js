const express = require('express');
const router = express.Router();

// Simple validation helpers
const validateLimit = (limit) => {
  const num = parseInt(limit) || 50;
  return Math.min(Math.max(num, 1), 100);
};

// GET /api/districts - List districts with cursor-based pagination
router.get('/', async (req, res) => {
  try {
    const { cursor, limit: rawLimit, state, search } = req.query;
    const limit = validateLimit(rawLimit);
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;

    // Try cache first
    const cacheKey = `districts:${cursor || 'start'}:${limit}:${state || 'all'}:${search || ''}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Build query
    let query = `
      SELECT id, name, state_id, state_name, centroid_lat, centroid_lng, iso_code
      FROM districts
    `;
    let params = [];
    let whereClause = [];

    if (state) {
      whereClause.push('state_id = ?');
      params.push(state);
    }

    if (cursor) {
      whereClause.push('id > ?');
      params.push(cursor);
    }

    if (search && String(search).trim().length > 0) {
      whereClause.push('(LOWER(name) LIKE ? OR LOWER(state_name) LIKE ?)');
      const term = `%${String(search).toLowerCase()}%`;
      params.push(term, term);
    }

    if (whereClause.length > 0) {
      query += ' WHERE ' + whereClause.join(' AND ');
    }

    query += ` ORDER BY id LIMIT ?`;
    params.push(limit + 1); // Get one extra to determine if there's a next page

    const result = await db.query(query, params);
    
    const hasNextPage = result.rows.length > limit;
    const districts = hasNextPage ? result.rows.slice(0, -1) : result.rows;
    const nextCursor = hasNextPage ? districts[districts.length - 1].id : null;

    const response = {
      districts,
      pagination: {
        hasNextPage,
        nextCursor,
        limit
      }
    };

    // Cache for 1 hour
    await redis.setEx(cacheKey, 3600, JSON.stringify(response));

    res.json(response);
  } catch (err) {
    console.error('Error fetching districts:', err);
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
});

// GET /api/districts/:id/summary - District summary with caching
router.get('/:id/summary', async (req, res) => {
  try {
    const districtId = parseInt(req.params.id);
    if (isNaN(districtId)) {
      return res.status(400).json({ error: 'Invalid district ID' });
    }

    const { year, months = 12 } = req.query;
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;

    // Try cache first
    const cacheKey = `district_summary:${districtId}:${year || 'current'}:${months}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Get district info
    const districtQuery = `
      SELECT id, name, state_id, centroid_lat, centroid_lng
      FROM districts WHERE id = ?
    `;
    const districtResult = await db.query(districtQuery, [districtId]);
    
    if (districtResult.rows.length === 0) {
      return res.status(404).json({ error: 'District not found' });
    }

    const district = districtResult.rows[0];

    // Get summary data
    let summaryQuery = `
      SELECT 
        AVG(households_registered) as avg_households_registered,
        AVG(households_work_provided) as avg_households_work_provided,
        SUM(total_persondays) as total_persondays,
        SUM(wages_paid) as total_wages_paid,
        AVG(women_participation_pct) as avg_women_participation,
        SUM(works_completed) as total_works_completed,
        SUM(works_ongoing) as total_works_ongoing,
        AVG(avg_wage) as avg_wage_per_day,
        COUNT(*) as months_count,
        MAX(source_date) as last_updated
      FROM mgnrega_monthly 
      WHERE district_id = ?
    `;
    
    let params = [districtId];
    
    if (year) {
      summaryQuery += ` AND year = ?`;
      params.push(year);
    }

    const summaryResult = await db.query(summaryQuery, params);
    const summary = summaryResult.rows[0];

    // Get latest month data for comparison
    const latestQuery = `
      SELECT * FROM mgnrega_monthly 
      WHERE district_id = ? 
      ORDER BY year DESC, month DESC 
      LIMIT 1
    `;
    const latestResult = await db.query(latestQuery, [districtId]);
    const latestMonth = latestResult.rows[0];

    // Get same month last year for comparison
    let yearAgoData = null;
    if (latestMonth) {
      const yearAgoQuery = `
        SELECT * FROM mgnrega_monthly 
        WHERE district_id = ? AND year = ? AND month = ?
      `;
      const yearAgoResult = await db.query(yearAgoQuery, [
        districtId, 
        latestMonth.year - 1, 
        latestMonth.month
      ]);
      yearAgoData = yearAgoResult.rows[0];
    }

    const response = {
      district,
      summary: {
        ...summary,
        // Convert string numbers to proper numbers
        avg_households_registered: parseFloat(summary.avg_households_registered) || 0,
        avg_households_work_provided: parseFloat(summary.avg_households_work_provided) || 0,
        total_persondays: parseInt(summary.total_persondays) || 0,
        total_wages_paid: parseFloat(summary.total_wages_paid) || 0,
        avg_women_participation: parseFloat(summary.avg_women_participation) || 0,
        total_works_completed: parseInt(summary.total_works_completed) || 0,
        total_works_ongoing: parseInt(summary.total_works_ongoing) || 0,
        avg_wage_per_day: parseFloat(summary.avg_wage_per_day) || 0,
        months_count: parseInt(summary.months_count) || 0
      },
      latestMonth,
      yearAgoComparison: yearAgoData,
      metadata: {
        period: year ? `Year ${year}` : `Last ${months} months`,
        generated_at: new Date().toISOString()
      }
    };

    // Cache for 24 hours
    await redis.setEx(cacheKey, 86400, JSON.stringify(response));

    res.json(response);
  } catch (err) {
    console.error('Error fetching district summary:', err);
    res.status(500).json({ error: 'Failed to fetch district summary' });
  }
});

// GET /api/districts/auto-detect - Auto-detect user's location and return nearest district
router.get('/auto-detect', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;
    
    // Get client IP address
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                    req.headers['x-forwarded-for']?.split(',')[0] ||
                    req.headers['x-real-ip'] ||
                    '127.0.0.1';
    
    // Try cache first
    const cacheKey = `auto_detect:${clientIP}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Try to get real location from IP geolocation service
    let latitude, longitude, city, region;
    
    if (process.env.NODE_ENV === 'development' || clientIP === '127.0.0.1' || clientIP === '::1') {
      // For localhost, try multiple geolocation APIs with fallbacks
      const geolocationAPIs = [
        {
          name: 'ipapi.co',
          url: 'https://ipapi.co/json/',
          parseResponse: (data) => ({
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
            city: data.city,
            region: data.region || data.country_name
          })
        },
        {
          name: 'ipinfo.io',
          url: 'https://ipinfo.io/json',
          parseResponse: (data) => ({
            latitude: parseFloat(data.loc?.split(',')[0]),
            longitude: parseFloat(data.loc?.split(',')[1]),
            city: data.city,
            region: data.region || data.country
          })
        },
        {
          name: 'ip-api.com',
          url: 'http://ip-api.com/json/',
          parseResponse: (data) => ({
            latitude: parseFloat(data.lat),
            longitude: parseFloat(data.lon),
            city: data.city,
            region: data.regionName || data.country
          })
        },
        {
          name: 'ipgeolocation.io',
          url: 'https://api.ipgeolocation.io/ipgeo?apiKey=free',
          parseResponse: (data) => ({
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
            city: data.city,
            region: data.state_prov || data.country_name
          })
        },
        {
          name: 'ipapi.com',
          url: 'https://ipapi.com/ip_api.php?ip=',
          parseResponse: (data) => ({
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
            city: data.city,
            region: data.region_name || data.country_name
          })
        },
        {
          name: 'ip-api.io',
          url: 'https://ip-api.io/json/',
          parseResponse: (data) => ({
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
            city: data.city,
            region: data.region_name || data.country_name
          })
        }
      ];

      let locationDetected = false;
      
      for (const api of geolocationAPIs) {
        try {
          console.log(`Trying ${api.name}...`);
          const geoResponse = await fetch(api.url);
          
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            const parsedData = api.parseResponse(geoData);
            
            if (parsedData.latitude && parsedData.longitude) {
              latitude = parsedData.latitude;
              longitude = parsedData.longitude;
              city = parsedData.city || 'Unknown';
              region = parsedData.region || 'Unknown';
              console.log(`✅ ${api.name} success: ${city}, ${region} (${latitude}, ${longitude})`);
              locationDetected = true;
              break;
            }
          }
        } catch (apiError) {
          console.warn(`❌ ${api.name} failed:`, apiError.message);
          continue;
        }
      }
      
      if (!locationDetected) {
        console.warn('All geolocation APIs failed, using Bangalore as default');
        // Default to Bangalore for development
        latitude = 12.9716;
        longitude = 77.5946;
        city = 'Bangalore';
        region = 'Karnataka';
      }
    } else {
      // For production, try to use a real IP geolocation service
      try {
        // Using ipapi.co (free tier allows 1000 requests/day)
        const geoResponse = await fetch(`https://ipapi.co/${clientIP}/json/`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.latitude && geoData.longitude) {
            latitude = geoData.latitude;
            longitude = geoData.longitude;
            city = geoData.city || 'Unknown';
            region = geoData.region || geoData.country_name || 'Unknown';
          } else {
            throw new Error('No coordinates in response');
          }
        } else {
          throw new Error('Geolocation API failed');
        }
      } catch (geoError) {
        console.warn('IP geolocation failed, using default location:', geoError.message);
        // Fallback to Delhi if geolocation fails
        latitude = 28.6139;
        longitude = 77.2090;
        city = 'New Delhi';
        region = 'Delhi';
      }
    }

    // Find the nearest district using simple Euclidean distance
    // SQLite doesn't have trigonometric functions, so we'll use a simple distance calculation
    const query = `
      SELECT 
        id, 
        name, 
        state_id, 
        state_name,
        centroid_lat, 
        centroid_lng,
        (
          ((centroid_lat - ?) * (centroid_lat - ?)) + 
          ((centroid_lng - ?) * (centroid_lng - ?))
        ) AS distance_squared
      FROM districts 
      WHERE centroid_lat IS NOT NULL AND centroid_lng IS NOT NULL
      ORDER BY distance_squared ASC 
      LIMIT 1
    `;
    
    const result = await db.query(query, [latitude, latitude, longitude, longitude]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No districts found' });
    }

    const nearestDistrict = result.rows[0];

    // Calculate approximate distance in km (rough conversion)
    const distanceKm = Math.sqrt(nearestDistrict.distance_squared) * 111; // Rough conversion to km

    const response = {
      id: nearestDistrict.id,
      name: nearestDistrict.name,
      state_name: nearestDistrict.state_name || 'Unknown State',
      latitude: parseFloat(nearestDistrict.centroid_lat),
      longitude: parseFloat(nearestDistrict.centroid_lng),
      distance_km: Math.round(distanceKm * 100) / 100,
      ip_location: {
        city: city,
        region: region,
        latitude: latitude,
        longitude: longitude
      },
      detected_at: new Date().toISOString()
    };

    // Cache for 1 hour
    await redis.setEx(cacheKey, 3600, JSON.stringify(response));

    res.json(response);
  } catch (err) {
    console.error('Error in auto-detect:', err);
    res.status(500).json({ error: 'Failed to auto-detect location' });
  }
});

// GET /api/districts/detect - Detect district from latitude and longitude
router.get('/detect', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid latitude or longitude values' });
    }

    const db = req.app.locals.db;
    const redis = req.app.locals.redis;

    // Try cache first
    const cacheKey = `detect:${latitude}:${longitude}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Find the nearest district using simple Euclidean distance
    const query = `
      SELECT 
        id, 
        name, 
        state_id, 
        state_name,
        centroid_lat, 
        centroid_lng,
        (
          ((centroid_lat - ?) * (centroid_lat - ?)) + 
          ((centroid_lng - ?) * (centroid_lng - ?))
        ) AS distance_squared
      FROM districts 
      WHERE centroid_lat IS NOT NULL AND centroid_lng IS NOT NULL
      ORDER BY distance_squared ASC 
      LIMIT 1
    `;
    
    const result = await db.query(query, [latitude, latitude, longitude, longitude]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No districts found' });
    }

    const nearestDistrict = result.rows[0];

    // Calculate approximate distance in km (rough conversion)
    const distanceKm = Math.sqrt(nearestDistrict.distance_squared) * 111; // Rough conversion to km

    const response = {
      id: nearestDistrict.id,
      name: nearestDistrict.name,
      state_name: nearestDistrict.state_name || 'Unknown State',
      latitude: parseFloat(nearestDistrict.centroid_lat),
      longitude: parseFloat(nearestDistrict.centroid_lng),
      distance_km: Math.round(distanceKm * 100) / 100,
      detected_at: new Date().toISOString()
    };

    // Cache for 1 hour
    await redis.setEx(cacheKey, 3600, JSON.stringify(response));

    res.json(response);
  } catch (err) {
    console.error('Error detecting district:', err);
    res.status(500).json({ error: 'Failed to detect district' });
  }
});

// POST /api/districts/:id/refresh - Manually refresh district data from live API
router.post('/:id/refresh', async (req, res) => {
  try {
    const districtId = parseInt(req.params.id);
    if (isNaN(districtId)) {
      return res.status(400).json({ error: 'Invalid district ID' });
    }

    const db = req.app.locals.db;
    
    // Check if district exists
    const districtQuery = await db.query('SELECT id, name FROM districts WHERE id = ?', [districtId]);
    if (districtQuery.rows.length === 0) {
      return res.status(404).json({ error: 'District not found' });
    }

    const district = districtQuery.rows[0];
    
    // Import the data fetcher
    const { fetchMGNREGAData } = require('../workers/dataFetcher');
    
    console.log(`Manually refreshing data for district: ${district.name}`);
    
    // Fetch fresh data from live API
    const records = await fetchMGNREGAData(districtId, {
      force: true,
      months: 12
    });
    
    // Clear cache for this district
    const redis = req.app.locals.redis;
    const cacheKeys = await redis.keys(`*district*${districtId}*`);
    if (cacheKeys.length > 0) {
      await redis.del(cacheKeys);
    }
    
    res.json({
      success: true,
      district: district,
      records_updated: records.length,
      message: `Successfully refreshed data for ${district.name}`,
      refreshed_at: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Error refreshing district data:', err);
    res.status(500).json({ 
      error: 'Failed to refresh district data',
      message: err.message 
    });
  }
});

module.exports = router;