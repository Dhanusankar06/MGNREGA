# 🚀 MGNREGA LokDekho - Complete Production Deployment Guide

## 📋 **Prerequisites**

### **Server Requirements**
- **Ubuntu 22.04 LTS** (recommended)
- **4GB RAM** minimum (8GB recommended)
- **40GB SSD** storage minimum
- **2 CPU cores** minimum
- **Root access** or sudo privileges

### **Domain & DNS**
- **Domain name** (e.g., mgnrega-lokdekho.com)
- **DNS access** to configure A records
- **SSL certificate** (automated via Let's Encrypt)

---

## 🛠️ **Step 1: Server Setup**

### **1.1 Update System**
```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

### **1.2 Create Deployment User**
```bash
sudo adduser mgnrega
sudo usermod -aG sudo mgnrega
su - mgnrega
```

### **1.3 Configure Firewall**
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw status
```

---

## 📦 **Step 2: Install Dependencies**

### **2.1 Install Node.js 18.x**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should show v18.x.x
npm --version
```

### **2.2 Install PostgreSQL 14**
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

**In PostgreSQL shell:**
```sql
CREATE USER mgnrega_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE mgnrega_db OWNER mgnrega_user;
GRANT ALL PRIVILEGES ON DATABASE mgnrega_db TO mgnrega_user;
\q
```

### **2.3 Install Redis**
```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
redis-cli ping  # Should return PONG
```

### **2.4 Install Nginx**
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### **2.5 Install PM2 (Process Manager)**
```bash
sudo npm install -g pm2
```

### **2.6 Install Certbot (SSL)**
```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## 📁 **Step 3: Deploy Application**

### **3.1 Clone Repository**
```bash
cd /home/mgnrega
git clone <your-repository-url> mgnrega-lokdekho
cd mgnrega-lokdekho
```

### **3.2 Install Dependencies**
```bash
npm run install:all
```

### **3.3 Configure Environment**
```bash
cp .env.example .env
nano .env
```

**Update .env file:**
```bash
# Database Configuration
DATABASE_URL=postgresql://mgnrega_user:your_secure_password_here@localhost:5432/mgnrega_db
REDIS_URL=redis://localhost:6379

# API Configuration
PORT=3001
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 64)

# Data.gov.in API (Get from https://data.gov.in/)
DATA_GOV_API_KEY=your-api-key-here
DATA_GOV_BASE_URL=https://api.data.gov.in/resource

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://yourdomain.com
NEXT_PUBLIC_ENABLE_GEOLOCATION=true

# Background Jobs
REDIS_QUEUE_URL=redis://localhost:6379/1

# Monitoring
ENABLE_METRICS=true
LOG_LEVEL=info
```

### **3.4 Setup Database**
```bash
npm run db:migrate
npm run db:seed
```

### **3.5 Build Frontend**
```bash
cd frontend
npm run build
cd ..
```

---

## ⚙️ **Step 4: Configure Process Management**

### **4.1 Create PM2 Ecosystem File**
```bash
nano ecosystem.config.js
```

**Add configuration:**
```javascript
module.exports = {
  apps: [
    {
      name: 'mgnrega-api',
      script: './server/index.js',
      cwd: '/home/mgnrega/mgnrega-lokdekho',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/mgnrega/api-error.log',
      out_file: '/var/log/mgnrega/api-out.log',
      log_file: '/var/log/mgnrega/api-combined.log',
      time: true,
      max_memory_restart: '1G'
    },
    {
      name: 'mgnrega-worker',
      script: './server/workers/index.js',
      cwd: '/home/mgnrega/mgnrega-lokdekho',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/mgnrega/worker-error.log',
      out_file: '/var/log/mgnrega/worker-out.log',
      time: true,
      max_memory_restart: '512M'
    }
  ]
};
```

### **4.2 Create Log Directory**
```bash
sudo mkdir -p /var/log/mgnrega
sudo chown mgnrega:mgnrega /var/log/mgnrega
```

### **4.3 Start Applications**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🌐 **Step 5: Configure Nginx**

### **5.1 Create Nginx Configuration**
```bash
sudo nano /etc/nginx/sites-available/mgnrega-lokdekho
```

**Add configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Frontend static files
    location / {
        root /home/mgnrega/mgnrega-lokdekho/frontend/out;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3001/api/health;
        access_log off;
    }
}
```

### **5.2 Enable Site**
```bash
sudo ln -s /etc/nginx/sites-available/mgnrega-lokdekho /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 **Step 6: Setup SSL Certificate**

### **6.1 Get SSL Certificate**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### **6.2 Test Auto-renewal**
```bash
sudo certbot renew --dry-run
```

---

## 📊 **Step 7: Setup Monitoring & Backups**

### **7.1 Create Backup Script**
```bash
sudo nano /usr/local/bin/backup-mgnrega.sh
```

