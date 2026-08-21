/**
 * Chương 15: REST API Best Practices
 * Versioning (/api/v1/), proper HTTP methods
 * Content negotiation, CORS, security headers
 *
 * Chạy: node app.js
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const productsRouter = require('./routes/v1/products');
const { error } = require('./utils/api-response');

const app = express();

// === SECURITY HEADERS ===
// helmet tự động thêm các security headers
app.use(helmet({
  contentSecurityPolicy: false, // tắt CSP cho API thuần JSON
}));

// === CORS ===
const corsOptions = {
  // Cho phép domain cụ thể (thay thế * trong production)
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'],

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Header được phép gửi
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],

  // Header được expose cho client đọc
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Remaining', 'Location'],

  // Cho phép gửi cookie trong CORS request
  credentials: true,

  // Cache preflight OPTIONS request 10 phút
  maxAge: 600,
};

app.use(cors(corsOptions));

// Parse JSON body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// === REQUEST ID MIDDLEWARE ===
// Thêm unique ID vào mỗi request để trace log
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  req.requestId = requestId;
  res.set('X-Request-ID', requestId);
  next();
});

// === REQUEST LOGGER ===
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
    console.log(`${color}[${req.method}] ${req.originalUrl} ${status} ${duration}ms\x1b[0m`);
  });

  next();
});

// === CONTENT NEGOTIATION ===
// API chỉ trả JSON, từ chối các Accept header khác
app.use('/api', (req, res, next) => {
  const accept = req.headers['accept'];

  // Chỉ từ chối khi client explicitly yêu cầu non-JSON
  if (accept && !accept.includes('application/json') && !accept.includes('*/*') && !accept.includes('text/')) {
    return res.status(406).json(
      error('API chỉ hỗ trợ application/json', 'NOT_ACCEPTABLE')
    );
  }

  // Đặt Content-Type cho tất cả response của API
  res.set('Content-Type', 'application/json; charset=utf-8');
  next();
});

// === ROUTES ===

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
  });
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    name: 'NodeJS Book REST API',
    version: '1.0.0',
    versions: {
      v1: {
        status: 'stable',
        base: '/api/v1',
        endpoints: {
          products: '/api/v1/products',
        },
      },
    },
  });
});

// V1 Routes
app.use('/api/v1/products', productsRouter);

// === 404 HANDLER ===
app.use((req, res) => {
  res.status(404).json(
    error(`Route ${req.method} ${req.path} không tồn tại`, 'NOT_FOUND')
  );
});

// === GLOBAL ERROR HANDLER ===
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.requestId}:`, err);

  // Xử lý lỗi parse JSON (body không hợp lệ)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json(error('JSON không hợp lệ', 'INVALID_JSON'));
  }

  // Lỗi payload quá lớn
  if (err.type === 'entity.too.large') {
    return res.status(413).json(error('Request body quá lớn', 'PAYLOAD_TOO_LARGE'));
  }

  // Lỗi không xác định: không leak stack trace ra production
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Lỗi máy chủ nội bộ'
    : err.message;

  res.status(statusCode).json(error(message, 'INTERNAL_ERROR'));
});

// === START SERVER ===
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\nREST API Server chạy tại http://localhost:${PORT}`);
  console.log('\nEndpoints:');
  console.log('  GET    /health                          — Health check');
  console.log('  GET    /api                             — API info');
  console.log('  GET    /api/v1/products                 — Danh sách (filter/sort/page)');
  console.log('  GET    /api/v1/products/:id             — Chi tiết');
  console.log('  POST   /api/v1/products                 — Tạo mới');
  console.log('  PUT    /api/v1/products/:id             — Cập nhật toàn bộ');
  console.log('  PATCH  /api/v1/products/:id             — Cập nhật một phần');
  console.log('  DELETE /api/v1/products/:id             — Xóa');
  console.log('  GET    /api/v1/products/categories/summary — Thống kê');
  console.log('\nVí dụ:');
  console.log('  curl http://localhost:3000/api/v1/products?page=1&limit=3&sort=price&order=desc');
  console.log('  curl http://localhost:3000/api/v1/products?category=laptop&search=dell');
  console.log('  curl -X POST http://localhost:3000/api/v1/products \\');
  console.log('       -H "Content-Type: application/json" \\');
  console.log('       -d \'{"name":"Test Product","price":1000000,"category":"other"}\'');
});

module.exports = app;
