// Express app demo các middleware patterns — Chương 09
// Chạy: node app.js  (cần: npm install express)

const express = require('express');
const requestLogger = require('./middleware/request-logger');
const rateLimiter = require('./middleware/rate-limiter');
const validateBody = require('./middleware/validate-body');
const { errorHandler, AppError } = require('./middleware/error-handler');
const notFound = require('./middleware/not-found');

const app = express();
const PORT = process.env.PORT || 3009;

// ── Middleware toàn cục ─────────────────────────────────────────
app.use(express.json());           // parse JSON body
app.use(express.urlencoded({ extended: true })); // parse form data
app.use(requestLogger);            // log mọi request
app.use(rateLimiter);              // giới hạn 100 req/phút/IP

// ── Routes demo ─────────────────────────────────────────────────

// Route đơn giản — không cần body
app.get('/', (req, res) => {
  res.json({
    message: 'Chào mừng đến Chương 09 — Middleware & Error Handling',
    endpoints: [
      'GET  /',
      'POST /api/users  (cần: name, email)',
      'GET  /api/slow   (demo timeout)',
      'GET  /api/error  (demo 500)',
      'GET  /api/not-operational (demo programming error)'
    ]
  });
});

// Route có validation body
app.post(
  '/api/users',
  validateBody(['name', 'email']), // middleware validate trước
  (req, res) => {
    const { name, email } = req.body;
    res.status(201).json({
      message: 'Tạo user thành công',
      user: { id: Date.now(), name, email }
    });
  }
);

// Demo route chậm — simulate I/O
app.get('/api/slow', async (req, res, next) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    res.json({ message: 'Xử lý xong sau 1.2 giây' });
  } catch (err) {
    next(err);
  }
});

// Demo operational error (lỗi biết trước — trả message cho client)
app.get('/api/error', (req, res, next) => {
  next(new AppError('Tài nguyên này tạm thời không khả dụng', 503));
});

// Demo programming error (bug — ẩn chi tiết với client)
app.get('/api/not-operational', (req, res, next) => {
  // Đây là bug: truy cập property của undefined
  try {
    const obj = null;
    obj.nonExistent; // TypeError
  } catch (err) {
    // err.isOperational = false => error handler trả "Lỗi máy chủ nội bộ"
    next(err);
  }
});

// Demo async error với try/catch + next
app.get('/api/async-error', async (req, res, next) => {
  try {
    await Promise.reject(new AppError('Lỗi async có kiểm soát', 422));
  } catch (err) {
    next(err);
  }
});

// ── 404 & Error handlers (phải đặt CUỐI) ─────────────────────────
app.use(notFound);       // bắt routes không tồn tại
app.use(errorHandler);   // xử lý tất cả errors

// ── Khởi động server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Ch09] Server chạy tại http://localhost:${PORT}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
