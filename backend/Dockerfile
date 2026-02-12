# Backend Dockerfile - Ramadan Fantasy Football
# Last updated: 2026-02-12 v2
FROM node:18-alpine

# Install OpenSSL (required by Prisma)
RUN apk add --no-cache openssl

# Create app directory
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY src ./src/

# Railway provides PORT dynamically - don't override it
# ENV PORT=5000

# Start with direct node command (simpler, more reliable)
CMD ["sh", "-c", "echo 'Starting server...' && npx prisma migrate deploy || true && node src/server.js"]
