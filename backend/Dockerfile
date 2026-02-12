# Backend Dockerfile - Ramadan Fantasy Football
# Last updated: 2026-02-12
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

# Copy source code and startup script
COPY src ./src/
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Railway provides PORT dynamically
ENV PORT=5000

# Start with the script
CMD ["./start.sh"]
