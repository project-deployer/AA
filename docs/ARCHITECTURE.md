# AgriAI System Architecture

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (React + Vite)                             │
├─────────────┬───────────────────────────────────┬───────────────────────────┤
│  Left Panel │     Center Panel (AI Chat)        │   Right Panel (My Plan)   │
│  - Crops    │     - ChatGPT-style interface     │   - Weather, Progress     │
│  - Fields   │     - Message bubbles             │   - Cost, Yield, Profit   │
│  - Nav      │     - Fixed input bar             │   - Day-to-day plan       │
└─────────────┴───────────────────────────────────┴───────────────────────────┘
                                    │
                                    │ HTTPS / REST API
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI)                                     │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────────┤
│   auth.py    │  database.py │  models.py   │ crop_rules.py│ chatbot_rules.py│
│ Firebase     │  SQLite      │  ORM models  │ Planning     │ Rule-based      │
│ verification │  Session     │  FarmerProfile│ engine      │ Q&A engine      │
│              │  handling    │  Field, Crop │              │                 │
└──────────────┴──────────────┴──────────────┴──────────────┴─────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SQLite Database                                       │
│  farmer_profiles, fields, crop_plans, chat_messages                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why this architecture:**
- **3-panel layout**: Familiar ChatGPT-style UX; left for context, center for interaction, right for actionable plan. Separates "what I have" from "what I'm doing" from "what to do next."
- **FastAPI + SQLite**: Fast iteration for MVP; SQLite is file-based (no infra), sufficient for single-instance deployment.
- **Rule-based MVP**: Deterministic, debuggable, no API costs. Easily swappable for LLM later.

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

## 5. API Design

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/verify` | Verify Firebase token, return session |
| POST | `/api/auth/refresh` | Refresh session |
| GET | /api/crops | List crops for user |
| POST | /api/crops | Create crop/field |
| PUT | /api/crops/{id} | Update crop |
| DELETE | /api/crops/{id} | Delete crop |
| GET | /api/crops/{id}/plan | Get generated plan |
| POST | /api/chat | Send message, get AI response |
| GET | /api/chat/{crop_id}/history | Get chat history |
| GET | /api/plan/{crop_id} | Get plan (weather placeholder) |

---

## 6. Data Flow

```
User adds crop → POST /api/crops → crop_rules.generate_plan()
  → Plan stored → Plan returned → Right panel updates

User sends chat → POST /api/chat → chatbot_rules.get_response()
  → Response stored → Message returned → Center panel updates

Auth: Firebase ID token → Backend verifies → firebase_uid → FarmerProfile
  → Session/cookie for subsequent requests
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
| `main.py` | Entry point, CORS, lifespan, router registration |
| `config.py` | Pydantic settings (DB, Firebase, CORS) |
| `database.py` | SQLAlchemy engine, SessionLocal, Base |
| `models.py` | FarmerProfile, Field, ChatMessage |
| `schemas.py` | Pydantic request/response schemas |
| `auth.py` | Firebase verify, dev token bypass, get_current_user |
| `crop_rules.py` | Rule-based plan generation (duration, cost, yield, fertilizers, irrigation, day plan) |
| `chatbot_rules.py` | Keyword-based Hindi/English responses |
| `routers/*` | auth, crops, chat, plan endpoints |

### Frontend (React + Vite)

| Area | Components |
|------|------------|
| Launch | LogoIntro (fade+scale), FeatureOverview (swipeable cards), LoginScreen (OTP/Google placeholder, Dev login) |
| Dashboard | LeftPanel (crops list, add/delete), CenterPanel (ChatMessages, ChatInput), RightPanel (weather, progress, plan) |
| Add Crop | AddCropModal (land, soil, crop search, water, investment) |
| Mobile | MobileBottomNav (Chat/Plan tabs), collapsible left drawer |

### Why Key Decisions

- **Dev token**: Enables local testing without Firebase. Prefix `dev_` + timestamp creates unique farmer per session.
- **Rule-based MVP**: No API costs, deterministic, easy to extend. Swap for LLM later by replacing `chatbot_rules.get_response` and optionally `crop_rules.generate_plan`.
- **3-panel desktop, tabs mobile**: Familiar ChatGPT layout on large screens; single-focus tabs on small screens reduce cognitive load.
