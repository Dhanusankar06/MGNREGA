# 🎨 Render Deployment - Free with PostgreSQL

## 🎯 **Why Render?**
- ✅ **Free tier** with PostgreSQL included
- ✅ **Automatic subdomain** (e.g., mgnrega-lokdekho.onrender.com)
- ✅ **Git-based deployment** from GitHub
- ✅ **SSL certificate** included
- ✅ **Environment variables** management

## 🚀 **Step-by-Step Deployment**

### **1. Prepare Project Structure**
```bash
# Create render.yaml for configuration
cat > render.yaml << 'EOF'
services:
  - type: web
    name: mgnrega-api
    env: node
    buildCommand: npm run install:all && cd frontend && npm run build
    startCommand: cd server && npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: DATA_GOV_API_KEY
        value: 579b464db66ec23bdd000001cde4e6f4672b4884773391b3f9d2a01a
      - key: DATA_GOV_BASE_URL
        value: https://api.data.gov.in/resource
      - key: NEXT_PUBLIC_ENABLE_GEOLOCATION
        value: true

  - type: pserv
    name: mgnrega-db
    env: postgresql
    plan: free
    
  - type: redis
    name: mgnrega-redis
    plan: free
EOF

# Update server package.json for Render
cd server
cat > package.json << 'EOF'
{
  "name": "mgnrega-backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "build": "echo 'No build step required'",
    "db:migrate": "node scripts/migrate.js",
    "db:seed": "node scripts/seed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.1.5",
    "pg": "^8.11.3",
    "redis": "^4.6.10",
    "axios": "^1.12.2",
    "dotenv": "^16.3.1",
    "sqlite3": "^5.1.7"
  }
}
EOF
```

### **2. Setup Render Account**
1. Go to **https://render.com**
2. **Sign up** with GitHub (free)
3. **Create Web Service** from your GitHub repo
4. **Add PostgreSQL** database (free tier)

### **3. Configure Build Settings**
- **Build Command**: `npm run install:all && cd frontend && npm run build`
- **Start Command**: `cd server && npm start`
- **Environment**: Node.js
- **Health Check Path**: `/api/health`

### **4. Environment Variables**
```bash
NODE_ENV=production
DATABASE_URL=${DATABASE_URL}  # Render provides automatically
REDIS_URL=${REDIS_URL}        # If you add Redis service
DATA_GOV_API_KEY=579b464db66ec23bdd000001cde4e6f4672b4884773391b3f9d2a01a
NEXT_PUBLIC_API_URL=${RENDER_EXTERNAL_URL}
```

### **5. Deploy**
- **Connect GitHub** repository
- **Auto-deploy** on every push
- **Live URL**: `https://mgnrega-lokdekho.onrender.com`