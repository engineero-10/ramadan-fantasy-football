# Backend Dockerfile - Ramadan Fantasy Football
# Last updated: 2026-02-12 v3
FROM node:18-alpine

# Install OpenSSL (required by Prisma)
RUN apk add --no-cache openssl

# Create app directory
WORKDIR /app

# Install ALL dependencies (including dev for prisma)
COPY package*.json ./
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY src ./src/

# Start command - migrations first, then server
CMD ["sh", "-c", "npx prisma migrate deploy 2>&1 || echo 'Migration skipped' && node src/server.js"]
