const express = require('express');
const router = express.Router();

// Simple validation helpers
const validateLimit = (limit) => {
  const num = parseInt(limit) || 50;
  return Math.min(Math.max(num, 1), 100);
};

// GET /api/districts/auto-detect - Auto-detect district (must be before /:id routes)
router.get('/auto-detect', async (req, res) => {
  try {
    // For development, just return the first district as a fallback
    const db = req.app.locals.db;

    const query = `SELECT id, name, state_id, centroid_lat, centroid_lng FROM districts LIMIT 1`;
    const result = await db.query(query);

    if (result.rows.length > 0) {
      const district = result.rows[0];
      res.json({
        ...district,
        detection_method: 'fallback',
        message: 'Auto-detection not available in development mode. Showing sample district.'
      });
    } else {
      res.status(404).json({ error: 'No districts available' });
    }
  } catch (err) {
    console.error('Error auto-detecting district:', err);
    res.status(500).json({ error: 'Failed to auto-detect district' });
  }
});

// GET /api/districts/detect - Detect district from coordinates (must be before /:id routes)
router.get('/detect', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Simple distance-based detection for demo
    // In production, this would use PostGIS or proper geospatial queries
    const db = req.app.locals.db;

    const query = `
      SELECT id, name, state_id, centroid_lat, centroid_lng,
             ((centroid_lat - ?) * (centroid_lat - ?) + 
              (centroid_lng - ?) * (centroid_lng - ?)) as distance
      FROM districts 
      ORDER BY distance 
      LIMIT 1
    `;

    const result = await db.query(query, [latitude, latitude, longitude, longitude]);

    if (result.rows.length > 0) {
      const district = result.rows[0];
      // Remove the distance field from response
      delete district.distance;
      res.json(district);
    } else {
      res.status(404).json({ error: 'No district found for the given coordinates' });
    }
  } catch (err) {
    console.error('Error detecting district:', err);
    res.status(500).json({ error: 'Failed to detect district' });
  }
});

// GET /api/districts - List districts with search and pagination
router.get('/', async (req, res) => {
  try {
    const { cursor, limit: rawLimit, state, search } = req.query;
    const limit = validateLimit(rawLimit);
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;

    // Try cache first (only if no search)
    const cacheKey = `districts:${cursor || 'start'}:${limit}:${state || 'all'}:${search || 'none'}`;
    const cached = !search ? await redis.get(cacheKey) : null;

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Build query
    let query = `
      SELECT id, name, state_id, centroid_lat, centroid_lng, iso_code
      FROM districts
    `;
    let params = [];
    let whereClause = [];

    if (search) {
      whereClause.push('(LOWER(name) LIKE ? OR LOWER(iso_code) LIKE ?)');
      const searchTerm = `%${search.toLowerCase()}%`;
      params.push(searchTerm, searchTerm);
    }

    if (state) {
      whereClause.push('state_id = ?');
      params.push(state);
    }

    if (cursor) {
      whereClause.push('id > ?');
      params.push(cursor);
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

    // Cache for 1 hour (only if no search)
    if (!search) {
      await redis.setEx(cacheKey, 3600, JSON.stringify(response));
    }

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



module.exports = router;