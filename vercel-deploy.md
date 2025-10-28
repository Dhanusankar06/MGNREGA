# ▲ Vercel + PlanetScale Deployment - Completely Free

## 🎯 **Why Vercel + PlanetScale?**
- ✅ **Completely free** for personal projects
- ✅ **Automatic subdomain** (e.g., mgnrega-lokdekho.vercel.app)
- ✅ **Git-based deployment** - push to deploy
- ✅ **Global CDN** for fast loading
- ✅ **Serverless functions** for API
- ✅ **MySQL database** (PlanetScale free tier)

## 🚀 **Step-by-Step Deployment**

### **1. Prepare for Serverless**
```bash
# Create API routes in frontend/pages/api/
mkdir -p frontend/pages/api

# Move server routes to Next.js API routes
cp server/routes/health.js frontend/pages/api/health.js
cp server/routes/districts-simple.js frontend/pages/api/districts.js

# Create database connection for serverless
cat > frontend/lib/db.js << 'EOF'
import mysql from 'mysql2/promise';

const connection = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: {
    rejectUnauthorized: true
  }
});

export default connection;
EOF
```

### **2. Setup PlanetScale Database**
1. Go to **https://planetscale.com**
2. **Sign up** (free tier: 1 database, 1GB storage)
3. **Create database** named `mgnrega_db`
4. **Get connection string**

### **3. Setup Vercel Account**
1. Go to **https://vercel.com**
2. **Sign up** with GitHub (free)
3. **Import project** from GitHub
4. **Configure build settings**

### **4. Configure Environment Variables in Vercel**
```bash
NODE_ENV=production
DATABASE_URL=mysql://username:password@host/mgnrega_db?sslaccept=strict
DATA_GOV_API_KEY=579b464db66ec23bdd000001cde4e6f4672b4884773391b3f9d2a01a
DATA_GOV_BASE_URL=https://api.data.gov.in/resource
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
NEXT_PUBLIC_ENABLE_GEOLOCATION=true
```

### **5. Update Next.js Config for Vercel**
```javascript
// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Internationalization
  i18n: {
    locales: ['en', 'hi', 'ur'],
    defaultLocale: 'hi',
    localeDetection: true
  },
  
  // API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*'
      }
    ];
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ENABLE_GEOLOCATION: process.env.NEXT_PUBLIC_ENABLE_GEOLOCATION
  }
};

module.exports = nextConfig;
```

### **6. Deploy**
```bash
# Push to GitHub
git add .
git commit -m "Deploy to Vercel"
git push origin main

# Vercel auto-deploys from GitHub
# Live URL: https://mgnrega-lokdekho.vercel.app
```