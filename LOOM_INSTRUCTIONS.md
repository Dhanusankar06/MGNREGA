# MGNREGA LokDekho - Loom Video Instructions

## 2-Minute Walkthrough Script

### Introduction (15 seconds)
- **Show**: Homepage with welcome message
- **Say**: "Welcome to MGNREGA LokDekho - a dashboard designed for rural citizens to easily check their district's MGNREGA performance"
- **Action**: Click the audio button to demonstrate accessibility features

### District Selection (30 seconds)
- **Show**: Location detection feature
- **Say**: "Users can either auto-detect their district using location services..."
- **Action**: Click "Detect My Location" button (or simulate)
- **Show**: Manual district selection dropdown
- **Say**: "...or manually select from a searchable list of districts"
- **Action**: Type "Agra" in the search box and select it

### Dashboard Overview (45 seconds)
- **Show**: Main dashboard with 4 key metric cards
- **Say**: "The dashboard shows 4 main metrics in large, icon-based cards designed for low-literacy users"
- **Action**: Point to each card:
  1. **Households** (👪 icon): "Families registered and provided work"
  2. **Person-days** (👷 icon): "Total work days generated"
  3. **Wages** (₹ icon): "Money paid to workers"
  4. **Women Participation** (♀ icon): "Percentage of women workers"

### Accessibility Features (20 seconds)
- **Show**: Audio buttons on each card
- **Say**: "Every metric has audio explanations in local language"
- **Action**: Click audio button on one metric card
- **Show**: Large fonts, clear icons, and simple language
- **Say**: "Large fonts, clear icons, and simple language make it accessible to everyone"

### Data Reliability (15 seconds)
- **Show**: "Last updated" timestamp
- **Say**: "Data is automatically synced from government sources and cached locally for reliability"
- **Show**: Comparison with last year's data
- **Say**: "Users can see trends and compare with previous periods"

### Technical Highlights (15 seconds)
- **Show**: Browser developer tools or mention in voiceover
- **Say**: "Built with Next.js frontend, Node.js backend, PostgreSQL database, all hosted on our own VPS with background data synchronization"

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