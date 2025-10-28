# 🎨 Complete Render Deployment Guide - Free Hosting

## 🎯 **Why Render?**
- ✅ **Free tier** with 750 hours/month (enough for personal projects)
- ✅ **Free PostgreSQL** database included
- ✅ **Automatic HTTPS** and custom domains
- ✅ **Git-based deployment** - auto-deploy on push
- ✅ **Zero configuration** - works out of the box
- ✅ **Better than Heroku** free tier (which ended)

## 📋 **Prerequisites**
- GitHub account with your project
- Render account (free)
- Your project should be pushed to GitHub

## 🚀 **Complete Step-by-Step Deployment**

### **Step 1: Prepare Your Project for Render**

First, let's create the necessary configuration files:

#### Create render.yaml (Infrastructure as Code)
```yaml
services:
  # Main Web Service
  - type: web
    name: mgnrega-dashboard
    env: node
    region: oregon
    plan: free
    buildCommand: npm run install:all && npm run build:frontend
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATA_GOV_API_KEY
        value: 579b464db66ec23bdd000001cde4e6f4672b4884773391b3f9d2a01a
      - key: DATA_GOV_BASE_URL
        value: https://api.data.gov.in/resource
      - key: NEXT_PUBLIC_ENABLE_GEOLOCATION
        value: "true"
      - key: JWT_SECRET
        generateValue: true

  # Background Worker (Optional)
  - type: worker
    name: mgnrega-worker
    env: node
    region: oregon
    plan: free
    buildCommand: npm run install:all
    startCommand: npm run worker

databases:
  # PostgreSQL Database
  - name: mgnrega-db
    plan: free
    region: oregon
```

#### Update package.json scripts for Render
Make sure your root package.json has these scripts:
```json
{
  "scripts": {
    "start": "cd server && npm start",
    "build:frontend": "cd frontend && npm run build",
    "install:all": "npm install && cd frontend && npm install && cd ../server && npm install",
    "worker": "cd server && npm run worker"
  }
}
```

### **Step 2: Create Render Account**

1. **Visit Render**: Go to https://render.com
2. **Sign Up**: Click "Get Started" → "Sign up with GitHub"
3. **Authorize**: Allow Render to access your GitHub repositories
4. **Verify Email**: Check your email and verify your account

### **Step 3: Create Web Service**

1. **Dashboard**: After login, you'll see Render dashboard
2. **New Web Service**: Click "New +" → "Web Service"
3. **Connect Repository**: 
   - Click "Connect account" if not connected
   - Find your MGNREGA project repository
   - Click "Connect"

### **Step 4: Configure Web Service Settings**

#### Basic Settings:
- **Name**: `mgnrega-dashboard` (or your preferred name)
- **Region**: Oregon (US West) - free tier available
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (uses project root)
- **Runtime**: Node

#### Build & Deploy Settings:
- **Build Command**: `npm run install:all && npm run build:frontend`
- **Start Command**: `npm start`
- **Plan**: Free ($0/month)

#### Advanced Settings:
- **Health Check Path**: `/api/health`
- **Auto-Deploy**: Yes (deploys on every push)

### **Step 5: Add PostgreSQL Database**

1. **From Dashboard**: Click "New +" → "PostgreSQL"
2. **Database Settings**:
   - **Name**: `mgnrega-db`
   - **Database**: `mgnrega_production`
   - **User**: `mgnrega_user`
   - **Region**: Oregon (same as web service)
   - **Plan**: Free
3. **Create Database**: Click "Create Database"
4. **Note Connection Details**: Render will provide DATABASE_URL automatically

### **Step 6: Configure Environment Variables**

In your web service settings, go to "Environment" tab and add:

```bash
# Core Settings
NODE_ENV=production
PORT=10000

# Database (Render auto-provides this)
DATABASE_URL=[Auto-filled by Render when you connect database]

# API Configuration
DATA_GOV_API_KEY=579b464db66ec23bdd000001cde4e6f4672b4884773391b3f9d2a01a
DATA_GOV_BASE_URL=https://api.data.gov.in/resource

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://your-service-name.onrender.com
NEXT_PUBLIC_ENABLE_GEOLOCATION=true

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-now

# Optional: Redis (if you add Redis service)
# REDIS_URL=[Will be auto-filled if you add Redis]
```

**Important**: Replace `your-service-name` with your actual Render service name.

### **Step 7: Connect Database to Web Service**

1. **In Web Service Settings**: Go to "Environment" tab
2. **Add Environment Variable**: 
   - Key: `DATABASE_URL`
   - Value: Click "Add from database" → Select your PostgreSQL database
