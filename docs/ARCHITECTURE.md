# AgriAI v2.0 System Architecture

## 1. High-Level System Architecture (v2.0)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (React + Vite)                             │
├─────────────┬───────────────────────────────────┬───────────────────────────┤
│  Left Panel │     Center Panel (AI Chat)        │   Right Panel (My Plan)   │
│  - Crops    │     - ChatGPT-style interface     │   - Weather, Progress     │
│  - Fields   │     - Message bubbles             │   - Recommendation List   │
│  - Nav      │     - Fixed input bar             │   - Profit Chart          │
│  - Add: AI  │                                   │   - Crop Score & Risk     │
│    recommen │                                   │   - Day-to-day plan       │
└─────────────┴───────────────────────────────────┴───────────────────────────┘
                                    │
                                    │ HTTPS / REST API
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI v2.0)                                │
├──────────┬──────────┬──────────┬───────────────┬──────────────┬─────────────┤
│  auth.py │ database │ models.py│ recommendation│crop_rules.py │ chatbot.py  │
│Firebase  │ SQLite   │ ORM:     │ _engine.py:   │Planning      │ Context-    │
│verify    │ Session  │- Farmer  │- ML-style     │ engine       │ aware       │
│          │ handling │- Field   │  scoring      │              │ responses   │
│          │          │- Chat    │- Weather API  │              │             │
│          │          │- Weather │- Soil-crop    │              │             │
│          │          │- Rec     │  matrix       │              │             │
└──────────┴──────────┴──────────┴───────────────┴──────────────┴─────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SQLite Database (v2.0)                               │
│  farmer_profiles, fields, chat_messages                                      │
│  + weather_logs, crop_recommendations, soil_crop_matrix                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key v2.0 Improvements:**
- **ML-style Crop Recommendation**: No manual crop selection. Users provide soil, season, location, water, budget → system recommends top 3 crops with suitability scores.
- **Weather Integration**: Real-time weather API + rainfall data for crop suitability scoring.
- **Crop Scoring**: Each crop gets 0-100 suitability score, risk assessment, yield estimate, and profit range.
- **Smart Chatbot**: Responds contextually to questions about recommended crops, best profit options, water requirements.
- **Recommendation History**: Tracks all past recommendations per farmer and field.
- **No OTP Login**: Simplified to Google Sign-In + dev mode only.

---

## 2. Responsive UI/UX Layout Strategy

| Viewport | Left Panel | Center Panel | Right Panel |
|----------|------------|--------------|-------------|
| Desktop (≥1024px) | Fixed 280px, visible | Flex 1, min 400px | Fixed 340px, visible |
| Tablet (768–1023px) | Collapsible drawer | Full width | Overlay/sheet |
| Mobile (<768px) | Bottom nav + drawer | Full screen | Full-screen tab |

**Breakpoints:** 640px (sm), 768px (md), 1024px (lg), 1280px (xl)

**Touch targets:** Minimum 44×44px for all interactive elements.

**Sunlight readability:** High contrast (4.5:1 min), 16px base font, avoid light gray text.

---

## 3. Animation & Motion Guidelines

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Logo intro | Fade + scale 0.9→1 | 2s | ease-out |
| Logo glow | Subtle gradient pulse | 2.5s | ease-in-out |
| Feature cards | Fade-in on scroll/enter | 0.3s | ease-out |
| Message entrance | Slide up + fade | 0.25s | ease-out |
| Panel transitions | Slide (mobile) | 0.3s | ease-in-out |
| Button feedback | Scale 0.98 on press | 0.1s | ease-out |
| Success state | Checkmark draw | 0.4s | ease-out |

**Principles:** Use `transform` and `opacity` only (GPU-friendly). No layout-triggering animations. `will-change` only where needed.

---

## 4. Folder Structure

```
AA/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI entry
│   │   ├── config.py         # Settings
│   │   ├── auth.py           # Firebase verify
│   │   ├── database.py       # SQLAlchemy
│   │   ├── models.py         # ORM models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── crop_rules.py     # Planning engine
│   │   ├── chatbot_rules.py  # Rule-based chatbot
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── crops.py
│   │       ├── chat.py
│   │       └── plan.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/              # Centralized API
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── chat/
│   │   │   └── plan/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   └── ARCHITECTURE.md
└── README.md
```

---

