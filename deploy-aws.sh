#!/bin/bash

# AWS EC2 Deployment Script for Bandwidth Monitor

set -e

echo "🚀 Deploying Bandwidth Monitor on AWS EC2..."

# Check if running on EC2
if ! curl -s http://169.254.169.254/latest/meta-data/instance-id > /dev/null 2>&1; then
    echo "⚠️  This script is designed to run on AWS EC2 instances."
    echo "   Please run this on your EC2 instance."
    exit 1
fi

# Get EC2 public IP
EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "📍 EC2 Public IP: $EC2_PUBLIC_IP"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please install and start Docker."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from production template..."
    cp env.prod.example .env
    
    # Update EC2_PUBLIC_IP in .env file
    sed -i "s/your-ec2-public-ip-here/$EC2_PUBLIC_IP/g" .env
    
    echo "⚠️  Please edit .env file with your configuration before continuing."
    echo "   Key things to update:"
    echo "   - INFLUXDB_PASSWORD (set a secure password)"
    echo "   - INFLUXDB_TOKEN (generate a secure token)"
    echo "   - SENDGRID_API_KEY (if using email notifications)"
    echo "   - VAPID keys (if using push notifications)"
    echo ""
    echo "   Press Enter when ready to continue..."
    read
fi

# Update EC2_PUBLIC_IP in .env if it's not set correctly
CURRENT_IP=$(grep EC2_PUBLIC_IP .env | cut -d'=' -f2)
if [ "$CURRENT_IP" != "$EC2_PUBLIC_IP" ]; then
    echo "🔄 Updating EC2_PUBLIC_IP in .env file..."
    sed -i "s/EC2_PUBLIC_IP=.*/EC2_PUBLIC_IP=$EC2_PUBLIC_IP/g" .env
fi

# Build Docker images
echo "🔨 Building Docker images..."

echo "Building agent image..."
docker build -t bandwidth-agent:latest ./agent

echo "Building backend image..."
docker build -t bandwidth-backend:latest ./backend

echo "Building frontend image..."
docker build -t bandwidth-frontend:latest ./frontend

# Stop existing containers if running
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Start services with production configuration
echo "🚀 Starting services with production configuration..."
docker-compose -f docker-compose.prod.yml up -d

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
if curl -f http://localhost > /dev/null 2>&1; then
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
echo "🎉 AWS Deployment complete!"
echo ""
echo "📊 Access your application:"
echo "   Frontend: http://$EC2_PUBLIC_IP"
echo "   Backend API: http://$EC2_PUBLIC_IP:4000"
echo "   InfluxDB: http://$EC2_PUBLIC_IP:8086"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.prod.yml down"
echo "   Restart services: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "🔧 Security Notes:"
echo "   - Make sure your EC2 security group allows ports 80, 4000, and 8086"
echo "   - Consider using HTTPS with a reverse proxy for production"
echo "   - Regularly update your .env file with secure credentials" 