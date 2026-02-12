#!/bin/sh

echo "🚀 Starting Ramadan Fantasy Football API..."
echo "📦 Environment: ${NODE_ENV:-development}"
echo "🔌 Port: ${PORT:-5000}"
echo "📊 Database URL exists: $([ -n "$DATABASE_URL" ] && echo 'yes' || echo 'no')"

# Run database migrations
echo "🔄 Running database migrations..."
if npx prisma migrate deploy; then
  echo "✅ Migrations completed successfully"
else
  echo "⚠️ Migrations failed or no migrations to run"
fi

# Start the server
echo "🎯 Starting Node.js server..."
exec node src/server.js
