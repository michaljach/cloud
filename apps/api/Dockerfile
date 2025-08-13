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

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependencies and source
COPY --from=base /app/package*.json ./
COPY --from=base /app/turbo.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps ./apps
COPY --from=base /app/packages ./packages

# Build the API
RUN npm run build --filter=api

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy built app and dependencies
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package*.json ./apps/api/
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["npm", "run", "serve", "--workspace=api"]
