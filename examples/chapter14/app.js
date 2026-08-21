/**
 * Chương 14: Express App tích hợp Redis Cache cho API
 * Demo tổng hợp: cache, rate limit, session
 *
 * Chạy: node app.js
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

// === CACHE HELPER ===
const cache = {
  async get(key) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key, value, ttl = 60) {
    await redis.setex(key, ttl, JSON.stringify(value));
  },

  async del(key) {
    await redis.del(key);
  },

  async delPattern(pattern) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
    return keys.length;
  },

  // Wrapper: cache kết quả của hàm async
  async wrap(key, fn, ttl = 60) {
    const cached = await this.get(key);
    if (cached !== null) {
      return { data: cached, fromCache: true };
    }
    const data = await fn();
    await this.set(key, data, ttl);
    return { data, fromCache: false };
  },
};

// === GIẢ LẬP DB ===
let products = [
  { id: 1, name: 'Laptop Dell XPS 13', price: 28000000, category: 'laptop', inStock: true },
  { id: 2, name: 'iPhone 15 Pro Max', price: 35000000, category: 'phone', inStock: true },
  { id: 3, name: 'Sony WH-1000XM5', price: 8500000, category: 'audio', inStock: false },
  { id: 4, name: 'iPad Pro M4', price: 22000000, category: 'tablet', inStock: true },
];

// Giả lập delay query
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// === API ROUTES ===

// GET /api/products — cache 2 phút
app.get('/api/products', async (req, res) => {
  try {
    const { category, inStock } = req.query;
    const cacheKey = `products:list:${category || 'all'}:${inStock || 'all'}`;

    const { data, fromCache } = await cache.wrap(cacheKey, async () => {
      await delay(80); // giả lập DB query

      let result = [...products];
      if (category) result = result.filter(p => p.category === category);
      if (inStock !== undefined) result = result.filter(p => p.inStock === (inStock === 'true'));

      return result;
    }, 120);

    res.set('X-Cache', fromCache ? 'HIT' : 'MISS');
    res.json({
      success: true,
      data,
      meta: { count: data.length, cached: fromCache },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:id — cache 5 phút
app.get('/api/products/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const { data, fromCache } = await cache.wrap(
      `products:${id}`,
      async () => {
        await delay(50);
        return products.find(p => p.id === id) || null;
      },
      300
    );

    if (!data) {
      return res.status(404).json({ success: false, error: `Sản phẩm #${id} không tồn tại` });
    }

    res.set('X-Cache', fromCache ? 'HIT' : 'MISS');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products — tạo mới, xóa cache list
app.post('/api/products', async (req, res) => {
  const { name, price, category } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({
      success: false,
      error: 'Thiếu name, price hoặc category',
    });
  }

  const newProduct = {
    id: Math.max(...products.map(p => p.id)) + 1,
    name,
    price: parseInt(price),
    category,
    inStock: true,
  };

  products.push(newProduct);

  // Xóa cache list để request tiếp theo lấy data mới
  const deleted = await cache.delPattern('products:list:*');
  console.log(`Xóa ${deleted} cache entries sau khi thêm sản phẩm`);

  res.status(201).json({ success: true, data: newProduct });
});

// PUT /api/products/:id — cập nhật, xóa cache liên quan
app.put('/api/products/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: `Sản phẩm #${id} không tồn tại` });
  }

  products[index] = { ...products[index], ...req.body, id };

  // Xóa cache của product cụ thể và toàn bộ list
  await Promise.all([
    cache.del(`products:${id}`),
    cache.delPattern('products:list:*'),
  ]);

  res.json({ success: true, data: products[index] });
});

// DELETE /api/products/:id
app.delete('/api/products/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: `Sản phẩm #${id} không tồn tại` });
  }

  products.splice(index, 1);

  await Promise.all([
    cache.del(`products:${id}`),
    cache.delPattern('products:list:*'),
  ]);

  res.json({ success: true, message: `Đã xóa sản phẩm #${id}` });
});

// GET /api/stats — thống kê (cache 30 giây)
app.get('/api/stats', async (req, res) => {
  const { data, fromCache } = await cache.wrap('stats:summary', async () => {
    await delay(200); // giả lập query nặng

    return {
      totalProducts: products.length,
      byCategory: products.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {}),
      inStock: products.filter(p => p.inStock).length,
      outOfStock: products.filter(p => !p.inStock).length,
      avgPrice: Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length),
    };
  }, 30);

  res.set('X-Cache', fromCache ? 'HIT' : 'MISS');
  res.json({ success: true, data, cached: fromCache });
});

// DELETE /api/cache — xóa toàn bộ cache (admin)
app.delete('/api/cache', async (req, res) => {
  const deleted = await cache.delPattern('*');
  res.json({ success: true, message: `Đã xóa ${deleted} cache entries` });
});

// === START ===
async function startServer() {
  try {
    await redis.connect();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`\nAPI Server chạy tại http://localhost:${PORT}`);
      console.log('\nEndpoints:');
      console.log('  GET    /api/products         — Danh sách (có cache)');
      console.log('  GET    /api/products/:id      — Chi tiết (có cache)');
      console.log('  POST   /api/products          — Thêm mới (xóa cache)');
      console.log('  PUT    /api/products/:id      — Cập nhật (xóa cache)');
      console.log('  DELETE /api/products/:id      — Xóa (xóa cache)');
      console.log('  GET    /api/stats             — Thống kê (cache 30s)');
      console.log('  DELETE /api/cache             — Xóa toàn bộ cache');
      console.log('\nKiểm tra header X-Cache: HIT/MISS để thấy cache hoạt động');
    });
  } catch (err) {
    console.error('Lỗi khởi động server:', err.message);
    process.exit(1);
  }
}

startServer();

module.exports = { app, cache, redis };
