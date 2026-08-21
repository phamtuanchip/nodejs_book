/**
 * Chương 14: Rate Limiter dùng Redis INCR + EXPIRE
 * 100 requests per 15 minutes per IP
 * Trả headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
 *
 * Chạy: node 03-rate-limiter.js
 */

const express = require('express');
const Redis = require('ioredis');

const app = express();
app.use(express.json());

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
  lazyConnect: true,
});

// === RATE LIMITER CƠ BẢN ===

/**
 * Tạo rate limiter middleware
 * @param {Object} options
 * @param {number} options.max - Số request tối đa
 * @param {number} options.windowMs - Cửa sổ thời gian (ms)
 * @param {string} options.keyPrefix - Tiền tố key Redis
 * @param {Function} options.keyGenerator - Hàm tạo key (mặc định: theo IP)
 * @param {Function} options.handler - Hàm xử lý khi vượt giới hạn
 */
function createRateLimiter(options = {}) {
  const {
    max = 100,
    windowMs = 15 * 60 * 1000, // 15 phút
    keyPrefix = 'rl',
    keyGenerator = (req) => req.ip || req.connection.remoteAddress,
    handler = null,
  } = options;

  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req, res, next) => {
    const identifier = keyGenerator(req);
    const key = `${keyPrefix}:${identifier}`;

    try {
      // Dùng pipeline để atomic: INCR + EXPIRE trong 1 round-trip
      const pipeline = redis.pipeline();
      pipeline.incr(key);
      pipeline.ttl(key);
      const results = await pipeline.exec();

      const current = results[0][1]; // kết quả INCR
      const ttl = results[1][1];     // kết quả TTL

      // Lần đầu tiên: set expire
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      // Tính thời gian reset
      const resetTime = ttl > 0
        ? Math.floor(Date.now() / 1000) + ttl
        : Math.floor(Date.now() / 1000) + windowSeconds;

      const remaining = Math.max(0, max - current);

      // Thêm headers thông tin rate limit
      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toString(),
        'X-RateLimit-Reset-Human': new Date(resetTime * 1000).toISOString(),
      });

      // Vượt quá giới hạn
      if (current > max) {
        if (handler) {
          return handler(req, res);
        }

        res.set('Retry-After', (ttl > 0 ? ttl : windowSeconds).toString());
        return res.status(429).json({
          success: false,
          error: 'Quá nhiều request',
          message: `Giới hạn ${max} requests/${windowMs / 60000} phút. Thử lại sau ${ttl} giây.`,
          retryAfter: ttl,
        });
      }

      next();
    } catch (err) {
      // Redis lỗi: cho phép request đi qua (fail open)
      console.error('Rate limiter lỗi:', err.message);
      next();
    }
  };
}

// === RATE LIMITER NÂNG CAO: Sliding Window ===

/**
 * Sliding window rate limiter dùng Sorted Set
 * Chính xác hơn fixed window nhưng tốn memory hơn
 */
function slidingWindowLimiter(max = 100, windowMs = 60000) {
  const windowSeconds = windowMs / 1000;

  return async (req, res, next) => {
    const key = `sw:${req.ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      const pipeline = redis.pipeline();
      // Xóa requests cũ hơn cửa sổ thời gian
      pipeline.zremrangebyscore(key, 0, windowStart);
      // Thêm request hiện tại (score = timestamp)
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      // Đếm số requests trong cửa sổ
      pipeline.zcard(key);
      // Set expire cho key
      pipeline.expire(key, Math.ceil(windowSeconds));

      const results = await pipeline.exec();
      const requestCount = results[2][1];

      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': Math.max(0, max - requestCount).toString(),
        'X-RateLimit-Policy': 'sliding-window',
      });

      if (requestCount > max) {
        return res.status(429).json({
          success: false,
          error: 'Quá nhiều request (sliding window)',
          requestCount,
          limit: max,
        });
      }

      next();
    } catch (err) {
      next();
    }
  };
}

// Rate limiter khác nhau cho từng route
const globalLimiter = createRateLimiter({
  max: 1000,
  windowMs: 15 * 60 * 1000, // 1000 req / 15 phút
  keyPrefix: 'rl:global',
});

const apiLimiter = createRateLimiter({
  max: 100,
  windowMs: 15 * 60 * 1000, // 100 req / 15 phút cho API
  keyPrefix: 'rl:api',
});

const loginLimiter = createRateLimiter({
  max: 5,
  windowMs: 15 * 60 * 1000, // 5 lần / 15 phút cho login
  keyPrefix: 'rl:login',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Quá nhiều lần đăng nhập thất bại',
      message: 'Tài khoản tạm khóa 15 phút do đăng nhập sai nhiều lần',
    });
  },
});

// Rate limit theo user ID (sau khi đã xác thực)
const userLimiter = createRateLimiter({
  max: 200,
  windowMs: 60 * 1000, // 200 req / phút per user
  keyPrefix: 'rl:user',
  keyGenerator: (req) => req.headers['x-user-id'] || req.ip,
});

// === ROUTES ===

// Áp dụng global limiter cho mọi request
app.use(globalLimiter);

// API thông thường: 100 req/15 phút
app.get('/api/products', apiLimiter, (req, res) => {
  res.json({ success: true, data: ['Laptop', 'Phone', 'Tablet'] });
});

// Login: chỉ 5 lần/15 phút
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  // Giả lập kiểm tra đăng nhập
  if (email === 'admin@test.com' && password === '123456') {
    res.json({ success: true, token: 'fake-jwt-token' });
  } else {
    res.status(401).json({ success: false, error: 'Sai email hoặc password' });
  }
});

// API với sliding window
app.get('/api/search', slidingWindowLimiter(50, 60000), (req, res) => {
  res.json({ success: true, query: req.query.q, results: [] });
});

// Per-user rate limiting
app.get('/api/me/data', userLimiter, (req, res) => {
  res.json({ success: true, data: { userId: req.headers['x-user-id'] } });
});

// Xem thống kê rate limit của IP hiện tại
app.get('/api/rate-limit/status', async (req, res) => {
  const ip = req.ip;
  const keys = await redis.keys(`rl:*:${ip}`);

  const stats = {};
  for (const key of keys) {
    const count = await redis.get(key);
    const ttl = await redis.ttl(key);
    stats[key] = { count: parseInt(count || 0), ttlSeconds: ttl };
  }

  res.json({ success: true, ip, stats });
});

// Start server
async function startServer() {
  try {
    await redis.connect();

    app.listen(3002, () => {
      console.log('Rate limiter server chạy tại http://localhost:3002');
      console.log('\nThử nghiệm rate limit:');
      console.log('  # Gửi nhiều request liên tiếp:');
      console.log('  for i in {1..10}; do curl -s http://localhost:3002/api/products | jq .success; done');
      console.log('\n  # Login brute force (chỉ 5 lần):');
      console.log('  curl -X POST http://localhost:3002/api/auth/login -H "Content-Type: application/json" -d \'{"email":"test","password":"wrong"}\'');
    });
  } catch (err) {
    console.error('Lỗi:', err.message);
  }
}

startServer();

module.exports = { app, createRateLimiter, slidingWindowLimiter };
