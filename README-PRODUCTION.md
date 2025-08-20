# Production Deployment Guide

This guide explains how to deploy the cloud application in production using Docker containers, suitable for Kubernetes or other production environments.

## Architecture Overview

The application is split into separate microservices:

- **PostgreSQL**: Database service
- **API**: Backend API service (Node.js/Express)
- **Account**: User management frontend (Next.js)
- **Files**: File management frontend (Next.js)
- **Notes**: Note-taking frontend (Next.js)
- **Nginx**: Reverse proxy and load balancer

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM
- 10GB of available disk space

## Quick Start

### 1. Environment Setup

Copy the environment template and update the values:

```bash
cp env.production.template .env.production
```

Edit `.env.production` and update the following values:

- `POSTGRES_PASSWORD`: Secure database password
- `JWT_SECRET`: Secure JWT secret
- `OAUTH_CLIENT_SECRET`: Secure OAuth secret

### 2. Deploy with Script

Use the automated deployment script:

```bash
./scripts/deploy-prod.sh
```

This script will:

- Build all production Docker images
- Start all services with proper health checks
- Verify all services are running correctly

### 3. Manual Deployment

Alternatively, deploy manually:

```bash
# Build images
docker build -f apps/api/Dockerfile.prod -t cloud-api:latest .
docker build -f apps/account/Dockerfile.prod -t cloud-account:latest .
docker build -f apps/files/Dockerfile.prod -t cloud-files:latest .
docker build -f apps/notes/Dockerfile.prod -t cloud-notes:latest .

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

## Service URLs

After deployment, the services will be available at:

- **API**: http://localhost:4000
- **Account**: http://localhost:3000
- **Files**: http://localhost:3001
- **Notes**: http://localhost:3002
- **Nginx (Main)**: http://localhost:80

## Health Checks

All services include health checks:

- **PostgreSQL**: `pg_isready` command
- **API**: HTTP GET `/health` endpoint
- **Frontend Services**: HTTP GET `/` endpoint
- **Nginx**: HTTP GET `/` endpoint

## Monitoring and Logs

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f account
docker-compose -f docker-compose.prod.yml logs -f files
docker-compose -f docker-compose.prod.yml logs -f notes
docker-compose -f docker-compose.prod.yml logs -f postgres
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Check Service Status

```bash
docker-compose -f docker-compose.prod.yml ps
```

### Health Check

```bash
# Check API health
curl http://localhost:4000/health

# Check all services
for port in 3000 3001 3002 4000 80; do
  echo "Port $port: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port)"
done
```

## Kubernetes Deployment

The application is designed to work with Kubernetes. Example configurations are provided in the `k8s/` directory:

### Prerequisites

- Kubernetes cluster (local: minikube, kind, or Docker Desktop)
- kubectl configured
- NGINX Ingress Controller installed

### Deploy to Kubernetes

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

### Build Images for Kubernetes

```bash
# Build and tag images
docker build -f apps/api/Dockerfile.prod -t your-registry/cloud-api:latest .
docker build -f apps/account/Dockerfile.prod -t your-registry/cloud-account:latest .
docker build -f apps/files/Dockerfile.prod -t your-registry/cloud-files:latest .
docker build -f apps/notes/Dockerfile.prod -t your-registry/cloud-notes:latest .

# Push to registry
docker push your-registry/cloud-api:latest
docker push your-registry/cloud-account:latest
docker push your-registry/cloud-files:latest
docker push your-registry/cloud-notes:latest
```

## Production Considerations

### Security

1. **Environment Variables**: Use secure secrets management
2. **Network Security**: Configure firewalls and network policies
3. **SSL/TLS**: Enable HTTPS with proper certificates
4. **Database Security**: Use strong passwords and network isolation

### Performance

1. **Resource Limits**: Configure appropriate CPU/memory limits
2. **Scaling**: Use horizontal pod autoscaling in Kubernetes
3. **Caching**: Implement Redis for session management
4. **CDN**: Use CDN for static assets

### Monitoring

1. **Metrics**: Implement Prometheus metrics
2. **Logging**: Use centralized logging (ELK stack, Fluentd)
3. **Alerting**: Set up alerts for service failures
4. **Tracing**: Implement distributed tracing

### Backup

1. **Database**: Regular PostgreSQL backups
2. **Files**: Backup uploads volume
3. **Configuration**: Version control all configs

## Troubleshooting

### Common Issues

1. **Database Connection**: Check PostgreSQL is running and accessible
2. **Port Conflicts**: Ensure ports 3000-3002, 4000, 5432, 80 are available
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
docker-compose -f docker-compose.prod.yml down -v

# Remove all images
docker rmi cloud-api:latest cloud-account:latest cloud-files:latest cloud-notes:latest

# Clean up volumes
docker volume prune -f
```

## Support

For issues and questions:

1. Check the logs for error messages
2. Verify environment variables are set correctly
3. Ensure all prerequisites are met
4. Check the troubleshooting section above
