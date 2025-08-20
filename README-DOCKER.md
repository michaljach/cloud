# Docker Production Setup

This project now uses standalone Docker containers for production deployment. Each service can be run independently without Docker Compose.

## Services

- **API**: Backend API service (Port 8080)
- **Account**: Account management frontend (Port 3000)
- **Files**: File management frontend (Port 3001)
- **Notes**: Notes management frontend (Port 3002)

## Building Images

Each service has its own Dockerfile in the `apps/{service}/` directory:

```bash
# Build API
docker build -f apps/api/Dockerfile -t cloud-api .

# Build Account
docker build -f apps/account/Dockerfile -t cloud-account .

# Build Files
docker build -f apps/files/Dockerfile -t cloud-files .

# Build Notes
docker build -f apps/notes/Dockerfile -t cloud-notes .
```

## Running Containers

Each container can be run independently. You'll need to provide the necessary environment variables:

### API Service

```bash
docker run -d \
  --name cloud-api \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://user:password@host:5432/database \
  -e JWT_SECRET=your-jwt-secret \
  -e OAUTH_CLIENT_ID=your-oauth-client-id \
  -e OAUTH_CLIENT_SECRET=your-oauth-client-secret \
  cloud-api
```

### Frontend Services

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

## Environment Variables

### API Service

- `NODE_ENV`: Set to `production`
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `OAUTH_CLIENT_ID`: OAuth client ID
- `OAUTH_CLIENT_SECRET`: OAuth client secret
- `PORT`: Port to run on (default: 8080)

### Frontend Services

- `NODE_ENV`: Set to `production`
- `NEXT_PUBLIC_API_URL`: URL of the API service
- `PORT`: Port to run on (Account: 3000, Files: 3001, Notes: 3002)

## Health Checks

All containers include health checks:

- API: `http://localhost:8080/health`
- Account: `http://localhost:3000`
- Files: `http://localhost:3001`
- Notes: `http://localhost:3002`

## Production Deployment

For production deployment, you can use:

1. **Google Cloud Run** (recommended)
2. **Kubernetes**
3. **Docker Swarm**
4. **Standalone Docker hosts**

Each service is designed to be stateless and can be scaled independently.

## Database

The API service requires a PostgreSQL database. You can run it separately:

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_USER=your-user \
  -e POSTGRES_PASSWORD=your-password \
  -e POSTGRES_DB=your-database \
  -p 5432:5432 \
  postgres:16-alpine
```

## Reverse Proxy

For production, you'll want to set up a reverse proxy (like Nginx) to route traffic to the appropriate services based on domain or path.

## Monitoring

Each container exposes health check endpoints that can be used for monitoring and load balancer health checks.
