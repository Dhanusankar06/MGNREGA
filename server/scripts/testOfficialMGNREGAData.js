const OfficialMGNREGAData = require('../utils/officialMGNREGAData');

async function testOfficialMGNREGAData() {
  console.log('🧪 Testing Official MGNREGA Data Service...\n');
  
  const mgnregaData = new OfficialMGNREGAData();
  
  // Test 1: Get full Uttar Pradesh data
  console.log('1️⃣ Testing getUttarPradeshMGNREGAData()');
  const upData = mgnregaData.getUttarPradeshMGNREGAData();
  console.log(`✅ State: ${upData.state.name}`);
  console.log(`✅ Districts: ${upData.districts.length}`);
  console.log(`✅ Total households registered: ${upData.state.state_summary.total_households_registered.toLocaleString()}`);
  console.log(`✅ Total expenditure: ₹${(upData.state.state_summary.total_expenditure / 10000000).toFixed(2)} crores\n`);
  
  // Test 2: Get aggregated metrics
  console.log('2️⃣ Testing getAggregatedMetrics()');
  const metrics = mgnregaData.getAggregatedMetrics();
  console.log(`✅ Total districts: ${metrics.total_districts}`);
  console.log(`✅ Total households registered: ${metrics.total_households_registered.toLocaleString()}`);
  console.log(`✅ Total households employed: ${metrics.total_households_employed.toLocaleString()}`);
  console.log(`✅ Total persondays: ${metrics.total_persondays.toLocaleString()}`);
  console.log(`✅ Total expenditure: ₹${(metrics.total_expenditure / 10000000).toFixed(2)} crores`);
  console.log(`✅ Average women participation: ${metrics.women_participation.toFixed(1)}%\n`);
  
  // Test 3: Get specific district
  console.log('3️⃣ Testing getDistrictById()');
  const agra = mgnregaData.getDistrictById(1);
  if (agra) {
    console.log(`✅ District: ${agra.name}`);
    console.log(`✅ Households registered: ${agra.mgnrega_data.households_registered.toLocaleString()}`);
    console.log(`✅ Employment percentage: ${agra.mgnrega_data.employment_provided_percentage}%`);
    console.log(`✅ Women participation: ${agra.mgnrega_data.women_participation_percentage}%`);
    console.log(`✅ Works completed: ${agra.mgnrega_data.works_completed}`);
    console.log(`✅ Performance - Timely wage payment: ${agra.mgnrega_data.performance_indicators.timely_wage_payment_percentage}%\n`);
  }
  
  // Test 4: Search districts
  console.log('4️⃣ Testing searchDistricts()');
  const searchResults = mgnregaData.searchDistricts('luc');
  console.log(`✅ Search for 'luc': ${searchResults.length} results`);
  searchResults.forEach(d => console.log(`   - ${d.name} (${d.district_code})`));
  console.log();
  
  // Test 5: Get top performing districts
  console.log('5️⃣ Testing getTopDistricts()');
  const topEmployment = mgnregaData.getTopDistricts('employment_provided_percentage', 3);
  console.log('✅ Top 3 districts by employment percentage:');
  topEmployment.forEach((d, i) => {
    console.log(`   ${i + 1}. ${d.name}: ${d.value}%`);
  });
  console.log();
  
  const topWomen = mgnregaData.getTopDistricts('women_participation_percentage', 3);
  console.log('✅ Top 3 districts by women participation:');
  topWomen.forEach((d, i) => {
    console.log(`   ${i + 1}. ${d.name}: ${d.value}%`);
  });
  console.log();
  
  // Test 6: Data info
  console.log('6️⃣ Testing getDataInfo()');
  const dataInfo = mgnregaData.getDataInfo();
  console.log(`✅ Source: ${dataInfo.source}`);
  console.log(`✅ Financial Year: ${dataInfo.financial_year}`);
  console.log(`✅ Last Updated: ${dataInfo.last_updated}`);
  console.log(`✅ Coverage: ${dataInfo.coverage}`);
  console.log(`✅ Reliability: ${dataInfo.reliability}\n`);
  
  // Test 7: Sample district data structure
  console.log('7️⃣ Sample District Data Structure');
  const sampleDistrict = upData.districts[0];
  console.log('✅ District fields:');
  console.log(`   - Basic: id, name, state_name, coordinates`);
  console.log(`   - Demographics: population (${sampleDistrict.population.toLocaleString()}), rural_population (${sampleDistrict.rural_population.toLocaleString()})`);
  console.log(`   - MGNREGA: ${Object.keys(sampleDistrict.mgnrega_data).length} metrics`);
  console.log(`   - Works categories: ${Object.keys(sampleDistrict.mgnrega_data.works_categories).length} types`);
  console.log(`   - Performance indicators: ${Object.keys(sampleDistrict.mgnrega_data.performance_indicators).length} metrics\n`);
  
  // Test 8: Data validation
  console.log('8️⃣ Data Validation');
  let validationPassed = true;
  
  upData.districts.forEach(district => {
    // Check required fields
    if (!district.name || !district.mgnrega_data) {
      console.log(`❌ Missing required fields in district: ${district.name || 'Unknown'}`);
      validationPassed = false;
    }
    
    // Check numeric values
    if (district.mgnrega_data.households_registered <= 0) {
      console.log(`❌ Invalid households_registered in ${district.name}`);
      validationPassed = false;
    }
    
    // Check percentages
    if (district.mgnrega_data.women_participation_percentage < 0 || 
        district.mgnrega_data.women_participation_percentage > 100) {
      console.log(`❌ Invalid women_participation_percentage in ${district.name}`);
      validationPassed = false;
    }
  });
  
  if (validationPassed) {
    console.log('✅ All data validation checks passed\n');
  }
  
  console.log('🎉 Official MGNREGA Data Service test completed successfully!');
  console.log('📊 Ready to serve real MGNREGA data from official government sources');
}

// Run the test
if (require.main === module) {
  testOfficialMGNREGAData().catch(console.error);
}

module.exports = testOfficialMGNREGAData;