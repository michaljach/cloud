.PHONY: help build run clean logs shell migrate seed test status

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker images
	@echo "Building API image..."
	docker build -f apps/api/Dockerfile -t cloud-api .
	@echo "Building Account image..."
	docker build -f apps/account/Dockerfile -t cloud-account .
	@echo "Building Files image..."
	docker build -f apps/files/Dockerfile -t cloud-files .
	@echo "Building Notes image..."
	docker build -f apps/notes/Dockerfile -t cloud-notes .
	@echo "All images built successfully!"

build-api: ## Build API Docker image
	docker build -f apps/api/Dockerfile -t cloud-api .

build-account: ## Build Account Docker image
	docker build -f apps/account/Dockerfile -t cloud-account .

build-files: ## Build Files Docker image
	docker build -f apps/files/Dockerfile -t cloud-files .

build-notes: ## Build Notes Docker image
	docker build -f apps/notes/Dockerfile -t cloud-notes .

run: ## Run all services using deployment script
	@if [ -z "$(DATABASE_URL)" ]; then \
		echo "Error: DATABASE_URL environment variable is required"; \
		echo "Example: DATABASE_URL=postgresql://user:password@host:5432/database make run"; \
		exit 1; \
	fi
	@if [ -z "$(JWT_SECRET)" ]; then \
		echo "Error: JWT_SECRET environment variable is required"; \
		echo "Example: JWT_SECRET=your-secret-key make run"; \
		exit 1; \
	fi
	./scripts/deploy-docker.sh

run-api: ## Run API service only
	@if [ -z "$(DATABASE_URL)" ]; then \
		echo "Error: DATABASE_URL environment variable is required"; \
		exit 1; \
	fi
	@if [ -z "$(JWT_SECRET)" ]; then \
		echo "Error: JWT_SECRET environment variable is required"; \
		exit 1; \
	fi
	docker run -d --name cloud-api -p 8080:8080 \
		-e NODE_ENV=production \
		-e DATABASE_URL=$(DATABASE_URL) \
		-e JWT_SECRET=$(JWT_SECRET) \
		-e PORT=8080 \
		cloud-api

run-account: ## Run Account service only
	@if [ -z "$(API_URL)" ]; then \
		echo "Warning: API_URL not set, using default: http://localhost:8080"; \
		API_URL="http://localhost:8080"; \
	fi
	docker run -d --name cloud-account -p 3000:3000 \
		-e NODE_ENV=production \
		-e NEXT_PUBLIC_API_URL=$(API_URL) \
		-e PORT=3000 \
		cloud-account

run-files: ## Run Files service only
	@if [ -z "$(API_URL)" ]; then \
		echo "Warning: API_URL not set, using default: http://localhost:8080"; \
		API_URL="http://localhost:8080"; \
	fi
	docker run -d --name cloud-files -p 3001:3001 \
		-e NODE_ENV=production \
		-e NEXT_PUBLIC_API_URL=$(API_URL) \
		-e PORT=3001 \
		cloud-files

run-notes: ## Run Notes service only
	@if [ -z "$(API_URL)" ]; then \
		echo "Warning: API_URL not set, using default: http://localhost:8080"; \
		API_URL="http://localhost:8080"; \
	fi
	docker run -d --name cloud-notes -p 3002:3002 \
		-e NODE_ENV=production \
		-e NEXT_PUBLIC_API_URL=$(API_URL) \
		-e PORT=3002 \
		cloud-notes

clean: ## Stop and remove all containers
	docker stop cloud-api cloud-account cloud-files cloud-notes 2>/dev/null || true
	docker rm cloud-api cloud-account cloud-files cloud-notes 2>/dev/null || true
	docker system prune -f

logs: ## Show logs for all services
	@echo "=== API Logs ==="
	docker logs cloud-api
	@echo "=== Account Logs ==="
	docker logs cloud-account
	@echo "=== Files Logs ==="
	docker logs cloud-files
	@echo "=== Notes Logs ==="
	docker logs cloud-notes

logs-api: ## Show API logs
	docker logs cloud-api

logs-account: ## Show Account logs
	docker logs cloud-account

logs-files: ## Show Files logs
	docker logs cloud-files

logs-notes: ## Show Notes logs
	docker logs cloud-notes

shell-api: ## Open shell in API container
	docker exec -it cloud-api sh

shell-account: ## Open shell in Account container
	docker exec -it cloud-account sh

shell-files: ## Open shell in Files container
	docker exec -it cloud-files sh

shell-notes: ## Open shell in Notes container
	docker exec -it cloud-notes sh

migrate: ## Run database migrations
	docker exec cloud-api npm run prisma:migrate --workspace=api

seed: ## Seed the database
	docker exec cloud-api npm run seed --workspace=api

setup: ## Run migrations and seed database
	@echo "Running database migrations..."
	docker exec cloud-api npm run prisma:migrate --workspace=api
	@echo "Seeding database..."
	docker exec cloud-api npm run seed --workspace=api
	@echo "Database setup complete!"

test: ## Run tests in containers
	docker exec cloud-api npm test
	docker exec cloud-account npm test
	docker exec cloud-files npm test
	docker exec cloud-notes npm test

status: ## Show status of all containers
	docker ps --filter "name=cloud-"

stop: ## Stop all containers
	docker stop cloud-api cloud-account cloud-files cloud-notes

start: ## Start all containers
	docker start cloud-api cloud-account cloud-files cloud-notes

restart: ## Restart all containers
	docker restart cloud-api cloud-account cloud-files cloud-notes
