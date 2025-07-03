#!/bin/bash

# Nutrition App Docker Startup Script

echo "🚀 Starting Nutrition App System..."
echo "=================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker is running"

# Build and start all services
echo "🔨 Building and starting all services..."
docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ System started successfully!"
    echo ""
    echo "🌐 Access points:"
    echo "  Frontend:      http://localhost"
    echo "  NodeServer:    http://localhost:3001"
    echo "  PythonServer:  http://localhost:8000"
    echo "  API Docs:      http://localhost:8000/docs"
    echo ""
    echo "📊 Check service status:"
    echo "  docker-compose ps"
    echo ""
    echo "📝 View logs:"
    echo "  docker-compose logs -f"
    echo ""
    echo "🛑 Stop system:"
    echo "  docker-compose down"
else
    echo "❌ Failed to start system. Check the logs:"
    echo "  docker-compose logs"
fi 