# Docker Setup for Cloud Monorepo

This document describes how to run the cloud monorepo using Docker for both development and production environments.

## Prerequisites

- Docker and Docker Compose installed
- Make (optional, for using the Makefile commands)

## Quick Start

### Development Environment

1. **Start development environment:**

   ```bash
   make dev
   # or
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Build and start development environment:**

   ```bash
   make dev-build
   # or
   docker-compose -f docker-compose.dev.yml up -d --build
   ```

3. **Run database migrations:**

   ```bash
   make migrate-dev
   # or
   docker-compose -f docker-compose.dev.yml exec api npm run prisma:migrate --workspace=api
   ```

4. **Seed the database:**
   ```bash
   make seed-dev
   # or
   docker-compose -f docker-compose.dev.yml exec api npm run seed --workspace=api
   ```

### Production Environment

1. **Start production environment:**

   ```bash
   make prod
   # or
   docker-compose up -d
   ```

2. **Build and start production environment:**
   ```bash
   make prod-build
   # or
   docker-compose up -d --build
   ```

## Services

### Development Services

- **PostgreSQL**: `localhost:5432`
- **API**: `localhost:4000`
- **Account App**: `localhost:3000`
- **Files App**: `localhost:3001`
- **Notes App**: `localhost:3002`

### Production Services

- **PostgreSQL**: `localhost:5432`
- **API**: `localhost:4000`
- **Account App**: `localhost:3000`
- **Files App**: `localhost:3001`
- **Notes App**: `localhost:3002`
- **Nginx**: `localhost:80` (reverse proxy)

## Environment Variables

Copy `env.example` to `.env` and configure the following variables:

```bash
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=cloud
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/cloud

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000

# Node Environment
NODE_ENV=development

# Ports
PORT=4000
```

## Available Commands

### Development Commands

```bash
make dev              # Start development environment
make dev-build        # Build and start development environment
make logs-dev         # Show development logs
make shell-api-dev    # Open shell in development API container
make migrate-dev      # Run database migrations in development
make seed-dev         # Seed the database in development
make test-dev         # Run tests in development
make restart-dev      # Restart development services
make status-dev       # Show status of development containers
```

### Production Commands

```bash
make prod             # Start production environment
make prod-build       # Build and start production environment
make logs             # Show production logs
make shell-api        # Open shell in production API container
make migrate          # Run database migrations
make seed             # Seed the database
make test             # Run tests
make restart          # Restart all services
make status           # Show status of all containers
```

### General Commands

```bash
make build            # Build all Docker images
make clean            # Stop and remove all containers, networks, and volumes
make help             # Show this help message
```

## Docker Images

### Base Image

- **Node**: 22-alpine
- **Architecture**: Multi-stage builds for optimized production images

### Individual App Images

Each app has its own Dockerfile with optimized builds:

- `apps/account/Dockerfile` - Account management app
- `apps/api/Dockerfile` - Backend API with Prisma
- `apps/files/Dockerfile` - File management app
- `apps/notes/Dockerfile` - Notes app

## Network Configuration

### Development Network

- **Network**: `cloud-network-dev`
- **Services**: All services communicate via internal Docker network
- **External Access**: Services exposed on localhost ports

### Production Network

- **Network**: `cloud-network`
- **Services**: All services communicate via internal Docker network
- **Nginx**: Reverse proxy for external access
- **SSL**: Configured for HTTPS (requires SSL certificates)

## Volumes

### Development Volumes

- `postgres_data_dev`: PostgreSQL data
- `uploads_dev`: File uploads
- Source code mounted for hot reloading

### Production Volumes

- `postgres_data`: PostgreSQL data
- `uploads`: File uploads
- Built applications (no source mounting)

## Nginx Configuration

The production setup includes an Nginx reverse proxy with:

- Rate limiting
- Gzip compression
- Security headers
- Load balancing
- SSL termination (configure SSL certificates)

### Virtual Hosts

- `api.localhost` → API service
- `account.localhost` → Account app
- `files.localhost` → Files app
- `notes.localhost` → Notes app

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000-3002, 4000, 5432, 80, 443 are available
2. **Database connection**: Wait for PostgreSQL to fully start before running migrations
3. **Build failures**: Check Node.js version compatibility (requires Node 22)
4. **Permission issues**: Ensure Docker has proper permissions

### Debugging

1. **View logs:**

   ```bash
   make logs-dev    # Development
   make logs        # Production
   ```

2. **Access container shell:**

   ```bash
   make shell-api-dev    # Development API
   make shell-api        # Production API
   ```

3. **Check container status:**
   ```bash
   make status-dev    # Development
   make status        # Production
   ```

### Cleanup

```bash
make clean    # Remove all containers, networks, and volumes
```

## Development Workflow

1. Start development environment: `make dev`
2. Run migrations: `make migrate-dev`
3. Seed database: `make seed-dev`
4. Access applications at their respective ports
5. Make code changes (hot reloading enabled)
6. Run tests: `make test-dev`
7. Stop environment: `docker-compose -f docker-compose.dev.yml down`

## Production Deployment

1. Configure environment variables in `.env`
2. Build and start: `make prod-build`
3. Run migrations: `make migrate`
4. Seed database: `make seed`
5. Configure SSL certificates for Nginx
6. Access via configured domain names

## Security Considerations

- Change default passwords in production
- Use strong JWT secrets
- Configure SSL certificates
- Set up proper firewall rules
- Regular security updates
- Monitor logs for suspicious activity
