# تفعيل الكاش في مشروع رمضان فانتازي

## لماذا الكاش؟
الكاش (Caching) يُستخدم لتسريع الموقع وتقليل الضغط على قاعدة البيانات، خاصة في الاستعلامات المتكررة أو العمليات الحسابية الثقيلة.

## أفضل حل عملي: Redis
Redis هو أشهر وأسرع نظام كاش (In-memory cache) ويُستخدم مع Node.js بسهولة.

## خطوات التفعيل:

### 1. تثبيت Redis
- على السيرفر أو جهازك المحلي:
  - Linux: `sudo apt install redis-server`
  - Windows: استخدم Docker أو نسخة رسمية
- تأكد أن Redis يعمل: `redis-cli ping` يجب أن تظهر `PONG`

### 2. تثبيت مكتبة Redis في Node.js
- في مجلد backend:
```
npm install redis
```

### 3. إعداد الاتصال في Express
```js
// في src/config/cache.js
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
client.connect();

client.on('error', (err) => console.error('Redis Error:', err));
module.exports = client;
```

### 4. استخدام الكاش في نقطة API
مثال: كاش ترتيب الدوري
```js
const redisClient = require('../config/cache');

async function getLeaderboard(req, res, next) {
  const cacheKey = `leaderboard:${req.params.leagueId}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // ... حساب الترتيب من قاعدة البيانات ...
  const leaderboard = await calculateLeaderboard();

  // حفظ النتيجة في الكاش لمدة ساعة
  await redisClient.set(cacheKey, JSON.stringify(leaderboard), { EX: 3600 });
  res.json(leaderboard);
}
```

### 5. تحديث الكاش عند تغيير البيانات
- عند تحديث النقاط أو ترتيب الفرق، احذف الكاش أو حدثه:
```js
await redisClient.del(cacheKey);
```

## نصائح:
- استخدم الكاش في الاستعلامات الثقيلة فقط (ترتيب، إحصائيات، بيانات ثابتة)
- لا تستخدم الكاش في بيانات المستخدم الحساسة أو المتغيرة باستمرار
- حدد مدة الكاش حسب الحاجة (دقائق أو ساعات)

---

يمكنك تخصيص الكاش لأي نقطة API بسهولة بنفس الطريقة. إذا أردت كود عملي لنقطة معينة، أخبرني بذلك!