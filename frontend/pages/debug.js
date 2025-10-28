import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Debug() {
  const [apiUrl, setApiUrl] = useState('');
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || 'https://mgnrega-eirq.onrender.com');
  }, []);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing API URL:', apiUrl);
      const response = await axios.get(`${apiUrl}/api/districts`, {
        params: { limit: 10 }
      });
      
      console.log('API Response:', response.data);
      setDistricts(response.data.districts || []);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔍 MGNREGA API Debug Page</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
        <h2>API Configuration</h2>
        <p><strong>API URL:</strong> {apiUrl}</p>
        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
        <p><strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testAPI} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test API'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '15px', backgroundColor: '#fee', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ color: 'red' }}>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {districts.length > 0 && (
        <div style={{ padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
          <h3 style={{ color: 'green' }}>✅ Districts Found ({districts.length})</h3>
          <ul>
            {districts.slice(0, 10).map((district, index) => (
              <li key={index}>
                <strong>{district.name}</strong> - {district.state_name || district.state_id} 
                (ID: {district.id})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
        <h3>🔗 Direct API Links</h3>
        <ul>
          <li><a href={`${apiUrl}/api/health`} target="_blank">Health Check</a></li>
          <li><a href={`${apiUrl}/api/districts`} target="_blank">Districts API</a></li>
          <li><a href={`${apiUrl}/api/districts?limit=5`} target="_blank">Districts (Limited)</a></li>
        </ul>
      </div>
    </div>
  );
}