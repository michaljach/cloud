# Install dependencies and build
FROM node:22-alpine AS builder
WORKDIR /app

# Copy root and app package.json files
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Install dependencies from root
RUN npm install --frozen-lockfile || npm install

# Copy app source
COPY apps/api ./apps/api

# Build the app
WORKDIR /app/apps/api
RUN npm run build

# Production image
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built app and node_modules
COPY --from=builder /app/apps/api ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ../packages

EXPOSE 4000
CMD ["npm", "run", "start"] 