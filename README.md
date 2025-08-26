# Cloud

### Escape Google Workspace and iCloud. Run your own cloud privately.

A modern, self-hosted cloud platform with file storage, notes, and account management. Built with Next.js, Express, and PostgreSQL.

---

## 🏗️ Architecture

This is a monorepo built with **Turborepo** containing multiple applications and shared packages:

### Applications (`apps/`)

- **`api/`** - Express.js API server with OAuth2, Prisma ORM, and PostgreSQL
  - RESTful API endpoints for all services
  - WebDAV protocol support for native iOS integration
  - OAuth2-based authentication
  - File upload/download handling
  - Database migrations and seeding

- **`account/`** - Next.js 15 account management app (port 3000)
  - User registration and authentication
  - Workspace management
  - Admin panel for user management
  - Password management

- **`files/`** - Next.js 15 file management app (port 3001)
  - File upload, download, and organization
  - WebDAV setup instructions for iOS integration
  - File preview and management
  - Trash/recovery system

- **`notes/`** - Next.js 15 notes app (port 3002)
  - Markdown note editor
  - Note organization and search
  - File attachments support

### Shared Packages (`packages/`)

- **`ui/`** - Shared React UI components with Radix UI and Tailwind CSS
- **`types/`** - TypeScript type definitions
- **`providers/`** - React context providers for authentication and state
- **`utils/`** - Shared utility functions
- **`api/`** - API client utilities
- **`eslint-config/`** - Shared ESLint configurations
- **`typescript-config/`** - Shared TypeScript configurations

---

## 🚀 Local Development

### Prerequisites

- Node.js >= 22
- PostgreSQL database
- Docker (optional, for database)

### Quick Start

1. **Clone and install dependencies:**

   ```sh
   git clone <repository-url>
   cd cloud
   npm install
   ```

   > **Note**: The API build process uses `tsconfig-paths` for runtime path resolution instead of `tsc-alias`. This allows the compiled JavaScript to resolve TypeScript path aliases at runtime.

2. **Set up environment variables:**

   ```sh
   cp env.example .env
   # Edit .env with your database configuration
   ```

3. **Start PostgreSQL (using Docker):**

   **Option A: Using Docker Compose (Recommended):**

   ```sh
   # Start PostgreSQL (volume will be created automatically)
   docker-compose up -d postgres
   ```

   **Option B: Using Docker run:**

   ```sh
   docker run --name cloud-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cloud -p 5432:5432 -v cloud-postgres-data:/var/lib/postgresql/data -d postgres:15
   ```

4. **Set up the database:**

   ```sh
   cd apps/api
   npm run prisma:migrate:dev
   npm run prisma:generate
   npm run seed
   ```

5. **Start all services:**

   ```sh
   npm run dev
   ```

### Development URLs

- **API**: http://localhost:4000
- **Account App**: http://localhost:3000
- **Files App**: http://localhost:3001
- **Notes App**: http://localhost:3002

### Available Scripts

```sh
npm run dev          # Start all services in development mode
npm run build        # Build all applications
npm run test         # Run tests across all packages
npm run lint         # Lint all code
npm run lint:fix     # Fix linting issues
npm run check-types  # Type check all TypeScript code
npm run format       # Format code with Prettier
```

### Makefile Commands

For convenience, you can also use the included Makefile:

```sh
make help           # Show all available commands
make dev            # Start development environment (Docker + install + dev)
make prod           # Start production environment (Docker + install + build + start)
make build          # Build all applications
make start          # Start all applications
make lint           # Run linting
make test           # Run tests
make clean          # Clean build artifacts and node_modules
make install        # Install dependencies
make seed           # Seed database
make docker-up      # Start Docker services
make docker-down    # Stop Docker services
```

**Quick Start with Makefile:**

```sh
make dev            # One command to start everything for development
```

---

## 🐳 Docker Development

### Using Docker Compose

For PostgreSQL development environment:

```sh
# Start PostgreSQL only
docker-compose up -d postgres

# View PostgreSQL logs
docker-compose logs -f postgres

# Stop PostgreSQL
docker-compose down postgres

# Start all services (when more services are added)
docker-compose up -d

# Stop all services
docker-compose down
```

### Individual Docker Services

Each service can be run independently:

