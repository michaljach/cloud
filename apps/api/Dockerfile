FROM node:22-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace package.json files
COPY apps/*/package*.json ./apps/
COPY packages/*/package*.json ./packages/

# Install dependencies (including dev dependencies for development)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Ensure workspace links are properly created
RUN npm install

# Generate Prisma client for API
RUN cd apps/api && npx prisma generate

# Build UI package
RUN cd packages/ui && npm run build

# Build API
RUN cd apps/api && npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy built app and dependencies
COPY --from=base /app/package*.json ./
COPY --from=base /app/turbo.json ./
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/package*.json ./apps/api/
COPY --from=base /app/apps/api/prisma ./apps/api/prisma
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages

# Create uploads directory
RUN mkdir -p /app/apps/api/uploads

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Install wait-for-it script
RUN apk add --no-cache bash

CMD ["sh", "-c", "sleep 10 && cd apps/api && npm run serve"]
