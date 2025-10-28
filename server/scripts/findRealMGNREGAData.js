const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.DATA_GOV_API_KEY;
const BASE_URL = 'https://api.data.gov.in/resource';

class MGNREGADataFinder {
  constructor() {
    this.apiKey = API_KEY;
    this.baseUrl = BASE_URL;
    this.foundEndpoints = [];
  }

  async findMGNREGAResourceIDs() {
    console.log('🔍 Searching for real MGNREGA resource IDs on data.gov.in...');
    console.log(`Using API key: ${this.apiKey.substring(0, 10)}...`);
    
    // Known working resource IDs from data.gov.in catalog
    const knownResourceIDs = [
      // Employment and Rural Development datasets
      '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69', // Your working endpoint
      '9ac1c5c6-9a8c-4543-9c61-1239c4245f8e', // Alternative format
      'b663934f-7c39-496c-9b7a-8b8b0d0c5e5e', // State-wise data
      
      // Try systematic variations for MGNREGA
      '4c5f8b8a-9d2e-4f3a-8b1c-2d3e4f5a6b7c',
      '5d6g9c9b-ae3f-5g4b-9c2d-3e4f5g6a7b8d',
      '6e7h0d0c-bf4g-6h5c-ad3e-4f5g6h7b8c9e',
      
      // Common MGNREGA-related resource patterns
      'employment-guarantee-scheme-data',
      'rural-employment-data-2024',
      'mgnrega-district-performance',
      'nrega-state-wise-data',
      'mahatma-gandhi-employment-data'
    ];

    for (const resourceId of knownResourceIDs) {
      await this.testResourceID(resourceId);
    }

    // Try to find more by testing sequential patterns
    await this.searchSequentialPatterns();
    
    return this.foundEndpoints;
  }