```sh
# Build individual services
docker build -f apps/api/Dockerfile -t cloud-api .
docker build -f apps/account/Dockerfile -t cloud-account .
docker build -f apps/files/Dockerfile -t cloud-files .
docker build -f apps/notes/Dockerfile -t cloud-notes .

# Run individual services
docker run -d --name cloud-api -p 4000:4000 cloud-api
docker run -d --name cloud-account -p 3000:3000 cloud-account
docker run -d --name cloud-files -p 3001:3001 cloud-files
docker run -d --name cloud-notes -p 3002:3002 cloud-notes
```

---

## 🚀 Production Deployment

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM
- 10GB of available disk space
- PostgreSQL database (can be external or containerized)

### Quick Production Setup

1. **Set up environment variables:**

   ```sh
   cp env.production.example .env.production
   # Edit .env.production with your production values
   ```

2. **Build and run all services:**

   ```sh
   make build
   DATABASE_URL=your-db-url make run
   ```

### Manual Production Deployment

#### Building Images

Each service has its own Dockerfile in the `apps/{service}/` directory:

```bash
# Build all services
docker build -f apps/api/Dockerfile -t cloud-api .
docker build -f apps/account/Dockerfile -t cloud-account .
docker build -f apps/files/Dockerfile -t cloud-files .
docker build -f apps/notes/Dockerfile -t cloud-notes .
```

#### Running Containers

Each container can be run independently with proper environment variables:

**API Service:**

```bash
docker run -d \
  --name cloud-api \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://user:password@host:5432/database \

  -e OAUTH_CLIENT_ID=your-oauth-client-id \
  -e OAUTH_CLIENT_SECRET=your-oauth-client-secret \
  cloud-api
```

**Frontend Services:**

```bash
# Account
docker run -d \
  --name cloud-account \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL=http://your-api-url:8080 \
  cloud-account

# Files
docker run -d \
  --name cloud-files \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL=http://your-api-url:8080 \
  cloud-files

# Notes
docker run -d \
  --name cloud-notes \
  -p 3002:3002 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL=http://your-api-url:8080 \
  cloud-notes
```

### Production Management Commands

```sh
make build           # Build all Docker images
make run             # Run all services
make build-api       # Build API only
make build-account   # Build Account app only
make build-files     # Build Files app only
make build-notes     # Build Notes app only
make run-api         # Run API only
make run-account     # Run Account app only
make run-files       # Run Files app only
make run-notes       # Run Notes app only
make status          # Show container status
make logs            # Show all logs
make clean           # Stop and remove all containers
make restart         # Restart all containers
make setup           # Run migrations and seed database
```

### Environment Variables

#### API Service

- `NODE_ENV`: Set to `production`
- `DATABASE_URL`: PostgreSQL connection string

- `OAUTH_CLIENT_ID`: OAuth client ID
- `OAUTH_CLIENT_SECRET`: OAuth client secret
- `PORT`: Port to run on (default: 8080)

#### Frontend Services

- `NODE_ENV`: Set to `production`
- `NEXT_PUBLIC_API_URL`: URL of the API service
- `PORT`: Port to run on (Account: 3000, Files: 3001, Notes: 3002)

### Production Database Setup

Run PostgreSQL separately:

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_USER=your-user \
  -e POSTGRES_PASSWORD=your-password \
  -e POSTGRES_DB=your-database \
  -p 5432:5432 \
  postgres:16-alpine
```

### Health Checks

All containers include health checks:

- **API**: `http://localhost:8080/health`
- **Account**: `http://localhost:3000`
- **Files**: `http://localhost:3001`
- **Notes**: `http://localhost:3002`

### Monitoring and Logs

```bash
# View all logs
make logs

# View specific service logs
make logs-api
make logs-account
make logs-files
make logs-notes

# Check service status
make status

# Execute commands in containers
make shell-api
make shell-account
make shell-files
make shell-notes
```

---

## ☁️ Cloud Deployment

### Google Cloud Platform

The project includes `cloudbuild.yaml` for automated deployment to Google Cloud Platform.

### Kubernetes Deployment

The application is designed to work with Kubernetes. Example configurations are provided in the `k8s/` directory:

#### Prerequisites

- Kubernetes cluster (local: minikube, kind, or Docker Desktop)
- kubectl configured
- NGINX Ingress Controller installed

