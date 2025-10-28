const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.DATA_GOV_API_KEY || '579b464db66ec23bdd000001cde4e6f4672b4884773391b3f9d2a01a';
const BASE_URL = 'https://api.data.gov.in';

// Known working endpoints from your test
const WORKING_ENDPOINTS = [
    '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69', // Air pollution data (3,329 records)
    'b663934f-7c39-496c-9b7a-8b8b0d0c5e5e', // Empty dataset
    '9ac1c5c6-9a8c-4543-9c61-1239c4245f8e'  // Empty dataset
];

// Common MGNREGA-related resource IDs to test
const MGNREGA_RESOURCE_IDS = [
    // Common patterns for MGNREGA data
    '01234567-89ab-cdef-0123-456789abcdef',
    '12345678-9abc-def0-1234-56789abcdef0',
    'abcd1234-5678-90ef-ghij-klmnopqrstuv',
    // Try variations of known working endpoint
    '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba70',
    '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba71',
    '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba72',
    // Common government data patterns
    'mgnrega-district-data-2024',
    'rural-employment-data',
    'nrega-performance-data'
];

async function searchDataGovCatalog() {
    console.log('🔍 Searching data.gov.in catalog for MGNREGA datasets...');

    try {
        // Try to access the catalog or search API
        const catalogUrls = [
            `${BASE_URL}/catalog`,
            `${BASE_URL}/api/catalog`,
            `${BASE_URL}/search`,
            `${BASE_URL}/datasets`
        ];

        for (const url of catalogUrls) {
            try {
                console.log(`Trying catalog URL: ${url}`);
                const response = await axios.get(url, {
                    params: {
                        'api-key': API_KEY,
                        q: 'mgnrega',
                        format: 'json'
                    },
                    timeout: 10000
                });

                console.log(`✅ Catalog response from ${url}:`, response.status);
                if (response.data) {
                    console.log('Data keys:', Object.keys(response.data));
                    if (response.data.results || response.data.datasets) {
                        const datasets = response.data.results || response.data.datasets;
                        console.log(`Found ${datasets.length} datasets`);

                        datasets.forEach((dataset, index) => {
                            if (index < 10) { // Show first 10
                                console.log(`- ${dataset.title || dataset.name}: ${dataset.id || dataset.resource_id}`);
                            }
                        });
                    }
                }
                break; // If one works, don't try others
            } catch (error) {
                console.log(`❌ ${url} failed:`, error.message);
            }
        }
    } catch (error) {
        console.log('❌ Catalog search failed:', error.message);
    }
}

async function testResourceEndpoint(resourceId) {
    try {
        const response = await axios.get(`${BASE_URL}/resource/${resourceId}`, {
            params: {
                'api-key': API_KEY,
                format: 'json',
                limit: 5
            },
            timeout: 10000
        });

        const hasData = response.data.records && response.data.records.length > 0;
        const sampleRecord = hasData ? response.data.records[0] : null;

        return {
            resourceId,
            status: response.status,
            total: response.data.total || 0,
            count: response.data.count || 0,
            hasData,
            sampleRecord,
            fields: response.data.field || []
        };
    } catch (error) {
        return {
            resourceId,
            error: error.message,
            hasData: false
        };
    }
}

async function analyzeWorkingEndpoint() {
    console.log('\n🔬 Analyzing the working endpoint for MGNREGA-like data...');

    const workingEndpoint = '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69';

    try {
        // Get more data from the working endpoint
        const response = await axios.get(`${BASE_URL}/resource/${workingEndpoint}`, {
            params: {
                'api-key': API_KEY,
                format: 'json',
                limit: 100,
                offset: 0
            },
            timeout: 15000
        });

        console.log(`📊 Working endpoint analysis:`);
        console.log(`   Total records: ${response.data.total}`);
        console.log(`   Fields: ${response.data.field ? response.data.field.map(f => f.id).join(', ') : 'Unknown'}`);

        if (response.data.records && response.data.records.length > 0) {
            const sampleRecord = response.data.records[0];
            console.log(`   Sample record keys: ${Object.keys(sampleRecord).join(', ')}`);

            // Check if this could be adapted for MGNREGA-like data
            const hasLocationData = sampleRecord.state || sampleRecord.district || sampleRecord.city;
            const hasNumericData = Object.values(sampleRecord).some(v => !isNaN(parseFloat(v)));

            console.log(`   Has location data: ${hasLocationData}`);
            console.log(`   Has numeric data: ${hasNumericData}`);

            if (hasLocationData && hasNumericData) {
                console.log('✅ This endpoint could be adapted for location-based data visualization!');

                // Show state distribution
                const states = {};
                response.data.records.forEach(record => {
                    const state = record.state || 'Unknown';
                    states[state] = (states[state] || 0) + 1;
                });

                console.log('📍 State distribution:');
                Object.entries(states).slice(0, 10).forEach(([state, count]) => {
                    console.log(`   ${state}: ${count} records`);
                });
            }
        }
    } catch (error) {
        console.log('❌ Analysis failed:', error.message);
    }
}

async function findMGNREGAEndpoints() {
    console.log('🎯 Searching for MGNREGA data endpoints...');
    console.log(`Using API key: ${API_KEY.substring(0, 10)}...`);

    // Step 1: Search catalog
    await searchDataGovCatalog();

    // Step 2: Test known MGNREGA resource IDs
    console.log('\n🧪 Testing potential MGNREGA resource IDs...');

    const results = [];
    for (const resourceId of MGNREGA_RESOURCE_IDS) {
        console.log(`Testing: ${resourceId}`);
        const result = await testResourceEndpoint(resourceId);
        results.push(result);

        if (result.hasData) {
            console.log(`✅ Found data in ${resourceId}: ${result.total} records`);
            console.log(`   Sample: ${JSON.stringify(result.sampleRecord, null, 2)}`);
        } else if (result.error) {
            console.log(`❌ ${resourceId}: ${result.error}`);
        } else {
            console.log(`⚠️ ${resourceId}: No data (${result.total} records)`);
        }
    }

    // Step 3: Analyze working endpoint
    await analyzeWorkingEndpoint();

    // Step 4: Summary
    console.log('\n📋 Summary:');
    const workingEndpoints = results.filter(r => r.hasData);
    console.log(`Found ${workingEndpoints.length} endpoints with data`);

    if (workingEndpoints.length === 0) {
        console.log('💡 Recommendation: Use the working air pollution endpoint as a template');
        console.log('   and create MGNREGA data with similar structure but real MGNREGA values');
    }

    return results;
}

if (require.main === module) {
    findMGNREGAEndpoints().catch(console.error);
}

module.exports = { findMGNREGAEndpoints };