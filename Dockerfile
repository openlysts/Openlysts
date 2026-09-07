# Multi-stage Dockerfile for Openlysts
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && \
    cp -R node_modules /production_deps && \
    npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S openlysts && \
    adduser -S openlysts -u 1001

# Copy production dependencies
COPY --from=frontend-build /production_deps ./node_modules

# Copy built frontend
COPY --from=frontend-build /app/dist ./dist

# Copy server code
COPY server/ ./server/

# Copy API handler
COPY api/ ./api/

# Copy necessary config files
COPY package.json ./
COPY vercel.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Run as non-root user
USER openlysts

# Start server
CMD ["dumb-init", "node", "server/index.js"]
