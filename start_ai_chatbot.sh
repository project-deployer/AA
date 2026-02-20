#!/bin/bash
# Quick Start Script for AI Chatbot

echo "🤖 AgriAI - AI Chatbot Setup"
echo "=============================="
echo ""

# Check if HF_TOKEN is set
if [ -f "backend/.env" ]; then
    if grep -q "HF_TOKEN=" backend/.env; then
        echo "✅ HF_TOKEN found in .env"
    else
        echo "⚠️  HF_TOKEN not found in .env"
        echo ""
        echo "📝 To enable AI chatbot:"
        echo "1. Get free token: https://huggingface.co/settings/tokens"
        echo "2. Add to backend/.env: HF_TOKEN=hf_your_token_here"
        echo "3. Restart backend"
        echo ""
        echo "Without token: Chatbot will use predefined responses (fallback)"
    fi
else
    echo "⚠️  backend/.env not found - copy from .env.example"
fi

echo ""
echo "📦 Starting backend..."
cd backend
uvicorn app.main:app --reload
