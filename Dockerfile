# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source and config files
COPY src/ ./src/
COPY tsconfig.json ./

# Compile TypeScript
RUN npx tsc

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Copy default config (can be overridden via volume mount or environment variables)
COPY --from=builder /app/src/config.json ./config.json

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose the port the app runs on
EXPOSE 3000

# Environment variables with defaults
# DB_PATH: Path to SQLite database file (use /data for Docker with volume mount)
ENV DB_PATH=/data/brewback.db

# Connection pool settings
ENV DB_POOL_SIZE=5
ENV DB_POOL_GET_TIMEOUT=3000
ENV DB_POOL_RETRY_INTERVAL=50

# Server settings
ENV PORT=3000
ENV NODE_ENV=production

# Run the application
CMD ["node", "dist/bin/www.js"]