#### Deploy to Kubernetes

```bash
# Apply configurations
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/frontend-deployments.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods
kubectl get services
kubectl get ingress
```

#### Build Images for Kubernetes

```bash
# Build and tag images
docker build -f apps/api/Dockerfile -t your-registry/cloud-api:latest .
docker build -f apps/account/Dockerfile -t your-registry/cloud-account:latest .
docker build -f apps/files/Dockerfile -t your-registry/cloud-files:latest .
docker build -f apps/notes/Dockerfile -t your-registry/cloud-notes:latest .

# Push to registry
docker push your-registry/cloud-api:latest
docker push your-registry/cloud-account:latest
docker push your-registry/cloud-files:latest
docker push your-registry/cloud-notes:latest
```

### Production Considerations

#### Security

1. **Environment Variables**: Use secure secrets management
2. **Network Security**: Configure firewalls and network policies
3. **SSL/TLS**: Enable HTTPS with proper certificates
4. **Database Security**: Use strong passwords and network isolation

#### Performance

1. **Resource Limits**: Configure appropriate CPU/memory limits
2. **Scaling**: Use horizontal pod autoscaling in Kubernetes
3. **Caching**: Implement Redis for session management
4. **CDN**: Use CDN for static assets

#### Monitoring

1. **Metrics**: Implement Prometheus metrics
2. **Logging**: Use centralized logging (ELK stack, Fluentd)
3. **Alerting**: Set up alerts for service failures
4. **Tracing**: Implement distributed tracing

#### Backup

1. **Database**: Regular PostgreSQL backups
2. **Files**: Backup uploads volume
3. **Configuration**: Version control all configs

---

## 🔧 Key Features

### Authentication & Authorization

- OAuth2-based authentication
- OAuth2 server implementation
- Role-based access control
- Workspace-based permissions

### File Management

- File upload/download with progress tracking
- File organization and search
- WebDAV protocol support for iOS integration
- Trash/recovery system
- File type detection and preview

### Notes System

- Markdown editor with live preview
- File attachments
- Note organization and search
- Auto-save functionality

### Account Management

- User registration and profile management
- Workspace creation and management
- Admin panel for user management
- Invitation system

### WebDAV Integration

- Native iOS Files app integration
- Full WebDAV protocol support
- Secure authentication
- Workspace-aware file access

---

## 🧪 Testing

The project includes comprehensive testing across all applications:

```sh
npm run test                    # Run all tests
npm run test:coverage          # Run tests with coverage
npm run test:webdav            # Test WebDAV functionality (API only)
```

### Test Structure

- **Unit tests** for utilities and components
- **Integration tests** for API endpoints
- **E2E tests** for critical user flows
- **WebDAV tests** for iOS integration

---

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection**: Check PostgreSQL is running and accessible
2. **Port Conflicts**: Ensure ports 3000-3002, 8080, 5432 are available
3. **Memory Issues**: Increase Docker memory allocation
4. **Build Failures**: Check Node.js version compatibility

### Debug Commands

```bash
# Check container status
docker ps -a

# Inspect container logs
docker logs <container_name>

# Execute commands in container
docker exec -it <container_name> /bin/sh

# Check network connectivity
docker network ls
docker network inspect cloud_cloud-network
```

### Reset Everything

```bash
# Stop and remove all containers
make clean

# Remove all images
docker rmi cloud-api cloud-account cloud-files cloud-notes

# Clean up volumes
docker volume prune -f
```

---

## 📚 Documentation

- [WEBDAV-INTEGRATION-SUMMARY.md](WEBDAV-INTEGRATION-SUMMARY.md) - WebDAV implementation details
- [apps/api/README.md](apps/api/README.md) - API documentation
- [apps/api/README-WEBDAV.md](apps/api/README-WEBDAV.md) - WebDAV API documentation

---

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework
- **React 19** - UI library
- **Tailwind CSS 4** - Styling
- **Radix UI** - Accessible components
- **TypeScript** - Type safety

### Backend

- **Express.js** - API server
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **OAuth2 Server** - Authentication
- **OAuth2** - Token-based auth

### Development

- **Turborepo** - Monorepo build system
- **ESLint** - Code linting
- **Jest** - Testing framework
- **Docker** - Containerization

---

## 📄 License

MIT
