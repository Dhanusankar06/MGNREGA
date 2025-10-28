# 🚀 MGNREGA LokDekho - Render Deployment Guide

> **Note**: This guide focuses on Render deployment - the best free hosting platform for your MGNREGA dashboard.

## 🎯 **Quick Start - Deploy to Render in 10 Minutes**

Render is the best free hosting platform for your MGNREGA dashboard. Follow this guide for a complete deployment.

### **Why Render?**
- ✅ **Free tier** with 750 hours/month
- ✅ **Free PostgreSQL** database included  
- ✅ **Automatic HTTPS** and SSL certificates
- ✅ **Git-based deployment** - auto-deploy on push
- ✅ **Zero configuration** required
- ✅ **Better than Heroku** (which ended free tier)

---

## 📋 **Prerequisites**
- GitHub account with your project
- Render account (free signup)
- 10 minutes of your time

For detailed step-by-step instructions, see: **[render-deploy.md](./render-deploy.md)**

---

## 🚀 **Quick Deployment Steps**

### **Step 1: Create Render Account**
1. Go to https://render.com
2. Sign up with GitHub (free)
3. Authorize Render to access your repositories

### **Step 2: Create Web Service**
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure settings:
   - **Name**: `mgnrega-dashboard`
   - **Build Command**: `npm run install:all && npm run build:frontend`
   - **Start Command**: `npm start`
   - **Plan**: Free

### **Step 3: Add PostgreSQL Database**
1. Click "New +" → "PostgreSQL"
2. **Name**: `mgnrega-db`
3. **Plan**: Free
4. Connect to your web service

### **Step 4: Configure Environment Variables**
Add these in your web service environment settings:
```bash
NODE_ENV=production
DATABASE_URL=[Auto-filled by Render]
DATA_GOV_API_KEY=579b464db66ec23bdd000001cde4e6f4672b4884773391b3f9d2a01a
DATA_GOV_BASE_URL=https://api.data.gov.in/resource
NEXT_PUBLIC_API_URL=https://your-service-name.onrender.com
NEXT_PUBLIC_ENABLE_GEOLOCATION=true
JWT_SECRET=your-super-secret-jwt-key
```

### **Step 5: Deploy & Test**
1. Render automatically builds and deploys
2. Visit your live URL: `https://your-service-name.onrender.com`
3. Test all features work correctly

---

## 🎯 **Your Live Application**

After deployment, your MGNREGA dashboard will be available at:
- **Main App**: `https://your-service-name.onrender.com`
- **API Health**: `https://your-service-name.onrender.com/api/health`

## 📚 **Additional Resources**

- **Detailed Guide**: [render-deploy.md](./render-deploy.md) - Complete step-by-step instructions
- **Render Documentation**: https://render.com/docs
- **Support**: Render community forum and documentation

---

**🎊 Your MGNREGA LokDekho application will be live on Render with free PostgreSQL database and automatic HTTPS!**