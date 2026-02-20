@echo off
REM Quick Start Script for AI Chatbot (Windows)

echo.
echo 🤖 AgriAI - AI Chatbot Setup
echo ==============================
echo.

REM Check if HF_TOKEN is set
if exist "backend\.env" (
    findstr /C:"HF_TOKEN=" backend\.env >nul
    if %errorlevel% equ 0 (
        echo ✅ HF_TOKEN found in .env
    ) else (
        echo ⚠️  HF_TOKEN not found in .env
        echo.
        echo 📝 To enable AI chatbot:
        echo 1. Get free token: https://huggingface.co/settings/tokens
        echo 2. Add to backend\.env: HF_TOKEN=hf_your_token_here
        echo 3. Restart backend
        echo.
        echo Without token: Chatbot will use predefined responses (fallback)
    )
) else (
    echo ⚠️  backend\.env not found - copy from .env.example
)

echo.
echo 📦 Starting backend...
cd backend
uvicorn app.main:app --reload
