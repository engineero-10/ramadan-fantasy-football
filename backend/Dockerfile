# Backend Dockerfile - Ramadan Fantasy Football
FROM node:18-alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy Prisma schema and migrations
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy application source
COPY src ./src/

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Expose API port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["./start.sh"]
