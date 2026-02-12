# Backend Dockerfile
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

# Railway uses dynamic PORT - don't hardcode
ENV PORT=5000

# Start the application (run migrations first)
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
