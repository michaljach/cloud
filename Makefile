.PHONY: help dev prod build clean logs shell migrate seed test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

dev: ## Start development environment
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Development environment started!"
	@echo "Run 'make setup-dev' to run migrations and seed the database"

dev-build: ## Build and start development environment
	docker-compose -f docker-compose.dev.yml up -d --build

prod: ## Start production environment
	docker-compose up -d

prod-build: ## Build and start production environment
	docker-compose up -d --build

build: ## Build all Docker images
	docker-compose build

clean: ## Stop and remove all containers, networks, and volumes
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f

logs: ## Show logs for all services
	docker-compose logs -f

logs-dev: ## Show logs for development services
	docker-compose -f docker-compose.dev.yml logs -f

shell-api: ## Open shell in API container
	docker-compose exec api sh

shell-api-dev: ## Open shell in development API container
	docker-compose -f docker-compose.dev.yml exec api sh

migrate: ## Run database migrations
	docker-compose exec api npm run prisma:migrate --workspace=api

migrate-dev: ## Run database migrations in development
	docker-compose -f docker-compose.dev.yml exec api npm run prisma:migrate --workspace=api

seed: ## Seed the database
	docker-compose exec api npm run seed --workspace=api

seed-dev: ## Seed the database in development
	docker-compose -f docker-compose.dev.yml exec api npm run seed --workspace=api

setup-dev: ## Run migrations and seed database in development
	@echo "Running database migrations..."
	docker-compose -f docker-compose.dev.yml exec api npm run prisma:migrate --workspace=api
	@echo "Seeding database..."
	docker-compose -f docker-compose.dev.yml exec api npm run seed --workspace=api
	@echo "Database setup complete!"

setup: ## Run migrations in production
	@echo "Running database migrations..."
	docker-compose exec api npm run prisma:migrate --workspace=api
	@echo "Database setup complete!"

test: ## Run tests
	docker-compose exec api npm test
	docker-compose exec account npm test
	docker-compose exec files npm test
	docker-compose exec notes npm test

test-dev: ## Run tests in development
	docker-compose -f docker-compose.dev.yml exec api npm test
	docker-compose -f docker-compose.dev.yml exec account npm test
	docker-compose -f docker-compose.dev.yml exec files npm test
	docker-compose -f docker-compose.dev.yml exec notes npm test

restart: ## Restart all services
	docker-compose restart

restart-dev: ## Restart development services
	docker-compose -f docker-compose.dev.yml restart

status: ## Show status of all containers
	docker-compose ps

status-dev: ## Show status of development containers
	docker-compose -f docker-compose.dev.yml ps
