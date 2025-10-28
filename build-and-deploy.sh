#!/bin/bash

echo "🚀 Starting MGNREGA LokDekho Build Process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Build frontend
echo "🎨 Building frontend..."
cd frontend
npm run build
cd ..

# Check if build was successful
if [ -d "frontend/out" ]; then
    echo "✅ Frontend build successful!"
    echo "📁 Frontend files:"
    ls -la frontend/out/
else
    echo "❌ Frontend build failed!"
    exit 1
fi

# Start server
echo "🚀 Starting server..."
npm start