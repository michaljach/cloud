#!/bin/bash

# Production Deployment Script
# This script builds and runs all services in separate containers

set -e

echo "🚀 Starting production deployment..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found!"
    echo "📝 Please copy env.production.template to .env.production and update the values"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "📦 Building production images..."

# Build all services
echo "🔨 Building API service..."
docker build -f apps/api/Dockerfile.prod -t cloud-api:latest .

echo "🔨 Building Account service..."
docker build -f apps/account/Dockerfile.prod -t cloud-account:latest .

echo "🔨 Building Files service..."
docker build -f apps/files/Dockerfile.prod -t cloud-files:latest .

echo "🔨 Building Notes service..."
docker build -f apps/notes/Dockerfile.prod -t cloud-notes:latest .

echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans

echo "🧹 Cleaning up old volumes (optional)..."
read -p "Do you want to clean up old volumes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker volume rm cloud_postgres_data cloud_uploads 2>/dev/null || true
fi

echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "🔍 Checking service health..."

# Check PostgreSQL
echo "📊 Checking PostgreSQL..."
if docker exec cloud-postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
fi

# Check API
echo "🔌 Checking API..."
if curl -f http://localhost:4000/health >/dev/null 2>&1; then
    echo "✅ API is ready"
else
    echo "❌ API is not ready"
fi

# Check frontend services
echo "🌐 Checking frontend services..."
for service in account files notes; do
    port=""
    case $service in
        account) port=3000 ;;
        files) port=3001 ;;
        notes) port=3002 ;;
    esac
    
    if curl -f http://localhost:$port >/dev/null 2>&1; then
        echo "✅ $service is ready"
    else
        echo "❌ $service is not ready"
    fi
done

echo "🔍 Checking Nginx..."
if curl -f http://localhost:80 >/dev/null 2>&1; then
    echo "✅ Nginx is ready"
else
    echo "❌ Nginx is not ready"
fi

echo ""
echo "🎉 Production deployment completed!"
echo ""
echo "📋 Service URLs:"
echo "   API: http://localhost:4000"
echo "   Account: http://localhost:3000"
echo "   Files: http://localhost:3001"
echo "   Notes: http://localhost:3002"
echo "   Nginx: http://localhost:80"
echo ""
echo "📊 To view logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f [service_name]"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose -f docker-compose.prod.yml down"
