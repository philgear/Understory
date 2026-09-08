# Stage 1: Build
FROM node:24-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS builder

WORKDIR /usr/src/app

# Update system packages to resolve vulnerabilities
RUN apk update && apk upgrade --no-cache

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:24-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf

WORKDIR /usr/src/app

# Update system packages to resolve vulnerabilities in production stage
RUN apk update && apk upgrade --no-cache

# Set Node to production environment
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled dist from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Run as non-root user for security
USER node

# Expose the default Cloud Run port
EXPOSE 8080

# Start the server
CMD ["node", "dist/index.js"]

