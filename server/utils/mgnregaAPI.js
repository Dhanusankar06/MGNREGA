const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.DATA_GOV_API_KEY || '579b464db66ec23bdd000001cde4e6f4672b4884773391b3f9d2a01a';
const BASE_URL = process.env.DATA_GOV_BASE_URL || 'https://api.data.gov.in/resource';

// MGNREGA API endpoints
const ENDPOINTS = {
  // District-wise MGNREGA data
  DISTRICT_WISE: '9ac1c5c6-9a8c-4543-9c61-1239c4245f8e',
  // State-wise MGNREGA data
  STATE_WISE: 'b663934f-7c39-496c-9b7a-8b8b0d0c5e5e',
  // Works data
  WORKS_DATA: '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69'
};

class MGNREGAAPIClient {
  constructor() {
    this.apiKey = API_KEY;
    this.baseUrl = BASE_URL;
  }

  async makeRequest(resourceId, params = {}) {
    try {
      const url = `${this.baseUrl}/${resourceId}`;
      const requestParams = {
        'api-key': this.apiKey,
        format: 'json',
        limit: 1000,
        ...params
      };

      console.log(`Making API request to: ${url}`);
      console.log('Request params:', requestParams);

      const response = await axios.get(url, {
        params: requestParams,
        timeout: 30000,
        headers: {
          'User-Agent': 'MGNREGA-LokDekho/1.0',
          'Accept': 'application/json'
        }
      });

      if (response.data && response.data.records) {
        console.log(`API response received: ${response.data.records.length} records`);
        return response.data.records;
      } else {
        console.log('API response structure:', Object.keys(response.data || {}));
        return [];
      }
    } catch (error) {
      console.error('MGNREGA API Error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  async getDistrictData(stateName = 'Uttar Pradesh', limit = 100) {
    try {
      const params = {
        limit,
        offset: 0
      };

      // Add state filter if provided
      if (stateName) {
        params['filters[state_name]'] = stateName;
      }

      const records = await this.makeRequest(ENDPOINTS.DISTRICT_WISE, params);
      return this.processDistrictData(records);
    } catch (error) {
      console.error('Error fetching district data:', error);
      return [];
    }
  }

  async getStateData(limit = 50) {
    try {
      const records = await this.makeRequest(ENDPOINTS.STATE_WISE, { limit });
      return this.processStateData(records);
    } catch (error) {
      console.error('Error fetching state data:', error);
      return [];
    }
  }

  processDistrictData(records) {
    return records.map(record => ({
      district_name: record.district_name || record.district || record.name,
      state_name: record.state_name || record.state,
      financial_year: record.financial_year || record.year,
      households_registered: parseInt(record.households_registered || record.total_households || 0),
      households_work_provided: parseInt(record.households_work_provided || record.households_provided_employment || 0),
      total_persondays: parseInt(record.total_persondays || record.persondays_generated || 0),
      wages_paid: parseFloat(record.wages_paid || record.total_wages || 0),
      women_participation: parseFloat(record.women_participation_pct || record.women_persondays_pct || 0),
      works_completed: parseInt(record.works_completed || record.total_works_completed || 0),
      works_ongoing: parseInt(record.works_ongoing || record.total_works_ongoing || 0),
      avg_wage: parseFloat(record.avg_wage_per_day || record.average_wage || 0),
      raw_data: record
    }));
  }

  processStateData(records) {
    return records.map(record => ({
      state_name: record.state_name || record.state,
      financial_year: record.financial_year || record.year,
      total_households: parseInt(record.total_households || 0),
      total_persondays: parseInt(record.total_persondays || 0),
      total_wages: parseFloat(record.total_wages || 0),
      total_works: parseInt(record.total_works || 0),
      raw_data: record
    }));
  }

  // Get sample data for testing
  async getSampleData() {
    return {
      districts: [
        {
          district_name: 'Agra',
          state_name: 'Uttar Pradesh',
          financial_year: '2023-24',
          households_registered: 125000,
          households_work_provided: 89000,
          total_persondays: 2150000,
          wages_paid: 4300000000,
          women_participation: 52.3,
          works_completed: 1250,
          works_ongoing: 340,
          avg_wage: 200
        },
        {
          district_name: 'Lucknow',
          state_name: 'Uttar Pradesh',
          financial_year: '2023-24',
          households_registered: 98000,
          households_work_provided: 72000,
          total_persondays: 1890000,
          wages_paid: 3780000000,
          women_participation: 48.7,
          works_completed: 980,
          works_ongoing: 280,
          avg_wage: 200
        },
        {
          district_name: 'Kanpur Nagar',
          state_name: 'Uttar Pradesh',
          financial_year: '2023-24',
          households_registered: 87000,
          households_work_provided: 65000,
          total_persondays: 1650000,
          wages_paid: 3300000000,
          women_participation: 45.2,
          works_completed: 850,
          works_ongoing: 220,
          avg_wage: 200
        },
        {
          district_name: 'Ghaziabad',
          state_name: 'Uttar Pradesh',
          financial_year: '2023-24',
          households_registered: 76000,
          households_work_provided: 58000,
          total_persondays: 1420000,
          wages_paid: 2840000000,
          women_participation: 41.8,
          works_completed: 720,
          works_ongoing: 190,
          avg_wage: 200
        },
        {
          district_name: 'Allahabad',
          state_name: 'Uttar Pradesh',
          financial_year: '2023-24',
          households_registered: 145000,
          households_work_provided: 108000,
          total_persondays: 2680000,
          wages_paid: 5360000000,
          women_participation: 55.1,
          works_completed: 1450,
          works_ongoing: 380,
          avg_wage: 200
        }
      ]
    };
  }
}

module.exports = MGNREGAAPIClient;