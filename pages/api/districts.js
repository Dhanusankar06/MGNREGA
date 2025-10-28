// Next.js API route for districts
import { fallbackMGNREGAData } from '../../utils/fallbackMGNREGAData.js';

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
    const { search, limit = 50 } = req.query;
    let districts = fallbackMGNREGAData.districts;

    // Filter by search term if provided
    if (search) {
      const searchTerm = search.toLowerCase();
      districts = districts.filter(district => 
        district.name.toLowerCase().includes(searchTerm) ||
        (district.state_name || '').toLowerCase().includes(searchTerm)
      );
    }

    // Apply limit
    const limitNum = parseInt(limit);
    if (limitNum > 0) {
      districts = districts.slice(0, limitNum);
    }

    res.status(200).json({
      districts,
      total: districts.length,
      pagination: {
        hasNextPage: false,
        nextCursor: null,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Districts API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}