# Build stage
FROM node:20-alpine AS builder
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci

# Production stage
FROM node:20-alpine
LABEL maintainer="Bill Church <github.com/billchurch>"
LABEL description="Unofficial Orbit Bhyve API to MQTT gateway"
LABEL version="1.0"

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set environment variables
ENV NODE_ENV=production \
    MAX_RETRIES=5 \
    RECONNECT_PERIOD=5000

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

WORKDIR /app

# Copy from builder stage - including package.json
COPY --chown=nodejs:nodejs --from=builder /build/node_modules ./node_modules
COPY --chown=nodejs:nodejs package.json ./
COPY --chown=nodejs:nodejs src/ ./src/

# Switch to non-root user
USER nodejs

# Use dumb-init as entrypoint
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/app.js"]
