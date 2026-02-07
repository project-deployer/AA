# AgriAI - Smart Agriculture Assistant

AgriAI is a smart agriculture assistant for Indian farmers that provides scientific crop planning, day-to-day guidance, and AI-style conversational support.

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

- Launch: Logo animation → Feature overview → Login
- Dashboard: 3-panel layout (Crops, Chat, Plan)
- Add Crop: Land, soil, crop, water, investment
- AI Chat: Rule-based farmer-friendly responses
- My Plan: Weather, cost, yield, day-to-day actions
