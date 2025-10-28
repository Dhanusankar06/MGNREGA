# 🏛️ MGNREGA LokDekho - मनरेगा लोकदेखो

A production-ready web application designed for low-literacy rural citizens in India to easily access, understand, and compare their district's MGNREGA performance data with comprehensive visualizations and offline support.

## 🎯 Key Features

### � *t*Low-Literacy User Experience**
- **Large touch targets** (44px minimum) for easy mobile interaction
- **Icon-based interface** (👪 households, 👷 person-days, ₹ wages, ♀ women)
- **Audio explanations** for every metric using Web Speech API
- **Simple language** with clear numbers and visual indicators
- **Multi-language support** (Hindi, English, Urdu) with proper RTL support

### 📊 **Advanced Data Visualization**
- **Time-series charts** showing trends over months using Chart.js
- **District comparison** bar charts and tables
- **Performance gauges** with color-coded status indicators
- **Monthly trend summaries** with change indicators
- **Interactive tooltips** with detailed explanations

### 🌐 **Progressive Web App (PWA)**
- **Offline support** with service workers for cached data viewing
- **App-like experience** with manifest and installable on mobile
- **Background sync** for automatic data updates
- **Push notifications** ready for future enhancements

### 🔄 **Robust Data Pipeline**
- **ETL pipeline** fetching from official data.gov.in APIs
- **Cursor-based pagination** for scalable data access
- **Redis caching** with intelligent cache invalidation
- **Background workers** with BullMQ for reliable data sync
- **Retry logic** with exponential backoff for API failures

### 📱 **Mobile-First Design**
- **Responsive breakpoints** optimized for all screen sizes
- **Touch-friendly interface** with proper gesture support
- **High contrast mode** for accessibility compliance
- **Screen reader compatibility** with ARIA labels

### 🚀 **Production-Ready Architecture**
- **Automated deployment** script for Ubuntu VPS
- **SSL/HTTPS** setup with Let's Encrypt
- **Process management** with PM2 clustering
- **Health monitoring** with Prometheus metrics
- **Log rotation** and automated backups

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with SSR/SSG
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js** - Interactive data visualizations
- **React Query** - Data fetching and caching
- **React Intl** - Internationalization

### Backend
- **Node.js + Express** - REST API server
- **PostgreSQL** - Primary database with PostGIS support
- **Redis** - Caching and job queues
- **BullMQ** - Background job processing
- **Winston** - Structured logging

### DevOps & Deployment
- **PM2** - Process management and clustering
- **Nginx** - Reverse proxy and static file serving
- **Let's Encrypt** - Automated SSL certificates
- **Docker** ready with multi-stage builds

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** 
- **PostgreSQL 14+** (or SQLite for development)
- **Redis 6+**
- **Ubuntu 22.04** (for production deployment)

### Local Development

1. **Clone and install:**
```bash
git clone <repository-url>
cd mgnrega-lokdekho
npm run install:all
```

2. **Environment setup:**
```bash
cp .env.example .env
# Edit .env with your database credentials and API keys
```

3. **Database initialization:**
```bash
npm run db:migrate
npm run db:seed
```

4. **Start development servers:**
```bash
# Terminal 1 - Backend API (Port 3002)
npm run dev:backend

# Terminal 2 - Frontend App (Port 3000)
npm run dev:frontend
```

5. **Access the application:**
- Frontend: http://localhost:3000
- API Health: http://localhost:3002/api/health
- API Docs: http://localhost:3002/api/districts

### Production Deployment

**One-command deployment on Ubuntu 22.04 VPS:**

```bash
# Update the DOMAIN variable in deploy.sh first
sudo ./deploy.sh
```

**What the deployment script does:**
- ✅ Installs Node.js, PostgreSQL, Redis, Nginx
- ✅ Creates application user and directories
- ✅ Sets up SSL certificates with Let's Encrypt
- ✅ Configures PM2 with clustering
- ✅ Sets up automated backups and log rotation
- ✅ Configures firewall and security headers
- ✅ Creates systemd services for auto-restart

## 📊 API Documentation

### Core Endpoints

#### Districts
```bash
# List districts with cursor pagination
GET /api/districts?cursor=&limit=50&state=UP

# District performance summary
GET /api/districts/:id/summary?year=2024&months=12

# Monthly data with pagination
GET /api/districts/:id/months?cursor=&limit=24

# Auto-detect district from coordinates
GET /api/districts/detect?lat=27.1767&lng=78.0081
```

#### Comparison & Analytics
```bash
# Compare multiple districts
GET /api/compare?district_ids=1,2,3&metric=total_wages_paid&period=2024-01:2024-12

# Refresh district data from live API
POST /api/districts/:id/refresh
```

#### Health & Monitoring
```bash
# System health check
GET /api/health

# Kubernetes probes
GET /api/health/ready
GET /api/health/live

# Prometheus metrics
GET /metrics
```

### Response Examples

**District Summary:**
```json
{
  "district": {
    "id": 1,
    "name": "Agra",
    "state_id": "UP"
  },
  "summary": {
    "total_persondays": 2500000,
    "total_wages_paid": 41600000000,
    "avg_women_participation": 52.3,
    "months_count": 12
  },
  "latestMonth": {
    "year": 2024,
    "month": 10,
    "households_work_provided": 20823
  }
}
```

## 🏗️ Architecture Overview

### Data Flow
```
Government API → Background Worker → PostgreSQL → Redis Cache → API → Frontend → User
```

