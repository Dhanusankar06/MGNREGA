// Vercel serverless function for district detection by location
import { fallbackMGNREGAData } from '../../frontend/utils/fallbackMGNREGAData.js';

// Simple distance calculation (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in kilometers
  return d;
}

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        message: 'Both lat and lng parameters are required' 
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        error: 'Invalid parameters',
        message: 'lat and lng must be valid numbers' 
      });
    }

    // Find the closest district
    let closestDistrict = null;
    let minDistance = Infinity;

    fallbackMGNREGAData.districts.forEach(district => {
      if (district.centroid_lat && district.centroid_lng) {
        const distance = calculateDistance(
          latitude, longitude,
          district.centroid_lat, district.centroid_lng
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestDistrict = district;
        }
      }
    });

    if (closestDistrict) {
      res.status(200).json({
        ...closestDistrict,
        distance_km: Math.round(minDistance * 100) / 100,
        detected_from: 'geolocation'
      });
    } else {
      res.status(404).json({ 
        error: 'No district found',
        message: 'Could not find a nearby district' 
      });
    }
  } catch (error) {
    console.error('District detection error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}