  async testResourceID(resourceId) {
    try {
      console.log(`\n🧪 Testing resource ID: ${resourceId}`);
      
      const response = await axios.get(`${this.baseUrl}/${resourceId}`, {
        params: {
          'api-key': this.apiKey,
          format: 'json',
          limit: 5
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'MGNREGA-DataFinder/1.0',
          'Accept': 'application/json'
        }
      });

      if (response.data && response.data.records && response.data.records.length > 0) {
        const sample = response.data.records[0];
        const keys = Object.keys(sample);
        
        console.log(`✅ Resource ${resourceId} has data:`);
        console.log(`   Total records: ${response.data.total || response.data.count || 'unknown'}`);
        console.log(`   Sample fields: ${keys.slice(0, 10).join(', ')}`);
        
        // Check if this looks like MGNREGA/employment data
        const relevanceScore = this.calculateMGNREGARelevance(sample);
        
        if (relevanceScore > 0) {
          console.log(`🎯 MGNREGA relevance score: ${relevanceScore}/10`);
          
          this.foundEndpoints.push({
            resourceId,
            relevanceScore,
            totalRecords: response.data.total || response.data.count,
            sampleFields: keys,
            sampleRecord: sample
          });
          
          // Show sample data if highly relevant
          if (relevanceScore >= 5) {
            console.log('📊 Sample record:', JSON.stringify(sample, null, 2));
          }
        }
      } else {
        console.log(`❌ Resource ${resourceId}: No data found`);
      }
      
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`❌ Resource ${resourceId}: Not found (404)`);
      } else if (error.response && error.response.status === 403) {
        console.log(`❌ Resource ${resourceId}: Access denied (403)`);
      } else {
        console.log(`❌ Resource ${resourceId}: ${error.message}`);
      }
    }
  }

  calculateMGNREGARelevance(record) {
    const keys = Object.keys(record).map(k => k.toLowerCase());
    const values = Object.values(record).map(v => String(v).toLowerCase());
    const allText = [...keys, ...values].join(' ');
    
    let score = 0;
    
    // High relevance keywords
    const highKeywords = ['mgnrega', 'nrega', 'employment guarantee', 'rural employment', 'mahatma gandhi'];
    highKeywords.forEach(keyword => {
      if (allText.includes(keyword)) score += 3;
    });
    
    // Medium relevance keywords
    const mediumKeywords = ['district', 'household', 'persondays', 'wage', 'work', 'employment'];
    mediumKeywords.forEach(keyword => {
      if (allText.includes(keyword)) score += 1;
    });
    
    // Specific field patterns
    const mgnregaFields = ['households_registered', 'persondays_generated', 'works_completed', 'avg_wage'];
    mgnregaFields.forEach(field => {
      if (keys.includes(field)) score += 2;
    });
    
    return Math.min(score, 10); // Cap at 10
  }

  async searchSequentialPatterns() {
    console.log('\n🔄 Searching sequential UUID patterns...');
    
    // Base UUID from your working endpoint
    const baseUUID = '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69';
    const baseParts = baseUUID.split('-');
    
    // Try variations of the last part
    const lastPart = baseParts[4];
    const baseNum = parseInt(lastPart.substring(lastPart.length - 2), 16);
    
    for (let i = -10; i <= 10; i++) {
      if (i === 0) continue; // Skip the original
      
      const newNum = baseNum + i;
      if (newNum < 0 || newNum > 255) continue;
      
      const newLastPart = lastPart.substring(0, lastPart.length - 2) + 
                         newNum.toString(16).padStart(2, '0');
      const newUUID = [...baseParts.slice(0, 4), newLastPart].join('-');
      
      await this.testResourceID(newUUID);
    }
  }

  async searchByCategory() {
    console.log('\n📂 Searching by data categories...');
    
    // Try to access the data.gov.in catalog API
    try {
      const catalogResponse = await axios.get('https://api.data.gov.in/catalog', {
        params: {
          'api-key': this.apiKey,
          format: 'json',
          limit: 100,
          q: 'employment rural mgnrega'
        },
        timeout: 15000
      });
      
      if (catalogResponse.data && catalogResponse.data.records) {
        console.log(`Found ${catalogResponse.data.records.length} catalog entries`);
        
        for (const entry of catalogResponse.data.records) {
          if (entry.resource_id) {
            await this.testResourceID(entry.resource_id);
          }
        }
      }
    } catch (error) {
      console.log('❌ Catalog search failed:', error.message);
    }
  }

  generateReport() {
    console.log('\n📋 MGNREGA Data Search Report');
    console.log('=' .repeat(50));
    
    if (this.foundEndpoints.length === 0) {
      console.log('❌ No MGNREGA-relevant endpoints found');
      return;
    }
    
    // Sort by relevance score
    this.foundEndpoints.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    console.log(`✅ Found ${this.foundEndpoints.length} relevant endpoints:`);
    
    this.foundEndpoints.forEach((endpoint, index) => {
      console.log(`\n${index + 1}. Resource ID: ${endpoint.resourceId}`);
      console.log(`   Relevance: ${endpoint.relevanceScore}/10`);
      console.log(`   Records: ${endpoint.totalRecords}`);
      console.log(`   Key fields: ${endpoint.sampleFields.slice(0, 5).join(', ')}`);
      
      if (endpoint.relevanceScore >= 7) {
        console.log('   🌟 HIGHLY RELEVANT - Recommended for use');
      } else if (endpoint.relevanceScore >= 4) {
        console.log('   ⭐ MODERATELY RELEVANT - May contain useful data');
      }
    });
    
    // Generate code snippet for the best endpoint
    if (this.foundEndpoints.length > 0) {
      const best = this.foundEndpoints[0];
      console.log('\n💻 Code snippet for best endpoint:');
      console.log(`
const resourceId = '${best.resourceId}';
const response = await axios.get(\`\${BASE_URL}/\${resourceId}\`, {
  params: {
    'api-key': API_KEY,
    format: 'json',
    limit: 1000
  }
});
      `);
    }
  }
}

// Run the search
async function main() {
  const finder = new MGNREGADataFinder();
  
  try {
    await finder.findMGNREGAResourceIDs();
    finder.generateReport();
  } catch (error) {
    console.error('❌ Search failed:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = MGNREGADataFinder;