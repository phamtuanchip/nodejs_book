/**
 * Chương 08 - Express.js Application
 * App đầy đủ: middleware, routing, error handling
 * Chạy: node app.js  hoặc  npm run dev
 * Truy cập: http://localhost:3000
 *
 * Test nhanh:
 *   curl http://localhost:3000/
 *   curl http://localhost:3000/api/users
 *   curl -X POST http://localhost:3000/api/users \
 *     -H "Content-Type: application/json" \
 *     -d '{"name":"Test User","email":"test@example.com"}'
 */

const express = require('express');
const path = require('path');
const { logger, requestId } = require('./middleware/logger');
const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware toàn app (thứ tự quan trọng!) ────────────────────────────────

// 1. Request ID - đặt đầu tiên để mọi log đều có thể dùng
app.use(requestId);

// 2. Logger - log tất cả requests
app.use(logger);

// 3. Parse body - phải có trước routes dùng req.body
app.use(express.json({ limit: '1mb' }));           // parse JSON body
app.use(express.urlencoded({ extended: true }));    // parse form data

// 4. Security headers cơ bản (production nên dùng helmet package)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.removeHeader('X-Powered-By'); // ẩn Express fingerprint
  next();
});

// 5. CORS đơn giản (production dùng cors package với cấu hình cụ thể)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204); // preflight request
  next();
});

// 6. Static files - phục vụ file tĩnh từ thư mục public/
app.use(express.static(path.join(__dirname, 'public')));

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/', indexRouter);       // Trang chủ, about, health
app.use('/api', apiRouter);      // /api/users, /api/stats

// ─── 404 Handler - route không tìm thấy ─────────────────────────────────────

// Đặt SAU tất cả routes để catch các route không match
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} không tồn tại`,
    availableRoutes: ['GET /', 'GET /about', 'GET /health', 'GET /api/users', 'POST /api/users'],
  });
});

// ─── Error Handler - xử lý lỗi từ middleware/routes ─────────────────────────

// Express nhận biết error handler qua 4 tham số (err, req, res, next)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Log lỗi server-side
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Không lộ stack trace ra client trong production
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : err.name || 'Error',
    message: statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Đã xảy ra lỗi, vui lòng thử lại sau'
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Khởi động server ─────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`\n✓ Express server đang chạy tại http://localhost:${PORT}`);
  console.log(`  Môi trường: ${process.env.NODE_ENV || 'development'}`);
  console.log('\nEndpoints:');
  console.log(`  GET  http://localhost:${PORT}/`);
  console.log(`  GET  http://localhost:${PORT}/about`);
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  GET  http://localhost:${PORT}/api/users`);
  console.log(`  POST http://localhost:${PORT}/api/users`);
  console.log(`  GET  http://localhost:${PORT}/api/stats`);
  console.log('\nCtrl+C để dừng\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM nhận được, đang shutdown...');
  server.close(() => {
    console.log('✓ Server đã đóng');
    process.exit(0);
  });
});

module.exports = app; // export để dùng trong tests
