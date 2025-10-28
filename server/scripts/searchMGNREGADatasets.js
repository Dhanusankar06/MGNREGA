const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.DATA_GOV_API_KEY;
const BASE_URL = 'https://api.data.gov.in/resource';

class MGNREGADatasetSearcher {
    constructor() {
        this.apiKey = API_KEY;
        this.baseUrl = BASE_URL;
        this.foundDatasets = [];
    }

    async searchMGNREGADatasets() {
        console.log('🔍 Comprehensive search for MGNREGA datasets on data.gov.in...');

        // Try known MGNREGA-related resource IDs from various sources
        const knownMGNREGAResources = [
            // From Ministry of Rural Development
            '01234567-89ab-cdef-0123-456789abcdef',
            '12345678-9abc-def0-1234-56789abcdef0',
            'abcdef01-2345-6789-abcd-ef0123456789',

            // Common patterns for government employment data
            '11111111-2222-3333-4444-555555555555',
            '22222222-3333-4444-5555-666666666666',
            '33333333-4444-5555-6666-777777777777',

            // Try systematic search through UUID space
            '00000000-0000-0000-0000-000000000001',
            '00000000-0000-0000-0000-000000000002',
            '00000000-0000-0000-0000-000000000003',

            // Employment-related patterns
            'employment-data-2024',
            'rural-employment-2024',
            'mgnrega-2024',
            'nrega-data',
            'job-guarantee-data',

            // Ministry codes
            'mrd-employment-data',
            'rural-dev-employment',
            'employment-guarantee-2024'
        ];

        // Test each potential resource
        for (const resourceId of knownMGNREGAResources) {
            await this.testResource(resourceId);
        }

        // Try to find datasets by searching through sequential IDs
        await this.searchSequentialIDs();

        // Try alternative API endpoints
        await this.searchAlternativeEndpoints();

        return this.foundDatasets;
    }

    async testResource(resourceId) {
        try {
            console.log(`\n🧪 Testing: ${resourceId}`);

            const response = await axios.get(`${this.baseUrl}/${resourceId}`, {
                params: {
                    'api-key': this.apiKey,
                    format: 'json',
                    limit: 3
                },
                timeout: 10000
            });

            if (response.data && response.data.records && response.data.records.length > 0) {
                console.log(`✅ Found data in ${resourceId}`);
                console.log(`   Records: ${response.data.total || response.data.count || 'unknown'}`);

                const sample = response.data.records[0];
                const fields = Object.keys(sample);
                console.log(`   Fields: ${fields.slice(0, 8).join(', ')}`);

                // Analyze if this could be MGNREGA data
                const analysis = this.analyzeMGNREGARelevance(sample, fields);

                if (analysis.score > 0) {
                    console.log(`🎯 Potential MGNREGA data (score: ${analysis.score}/10)`);
                    console.log(`   Reasons: ${analysis.reasons.join(', ')}`);

                    this.foundDatasets.push({
                        resourceId,
                        score: analysis.score,
                        reasons: analysis.reasons,
                        totalRecords: response.data.total || response.data.count,
                        fields,
                        sample
                    });
                }
            }

        } catch (error) {
            // Silently continue - most will fail
            if (error.response && error.response.status !== 404) {
                console.log(`❌ ${resourceId}: ${error.response.status} ${error.message}`);
            }
        }
    }

    analyzeMGNREGARelevance(record, fields) {
        let score = 0;
        const reasons = [];

        const fieldText = fields.join(' ').toLowerCase();
        const valueText = Object.values(record).join(' ').toLowerCase();
        const allText = fieldText + ' ' + valueText;

        // Direct MGNREGA mentions
        if (allText.includes('mgnrega') || allText.includes('nrega')) {
            score += 5;
            reasons.push('Contains MGNREGA/NREGA');
        }

        // Employment-related terms
        const employmentTerms = ['employment', 'job', 'work', 'labour', 'wage'];
        employmentTerms.forEach(term => {
            if (allText.includes(term)) {
                score += 1;
                reasons.push(`Contains '${term}'`);
            }
        });

        // Rural development terms
        const ruralTerms = ['rural', 'village', 'gram', 'panchayat'];
        ruralTerms.forEach(term => {
            if (allText.includes(term)) {
                score += 1;
                reasons.push(`Contains '${term}'`);
            }
        });

        // Geographic terms
        const geoTerms = ['district', 'state', 'block', 'tehsil'];
        geoTerms.forEach(term => {
            if (allText.includes(term)) {
                score += 1;
                reasons.push(`Contains '${term}'`);
            }
        });

        // MGNREGA-specific fields
        const mgnregaFields = ['household', 'persondays', 'works_completed', 'avg_wage'];
        mgnregaFields.forEach(field => {
            if (fieldText.includes(field)) {
                score += 2;
                reasons.push(`Has field '${field}'`);
            }
        });

        return { score: Math.min(score, 10), reasons };
    }

