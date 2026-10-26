# Build stage
FROM node:24.22.1-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS builder
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci

# Production stage
FROM node:24.22.1-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53
LABEL maintainer="Bill Church <github.com/billchurch>"
LABEL description="Unofficial Orbit Bhyve API to MQTT gateway"
LABEL version="1.0"

# Install dumb-init for proper signal handling and refresh the CA store
# (eMudhra intermediate CA compromise, 2026-10)
RUN apk add --no-cache --upgrade dumb-init ca-certificates

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
