"""FastAPI entry point for AgriAI backend."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import auth, crops, chat, plan, recommend


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="AgriAI API",
    description="Smart agriculture assistant for Indian farmers",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(crops.router)
app.include_router(chat.router)
app.include_router(plan.router)
app.include_router(recommend.router)


@app.get("/")
def root():
    return {"app": "AgriAI", "status": "ok", "version": "2.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
