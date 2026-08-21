/**
 * Chương 14: Express Session Store dùng Redis
 * Session persist qua server restart
 *
 * Cài đặt: npm install express express-session connect-redis ioredis
 * Chạy: node 04-session-store.js
 */

const express = require('express');
const session = require('express-session');
const { createClient } = require('redis');
const { RedisStore } = require('connect-redis');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kết nối Redis (dùng redis client thay vì ioredis để tương thích với connect-redis v7)
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:6379`,
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis kết nối cho session store'));

// Cấu hình Session với Redis Store
app.use(session({
  // Redis store để lưu session
  store: new RedisStore({
    client: redisClient,
    prefix: 'sess:', // prefix của session keys trong Redis
    ttl: 86400,      // Session tồn tại 24 giờ (giây)
  }),

  // Secret để ký session cookie (dùng biến môi trường trong production!)
  secret: process.env.SESSION_SECRET || 'nodejs-book-secret-key-change-in-prod',

  // Không lưu session nếu không thay đổi
  resave: false,

  // Không lưu session mới khi chưa có gì
  saveUninitialized: false,

  cookie: {
    // httpOnly: cookie không accessible từ JavaScript (bảo mật)
    httpOnly: true,
    // secure: chỉ gửi qua HTTPS (bật trong production)
    secure: process.env.NODE_ENV === 'production',
    // maxAge: 24 giờ (ms)
    maxAge: 24 * 60 * 60 * 1000,
    // sameSite: bảo vệ CSRF
    sameSite: 'lax',
  },

  // Tên cookie (mặc định: connect.sid)
  name: 'sessionId',
}));

// === MIDDLEWARE KIỂM TRA AUTH ===
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Chưa đăng nhập',
      redirect: '/login',
    });
  }
  next();
}

// === GIẢ LẬP USER DB ===
const users = [
  { id: 1, email: 'alice@example.com', password: 'password123', name: 'Alice', role: 'admin' },
  { id: 2, email: 'bob@example.com', password: 'password456', name: 'Bob', role: 'user' },
];

// === ROUTES ===

// Đăng nhập
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Tìm user (trong thực tế: query DB + so sánh bcrypt hash)
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Sai email hoặc mật khẩu' });
  }

  // Lưu thông tin vào session
  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.name = user.name;
  req.session.role = user.role;
  req.session.loginAt = new Date().toISOString();

  // Session ID sẽ được gửi qua cookie tự động
  res.json({
    success: true,
    message: `Chào mừng ${user.name}!`,
    sessionId: req.sessionID,
    user: { id: user.id, name: user.name, role: user.role },
  });
});

// Đăng xuất
app.post('/api/auth/logout', (req, res) => {
  const name = req.session.name || 'Guest';

  // Xóa session khỏi Redis và cookie
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Lỗi khi đăng xuất' });
    }

    // Xóa cookie phía client
    res.clearCookie('sessionId');
    res.json({ success: true, message: `Tạm biệt ${name}!` });
  });
});

// Xem thông tin session hiện tại
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.session.userId,
      email: req.session.email,
      name: req.session.name,
      role: req.session.role,
      loginAt: req.session.loginAt,
      sessionId: req.sessionID,
    },
  });
});

// Cập nhật dữ liệu trong session (giỏ hàng)
app.post('/api/cart/add', requireAuth, (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({ success: false, error: 'Thiếu productId' });
  }

  // Khởi tạo giỏ hàng trong session nếu chưa có
  if (!req.session.cart) {
    req.session.cart = {};
  }

  // Thêm/cộng dồn số lượng
  req.session.cart[productId] = (req.session.cart[productId] || 0) + quantity;

  res.json({
    success: true,
    cart: req.session.cart,
    message: `Thêm ${quantity} sản phẩm ${productId} vào giỏ`,
  });
});

// Xem giỏ hàng từ session
app.get('/api/cart', requireAuth, (req, res) => {
  res.json({
    success: true,
    cart: req.session.cart || {},
    total: Object.values(req.session.cart || {}).reduce((sum, qty) => sum + qty, 0),
  });
});

// Xóa giỏ hàng
app.delete('/api/cart', requireAuth, (req, res) => {
  req.session.cart = {};
  res.json({ success: true, message: 'Đã xóa giỏ hàng' });
});

// Admin: xem tất cả sessions trong Redis
app.get('/api/admin/sessions', requireAuth, async (req, res) => {
  if (req.session.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Chỉ admin mới xem được' });
  }

  const keys = await redisClient.keys('sess:*');
  const sessions = [];

  for (const key of keys.slice(0, 20)) { // giới hạn 20
    const data = await redisClient.get(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        sessions.push({
          key,
          userId: parsed.userId,
          email: parsed.email,
          loginAt: parsed.loginAt,
        });
      } catch {}
    }
  }

  res.json({ success: true, data: sessions, total: keys.length });
});

// Gia hạn session
app.post('/api/auth/refresh', requireAuth, (req, res) => {
  // Touch session để gia hạn TTL
  req.session.lastActivity = new Date().toISOString();

  req.session.save((err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Session đã được gia hạn' });
  });
});

// Start server
async function startServer() {
  try {
    await redisClient.connect();

    app.listen(3003, () => {
      console.log('Session store server chạy tại http://localhost:3003');
      console.log('\nThử nghiệm:');
      console.log('  # Đăng nhập:');
      console.log('  curl -c cookies.txt -X POST http://localhost:3003/api/auth/login \\');
      console.log('       -H "Content-Type: application/json" \\');
      console.log('       -d \'{"email":"alice@example.com","password":"password123"}\'');
      console.log('\n  # Xem thông tin (dùng cookie đã lưu):');
      console.log('  curl -b cookies.txt http://localhost:3003/api/auth/me');
      console.log('\n  # Thêm giỏ hàng:');
      console.log('  curl -b cookies.txt -c cookies.txt -X POST http://localhost:3003/api/cart/add \\');
      console.log('       -H "Content-Type: application/json" -d \'{"productId":"laptop-1","quantity":2}\'');
    });
  } catch (err) {
    console.error('Lỗi:', err.message);
  }
}

startServer();
