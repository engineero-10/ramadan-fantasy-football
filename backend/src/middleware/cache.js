/**
 * In-memory response cache for GET requests
 * Reduces DB load and speeds up repeated reads
 */

const NodeCache = require('node-cache');

const cache = new NodeCache({
  stdTTL: 60,       // 60 seconds default TTL
  maxKeys: 500,
  useClones: false
});

const SKIP_PATHS = [
  '/auth/me',
  '/auth/login',
  '/auth/register'
];

function isCacheable(req) {
  if (req.method !== 'GET') return false;
  const path = (req.path || '').replace(/^\/api/, '');
  if (SKIP_PATHS.some(p => path.startsWith(p))) return false;
  return true;
}

function getCacheKey(req) {
  const path = req.originalUrl || req.url || req.path;
  const userId = req.user?.id || 'anon';
  const query = req.query && Object.keys(req.query).length
    ? Object.keys(req.query)
        .sort()
        .map(k => `${k}=${req.query[k]}`)
        .join('&')
    : '';
  return `${path}:${userId}${query ? `?${query}` : ''}`;
}

function cacheMiddleware(req, res, next) {
  if (req.method !== 'GET') {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      invalidateCache();
      return originalJson(body);
    };
    return next();
  }

  if (!isCacheable(req)) return next();

  const key = getCacheKey(req);
  const cached = cache.get(key);
  if (cached) {
    res.set('X-Cache', 'HIT');
    res.set('Cache-Control', 'private, max-age=60');
    return res.status(cached.status).json(cached.body);
  }

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    cache.set(key, { status: res.statusCode, body });
    res.set('X-Cache', 'MISS');
    res.set('Cache-Control', 'private, max-age=60');
    return originalJson(body);
  };
  next();
}

function invalidateCache() {
  cache.flushAll();
}

module.exports = { cacheMiddleware, invalidateCache, cache };
