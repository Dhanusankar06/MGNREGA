const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const OfficialMGNREGAData = require('../utils/officialMGNREGAData');

// Initialize official MGNREGA data service
const mgnregaData = new OfficialMGNREGAData();

// GET /api/districts-mgnrega - Real MGNREGA data from official sources
router.get('/', async (req, res) => {
  try {
    logger.info('Fetching real MGNREGA data from official government sources');
    
    // Get real MGNREGA data from official sources
    const officialData = mgnregaData.getUttarPradeshMGNREGAData();
    const dataInfo = mgnregaData.getDataInfo();
    const aggregatedMetrics = mgnregaData.getAggregatedMetrics();
    
    // Transform to API format with full MGNREGA data
    const districts = officialData.districts.map(district => ({
      id: district.id,
      name: district.name,
      state_id: district.district_code,
      state_name: district.state_name,
      centroid_lat: district.centroid_lat,
      centroid_lng: district.centroid_lng,
      iso_code: `IN-UP-${district.district_code}`,
      
      // Core MGNREGA metrics
      households_registered: district.mgnrega_data.households_registered,
      households_work_provided: district.mgnrega_data.households_provided_employment,
      employment_percentage: district.mgnrega_data.employment_provided_percentage,
      total_persondays: district.mgnrega_data.total_persondays_generated,
      average_days_per_household: district.mgnrega_data.average_days_per_household,
      
      // Financial data
      total_expenditure: district.mgnrega_data.total_expenditure,
      wages_paid: district.mgnrega_data.wage_expenditure,
      material_expenditure: district.mgnrega_data.material_expenditure,
      avg_wage: district.mgnrega_data.average_wage_per_day,
      
      // Social indicators
      women_participation: district.mgnrega_data.women_participation_percentage,
      women_persondays: district.mgnrega_data.women_persondays,
      sc_households: district.mgnrega_data.sc_households,
      st_households: district.mgnrega_data.st_households,
      
      // Works data
      works_completed: district.mgnrega_data.works_completed,
      works_ongoing: district.mgnrega_data.works_ongoing,
      works_categories: district.mgnrega_data.works_categories,
      
      // Performance indicators
      performance: district.mgnrega_data.performance_indicators,
      
      // Demographics
      population: district.population,
      rural_population: district.rural_population,
      
      // Formatted metrics for display
      formatted_metrics: {
        expenditure_crores: (district.mgnrega_data.total_expenditure / 10000000).toFixed(2),
        persondays_lakhs: (district.mgnrega_data.total_persondays_generated / 100000).toFixed(2),
        households_thousands: (district.mgnrega_data.households_registered / 1000).toFixed(1)
      }
    }));

    res.json({
      success: true,
      data: districts,
      total: districts.length,
      summary: {
        state: officialData.state,
        aggregated_metrics: aggregatedMetrics
      },
      metadata: {
        source: dataInfo.source,
        financial_year: dataInfo.financial_year,
        last_updated: dataInfo.last_updated,
        coverage: dataInfo.coverage,
        reliability: dataInfo.reliability,
        data_points: dataInfo.data_points,
        api_endpoint: 'districts-mgnrega',
        note: 'This endpoint serves real MGNREGA data from official government sources'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching MGNREGA districts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch MGNREGA districts data',
      message: error.message
    });
  }
});

// GET /api/districts-mgnrega/summary - Get state-level summary (must be before /:id)
router.get('/summary', async (req, res) => {
  try {
    logger.info('Fetching MGNREGA state summary');
    
    const officialData = mgnregaData.getUttarPradeshMGNREGAData();
    const aggregatedMetrics = mgnregaData.getAggregatedMetrics();
    const dataInfo = mgnregaData.getDataInfo();
    
    res.json({
      success: true,
      data: {
        state: officialData.state,
        aggregated_metrics: aggregatedMetrics,
        top_performers: {
          employment: mgnregaData.getTopDistricts('employment_provided_percentage', 3),
          women_participation: mgnregaData.getTopDistricts('women_participation_percentage', 3),
          works_completed: mgnregaData.getTopDistricts('works_completed', 3)
        }
      },
      metadata: {
        source: dataInfo.source,
        financial_year: dataInfo.financial_year,
        last_updated: dataInfo.last_updated,
        coverage: dataInfo.coverage,
        reliability: dataInfo.reliability
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching MGNREGA summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch MGNREGA summary',
      message: error.message
    });
  }
});

// GET /api/districts-mgnrega/:id - Get specific district with full MGNREGA data
router.get('/:id', async (req, res) => {
  try {
    const districtId = parseInt(req.params.id);
    logger.info(`Fetching MGNREGA district data for ID: ${districtId}`);
    
    const district = mgnregaData.getDistrictById(districtId);
    
    if (!district) {
      return res.status(404).json({
        success: false,
        error: 'District not found',
        message: `No district found with ID: ${districtId}`
      });
    }

    const dataInfo = mgnregaData.getDataInfo();

    res.json({
      success: true,
      data: {
        ...district,
        // Add comprehensive formatted metrics
        formatted_metrics: {
          expenditure_crores: (district.mgnrega_data.total_expenditure / 10000000).toFixed(2),
          wage_expenditure_crores: (district.mgnrega_data.wage_expenditure / 10000000).toFixed(2),
          material_expenditure_crores: (district.mgnrega_data.material_expenditure / 10000000).toFixed(2),
          persondays_lakhs: (district.mgnrega_data.total_persondays_generated / 100000).toFixed(2),
          households_registered_thousands: (district.mgnrega_data.households_registered / 1000).toFixed(1),
          households_employed_thousands: (district.mgnrega_data.households_provided_employment / 1000).toFixed(1),
          women_persondays_lakhs: (district.mgnrega_data.women_persondays / 100000).toFixed(2),
          population_lakhs: (district.population / 100000).toFixed(2),
          rural_population_lakhs: (district.rural_population / 100000).toFixed(2)
        },
        // Add calculated ratios
        calculated_metrics: {
          employment_rate: ((district.mgnrega_data.households_provided_employment / district.mgnrega_data.households_registered) * 100).toFixed(1),
          expenditure_per_household: (district.mgnrega_data.total_expenditure / district.mgnrega_data.households_provided_employment).toFixed(0),
          persondays_per_household: (district.mgnrega_data.total_persondays_generated / district.mgnrega_data.households_provided_employment).toFixed(1),
          rural_coverage_percentage: ((district.mgnrega_data.households_registered / (district.rural_population / 5)) * 100).toFixed(1) // Assuming 5 people per household
        }
      },
      metadata: {
        source: dataInfo.source,
        financial_year: dataInfo.financial_year,
        last_updated: dataInfo.last_updated,
        reliability: dataInfo.reliability
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching MGNREGA district:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch MGNREGA district data',
      message: error.message
    });
  }
});

// GET /api/districts-mgnrega/search/:query - Search districts
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    logger.info(`Searching MGNREGA districts for: ${query}`);
    
    const results = mgnregaData.searchDistricts(query);
    
    res.json({
      success: true,
      data: results,
      total: results.length,
      query: query,
      metadata: {
        source: 'Ministry of Rural Development, Government of India',
        search_type: 'name_and_code'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error searching MGNREGA districts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search MGNREGA districts',
      message: error.message
    });
  }
});

// GET /api/districts-mgnrega/top/:metric - Get top performing districts
router.get('/top/:metric', async (req, res) => {
  try {
    const metric = req.params.metric;
    const limit = parseInt(req.query.limit) || 5;
    
    logger.info(`Fetching top MGNREGA districts by metric: ${metric}`);
    
    const topDistricts = mgnregaData.getTopDistricts(metric, limit);
    
    res.json({
      success: true,
      data: topDistricts,
      metric: metric,
      limit: limit,
      metadata: {
        source: 'Ministry of Rural Development, Government of India',
        ranking_basis: metric,
        financial_year: '2023-24'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching top MGNREGA districts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top MGNREGA districts',
      message: error.message
    });
  }
});

module.exports = router;