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

# Force install tailwindcss and tw-animate-css if not present
RUN npm install tailwindcss@4.1.6 @tailwindcss/cli@4.1.6 tw-animate-css@1.3.5 --no-save || echo "Failed to install tailwindcss"

# Ensure Next.js is available globally
RUN npm install -g next

# Copy source code
COPY . .

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build stage - use base stage directly
FROM base AS builder

# Build only the UI package and API
RUN cd packages/ui && npm run build
RUN cd apps/api && npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy built app and dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/turbo.json ./
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package*.json ./apps/api/
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && node prisma/seed.js && npm run serve"]