3. **Save Changes**: Render will automatically redeploy

### **Step 8: Deploy Your Application**

1. **Automatic Deployment**: Render starts building automatically
2. **Monitor Build**: Watch build logs in real-time
3. **Build Process**: 
   - Installs dependencies
   - Builds frontend
   - Starts server
4. **First Deploy**: Takes 5-10 minutes

### **Step 9: Database Setup**

After successful deployment:

1. **Open Shell**: In your web service, go to "Shell" tab
2. **Run Migrations**:
   ```bash
   cd server && npm run db:migrate
   ```
3. **Seed Database**:
   ```bash
   cd server && npm run db:seed
   ```

### **Step 10: Add Background Worker (Optional)**

If you need background jobs:

1. **Create Worker Service**: "New +" → "Background Worker"
2. **Connect Same Repo**: Select your GitHub repository
3. **Worker Settings**:
   - **Name**: `mgnrega-worker`
   - **Build Command**: `npm run install:all`
   - **Start Command**: `npm run worker`
   - **Same Environment Variables**: Copy from web service

### **Step 11: Configure Custom Domain (Optional)**

1. **In Web Service**: Go to "Settings" → "Custom Domains"
2. **Add Domain**: Enter your domain name
3. **DNS Setup**: Point your domain to Render's servers
4. **SSL**: Render automatically provides SSL certificates

### **Step 12: Test Your Deployment**

1. **Access Your App**: Click the Render-provided URL
2. **Test Endpoints**:
   - Main app: `https://your-app.onrender.com`
   - Health check: `https://your-app.onrender.com/api/health`
   - API: `https://your-app.onrender.com/api/districts`
3. **Test Features**:
   - Language switching
   - District selection
   - Audio functionality
   - Data loading

## 🔧 **Troubleshooting Common Issues**

### **Build Failures**
```bash
# Check build logs in Render dashboard
# Common fixes:
- Ensure all dependencies are in package.json
- Check Node.js version compatibility
- Verify build commands are correct
```

### **Database Connection Issues**
```bash
# Verify DATABASE_URL is set correctly
# Check PostgreSQL service is running
# Run migrations: npm run db:migrate
```

### **Port Issues**
```bash
# Render uses PORT=10000 by default
# Make sure your server uses process.env.PORT
```

### **Environment Variables**
```bash
# Double-check all required variables
# Ensure NEXT_PUBLIC_API_URL matches your Render URL
# Verify API keys are correct
```

### **Cold Start Issues**
```bash
# Free tier services sleep after 15 minutes of inactivity
# First request after sleep takes 30-60 seconds
# Consider upgrading to paid plan for always-on service
```

## 📊 **Monitoring Your App**

### **Render Dashboard**:
- **Metrics**: CPU, memory, response times
- **Logs**: Real-time application logs
- **Events**: Deployment history
- **Shell**: Direct server access

### **Health Monitoring**:
- **Health Check**: `/api/health` endpoint
- **Uptime**: Render monitors automatically
- **Alerts**: Email notifications for downtime

## 💰 **Render Pricing**

### **Free Tier**:
- **Web Services**: 750 hours/month (enough for 1 always-on service)
- **PostgreSQL**: 1GB storage, 1 million rows
- **Bandwidth**: 100GB/month
- **Build Minutes**: 500 minutes/month

### **Paid Plans**:
- **Starter**: $7/month (always-on, more resources)
- **Standard**: $25/month (autoscaling, more features)

## 🎯 **Your Live URLs**

After deployment, you'll get:
- **Main App**: `https://mgnrega-dashboard.onrender.com`
- **API Health**: `https://mgnrega-dashboard.onrender.com/api/health`
- **Admin Panel**: `https://mgnrega-dashboard.onrender.com/api/admin`

## 🔄 **Continuous Deployment**

Render automatically redeploys when you:
1. **Push to GitHub**: Any commit to main branch
2. **Update Environment Variables**: In Render dashboard
3. **Manual Deploy**: Click "Manual Deploy" button

## ⚡ **Performance Tips**

1. **Keep Services Warm**: Make periodic requests to prevent sleeping
2. **Optimize Build**: Use npm ci instead of npm install
3. **Database Indexing**: Add indexes for better query performance
4. **Caching**: Implement Redis caching for API responses

## 🚀 **Next Steps**

1. **Monitor Performance**: Check response times and errors
2. **Set Up Monitoring**: Use tools like UptimeRobot for external monitoring
3. **Backup Database**: Regular PostgreSQL backups
4. **Scale Up**: Upgrade to paid plan when needed

Your MGNREGA dashboard is now live on Render with free PostgreSQL database and automatic HTTPS! 🎉