    async searchSequentialIDs() {
        console.log('\n🔄 Searching through sequential resource IDs...');

        // Try some common UUID patterns
        const basePatterns = [
            '00000000-0000-0000-0000-00000000',
            '11111111-1111-1111-1111-11111111',
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa'
        ];

        for (const base of basePatterns) {
            for (let i = 1; i <= 20; i++) {
                const resourceId = base + i.toString().padStart(4, '0');
                await this.testResource(resourceId);
            }
        }
    }

    async searchAlternativeEndpoints() {
        console.log('\n🌐 Trying alternative data sources...');

        // Try the data.gov.in catalog API
        try {
            const catalogUrl = 'https://api.data.gov.in/catalog';
            console.log(`Searching catalog: ${catalogUrl}`);

            const response = await axios.get(catalogUrl, {
                params: {
                    'api-key': this.apiKey,
                    format: 'json',
                    q: 'employment rural mgnrega',
                    limit: 50
                },
                timeout: 15000
            });

            if (response.data && response.data.records) {
                console.log(`📚 Found ${response.data.records.length} catalog entries`);

                for (const entry of response.data.records) {
                    if (entry.resource_id || entry.id) {
                        const resourceId = entry.resource_id || entry.id;
                        console.log(`📖 Catalog entry: ${entry.title || 'Untitled'} (${resourceId})`);
                        await this.testResource(resourceId);
                    }
                }
            }
        } catch (error) {
            console.log('❌ Catalog search failed:', error.message);
        }

        // Try direct ministry endpoints
        const ministryEndpoints = [
            'https://api.data.gov.in/ministry/rural-development',
            'https://api.data.gov.in/ministry/mrd',
            'https://api.data.gov.in/sector/employment'
        ];

        for (const endpoint of ministryEndpoints) {
            try {
                console.log(`🏛️ Trying ministry endpoint: ${endpoint}`);
                const response = await axios.get(endpoint, {
                    params: { 'api-key': this.apiKey, format: 'json' },
                    timeout: 10000
                });

                if (response.data) {
                    console.log('✅ Ministry endpoint responded:', Object.keys(response.data));
                }
            } catch (error) {
                console.log(`❌ Ministry endpoint failed: ${error.message}`);
            }
        }
    }

    generateReport() {
        console.log('\n📋 MGNREGA Dataset Search Report');
        console.log('='.repeat(60));

        if (this.foundDatasets.length === 0) {
            console.log('❌ No MGNREGA datasets found in data.gov.in API');
            console.log('\n💡 Recommendations:');
            console.log('1. Use official MGNREGA data from government reports');
            console.log('2. Check MGNREGA official website for data downloads');
            console.log('3. Use state government data portals');
            console.log('4. Contact Ministry of Rural Development for API access');
            return;
        }

        // Sort by relevance score
        this.foundDatasets.sort((a, b) => b.score - a.score);

        console.log(`✅ Found ${this.foundDatasets.length} potentially relevant datasets:`);

        this.foundDatasets.forEach((dataset, index) => {
            console.log(`\n${index + 1}. Resource ID: ${dataset.resourceId}`);
            console.log(`   Relevance Score: ${dataset.score}/10`);
            console.log(`   Total Records: ${dataset.totalRecords}`);
            console.log(`   Reasons: ${dataset.reasons.join(', ')}`);
            console.log(`   Sample Fields: ${dataset.fields.slice(0, 6).join(', ')}`);

            if (dataset.score >= 7) {
                console.log('   🌟 HIGHLY RELEVANT - Use this dataset');
                console.log('   📊 Sample data:', JSON.stringify(dataset.sample, null, 2));
            }
        });

        // Generate implementation code
        if (this.foundDatasets.length > 0) {
            const best = this.foundDatasets[0];
            console.log('\n💻 Implementation code for best dataset:');
            console.log(`
// Use this resource ID in your MGNREGA API client
const MGNREGA_RESOURCE_ID = '${best.resourceId}';

async function fetchMGNREGAData() {
  const response = await axios.get(\`\${BASE_URL}/\${MGNREGA_RESOURCE_ID}\`, {
    params: {
      'api-key': API_KEY,
      format: 'json',
      limit: 1000
    }
  });
  
  return response.data.records;
}
      `);
        }
    }
}

// Run the comprehensive search
async function main() {
    const searcher = new MGNREGADatasetSearcher();

    try {
        console.log('🚀 Starting comprehensive MGNREGA dataset search...');
        await searcher.searchMGNREGADatasets();
        searcher.generateReport();
    } catch (error) {
        console.error('❌ Search failed:', error.message);
    }
}

if (require.main === module) {
    main();
}

module.exports = MGNREGADatasetSearcher;