## 5. API Design (v2.0)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/verify` | Verify Firebase token, return session |
| GET | /api/crops | List crops for user |
| POST | /api/crops | Create crop (auto-recommend if no crop_name) |
| PUT | /api/crops/{id} | Update crop |
| DELETE | /api/crops/{id} | Delete crop |
| GET | /api/crops/{id}/plan | Get generated plan |
| GET | /api/crops/{id}/score | Get crop suitability score |
| POST | /api/chat | Send message, get AI response (with recommendation context) |
| GET | /api/chat/{crop_id}/history | Get chat history |
| GET | /api/plan/{crop_id} | Get plan with weather |
| **POST** | **/api/recommend** | Generate AI crop recommendations for given inputs |
| **GET** | **/api/recommend/history** | Get recommendation history (with optional field_id filter) |
| **GET** | **/api/weather/{location}** | Get live weather for location |

---

## 6. Data Flow (v2.0)

```
User provides field inputs (soil, season, location, water, budget)
  → POST /api/crops (no explicit crop_name)
  → Backend: generate_recommendations() + fetch_weather()
  → AI picks top crop, creates field with plan
  → Field stored + Recommendation logged to DB
  
Farmer views My Plan
  → GET /api/crops/{id}/plan
  → GET /api/crops/{id}/score
  → GET /api/recommend/history?field_id={id}
  → Right panel shows: weather, score, recommendations list, profit chart

Farmer asks chat question
  → POST /api/chat
  → Backend loads latest recommendation from DB
  → get_response() with recommendation context
  → Smart reply about best crop, profit, water needs, etc.
```

---

## 7. Implementation Order

1. Backend: DB, models, auth, crop_rules, chatbot_rules, routers
2. Frontend: Vite setup, routing, auth flow, API layer
3. Launch: Logo animation, feature cards, login
4. Dashboard: 3-panel layout, left nav, center chat, right plan
5. Add Crop flow: Modal/bottom sheet, validation, success state
6. Polish: Animations, responsive, error handling

---

## 8. Implementation Summary

### Backend (FastAPI)

| File | Purpose |
|------|---------|
| `main.py` | Entry point, CORS, lifespan, router registration (v2.0: added recommend router) |
| `config.py` | Pydantic settings (DB, Firebase, CORS, weather_api_key) |
| `database.py` | SQLAlchemy engine, SessionLocal, Base |
| `models.py` | ORM: FarmerProfile, Field, ChatMessage, **WeatherLog, CropRecommendation, SoilCropMatrix** |
| `schemas.py` | Pydantic: Request/response (v2.0: added Recommendation, Weather, SoilCropMatrix schemas) |
| `auth.py` | Firebase verify, dev token bypass, get_current_user |
| `crop_rules.py` | Rule-based plan generation (duration, cost, yield, fertilizers, irrigation, day plan) |
| `**recommendation_engine.py**` | **(NEW)** ML-style scoring: weather API, soil-crop matrix, seasonality, water & investment adjustments |
| `chatbot_rules.py` | Keyword-based responses (v2.0: context-aware with recommendation data) |
| `routers/auth.py` | Auth verify endpoint |
| `routers/crops.py` | CRUD crops + auto-recommend on create, crop score endpoint |
| `routers/chat.py` | Chat endpoint (v2.0: passes recommendation context) |
| `routers/plan.py` | Plan retrieval endpoint |
| `**routers/recommend.py**` | **(NEW)** POST /recommend, GET /recommend/history, GET /weather/{location} |

### Frontend (React + Vite)

| Area | Components |
|------|------------|
| Launch | LogoIntro (fade+scale), FeatureOverview (swipeable cards), LoginScreen (Google + Dev, **no OTP**) |
| Dashboard | LeftPanel (crops list, add/delete), CenterPanel (ChatMessages, ChatInput), RightPanel (**Recommendation list, profit chart, weather, crop score**) |
| Add Crop | **AddCropModal (soil, season, location, water, investment → AI recommends)** |
| Mobile | MobileBottomNav (Chat/Plan tabs), collapsible left drawer |

### v2.0 Additions

| Component | Details |
|-----------|---------|
| **Recommendation Card** | Displays top crop selection, all inputs, and weather used for decision |
| **Suitability Score** | 0-100 score + risk badge (Low/Medium/High) |
| **Profit Comparison** | Horizontal bar chart comparing profit range of top 3 crops |
| **Weather Widget** | Live temperature, rainfall, condition + location tag |
| **Recommendation History** | List of past recommendations for the field |

### Why Key Decisions

- **Dev token**: Enables local testing without Firebase. Prefix `dev_` + timestamp creates unique farmer per session.
- **Rule-based MVP**: No API costs, deterministic, easy to extend. Swap for LLM later by replacing `chatbot_rules.get_response` and optionally `crop_rules.generate_plan`.
- **3-panel desktop, tabs mobile**: Familiar ChatGPT layout on large screens; single-focus tabs on small screens reduce cognitive load.
