# AgriAI v2.0 Quick Integration Guide

## What Changed for Developers

### Backend Changes Summary

**New Files:**
- `app/recommendation_engine.py` - Recommendation scoring logic
- `app/routers/recommend.py` - API endpoints for recommendations

**Modified Files:**
- `app/main.py` - Added recommend router, version 2.0.0
- `app/models.py` - Added 3 new tables: WeatherLog, CropRecommendation, SoilCropMatrix
- `app/schemas.py` - Added 6 new schemas for recommendations/weather
- `app/config.py` - Added weather_api_key config
- `app/routers/crops.py` - Auto-recommend on create, new score endpoint
- `app/routers/chat.py` - Pass recommendation context to chatbot
- `app/chatbot_rules.py` - Enhanced with recommendation-aware logic

**Key Integration Points:**

1. When POST `/api/crops` is called WITHOUT `crop_name`:
   ```python
   # Auto-generate recommendation
   recommendations = generate_recommendations(...)
   selected_crop = recommendations[0]["crop_name"]  # Pick top crop
   # Save to both fields and crop_recommendations tables
   ```

2. When GET `/api/chat` is called:
   ```python
   # Fetch latest recommendation for context
   latest_rec = db.query(CropRecommendation).filter(...).order_by(...).first()
   ai_response = get_response(..., recommendations=latest_rec.top_recommendations)
   ```

3. Weather API flow:
   ```python
   weather = fetch_weather(location)  # Calls OpenWeather API
   # Falls back to default if API unavailable
   # Adjusts crop scores based on temp & rainfall
   ```

---

### Frontend Changes Summary

**Modified Files:**
- `src/api/client.ts` - Added recommend, weather, score API methods
- `src/components/dashboard/AddCropModal.tsx` - Removed crop dropdown, added location + season
- `src/components/dashboard/RightPanel.tsx` - Added 4 new widgets (score, recommendations, chart, enhanced weather)
- `src/components/launch/LoginScreen.tsx` - Removed OTP form flow entirely
- `package.json` - Version 2.0.0

**Key Integration Points:**

1. Add Field Flow:
   ```typescript
   const createCrop = async () => {
     // No crop_name in payload
     const response = await api.crops.create(token, {
       location: "Hyderabad",
       season: "kharif",
       // ... other fields
       // crop_name is now optional, auto-selected
     });
   };
   ```

2. Load Recommendations:
   ```typescript
   // In RightPanel.tsx
   const [recommendations, setRecommendations] = useState([]);
   useEffect(() => {
     api.recommend.history(token, fieldId).then(rows => {
       setRecommendations(rows[0]?.recommendations || []);
     });
   }, [fieldId, token]);
   ```

3. Display Profit Chart:
   ```typescript
   // Map recommendations to bar chart
   recommendations.map(item => ({
     name: item.crop_name,
     value: item.estimated_profit_max,
     min: item.estimated_profit_min
   }))
   ```

---

## API Endpoints (Quick Reference)

### NEW: Crop Recommendations

**POST /api/recommend**
```bash
curl -X POST http://localhost:8000/api/recommend \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "soil_type": "black",
    "area_acres": 5,
    "location": "Hyderabad",
    "season": "kharif",
    "water_availability": "medium",
    "investment_level": "high"
  }'
```

Response:
```json
{
  "recommendation_id": 123,
  "weather": {
    "location": "Hyderabad",
    "temperature_c": 28.5,
    "rainfall_mm": 4.2,
    "condition": "Partly Cloudy",
    "source": "openweather"
  },
  "recommendations": [
    {
      "crop_name": "Cotton",
      "suitability_score": 92,
      "risk_score": "Low",
      "expected_yield_estimation": "10.2 quintals",
      "estimated_investment_cost": 42000,
      "estimated_profit_min": 18000,
      "estimated_profit_max": 52000
    },
    // ... 2 more crops
  ]
}
```

**GET /api/recommend/history?field_id=5**
```bash
curl http://localhost:8000/api/recommend/history?field_id=5 \
  -H "Authorization: Bearer <token>"
```

**GET /api/weather/Hyderabad**
```bash
curl http://localhost:8000/api/weather/Hyderabad \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "location": "Hyderabad",
  "temperature_c": 28.5,
  "rainfall_mm": 4.2,
  "condition": "Partly Cloudy",
  "source": "openweather"
}
```

### MODIFIED: Crop Endpoints

**POST /api/crops**
```bash
# v2.0: crop_name now optional, location + season required
curl -X POST http://localhost:8000/api/crops \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "My Field",
    "land_area_acres": 2.5,
    "soil_type": "alluvial",
    "location": "Chennai",        # NEW
    "season": "rabi",              # NEW
    "water_availability": "medium",
    "investment_level": "low"
    # crop_name OPTIONAL - system auto-recommends
  }'
```

**GET /api/crops/{id}/score**
```bash
curl http://localhost:8000/api/crops/5/score \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "crop_name": "Cotton",
  "suitability_score": 88,
  "risk_score": "Medium",
  "expected_yield_estimation": "9.8 quintals",
  "estimated_investment_cost": 42000,
  "estimated_profit_min": 16000,
  "estimated_profit_max": 48000
}
```

