# AgriAI v2.0 Changelog

**Release Date:** February 20, 2026  
**Previous Version:** 1.0.0  
**New Version:** 2.0.0

---

## Overview

This release transforms AgriAI from a manual crop planning tool to an **AI-powered crop recommendation engine** with live weather integration and smart chatbot enhancements.

---

## Major Features Added

### 1. AI Crop Recommendation Engine
- **Smart Auto-Selection**: Users no longer manually select crops. System automatically recommends top 3 crops based on:
  - Soil type (Black, Red, Alluvial, Laterite, Clay, Sandy, Loam)
  - Season (Kharif, Rabi, Zaid)  
  - Location (for weather context)
  - Water availability (Low/Medium/High)
  - Budget/Investment level (Low/Medium/High)
  - Live weather data (temperature, rainfall)

- **Recommendation Scoring**:
  - Each crop gets a Suitability Score (0-100)
  - Risk Assessment (Low/Medium/High)
  - Expected Yield Estimation
  - Estimated Investment Cost (₹)
  - Profit Range (₹ Min-Max)

- **Soil-Crop Matrix**: Pre-built matrix shows base compatibility of crops with different soil types
- **Seasonality Bonus**: Crops optimized for specific seasons receive bonus scores
- **Weather Adjustments**: Live temperature and rainfall data adjusts crop suitability in real-time
- **Water-Need Awareness**: System matches crop water requirements with farmer's water availability
- **Investment Matching**: High-investment crops are deprioritized for budget-conscious farmers

### 2. Weather API Integration
- **Live Weather Fetching**: Integrated with OpenWeather API (fallback to default if API unavailable)
- **Location-Based Query**: Query weather by location name (auto-geocoding)
- **Crop-Specific Impact**: Weather data influences suitability scoring
- **Weather Logging**: All weather queries logged to database for analysis
- **New Endpoint**: `GET /api/weather/{location}` returns temperature, rainfall, condition, source

### 3. Enhanced Dashboard - Right Panel
- **Recommendation List**: Shows top 3 recommended crops with scores and risk badges
- **Profit Comparison Chart**: Horizontal bar chart comparing profit ranges of top crops
- **Live Weather Widget**: 
  - Current temperature (from live API or fallback)
  - Weather condition (Sunny, Cloudy, Rainy, etc.)
  - Rainfall forecast (mm)
  - Location display
- **Crop Suitability Score**: 
  - 0-100 score for selected crop
  - Risk level badge
- **Dynamic Weather Updates**: Auto-updates from geolocation if browser permits

### 4. Smart Chatbot Upgrade
- **Recommendation Context**: Chatbot now has access to latest crop recommendations
- **Smart Responses**:
  - "Which crop is best?" → Shows top-scoring crop with rationale
  - "Which crop gives high profit?" → Recommends highest-profit crop with range
  - "Which crop needs less water?" → Shows low-water crops suitable for farmer's inputs
- **Backward Compatibility**: Falls back to rule-based responses if no recommendations available

### 5. New API Endpoints (v2.0)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/recommend` | POST | Generate top 3 crop recommendations based on field inputs |
| `/api/recommend/history` | GET | Get recommendation history (optionally filtered by field_id) |
| `/api/weather/{location}` | GET | Fetch live weather for specified location |
| `/api/crops/{id}/score` | GET | Get suitability score for a crop on a specific field |

### 6. Enhanced Add Field Modal
- **Removed Manual Crop Selection**: No more dropdown for crop selection
- **Renamed**: "Add Crop / Field" → "Add Field (AI Recommend)"
- **New Inputs**:
  - Location (required) - used for weather context
  - Season (required) - Kharif/Rabi/Zaid
- **Same Inputs**: Land area, soil type, water availability, investment level
- **Smart Flow**: 
  1. User enters field parameters
  2. System fetches live weather
  3. Recommendation engine scores all crops
  4. Top crop auto-selected for farming plan
  5. Recommendation saved to history

### 7. New Database Tables

#### `weather_logs`
```sql
id | farmer_id | location | temperature_c | rainfall_mm | condition | source | raw_json | created_at
```

#### `crop_recommendations`
```sql
id | farmer_id | field_id | soil_type | area_acres | location | season | 
water_availability | investment_level | top_recommendations (JSON) | 
weather_snapshot (JSON) | created_at
```

#### `soil_crop_matrix`
```sql
id | soil_type | crop_name | base_score | water_need | is_active | created_at
```

### 8. Configuration

**New Environment Variable**:
```bash
WEATHER_API_KEY=your_openweathermap_api_key  # Optional; uses fallback if not set
```

**Updated Version**:
- Backend: `2.0.0`
- Frontend: `2.0.0` (package.json)
- API: `/` returns version `2.0.0`

---

## Breaking Changes

### Authentication - OTP Removed ✓
- **Before**: Login screen offered OTP (phone), Google, and Dev modes
- **After**: Login screen offers Google and Dev modes only (OTP fully removed)
- **Impact**: Simplified login flow; no Firebase Phone Auth dependency
- **Migration**: Existing users can still use Google sign-in

### FieldCreate Schema Updated
```typescript
// Before
{
  name: string,
  land_area_acres: number,
  soil_type: string,
  crop_name: string,  // ← REQUIRED
  water_availability: string,
  investment_level: string
}

// After
{
  name: string,
  land_area_acres: number,
  soil_type: string,
  crop_name?: string,  // ← OPTIONAL, auto-recommended if missing
  location: string,    // ← NEW REQUIRED
  season: string,      // ← NEW REQUIRED (kharif|rabi|zaid)
  water_availability: string,
  investment_level: string
}
```

