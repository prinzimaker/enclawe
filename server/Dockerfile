# ------------------------------------------------------------
# EnclaWe 1.0   Rel 251212
# December 2025
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# Aldus Prinzimaker
# ------------------------------------------------------------
# File: server/Dockerfile
# Docker configuration for Node.js server
# ------------------------------------------------------------

FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Create non-root user
RUN addgroup -g 1001 -S enclawe && \
    adduser -S enclawe -u 1001 -G enclawe

# Change ownership
RUN chown -R enclawe:enclawe /app

# Switch to non-root user
USER enclawe

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start server
CMD ["node", "src/index.js"]
