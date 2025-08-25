.PHONY: help dev prod build start lint test clean install seed docker-up docker-down

# Default target
help:
	@echo "Available commands:"
	@echo "  dev        - Start development environment"
	@echo "  prod       - Start production environment"
	@echo "  build      - Build all applications"
	@echo "  start      - Start all applications"
	@echo "  lint       - Run linting"
	@echo "  test       - Run tests"
	@echo "  clean      - Clean build artifacts"
	@echo "  install    - Install dependencies"
	@echo "  seed       - Seed database"
	@echo "  docker-up  - Start Docker services"
	@echo "  docker-down- Stop Docker services"

# Development environment
dev: docker-up install
	@echo "Starting development environment..."
	npm run dev

# Production environment
prod: docker-up install build
	@echo "Starting production environment..."
	npm run start

# Build all applications
build:
	@echo "Building all applications..."
	npm run build

# Start all applications
start:
	@echo "Starting all applications..."
	npm run start

# Run linting
lint:
	@echo "Running linting..."
	npm run lint

# Run tests
test:
	@echo "Running tests..."
	npm run test

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf apps/*/dist apps/*/.next packages/*/dist
	rm -rf node_modules apps/*/node_modules packages/*/node_modules

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm install

# Seed database
seed:
	@echo "Seeding database..."
	cd apps/api && npm run seed

# Start Docker services
docker-up:
	@echo "Starting Docker services..."
	docker-compose up -d

# Stop Docker services
docker-down:
	@echo "Stopping Docker services..."
	docker-compose down