---

## Backend Changes

### New Files Added
- `app/recommendation_engine.py` - ML-style scoring logic
- `app/routers/recommend.py` - Recommendation & weather API endpoints

### Files Modified
- `app/main.py` - Registered recommend router, bumped version to 2.0.0
- `app/models.py` - Added WeatherLog, CropRecommendation, SoilCropMatrix tables
- `app/schemas.py` - Added Recommendation, Weather, SoilCropMatrix schemas & input types
- `app/config.py` - Added weather_api_key setting
- `app/routers/crops.py` - Auto-recommend crop on create, added score endpoint
- `app/routers/chat.py` - Pass recommendation context to chatbot
- `app/chatbot_rules.py` - Added recommendation-aware response logic

### Recommendation Algorithm
```
Base Score = Soil-Crop Compatibility Score (0-100)
+ Seasonality Bonus (0-8 points)
+ Weather Adjustment (-7 to +6 points)
+ Water Availability Adjustment (-8 to +6 points)
+ Investment Level Adjustment (-8 to +5 points)
= Final Suitability Score (capped 40-99)
```

**Financial Estimation**:
```
Estimated Cost = Base Cost × Area × Investment Factor
Estimated Profit = (Yield × Price - Cost) × Profit Factor × Score Factor
```

---

## Frontend Changes

### New Files Added
None (used existing structure)

### Files Modified
- `src/api/client.ts` - Added recommendation, weather, and crop score API types
- `src/components/dashboard/AddCropModal.tsx` - Revamped to v2.0 input flow (no crop selection)
- `src/components/dashboard/RightPanel.tsx` - Added recommendation list, profit chart, score badge, live weather
- `src/components/launch/LoginScreen.tsx` - Removed OTP flow, simplified to Google + Dev login
- `src/utils/firebaseClient.ts` - Removed sendOtp and recaptcha (kept Google sign-in)
- `package.json` - Bumped version to 2.0.0

### New UI Components (within RightPanel)
1. **Crop Suitability Score Widget** - Shows 0-100 score + risk badge
2. **Recommendation List** - Card-based list of top 3 crops
3. **Profit Comparison Chart** - Horizontal bar chart with profit ranges
4. **Enhanced Weather Widget** - Displays temperature, condition, rainfall, location

---

## Documentation Updates

- **README.md** - Updated with v2.0 feature list, weather API setup
- **ARCHITECTURE.md** - Updated system diagram, API table, data flow, component details

---

## Testing Recommendations

### Manual Testing Checklist
- [ ] Create field without explicit crop name → System recommends crop
- [ ] Verify weather API call (check browser dev tools / backend logs)
- [ ] Check recommendation history persists across page reloads
- [ ] Verify profit chart displays all 3 recommendations
- [ ] Test chatbot with recommendation context ("high profit crop?")
- [ ] Verify crop score appears for selected field
- [ ] Test login without OTP - only Google + Dev should work
- [ ] Test with WEATHER_API_KEY set and unset (fallback)
- [ ] Mobile responsive check: right panel should work on tablet

### Load Testing
- Test with 5+ simultaneous recommendation requests
- Verify weather API calls don't timeout backend

### Edge Cases
- Location not found in OpenWeather API → fallback weather
- Missing required field (soil_type, season) → validation error
- Old fields without recommendation history → graceful fallback
- Crop not in matrix → uses fallback score calculation

---

## Performance Notes

- **Weather API Caching**: Consider caching weather results (30-60 min) in production
- **Recommendation Computation**: O(n) where n = number of crops in matrix (~40 crops max)
- **Database Queries**: Added indexes on farmer_id, field_id in new tables

---

## Version Compatibility

| Component | v1.0 → v2.0 |
|-----------|------------|
| Firebase Auth | Still compatible (OTP path removed) |
| Database | Schema extended (migrations via new tables) |
| API | Breaking change: crop_name now optional, location + season required |
| Chat API | Backward compatible (recommendation context optional) |
| Frontend | Full rebuild recommended |

---

## Future Extensions (v3.0 Roadmap)

- Full crop lifecycle monitoring with daily video uploads
- Disease detection using computer vision
- Multilingual voice chatbot
- Crop health timeline tracking
- Integrated marketplace for crop pricing
- SMS/WhatsApp notifications for critical actions

---

## Deployment Notes

1. **Database Migration**: Run `init_db()` on startup to create new tables
2. **Environment**: Add `WEATHER_API_KEY` to `.env` (optional, uses fallback if missing)
3. **Frontend Build**: No new dependencies; existing package.json sufficient
4. **Backend**: No new Python packages needed (httpx already in requirements.txt)

---

## Known Limitations

1. **Weather API Rate Limiting**: OpenWeather free tier limited to 60 requests/min
2. **Offline Mode**: Without WEATHER_API_KEY, uses hardcoded fallback weather
3. **Recommendation Tuning**: Soil-crop matrix and scoring weights are rule-based; no ML training in v2.0
4. **Mobile UI**: Recommendation list scrolls within right panel; chart may be small on very small phones

---

## Credits

- **Recommendation Engine**: Based on agricultural compatibility matrices + weather impact research
- **Weather Data**: OpenWeatherMap API
- **Chatbot Context**: Integrated with crop recommendation scoring

---

## Support & Feedback

For issues or feature requests related to v2.0, please contact the development team with:
- Exact error message or unexpected behavior
- Steps to reproduce
- Weather conditions (if weather-related)
- Browser/device info (if UI-related)

---

**End of Changelog**
