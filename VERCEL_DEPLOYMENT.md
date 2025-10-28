# MGNREGA LokDekho - Vercel Deployment

This project is now deployed exclusively on Vercel with serverless functions.

## Architecture

- **Frontend**: Next.js static site deployed on Vercel
- **Backend**: Vercel serverless functions in `/api` directory
- **Data**: Fallback MGNREGA data (no external database required)

## API Endpoints

All API endpoints are available at: `https://mgnrega-beta.vercel.app/api/`

- `GET /api/health` - Health check
- `GET /api/districts` - List all districts (with optional search)
- `GET /api/districts/detect?lat=X&lng=Y` - Detect district by location

## Environment Variables

Set these in Vercel dashboard:

```
NEXT_PUBLIC_API_URL=https://mgnrega-beta.vercel.app
NEXT_PUBLIC_ENABLE_GEOLOCATION=true
NODE_ENV=production
```

## Deployment

The app automatically deploys to Vercel when you push to the main branch.

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Features

- ✅ PWA support with offline functionality
- ✅ Responsive design for mobile and desktop
- ✅ Multi-language support (Hindi, English, Urdu)
- ✅ Audio assistance for rural users
- ✅ Location-based district detection
- ✅ Fallback data when API is unavailable
- ✅ Serverless architecture (no server maintenance)

## Data Source

Currently uses fallback MGNREGA data with 5 sample districts from Uttar Pradesh. This ensures the app works reliably without external API dependencies.

## Performance

- Static site generation for fast loading
- Serverless functions for API calls
- Service worker for offline support
- Optimized images and assets