// Test the new Vercel API endpoints
const API_BASE = 'https://mgnrega-beta.vercel.app/api';

async function testAPI() {
  console.log('Testing MGNREGA API endpoints...\n');

  // Test health endpoint
  try {
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('   Service:', healthData.service);
    console.log('   Deployment:', healthData.deployment);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test districts endpoint
  try {
    console.log('\n2. Testing districts endpoint...');
    const districtsResponse = await fetch(`${API_BASE}/districts?limit=3`);
    const districtsData = await districtsResponse.json();
    console.log('✅ Districts found:', districtsData.total);
    console.log('   Sample districts:', districtsData.districts.map(d => d.name).join(', '));
  } catch (error) {
    console.log('❌ Districts endpoint failed:', error.message);
  }

  // Test district detection
  try {
    console.log('\n3. Testing district detection...');
    const detectResponse = await fetch(`${API_BASE}/districts/detect?lat=27.1767&lng=78.0081`);
    const detectData = await detectResponse.json();
    console.log('✅ District detected:', detectData.name);
    console.log('   State:', detectData.state_name);
    console.log('   Distance:', detectData.distance_km, 'km');
  } catch (error) {
    console.log('❌ District detection failed:', error.message);
  }

  // Test search
  try {
    console.log('\n4. Testing district search...');
    const searchResponse = await fetch(`${API_BASE}/districts?search=agra`);
    const searchData = await searchResponse.json();
    console.log('✅ Search results for "agra":', searchData.total);
    if (searchData.districts.length > 0) {
      console.log('   Found:', searchData.districts[0].name);
    }
  } catch (error) {
    console.log('❌ District search failed:', error.message);
  }

  console.log('\n🎉 API testing complete!');
}

// Run the test
testAPI().catch(console.error);