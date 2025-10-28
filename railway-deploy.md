# 🚂 Railway Deployment - Free with Database

## 🎯 **Why Railway?**
- ✅ **Free tier** with PostgreSQL and Redis included
- ✅ **Automatic subdomain** (e.g., mgnrega-lokdekho-production.up.railway.app)
- ✅ **Git-based deployment** - just push to deploy
- ✅ **Environment variables** management
- ✅ **SSL certificate** included automatically

## 🚀 **Step-by-Step Deployment**

### **1. Prepare Your Project**
```bash
# Create railway.json configuration
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

# Create Procfile for process management
cat > Procfile << 'EOF'
web: cd server && npm start
worker: cd server && npm run worker
EOF

# Update package.json scripts
cat > package.json << 'EOF'
{
  "name": "mgnrega-lokdekho",
  "version": "1.0.0",
  "description": "District MGNREGA dashboard for low-literacy users",
  "main": "server/index.js",
  "scripts": {
    "start": "cd server && npm start",
    "build": "cd frontend && npm run build && cd ../server && npm install",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd server && npm run dev",
    "worker": "cd server && npm run worker",
    "install:all": "npm install && cd frontend && npm install && cd ../server && npm install"
  },
  "dependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF
```

### **2. Setup Railway Account**
1. Go to **https://railway.app**
2. **Sign up** with GitHub account (free)
3. **Create new project** from GitHub repo
4. **Add PostgreSQL** and **Redis** services

### **3. Configure Environment Variables**
In Railway dashboard, add these environment variables:
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=${PGDATABASE_URL}  # Railway provides this automatically
REDIS_URL=${REDIS_URL}          # Railway provides this automatically
DATA_GOV_API_KEY=579b464db66ec23bdd000001cde4e6f4672b4884773391b3f9d2a01a
DATA_GOV_BASE_URL=https://api.data.gov.in/resource
NEXT_PUBLIC_API_URL=${RAILWAY_PUBLIC_DOMAIN}
NEXT_PUBLIC_ENABLE_GEOLOCATION=true
JWT_SECRET=your-jwt-secret-here
```

### **4. Deploy**
```bash
# Push to GitHub (Railway auto-deploys)
git add .
git commit -m "Deploy to Railway"
git push origin main
```

### **5. Your Live URL**
Railway will provide a URL like: `https://mgnrega-lokdekho-production.up.railway.app`