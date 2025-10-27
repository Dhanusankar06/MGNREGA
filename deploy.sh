#!/bin/bash

# MGNREGA LokDekho Deployment Script for Ubuntu 22.04
# This script sets up the complete production environment

set -e  # Exit on any error

echo "🚀 Starting MGNREGA LokDekho deployment..."

# Configuration
APP_NAME="mgnrega-lokdekho"
APP_USER="mgnrega"
APP_DIR="/opt/$APP_NAME"
DOMAIN="your-domain.com"  # Change this to your actual domain
DB_NAME="mgnrega_db"
DB_USER="mgnrega_user"
DB_PASSWORD=$(openssl rand -base64 32)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
fi

log "Updating system packages..."
apt update && apt upgrade -y

log "Installing required packages..."
apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release

# Install Node.js 18.x
log "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PostgreSQL 14
log "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib postgresql-client

# Install Redis
log "Installing Redis..."
apt install -y redis-server

# Install Nginx
log "Installing Nginx..."
apt install -y nginx

# Install PM2 globally
log "Installing PM2..."
npm install -g pm2

# Install Certbot for SSL
log "Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Create application user
log "Creating application user..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d $APP_DIR $APP_USER
fi

# Create application directory
log "Setting up application directory..."
mkdir -p $APP_DIR
mkdir -p /var/log/$APP_NAME
chown -R $APP_USER:$APP_USER $APP_DIR
chown -R $APP_USER:$APP_USER /var/log/$APP_NAME

# Setup PostgreSQL
log "Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || true

# Configure Redis
log "Configuring Redis..."
systemctl enable redis-server
systemctl start redis-server

# Copy application files
log "Copying application files..."
cp -r . $APP_DIR/
chown -R $APP_USER:$APP_USER $APP_DIR

# Install dependencies
log "Installing application dependencies..."
cd $APP_DIR
sudo -u $APP_USER npm run install:all

# Create environment file
log "Creating environment configuration..."
cat > $APP_DIR/.env << EOF
# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
REDIS_URL=redis://localhost:6379

# API Configuration
PORT=3001
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 64)

# Data.gov.in API (you need to get these keys)
DATA_GOV_API_KEY=your-api-key-here
DATA_GOV_BASE_URL=https://api.data.gov.in/resource

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://$DOMAIN
NEXT_PUBLIC_ENABLE_GEOLOCATION=true

# Background Jobs
REDIS_QUEUE_URL=redis://localhost:6379/1

# Monitoring
ENABLE_METRICS=true
LOG_LEVEL=info

# SSL
SSL_CERT_PATH=/etc/letsencrypt/live/$DOMAIN/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/$DOMAIN/privkey.pem
EOF

chown $APP_USER:$APP_USER $APP_DIR/.env
chmod 600 $APP_DIR/.env

# Run database migrations
log "Running database migrations..."
cd $APP_DIR
sudo -u $APP_USER npm run db:migrate
sudo -u $APP_USER npm run db:seed

# Build frontend
log "Building frontend..."
cd $APP_DIR
sudo -u $APP_USER npm run build:frontend

# Create PM2 ecosystem file
log "Creating PM2 configuration..."
cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'mgnrega-api',
      script: './server/index.js',
      cwd: '/opt/mgnrega-lokdekho',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/mgnrega-lokdekho/api-error.log',
      out_file: '/var/log/mgnrega-lokdekho/api-out.log',
      log_file: '/var/log/mgnrega-lokdekho/api-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'mgnrega-worker',
      script: './server/workers/index.js',
      cwd: '/opt/mgnrega-lokdekho',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/mgnrega-lokdekho/worker-error.log',
      out_file: '/var/log/mgnrega-lokdekho/worker-out.log',
      log_file: '/var/log/mgnrega-lokdekho/worker-combined.log',
      time: true,
      max_memory_restart: '512M'
    }
  ]
};
EOF

chown $APP_USER:$APP_USER $APP_DIR/ecosystem.config.js

