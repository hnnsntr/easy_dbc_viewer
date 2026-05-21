#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting DBC Network Explorer..."

# 1. Setup Backend
echo "📦 Checking Python backend dependencies..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
echo "Installing backend requirements..."
pip install -q -r requirements.txt
cd ..

# 2. Setup Frontend
echo "📦 Checking Node frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend npm packages..."
    npm install
fi
cd ..

echo "✅ Environments ready!"
echo "----------------------------------------"

# 3. Start Backend in the background
echo "🟢 Starting FastAPI backend on http://localhost:8000..."
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 > /dev/null 2>&1 &
BACKEND_PID=$!
cd ..

# 4. Start Frontend in the background
echo "🟢 Starting React frontend on http://localhost:5173..."
cd frontend
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
cd ..

echo "----------------------------------------"
echo "🎉 App is fully running! Open your browser to:"
echo "👉 http://localhost:5173"
echo ""
echo "Press [Ctrl+C] to stop all servers gracefully."

# 5. Trap SIGINT (Ctrl+C) to safely kill the background processes
trap "echo -e '\n🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Keep the script alive
wait
