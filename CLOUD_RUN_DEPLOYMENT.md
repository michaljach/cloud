# Google Cloud Run Deployment Guide

This guide explains how to deploy your cloud platform to Google Cloud Run.

## Prerequisites

1. **Google Cloud Account**: You need a Google Cloud account with billing enabled
2. **Google Cloud CLI**: Install the [gcloud CLI](https://cloud.google.com/sdk/docs/install)
3. **Docker**: Install Docker on your local machine
4. **Project Setup**: Create a Google Cloud project and enable required APIs

## Setup

### 1. Enable Required APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 2. Configure Cloud Build

1. **Connect your repository** to Cloud Build in the Google Cloud Console
2. **Set up triggers** for automatic deployment on push to main branch
3. **Configure environment variables** in Cloud Build settings

### 3. Set Environment Variables

```bash
export PROJECT_ID="your-project-id"
export REGION="us-central1"  # or your preferred region
```

## Deployment Options

### Option 1: Cloud Build (CI/CD) - Recommended

1. **Connect your repository** to Cloud Build
2. **Set up build triggers** for automatic deployment
3. **Push to your repository** - Cloud Build will automatically build and deploy using `cloudbuild.yaml`

#### Setting up Cloud Build Triggers

1. **Go to Cloud Build > Triggers** in the Google Cloud Console
2. **Create a new trigger** with the following settings:
   - **Name**: `cloud-platform-deploy`
   - **Event**: Push to a branch
   - **Repository**: Your connected repository
   - **Branch**: `main` (or your default branch)
   - **Build configuration**: Cloud Build configuration file
   - **Cloud Build configuration file location**: `/cloudbuild.yaml`

3. **Configure environment variables** in the trigger settings if needed

### Option 2: Individual Service Deployment

Deploy services individually:

```bash
# Build and deploy API
docker build -f apps/api/Dockerfile.cloudrun -t gcr.io/$PROJECT_ID/cloud-api:latest .
docker push gcr.io/$PROJECT_ID/cloud-api:latest
gcloud run deploy cloud-api \
    --image gcr.io/$PROJECT_ID/cloud-api:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1

# Build and deploy Account app
docker build -f apps/account/Dockerfile.cloudrun -t gcr.io/$PROJECT_ID/cloud-account:latest .
docker push gcr.io/$PROJECT_ID/cloud-account:latest
gcloud run deploy cloud-account \
    --image gcr.io/$PROJECT_ID/cloud-account:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1

# Repeat for files and notes services...
```

## Cloud Run Optimizations

The Cloud Run Dockerfiles include several optimizations:

### 1. **Port Configuration**

- All services run on port 8080 (Cloud Run requirement)
- Environment variable `PORT=8080` is set

### 2. **Security**

- Non-root user (`nextjs`) for running applications
- Proper file permissions
- Minimal attack surface

### 3. **Performance**

- Multi-stage builds to reduce image size
- Alpine Linux base images
- Optimized layer caching

### 4. **Health Checks**

- Built-in health check endpoints
- Proper startup timeouts

## Environment Variables

Set these environment variables in Cloud Run:

### API Service

```bash
NODE_ENV=production
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-client-secret
```

### Frontend Services

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api-service-url
```

## Database Setup

For production, use Cloud SQL or an external PostgreSQL database:

1. **Create a Cloud SQL instance** (recommended)
2. **Update the DATABASE_URL** in your Cloud Run service
3. **Run migrations** on the database

## Monitoring and Logging

### View Logs

```bash
gcloud logging read "resource.type=cloud_run_revision" --limit=50
```

### Monitor Services

```bash
gcloud run services list --region=$REGION
```

## Scaling Configuration

Default configuration:

- **Memory**: 512Mi
- **CPU**: 1
- **Max Instances**: 10
- **Min Instances**: 0 (scales to zero)

Adjust based on your needs:

```bash
gcloud run services update cloud-api \
    --memory 1Gi \
    --cpu 2 \
    --max-instances 20 \
    --min-instances 1
```

## Cost Optimization

1. **Set appropriate memory limits** - don't over-allocate
2. **Use min-instances=0** for non-critical services
3. **Monitor usage** with Cloud Monitoring
4. **Set up billing alerts**

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Docker build logs
   - Verify all dependencies are included

2. **Runtime Errors**
   - Check Cloud Run logs
   - Verify environment variables

3. **Database Connection Issues**
   - Check DATABASE_URL format
   - Verify network connectivity

### Debug Commands

```bash
# Check service status
gcloud run services describe cloud-api --region=$REGION

# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=cloud-api" --limit=10

# Test health endpoint
curl https://your-service-url/health
```

## Security Considerations

1. **Use IAM roles** instead of service accounts where possible
2. **Enable authentication** for sensitive services
3. **Use VPC Connector** for private database access
4. **Set up proper CORS** policies
5. **Use HTTPS** (enabled by default in Cloud Run)

## Next Steps

1. **Set up a custom domain** for your services
2. **Configure SSL certificates**
3. **Set up monitoring and alerting**
4. **Implement CI/CD pipeline**
5. **Set up backup and disaster recovery**
