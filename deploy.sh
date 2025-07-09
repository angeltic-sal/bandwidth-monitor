#!/bin/bash

# Internet Bandwidth Monitor Deployment Script

set -e

echo "🚀 Deploying Internet Bandwidth Monitor..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration before continuing."
    echo "   Press Enter when ready to continue..."
    read
fi

# Build Docker images
echo "🔨 Building Docker images..."

echo "Building agent image..."
docker build -t bandwidth-agent:latest ./agent

echo "Building backend image..."
docker build -t bandwidth-backend:latest ./backend

echo "Building frontend image..."
docker build -t bandwidth-frontend:latest ./frontend

# Start services
echo "🚀 Starting services with Docker Compose..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check backend health
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
fi

# Check InfluxDB
if curl -f http://localhost:8086/health > /dev/null 2>&1; then
    echo "✅ InfluxDB is healthy"
else
    echo "❌ InfluxDB health check failed"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📊 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:4000"
echo "   InfluxDB: http://localhost:8086"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo ""
echo "🔧 For development:"
echo "   docker-compose -f docker-compose.yml -f docker-compose.override.yml up" 