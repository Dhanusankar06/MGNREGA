const axios = require('axios');

async function checkDeployment() {
    console.log('🔍 Checking MGNREGA LokDekho Deployment Status...\n');

    const baseUrl = 'https://mgnrega-eirq.onrender.com';

    try {
        // Check API status
        console.log('1️⃣ Checking API status...');
        const apiResponse = await axios.get(`${baseUrl}/api`, { timeout: 10000 });
        console.log('✅ API Status:', apiResponse.status);
        console.log('📊 API Response:', JSON.stringify(apiResponse.data, null, 2));

        // Check if frontend exists
        if (apiResponse.data.frontend) {
            console.log('\n2️⃣ Frontend Status:');
            console.log('   Path:', apiResponse.data.frontend.path);
            console.log('   Exists:', apiResponse.data.frontend.exists);
            console.log('   Index Exists:', apiResponse.data.frontend.indexExists);
            console.log('   Files:', apiResponse.data.frontend.files);
        }

        // Check health
        console.log('\n3️⃣ Checking health endpoint...');
        const healthResponse = await axios.get(`${baseUrl}/api/health`, { timeout: 5000 });
        console.log('✅ Health Status:', healthResponse.status);
        console.log('📊 Health Data:', healthResponse.data);

        // Check MGNREGA data
        console.log('\n4️⃣ Checking MGNREGA data...');
        const mgnregaResponse = await axios.get(`${baseUrl}/api/districts-mgnrega`, { timeout: 10000 });
        console.log('✅ MGNREGA Status:', mgnregaResponse.status);
        console.log('📊 MGNREGA Districts:', mgnregaResponse.data.total);

        // Try to access frontend
        console.log('\n5️⃣ Checking frontend access...');
        const frontendResponse = await axios.get(baseUrl, {
            timeout: 10000,
            headers: { 'Accept': 'text/html' }
        });
        console.log('✅ Frontend Status:', frontendResponse.status);
        console.log('📄 Content Type:', frontendResponse.headers['content-type']);
        console.log('📏 Content Length:', frontendResponse.data.length);

        if (frontendResponse.data.includes('MGNREGA LokDekho')) {
            console.log('🎉 Frontend is loading correctly!');
        } else {
            console.log('⚠️ Frontend might not be loading properly');
        }

    } catch (error) {
        console.error('❌ Error checking deployment:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

checkDeployment();