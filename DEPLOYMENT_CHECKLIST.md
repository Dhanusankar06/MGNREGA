# 📋 MGNREGA LokDekho - Deployment Checklist

## 🚀 **Pre-Deployment Setup**

### **1. Domain & Server Setup**
- [ ] **Purchase domain name** (e.g., mgnrega-lokdekho.com)
- [ ] **Setup VPS server** (Ubuntu 22.04, 4GB RAM, 40GB SSD)
- [ ] **Configure DNS A records** pointing to server IP
- [ ] **Get server root/sudo access**

### **2. API Keys & Credentials**
- [ ] **Register at data.gov.in** and get API key
- [ ] **Generate secure database password**
- [ ] **Generate JWT secret key**
- [ ] **Setup email for SSL certificate**

---

## 🛠️ **Deployment Steps**

### **Step 1: Fix Language Switching (Local)**
```bash
# Run this on your local machine first
node fix-language-switching.js
cd frontend
npm run dev
# Test language switching works
```

### **Step 2: Update Configuration**
```bash
# Edit deploy.sh with your details
nano deploy.sh
```

**Update these values:**
```bash
DOMAIN="your-actual-domain.com"  # ⚠️ CHANGE THIS
API_KEY="your-data-gov-api-key"  # ⚠️ GET FROM data.gov.in
```

### **Step 3: Upload to Server**
```bash
# Upload files to server
scp -r . root@your-server-ip:/tmp/mgnrega-lokdekho/
```

### **Step 4: Run Deployment Script**
```bash
# SSH into server
ssh root@your-server-ip

# Navigate to uploaded files
cd /tmp/mgnrega-lokdekho

# Make script executable
chmod +x deploy.sh

# Run deployment (this takes 10-15 minutes)
./deploy.sh
```

---

## ✅ **Post-Deployment Verification**

### **1. Check Services**
```bash
# Check PM2 processes
pm2 status

# Check system services
systemctl status nginx
systemctl status postgresql
systemctl status redis-server

# Check application health
curl https://yourdomain.com/health
```

### **2. Test Website Features**
- [ ] **Visit website:** https://yourdomain.com
- [ ] **Test language switching** (Hindi ↔ English ↔ Urdu)
- [ ] **Test district selection**
- [ ] **Test audio features**
- [ ] **Test mobile responsiveness**
- [ ] **Test API endpoints**

### **3. Performance Testing**
```bash
# Test API response time
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/api/health

# Test SSL certificate
curl -I https://yourdomain.com

# Test gzip compression
curl -H "Accept-Encoding: gzip" -I https://yourdomain.com
```

---

## 🔧 **Configuration Files Created**

### **1. Environment Variables** (`.env`)
```bash
DATABASE_URL=postgresql://mgnrega_user:password@localhost:5432/mgnrega_db
REDIS_URL=redis://localhost:6379
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://yourdomain.com
DATA_GOV_API_KEY=your-api-key
```

### **2. PM2 Configuration** (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [
    {
      name: 'mgnrega-api',
      script: './server/index.js',
      instances: 2,
      exec_mode: 'cluster'
    },
    {
      name: 'mgnrega-worker',
      script: './server/workers/index.js',
      instances: 1
    }
  ]
};
```

### **3. Nginx Configuration**
- **HTTP → HTTPS redirect**
- **Static file serving**
- **API proxy to Node.js**
- **Gzip compression**
- **Security headers**

---

## 🚨 **Troubleshooting Common Issues**

### **Issue 1: Language Not Switching**
```bash
# Check Next.js config
cat /opt/mgnrega-lokdekho/frontend/next.config.js

# Restart frontend build
cd /opt/mgnrega-lokdekho
npm run build:frontend
pm2 restart all
```

### **Issue 2: API Not Responding**
```bash
# Check PM2 logs
pm2 logs mgnrega-api

# Check if port 3001 is listening
netstat -tlnp | grep 3001

# Restart API
pm2 restart mgnrega-api
```

### **Issue 3: Database Connection Error**
```bash
# Test database connection
sudo -u postgres psql -d mgnrega_db -c "SELECT 1;"

# Check PostgreSQL status
systemctl status postgresql

