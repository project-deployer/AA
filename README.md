# AgriAI v2.0 - AI Crop Recommendation Engine with Weather + Smart Chatbot

AgriAI is an AI-powered agriculture assistant for Indian farmers that automatically recommends the best crops based on soil, weather, season, and budget, then provides day-to-day guidance and smart chatbot support.

## What's New in v2.0

- **AI Crop Recommendation**: System automatically recommends top 3 crops based on soil, season, weather, water availability, and budget
- **Weather Integration**: Live weather data with rainfall forecasting for crop suitability scoring
- **Crop Suitability Scoring**: Each recommendation includes score (0-100), risk level, yield estimate, and profit range
- **Smart Chatbot Upgrade**: Intent-based responses using recommendation context
- **Enhanced Dashboard**: Profit comparison charts, weather widget, recommendation history
- **No OTP Login**: Simplified Google sign-in + dev mode for development
- **New API Endpoints**: `/api/recommend`, `/api/recommend/history`, `/api/weather/{location}`, `/api/crops/{id}/score`
- **New Database Tables**: `weather_logs`, `crop_recommendations`, `soil_crop_matrix`

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- (Optional) Firebase project for production auth

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Set `ENV=development` in `.env` for dev-mode auth (use "Continue (Dev)" on login).

### Optional: Weather API

For live weather, set `WEATHER_API_KEY` in `backend/.env`:
```bash
WEATHER_API_KEY=your_openweathermap_api_key
```
Get an API key: [OpenWeather](https://openweathermap.org/api)
Without API key, system uses fallback weather data.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Firebase (Production Auth)

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication → Phone and Google sign-in
3. Add web app, copy config
4. Create `frontend/.env`:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
5. For backend verification, add service account key:
   - Download service account JSON
   - Set `GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json` in `backend/.env`
   - Or set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` in `.env`

## Architecture

- **Backend**: FastAPI, SQLAlchemy, SQLite
- **Frontend**: React, Vite, Tailwind CSS
- **Auth**: Firebase (OTP, Google) with backend token verification

See `docs/ARCHITECTURE.md` for full system design.

## Features

- Launch: Logo animation → Feature overview → Login (Google + Dev)
- Dashboard: 3-panel layout (Crops, Chat, Plan)
- Add Crop: Land, soil, season, location, water, investment → AI auto-recommends crop
- AI Crop Recommendation: Top 3 crops with suitability scores, yields, and profit estimates
- Weather Integration: Live temperature, rainfall, condition per location
- Chat: Rule-based farmer-friendly responses with recommendation context
- My Plan: Weather widget, crop score, profit chart, day-to-day tasks
- Recommendation History: Track all past recommendations per field