---

## Environment Setup

### Backend (.env)
```bash
# Existing
ENV=development
DATABASE_URL=sqlite:///./agriai.db
FIREBASE_PROJECT_ID=your_project
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# NEW - Optional weather API
WEATHER_API_KEY=your_openweathermap_api_key
```

Get API key from: https://openweathermap.org/api (free tier available)

If `WEATHER_API_KEY` is not set, system uses hardcoded fallback weather.

### Frontend (.env)
No new requirements. Existing Firebase config unchanged.

---

## Running v2.0

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
cp .env.example .env  # Add WEATHER_API_KEY if desired

# Run with reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Should see: "version": "2.0.0" at GET /
```

### Frontend
```bash
cd frontend
npm install  # Already has latest vite/react
npm run dev  # Start dev server

# Open http://localhost:5173
# Version shown in package.json: "2.0.0"
```

---

## Testing the Flow

1. **Start Backend**: `uvicorn app.main:app --reload`
2. **Start Frontend**: `npm run dev`
3. **Login**: Use "Continue (Dev)" to skip Firebase
4. **Add Field**: 
   - Fill in: Name, Land Area, Soil Type, Location, Season, Water, Budget
   - Do NOT select crop (gone in v2.0)
   - Click "Get AI Recommendation"
5. **Verify**:
   - Field created with auto-recommended crop
   - Right panel shows recommendation list + profit chart + weather widget
   - Chat works with crop context
6. **Check Databases**:
   - `crop_recommendations` table has entry with top 3 crops
   - `weather_logs` table has weather fetch entry

---

## Troubleshooting

### Weather API Issues
**Problem**: All crops get score 60 (fallback)
**Solution**: 
- Check `WEATHER_API_KEY` is set correctly in `.env`
- Check OpenWeather API key is valid (visit app.openweathermap.org)
- Check backend logs for HTTP timeout errors
- Try location name normalization (e.g., "New Delhi" not "NEW DELHI")

### Recommendation Not Appearing
**Problem**: Right panel shows "No plan" after field creation
**Solution**:
- Force reload: Ctrl+Shift+R
- Check browser console for API errors
- Verify field was created (check left panel)
- Check backend logs: POST /recommend succeeded?

### OTP Button Still Shows
**Problem**: Login screen has OTP form
**Solution**:
- This is v1.0 code. You have an old version.
- Clear node_modules: `rm -r node_modules`, `npm install`
- Rebuild: `npm run build`
- Check frontend/src/components/launch/LoginScreen.tsx line 22 - should NOT have `<form onSubmit={handlePhoneSubmit}>` or `step === "otp"`

### Build Failure
```bash
# Frontend
npm run build  # Should succeed in ~20s

# Backend
python -c "from app import main; print('OK')"  # Should print OK
```

---

## Performance Tips

1. **Weather Caching**: In production, cache weather for 30-60 min per location to avoid rate limits
2. **Recommendation Precompute**: Pre-compute soil-crop matrix scores at boot time
3. **Database Indexes**: Ensure `farmer_id`, `field_id` columns are indexed on new tables
4. **API Rate Limiting**: Set up rate limit on `/recommend` to prevent abuse (5 requests per farmer per minute)

---

## File Checklist

**Backend** (all should exist):
- ✓ `app/recommendation_engine.py` (NEW)
- ✓ `app/routers/recommend.py` (NEW)
- ✓ `app/main.py` (UPDATED)
- ✓ `app/models.py` (UPDATED with 3 new tables)
- ✓ `app/schemas.py` (UPDATED with 6 new schemas)
- ✓ `app/config.py` (UPDATED)
- ✓ `app/routers/crops.py` (UPDATED)
- ✓ `app/routers/chat.py` (UPDATED)
- ✓ `app/chatbot_rules.py` (UPDATED)

**Frontend** (all should exist):
- ✓ `src/api/client.ts` (UPDATED)
- ✓ `src/components/dashboard/AddCropModal.tsx` (UPDATED)
- ✓ `src/components/dashboard/RightPanel.tsx` (UPDATED - 4+ new widgets)
- ✓ `src/components/launch/LoginScreen.tsx` (UPDATED - OTP removed)
- ✓ `package.json` (UPDATED to 2.0.0)

**Docs** (optional but helpful):
- ✓ `README.md` (UPDATED with v2.0 features)
- ✓ `ARCHITECTURE.md` (UPDATED with v2.0 design)
- ✓ `V2_CHANGELOG.md` (NEW - full changelog)
- ✓ `V2_INTEGRATION_GUIDE.md` (NEW - this file)

---

## Reverting to v1.0

If needed, revert with git:
```bash
git checkout main  # Latest main is v2.0
git checkout v1.0-tag  # If v1.0 was tagged
# Or manually restore from backup
```

---

**AgriAI v2.0 is ready for development and testing!**

For full feature details, see [V2_CHANGELOG.md](./V2_CHANGELOG.md)  
For architecture changes, see [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