**Add backup script:**
```bash
#!/bin/bash
BACKUP_DIR="/home/mgnrega/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
sudo -u postgres pg_dump mgnrega_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Application backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /home/mgnrega mgnrega-lokdekho

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
sudo chmod +x /usr/local/bin/backup-mgnrega.sh
```

### **7.2 Setup Cron Jobs**
```bash
crontab -e
```

**Add cron jobs:**
```bash
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-mgnrega.sh

# Restart PM2 weekly
0 3 * * 0 pm2 restart all
```

### **7.3 Setup Log Rotation**
```bash
sudo nano /etc/logrotate.d/mgnrega
```

**Add log rotation:**
```bash
/var/log/mgnrega/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 mgnrega mgnrega
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 🔧 **Step 8: Final Configuration**

### **8.1 Update Frontend Build for Static Export**
```bash
cd /home/mgnrega/mgnrega-lokdekho/frontend
nano next.config.js
```

**Add static export:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',
  trailingSlash: true,
  
  // Image optimization
  images: {
    unoptimized: true
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://yourdomain.com',
    NEXT_PUBLIC_ENABLE_GEOLOCATION: process.env.NEXT_PUBLIC_ENABLE_GEOLOCATION || 'true'
  }
};

module.exports = nextConfig;
```

### **8.2 Rebuild Frontend**
```bash
npm run build
```

### **8.3 Restart Services**
```bash
pm2 restart all
sudo systemctl reload nginx
```

---

## ✅ **Step 9: Verification & Testing**

### **9.1 Check Services**
```bash
# Check PM2 processes
pm2 status

# Check system services
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis-server

# Check application health
curl https://yourdomain.com/health
```

### **9.2 Test Website**
1. **Visit your domain:** https://yourdomain.com
2. **Test language switching**
3. **Test district selection**
4. **Test audio features**
5. **Test mobile responsiveness**

### **9.3 Performance Testing**
```bash
# Test API response
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/api/health

# Test SSL
curl -I https://yourdomain.com
```

---

## 🚨 **Troubleshooting**

### **Common Issues & Solutions**

#### **1. Application Not Starting**
```bash
# Check PM2 logs
pm2 logs

# Check system logs
sudo journalctl -u nginx
sudo tail -f /var/log/nginx/error.log
```

#### **2. Database Connection Issues**
```bash
# Test database connection
sudo -u postgres psql -d mgnrega_db -c "SELECT 1;"

# Check PostgreSQL status
sudo systemctl status postgresql
```

#### **3. SSL Certificate Issues**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew
```

#### **4. High Memory Usage**
```bash
# Monitor memory
free -h
htop

# Restart PM2 if needed
pm2 restart all
```

---

## 📈 **Performance Optimization**

### **1. Enable Nginx Caching**
```nginx
# Add to nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m use_temp_path=off;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout invalid_header updating http_500 http_502 http_503 http_504;
    # ... other proxy settings
}
```

### **2. Database Optimization**
```sql
-- Connect to database
sudo -u postgres psql -d mgnrega_db

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mgnrega_district_date ON mgnrega_monthly(district_id, year, month);
CREATE INDEX IF NOT EXISTS idx_districts_name ON districts(name);
```

### **3. Redis Configuration**
```bash
sudo nano /etc/redis/redis.conf
```

**Optimize Redis:**
```bash
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

---

## 🔐 **Security Hardening**

### **1. Firewall Configuration**
```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### **2. Fail2Ban Setup**
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### **3. Regular Updates**
```bash
# Create update script
sudo nano /usr/local/bin/update-system.sh
```

```bash
#!/bin/bash
apt update
apt upgrade -y
apt autoremove -y
certbot renew
systemctl reload nginx
```

---

## 📋 **Maintenance Checklist**

### **Daily**
- [ ] Check PM2 process status
- [ ] Monitor disk space
- [ ] Check error logs

### **Weekly**
- [ ] Review backup files
- [ ] Check SSL certificate expiry
- [ ] Monitor performance metrics

### **Monthly**
- [ ] Update system packages
- [ ] Review security logs
- [ ] Test disaster recovery

---

## 🎉 **Deployment Complete!**

Your MGNREGA LokDekho application is now live at **https://yourdomain.com**

### **Key URLs:**
- **Website:** https://yourdomain.com
- **API Health:** https://yourdomain.com/health
- **Admin Panel:** https://yourdomain.com/admin (if implemented)

### **Management Commands:**
```bash
# View logs
pm2 logs

# Restart application
pm2 restart all

# Check status
pm2 status

# Monitor resources
pm2 monit
```

### **Support & Maintenance:**
- Monitor logs regularly
- Keep system updated
- Backup database daily
- Monitor SSL certificate expiry
- Test disaster recovery procedures

**🎊 Your MGNREGA LokDekho application is now successfully deployed and ready for production use!**