# Configure Nginx
log "Configuring Nginx..."
cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
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
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Frontend static files
    location / {
        root $APP_DIR/frontend/out;
        try_files \$uri \$uri/ /index.html;
        
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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
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
    
    # Metrics (restrict access)
    location /metrics {
        proxy_pass http://localhost:3001/metrics;
        allow 127.0.0.1;
        deny all;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t || error "Nginx configuration test failed"

# Start services
log "Starting services..."
systemctl enable nginx
systemctl restart nginx

# Start PM2 as the app user
sudo -u $APP_USER bash -c "cd $APP_DIR && pm2 start ecosystem.config.js"
sudo -u $APP_USER pm2 save
sudo -u $APP_USER pm2 startup

# Create systemd service for PM2
cat > /etc/systemd/system/pm2-$APP_USER.service << EOF
[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=$APP_USER
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
Environment=PM2_HOME=/home/$APP_USER/.pm2
PIDFile=/home/$APP_USER/.pm2/pm2.pid
Restart=on-failure

ExecStart=/usr/bin/pm2 resurrect
ExecReload=/usr/bin/pm2 reload all
ExecStop=/usr/bin/pm2 kill

[Install]
WantedBy=multi-user.target
EOF

systemctl enable pm2-$APP_USER
systemctl start pm2-$APP_USER

# Setup SSL with Let's Encrypt
log "Setting up SSL certificate..."
if [[ "$DOMAIN" != "your-domain.com" ]]; then
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
else
    warn "Please update the DOMAIN variable in this script with your actual domain name"
    warn "Then run: certbot --nginx -d yourdomain.com -d www.yourdomain.com"
fi

# Setup log rotation
log "Setting up log rotation..."
cat > /etc/logrotate.d/$APP_NAME << EOF
/var/log/$APP_NAME/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $APP_USER $APP_USER
    postrotate
        sudo -u $APP_USER pm2 reloadLogs
    endscript
}
EOF

# Setup firewall
log "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'

# Create backup script
log "Creating backup script..."
cat > /usr/local/bin/backup-mgnrega.sh << EOF
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Database backup
sudo -u postgres pg_dump $DB_NAME | gzip > \$BACKUP_DIR/db_\$DATE.sql.gz

# Application backup
tar -czf \$BACKUP_DIR/app_\$DATE.tar.gz -C /opt $APP_NAME

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: \$DATE"
EOF

chmod +x /usr/local/bin/backup-mgnrega.sh

# Setup daily backup cron
echo "0 2 * * * /usr/local/bin/backup-mgnrega.sh" | crontab -

# Final status check
log "Performing final status check..."
sleep 5

# Check services
systemctl is-active --quiet postgresql && echo "✅ PostgreSQL is running" || echo "❌ PostgreSQL is not running"
systemctl is-active --quiet redis-server && echo "✅ Redis is running" || echo "❌ Redis is not running"
systemctl is-active --quiet nginx && echo "✅ Nginx is running" || echo "❌ Nginx is not running"
systemctl is-active --quiet pm2-$APP_USER && echo "✅ PM2 is running" || echo "❌ PM2 is not running"

# Check API health
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ API is responding"
else
    echo "❌ API is not responding"
fi

log "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "===================="
echo "Application: $APP_NAME"
echo "Directory: $APP_DIR"
echo "Database: $DB_NAME"
echo "User: $APP_USER"
echo "Domain: $DOMAIN"
echo ""
echo "🔧 Management Commands:"
echo "======================"
echo "View logs: sudo -u $APP_USER pm2 logs"
echo "Restart API: sudo -u $APP_USER pm2 restart mgnrega-api"
echo "Restart worker: sudo -u $APP_USER pm2 restart mgnrega-worker"
echo "Database backup: /usr/local/bin/backup-mgnrega.sh"
echo ""
echo "🌐 URLs:"
echo "========"
echo "Website: https://$DOMAIN"
echo "API Health: https://$DOMAIN/health"
echo ""
echo "⚠️  Important:"
echo "=============="
echo "1. Update the DOMAIN variable in this script"
echo "2. Get API keys from data.gov.in and update .env file"
echo "3. Configure monitoring and alerting"
echo "4. Test the application thoroughly"
echo ""
echo "Database credentials saved in: $APP_DIR/.env"

log "Deployment script completed!"