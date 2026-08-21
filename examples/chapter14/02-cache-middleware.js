/**
 * Chương 14: Express Cache Middleware dùng Redis
 * Cache response GET /api/products trong 60 giây
 * Key pattern: cache:{method}:{url}
 *
 * Chạy: node 02-cache-middleware.js
 */

const express = require('express');
const Redis = require('ioredis');

const app = express();
app.use(express.json());

// Kết nối Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
  lazyConnect: true,
});

redis.on('error', (err) => console.error('Redis error:', err.message));

// === CACHE MIDDLEWARE ===

/**
 * Tạo cache middleware với TTL tùy chỉnh
 * @param {number} ttlSeconds - Thời gian cache (giây)
 * @param {Function} keyFn - Hàm tạo cache key (optional)
 */
function cacheMiddleware(ttlSeconds = 60, keyFn = null) {
  return async (req, res, next) => {
    // Chỉ cache GET requests
    if (req.method !== 'GET') return next();

    // Tạo cache key
    const cacheKey = keyFn
      ? keyFn(req)
      : `cache:${req.method}:${req.originalUrl}`;

    try {
      // Kiểm tra cache có data không
      const cached = await redis.get(cacheKey);

      if (cached) {
        // Cache HIT: trả về data đã cache
        const data = JSON.parse(cached);
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        return res.json(data);
      }

      // Cache MISS: lưu lại res.json gốc
      res.set('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);

      // Override res.json để cache response trước khi gửi
      res.json = async (body) => {
        // Chỉ cache response thành công (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await redis.setex(cacheKey, ttlSeconds, JSON.stringify(body));
          res.set('X-Cache-TTL', ttlSeconds.toString());
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      // Lỗi Redis thì vẫn cho request đi qua (fail open)
      console.error('Cache middleware lỗi:', err.message);
      next();
    }
  };
}

// Middleware xóa cache theo pattern (dùng sau khi thay đổi data)
async function invalidateCache(pattern) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
    console.log(`Xóa ${keys.length} cache keys: ${pattern}`);
  }
  return keys.length;
}

// === GIẢ LẬP DATABASE ===
const products = [
  { id: 1, name: 'Laptop Dell XPS', price: 25000000, category: 'laptop', stock: 50 },
  { id: 2, name: 'iPhone 15 Pro', price: 32000000, category: 'phone', stock: 30 },
  { id: 3, name: 'Tai nghe Sony WH', price: 4500000, category: 'audio', stock: 100 },
  { id: 4, name: 'iPad Air M2', price: 18000000, category: 'tablet', stock: 45 },
  { id: 5, name: 'Mouse Logitech MX', price: 2800000, category: 'accessory', stock: 200 },
];

// Giả lập delay DB query
function queryDB(filters = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let result = [...products];
      if (filters.category) {
        result = result.filter(p => p.category === filters.category);
      }
      if (filters.maxPrice) {
        result = result.filter(p => p.price <= parseInt(filters.maxPrice));
      }
      resolve(result);
    }, 100); // 100ms delay giống query DB thật
  });
}

// === API ROUTES ===

// GET /api/products — cache 60 giây
// Key: cache:GET:/api/products (có thể có query params)
app.get('/api/products',
  cacheMiddleware(60, (req) => {
    // Cache key bao gồm query params để differentiate filters
    const params = new URLSearchParams(req.query).toString();
    return `cache:products:${params || 'all'}`;
  }),
  async (req, res) => {
    try {
      console.log(`[${new Date().toISOString()}] Query DB cho products...`);
      const data = await queryDB(req.query);

      res.json({
        success: true,
        data,
        meta: { count: data.length, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// GET /api/products/:id — cache 5 phút
app.get('/api/products/:id',
  cacheMiddleware(300),
  async (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));

    if (!product) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' });
    }

    res.json({ success: true, data: product });
  }
);

// POST /api/products — thêm sản phẩm và xóa cache
app.post('/api/products', async (req, res) => {
  const { name, price, category } = req.body;

  if (!name || !price) {
    return res.status(400).json({ success: false, error: 'Thiếu name hoặc price' });
  }

  const newProduct = {
    id: products.length + 1,
    name,
    price,
    category: category || 'other',
    stock: 0,
  };
  products.push(newProduct);

  // Xóa cache products list vì data đã thay đổi
  const deleted = await invalidateCache('cache:products:*');
  console.log(`Thêm sản phẩm mới, xóa ${deleted} cache keys`);

  res.status(201).json({ success: true, data: newProduct });
});

// DELETE /api/cache — xóa toàn bộ cache (admin endpoint)
app.delete('/api/cache', async (req, res) => {
  const deleted = await invalidateCache('cache:*');
  res.json({ success: true, message: `Đã xóa ${deleted} cache entries` });
});

// GET /api/cache/stats — thống kê cache
app.get('/api/cache/stats', async (req, res) => {
  const info = await redis.info('memory');
  const keys = await redis.dbsize();
  const memMatch = info.match(/used_memory_human:(\S+)/);

  res.json({
    success: true,
    data: {
      totalKeys: keys,
      memoryUsed: memMatch ? memMatch[1] : 'unknown',
    },
  });
});

// Start server
async function startServer() {
  try {
    await redis.connect();

    app.listen(3001, () => {
      console.log('Server chạy tại http://localhost:3001');
      console.log('\nThử nghiệm:');
      console.log('  curl http://localhost:3001/api/products');
      console.log('  curl http://localhost:3001/api/products?category=laptop');
      console.log('  curl http://localhost:3001/api/products/1');
      console.log('  # Request 2: header X-Cache: HIT');
    });
  } catch (err) {
    console.error('Lỗi khởi động:', err.message);
  }
}

startServer();

module.exports = { app, redis, cacheMiddleware, invalidateCache };
