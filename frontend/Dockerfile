# Frontend Dockerfile - Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies (separate layer for caching)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY public ./public/
COPY src ./src/

# Build the React app
# API calls are proxied through nginx, so we use /api as the base URL
ENV REACT_APP_API_URL=/api
RUN npm run build

# ──────────────────────────────────────────────
# Production stage: nginx serves the built app
# ──────────────────────────────────────────────
FROM nginx:alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
