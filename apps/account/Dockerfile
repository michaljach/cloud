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

# Ensure Next.js is available globally
RUN npm install -g next

# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependencies and source
COPY --from=base /app/package*.json ./
COPY --from=base /app/turbo.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps ./apps
COPY --from=base /app/packages ./packages

# Set build-time environment variables
ENV NEXT_PUBLIC_API_URL=http://localhost:4000

# Build the account app
RUN npm run build --filter=account

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy built app and dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/turbo.json ./
COPY --from=builder /app/apps/account/.next ./apps/account/.next
COPY --from=builder /app/apps/account/package*.json ./apps/account/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["npm", "run", "start", "--workspace=account"]
