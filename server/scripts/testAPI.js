const RealMGNREGAAPI = require('../utils/realMGNREGAAPI');
require('dotenv').config();

async function testMGNREGAAPI() {
  console.log('🔍 Testing MGNREGA API endpoints...');
  console.log('API Key:', process.env.DATA_GOV_API_KEY || '579b464db66ec23bdd000001cde4e6f4672b4884773391b3f9d2a01a');
  
  const api = new RealMGNREGAAPI();
  
  // Test API connection
  console.log('\n=== Testing API Connection ===');
  const result = await api.testAPIConnection();
  
  if (result) {
    console.log('✅ Found working endpoint:', result.endpoint);
    console.log('📊 Sample data:', JSON.stringify(result.data.records[0], null, 2));
  } else {
    console.log('❌ No working endpoints found');
  }
  
  // Search for MGNREGA datasets
  console.log('\n=== Searching for MGNREGA Datasets ===');
  await api.searchMGNREGADatasets();
  
  // Try to fetch real data
  console.log('\n=== Fetching Real MGNREGA Data ===');
  const realData = await api.fetchRealMGNREGAData();
  
  if (realData && realData.length > 0) {
    console.log(`✅ Successfully fetched ${realData.length} real records`);
    console.log('📊 Sample processed record:', JSON.stringify(realData[0], null, 2));
  } else {
    console.log('❌ Failed to fetch real data, using fallback data');
    const fallbackData = api.getRealMGNREGADataFromReports();
    console.log(`📊 Using ${fallbackData.length} records from official reports`);
    console.log('Sample fallback record:', JSON.stringify(fallbackData[0], null, 2));
  }
}

if (require.main === module) {
  testMGNREGAAPI().catch(console.error);
}

module.exports = { testMGNREGAAPI };