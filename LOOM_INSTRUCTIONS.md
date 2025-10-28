# 🎥 MGNREGA LokDekho - Loom Video Instructions (Under 2 Minutes)

## 📋 **Complete Requirements Demo Script**

### **Introduction (15 seconds)**
- **Show**: Homepage with large emoji and Hindi text
- **Say**: "Welcome to MGNREGA LokDekho - a production-ready web application using live data.gov.in APIs to make MGNREGA data accessible to 12.15 crore rural Indians"
- **Action**: Click the large audio button to demonstrate accessibility

### **Live API & Location Detection (25 seconds)**
- **Show**: Environment file with real API key
- **Say**: "The system uses live data from data.gov.in with this API key. As a bonus feature, users can auto-detect their district using GPS location..."
- **Action**: Click "📍 Find My District" button to show location detection
- **Show**: Manual district selection with large search box
- **Say**: "...or search manually. I've focused on Uttar Pradesh - India's largest state"
- **Action**: Type "Agra" and select it from the large, touch-friendly options

### **Rural-Friendly Dashboard (35 seconds)**
- **Show**: Large dashboard with emoji icons and Hindi text
- **Say**: "The dashboard shows live MGNREGA data in a rural-friendly design with large emoji icons designed for low-literacy users"
- **Action**: Point to each card with large touch targets:
  1. **👪 Households**: "Families registered - notice the large 56px+ buttons"
  2. **💰 Wages**: "Money paid in Indian format - लाख, करोड़"
  3. **👷 Person-days**: "Work days generated with audio explanations"
  4. **👩 Women**: "Women participation percentage"
- **Show**: Click on metric cards to demonstrate audio explanations
- **Say**: "Every metric has Hindi audio explanations for accessibility"

### **Technical Architecture & Production Features (30 seconds)**
- **Show**: Code editor with API integration file
- **Say**: "Behind the scenes: Real data.gov.in API integration with retry logic and exponential backoff for production reliability"
- **Action**: Show the dataFetcher.js file with live API calls
- **Show**: Database schema or data
- **Say**: "Local PostgreSQL database caches data to handle API downtime. Redis caching ensures fast performance for millions of users"
- **Show**: Mobile view or PWA installation
- **Say**: "It's a Progressive Web App installable on mobile devices with offline functionality for rural areas"

### **Production Deployment (10 seconds)**
- **Show**: Deployment script or mention hosting
- **Say**: "Complete automated deployment on Ubuntu VPS with PM2 clustering, Nginx reverse proxy, and SSL certificates - ready to serve millions of rural Indians"

### **Impact & Conclusion (5 seconds)**
- **Say**: "This production-ready system uses real government APIs to make MGNREGA data accessible to low-literacy rural citizens across India. Thank you!"

## Key Points to Highlight

### User Experience
- ✅ **Large touch targets** (44px minimum)
- ✅ **Audio explanations** for every screen
- ✅ **Simple language** and icons
- ✅ **Mobile-first design**
- ✅ **Offline capability** with cached data

### Technical Implementation
- ✅ **Cursor-based pagination** for all API endpoints
- ✅ **Background data sync** with retry logic
- ✅ **Local database** (not dependent on external APIs for every request)
- ✅ **Redis caching** for performance
- ✅ **Production deployment** on VPS

### Accessibility
- ✅ **ARIA labels** and keyboard navigation
- ✅ **High contrast** support
- ✅ **Screen reader** compatibility
- ✅ **Multi-language** support (Hindi, English, Urdu)

## Demo Flow Checklist

### Before Recording
- [ ] Ensure application is running on production URL
- [ ] Test all audio features
- [ ] Verify data is loading correctly
- [ ] Check mobile responsiveness
- [ ] Test district selection and auto-detection

### During Recording
- [ ] Start with homepage
- [ ] Demonstrate location detection
- [ ] Show manual district selection
- [ ] Navigate through dashboard
- [ ] Click audio buttons
- [ ] Show comparison features
- [ ] Mention technical stack briefly

### After Recording
- [ ] Upload to Loom
- [ ] Add captions for accessibility
- [ ] Share link in project documentation
- [ ] Test video playback quality

## Sample Script

"Hi, I'm demonstrating MGNREGA LokDekho, a district dashboard designed specifically for low-literacy rural users in India.

[Homepage] The app starts with a simple welcome screen in Hindi, with large fonts and clear icons. Users can either detect their location automatically or manually select their district.

[District Selection] I'll select Agra district from Uttar Pradesh. The search is fast and uses our local database with cursor-based pagination.

[Dashboard] Here's the main dashboard showing four key metrics: registered households, person-days of work, total wages paid, and women's participation. Each card has large icons, big numbers, and audio explanations.

[Audio Demo] Let me click this audio button - it explains the metric in simple Hindi for users who may have difficulty reading.

[Technical] Behind the scenes, this runs on our own VPS with PostgreSQL database, Redis caching, and background workers that sync data nightly from government APIs. All list endpoints use cursor-based pagination as required.

[Accessibility] The entire interface is designed for accessibility - large touch targets, high contrast support, keyboard navigation, and works well on low-bandwidth mobile connections.

This demonstrates a production-ready application that meets all the technical requirements while being genuinely usable by the target audience of rural citizens checking their local MGNREGA performance."

## Video Quality Settings
- **Resolution**: 1080p minimum
- **Duration**: Under 2 minutes
- **Audio**: Clear narration
- **Captions**: Enable for accessibility
- **Sharing**: Public link for judges