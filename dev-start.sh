#!/bin/bash

echo "🚀 Starting IPTV Manager in development mode..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install

# Start backend
echo "🔧 Starting backend server..."
cd ../backend && npm run dev &

# Start frontend
echo "🎨 Starting frontend dev server..."
cd ../frontend && npm run dev &

echo "✅ Development servers started!"
echo "   Backend: http://localhost:3000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"

wait
