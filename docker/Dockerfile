# Multi-stage build for SEOMonitor MCP Server
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Prune dev dependencies for production
RUN npm prune --production

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mcp -u 1001

# Copy built application and dependencies
COPY --from=builder --chown=mcp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=mcp:nodejs /app/dist ./dist
COPY --from=builder --chown=mcp:nodejs /app/package*.json ./

# Copy bin directory
COPY --chown=mcp:nodejs bin/ ./bin/
RUN chmod +x ./bin/mcp-server.js

# Create log directory
RUN mkdir -p /app/logs && chown mcp:nodejs /app/logs

# Switch to non-root user
USER mcp

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3001}/health || exit 1

# Set default environment variables
ENV NODE_ENV=production
ENV TRANSPORT=http
ENV PORT=3001
ENV HOST=0.0.0.0
ENV LOG_LEVEL=info
ENV CORS_ORIGIN=*

# Expose ports
EXPOSE 3001

# Default command (can be overridden)
CMD ["node", "dist/index.js"]