# Check database credentials in .env
cat /opt/mgnrega-lokdekho/.env | grep DATABASE_URL
```

### **Issue 4: SSL Certificate Problems**
```bash
# Check certificate status
certbot certificates

# Renew certificate manually
certbot renew

# Check Nginx configuration
nginx -t
systemctl reload nginx
```

### **Issue 5: High Memory Usage**
```bash
# Check memory usage
free -h
htop

# Restart PM2 processes
pm2 restart all

# Check for memory leaks
pm2 monit
```

---

## 📊 **Monitoring & Maintenance**

### **Daily Checks**
```bash
# Check application status
pm2 status

# Check disk space
df -h

# Check error logs
tail -f /var/log/mgnrega/api-error.log
```

### **Weekly Tasks**
```bash
# Update system packages
apt update && apt upgrade -y

# Check SSL certificate expiry
certbot certificates

# Review backup files
ls -la /home/mgnrega/backups/
```

### **Monthly Tasks**
```bash
# Review security logs
tail -f /var/log/auth.log

# Test disaster recovery
# (Restore from backup on test server)

# Performance optimization
# (Review slow queries, optimize database)
```

---

## 🔐 **Security Checklist**

### **Server Security**
- [ ] **Firewall configured** (only ports 22, 80, 443 open)
- [ ] **SSH key authentication** (disable password login)
- [ ] **Fail2ban installed** (prevent brute force attacks)
- [ ] **Regular security updates** scheduled

### **Application Security**
- [ ] **Environment variables** properly secured
- [ ] **Database credentials** strong and unique
- [ ] **API keys** properly configured
- [ ] **HTTPS enforced** everywhere
- [ ] **Security headers** configured in Nginx

### **Data Security**
- [ ] **Daily database backups** automated
- [ ] **Backup encryption** enabled
- [ ] **Log rotation** configured
- [ ] **Sensitive data** not logged

---

## 📈 **Performance Optimization**

### **Frontend Optimization**
- [ ] **Static export** enabled for faster loading
- [ ] **Image optimization** configured
- [ ] **Gzip compression** enabled
- [ ] **Browser caching** configured

### **Backend Optimization**
- [ ] **Database indexes** created
- [ ] **Redis caching** enabled
- [ ] **Connection pooling** configured
- [ ] **PM2 clustering** enabled

### **Server Optimization**
- [ ] **Nginx caching** configured
- [ ] **Log rotation** setup
- [ ] **Memory limits** configured
- [ ] **Process monitoring** enabled

---

## 🎯 **Success Metrics**

### **Performance Targets**
- [ ] **Page load time** < 3 seconds
- [ ] **API response time** < 500ms
- [ ] **Uptime** > 99.9%
- [ ] **Mobile performance** score > 90

### **User Experience**
- [ ] **Language switching** works smoothly
- [ ] **Audio features** work on all devices
- [ ] **District search** is fast and accurate
- [ ] **Mobile interface** is touch-friendly

### **Technical Metrics**
- [ ] **Memory usage** < 80%
- [ ] **CPU usage** < 70%
- [ ] **Disk usage** < 80%
- [ ] **Database queries** < 100ms average

---

## 🎉 **Deployment Complete!**

### **Your MGNREGA LokDekho is now live at:**
- **🌐 Website:** https://yourdomain.com
- **🔍 API Health:** https://yourdomain.com/health
- **📊 Admin Panel:** https://yourdomain.com/admin

### **Management Commands:**
```bash
# View application logs
pm2 logs

# Restart all services
pm2 restart all

# Monitor system resources
pm2 monit

# Check website status
curl https://yourdomain.com/health
```

### **Support Contacts:**
- **Technical Issues:** Check logs and troubleshooting guide
- **Performance Issues:** Monitor system resources
- **Security Issues:** Review security checklist

---

**🎊 Congratulations! Your MGNREGA LokDekho application is now successfully deployed and ready to serve rural citizens across India!**

### **Next Steps:**
1. **Test thoroughly** with real users
2. **Monitor performance** and optimize as needed
3. **Setup monitoring alerts** for critical issues
4. **Plan for scaling** as user base grows
5. **Regular maintenance** and updates