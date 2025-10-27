# MGNREGA LokDekho - District Dashboard

A production-ready web application for viewing MGNREGA performance data in Indian districts, designed for low-literacy rural users.

## Features

- 🏘️ Auto-detect or manual district selection
- 📊 Clear, icon-based performance metrics
- 🔊 Audio explanations for accessibility
- 🌐 Multi-language support (Hindi + local languages)
- 📱 Mobile-first, low-bandwidth design
- 🔄 Background data synchronization
- 📈 Cursor-based pagination for scalability

## Tech Stack

- **Frontend**: Next.js + Tailwind CSS + react-intl
- **Backend**: Node.js + Express + PostgreSQL + Redis
- **Background Jobs**: BullMQ
- **Hosting**: Ubuntu VPS + Nginx + PM2
- **SSL**: Let's Encrypt

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Ubuntu 22.04 VPS

### Local Development

1. Clone and install dependencies:
```bash
git clone <repo-url>
cd mgnrega-lokdekho
npm install
```

2. Set up environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Initialize database:
```bash
npm run db:migrate
npm run db:seed
```

4. Start services:
```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start PostgreSQL
sudo systemctl start postgresql

# Terminal 3: Start backend
npm run dev:backend

# Terminal 4: Start frontend
npm run dev:frontend
```

### Production Deployment

Run the automated deployment script:

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

This will:
- Install all dependencies
- Set up PostgreSQL and Redis
- Configure Nginx with SSL
- Start background workers
- Deploy the application

## API Endpoints

- `GET /api/districts?cursor=<cursor>&limit=50` - List districts
- `GET /api/districts/:id/summary?year=YYYY&months=12` - District summary
- `GET /api/districts/:id/months?cursor=&limit=24` - Monthly data
- `GET /api/compare?district_ids=1,2&metric=total_persondays` - Compare districts
- `POST /api/admin/refresh?district_id=...` - Manual data refresh

## Database Schema

See `migrations/` folder for complete schema.

Key tables:
- `districts` - District information
- `mgnrega_monthly` - Monthly performance data
- `fetch_logs` - Data sync logs

## Monitoring

- Health check: `GET /api/health`
- Metrics: Prometheus-compatible at `/metrics`
- Logs: PM2 logs and application logs in `/var/log/mgnrega/`

## License

MIT