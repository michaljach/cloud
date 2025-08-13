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

# Build the account app
RUN npm run build --filter=account

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy built app and dependencies
COPY --from=builder /app/apps/account/.next ./apps/account/.next
COPY --from=builder /app/apps/account/public ./apps/account/public
COPY --from=builder /app/apps/account/package*.json ./apps/account/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=account"]