### Component Structure
```
mgnrega-lokdekho/
├── frontend/                 # Next.js application
│   ├── components/          # React components
│   │   ├── Charts.js        # Data visualization components
│   │   ├── DistrictDashboard.js
│   │   ├── DistrictComparison.js
│   │   ├── DataExport.js
│   │   └── MetricCard.js
│   ├── contexts/            # React contexts
│   │   ├── AudioContext.js  # Speech synthesis
│   │   └── GeolocationContext.js
│   ├── locales/             # i18n translations
│   ├── pages/               # Next.js pages
│   ├── public/              # Static assets + PWA
│   │   ├── sw.js           # Service worker
│   │   └── manifest.json   # PWA manifest
│   └── styles/              # CSS and Tailwind
├── server/                  # Node.js backend
│   ├── routes/              # API endpoints
│   ├── workers/             # Background jobs
│   ├── utils/               # Utilities
│   ├── migrations/          # Database schema
│   └── scripts/             # Setup scripts
├── deploy.sh                # Production deployment
└── README.md               # This file
```

## 🎨 User Interface Design

### Accessibility Features
- **WCAG 2.1 AA compliant** with proper contrast ratios
- **Keyboard navigation** support for all interactive elements
- **Screen reader compatibility** with semantic HTML and ARIA labels
- **Audio descriptions** in local languages for all metrics
- **Large text options** and high contrast mode
- **Color-blind friendly** palette with pattern-based indicators

### Mobile Optimization
- **Touch targets** minimum 44px for easy finger interaction
- **Swipe gestures** for navigation between districts
- **Offline indicators** showing cached vs live data
- **Progressive loading** with skeleton screens
- **Bandwidth optimization** with compressed assets

## 📈 Performance & Monitoring

### Metrics Collected
- API response times and error rates
- Database connection health and query performance
- Redis cache hit rates and memory usage
- User interaction patterns and session duration
- Data sync success/failure rates

### Health Checks
- **Liveness probe:** Basic server responsiveness
- **Readiness probe:** Database and Redis connectivity
- **Deep health check:** End-to-end API functionality

### Monitoring Dashboard
```bash
# View real-time logs
sudo -u mgnrega pm2 logs

# Monitor system resources
sudo -u mgnrega pm2 monit

# Check service status
systemctl status nginx postgresql redis-server
```

## 🔒 Security Features

### API Security
- **Rate limiting:** 100 requests per 15 minutes per IP
- **Input validation:** Joi schema validation for all endpoints
- **SQL injection prevention:** Parameterized queries
- **CORS configuration:** Restricted to allowed origins
- **Security headers:** Helmet.js with CSP policies

### Infrastructure Security
- **SSL/TLS encryption:** Automatic Let's Encrypt certificates
- **Firewall configuration:** UFW with minimal open ports
- **Process isolation:** Non-root application user
- **Regular updates:** Automated security patches
- **Backup encryption:** Encrypted database backups

## 🌍 Internationalization

### Supported Languages
- **Hindi (Default):** मनरेगा लोकदेखो
- **English:** MGNREGA LokDekho  
- **Urdu:** منریگا لوک دیکھو

### Localization Features
- **Number formatting:** Locale-specific number display
- **Date formatting:** Regional date/time formats
- **RTL support:** Right-to-left text for Urdu
- **Audio messages:** Text-to-speech in local languages
- **Cultural adaptations:** Color meanings and iconography

## 🧪 Testing & Quality Assurance

### Testing Strategy
```bash
# Run all tests
npm test

# Backend API tests
npm run test:backend

# Frontend component tests
npm run test:frontend

# End-to-end tests
npm run test:e2e
```

### Code Quality
- **ESLint:** JavaScript/TypeScript linting
- **Prettier:** Code formatting
- **Husky:** Pre-commit hooks
- **Jest:** Unit and integration testing
- **Lighthouse:** Performance and accessibility audits

## 📦 Deployment Options

### VPS Deployment (Recommended)
```bash
# Ubuntu 22.04 with 4GB+ RAM
sudo ./deploy.sh
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Kubernetes Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mgnrega_db
REDIS_URL=redis://localhost:6379

# API Keys
DATA_GOV_API_KEY=your-data-gov-api-key
IPGEOLOCATION_API_KEY=your-geolocation-key

# Frontend
NEXT_PUBLIC_API_URL=https://yourdomain.com
NEXT_PUBLIC_ENABLE_GEOLOCATION=true

# Security
JWT_SECRET=your-jwt-secret
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Submit** a pull request

### Code Standards
- Follow **ESLint** configuration
- Write **comprehensive tests** for new features
- Update **documentation** for API changes
- Ensure **accessibility compliance**
- Test on **multiple devices** and browsers

## 📞 Support & Documentation

### Getting Help
- **GitHub Issues:** Bug reports and feature requests
- **Documentation:** Comprehensive API and setup guides
- **Community:** Discussions and best practices

### Troubleshooting
```bash
# Check service status
systemctl status mgnrega-lokdekho

# View application logs
sudo -u mgnrega pm2 logs

# Database connection test
psql -h localhost -U mgnrega_user -d mgnrega_db

# Redis connection test
redis-cli ping
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Government of India** for open data APIs
- **MGNREGA program** for rural employment data
- **Open source community** for excellent tools and libraries
- **Rural citizens** who inspired this accessible design

---

**Built with ❤️ for rural India's digital empowerment**