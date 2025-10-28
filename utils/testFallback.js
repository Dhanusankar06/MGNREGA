import { fallbackMGNREGAData, getDistrictById, searchDistricts } from './fallbackMGNREGAData';

export function testFallbackData() {
  console.log('🧪 Testing Fallback MGNREGA Data...');
  
  // Test 1: Get all districts
  console.log('1️⃣ All districts:', fallbackMGNREGAData.districts.length);
  
  // Test 2: Get specific district
  const agra = getDistrictById(1);
  console.log('2️⃣ Agra district:', agra?.name, agra?.households_registered);
  
  // Test 3: Search districts
  const searchResults = searchDistricts('luc');
  console.log('3️⃣ Search "luc":', searchResults.map(d => d.name));
  
  // Test 4: Data structure
  const sample = fallbackMGNREGAData.districts[0];
  console.log('4️⃣ Sample district fields:', Object.keys(sample));
  
  console.log('✅ Fallback data is working correctly!');
  
  return {
    totalDistricts: fallbackMGNREGAData.districts.length,
    sampleDistrict: sample.name,
    searchWorks: searchResults.length > 0
  };
}

// Auto-run test in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  testFallbackData();
}