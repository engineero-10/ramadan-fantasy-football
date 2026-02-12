#!/bin/sh

echo "🚀 Starting Ramadan Fantasy Football API..."
echo "📦 Environment: ${NODE_ENV:-development}"
echo "🔌 Port: ${PORT:-5000}"

# Check if DATABASE_URL exists
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set!"
  echo "⏳ Waiting 10 seconds before starting anyway..."
  sleep 10
else
  echo "📊 Database URL exists: yes"
  
  # Run database migrations
  echo "🔄 Running database migrations..."
  npx prisma migrate deploy 2>&1 || echo "⚠️ Migrations failed or no migrations to run"
fi

# Start the server regardless
echo "🎯 Starting Node.js server..."
exec node src/server.js
