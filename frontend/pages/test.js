export default function Test() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 MGNREGA LokDekho Test Page</h1>
      <p>If you can see this, the Next.js frontend is working!</p>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
        <h2>✅ Backend API Test</h2>
        <p>Backend is running on: <a href="http://localhost:3002/api/health" target="_blank">http://localhost:3002/api/health</a></p>
        <p>Districts API: <a href="http://localhost:3002/api/districts" target="_blank">http://localhost:3002/api/districts</a></p>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
        <h2>🎯 Project Features</h2>
        <ul>
          <li>✅ Next.js Frontend with Tailwind CSS</li>
          <li>✅ Node.js Backend with Express</li>
          <li>✅ SQLite Database (for development)</li>
          <li>✅ Multi-language support (Hindi, English, Urdu)</li>
          <li>✅ Accessibility features</li>
          <li>✅ Mobile-first responsive design</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
        <h2>🔗 Quick Links</h2>
        <ul>
          <li><a href="/">Main Application (may have loading issues)</a></li>
          <li><a href="/test">This Test Page</a></li>
        </ul>
      </div>
    </div>
  );
}