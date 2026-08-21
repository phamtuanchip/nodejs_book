// Express app mẫu để demo deploy lên production
// Chạy: node app.js
// Health check: GET /health
// Dữ liệu mẫu: GET /api/items

'use strict';

const express = require('express');
const config = require('./config');

const app = express();

// Middleware parse JSON body
app.use(express.json());

// Middleware ghi log request đơn giản
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.url} ${res.statusCode} - ${ms}ms`);
  });
  next();
});

// Health check endpoint — load balancer và orchestrator dùng để kiểm tra app còn sống
app.get('/health', (req, res) => {
  const memoryMB = process.memoryUsage().rss / 1024 / 1024;

  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),       // giây app đã chạy
    memory: `${memoryMB.toFixed(1)} MB`,        // RAM đang dùng
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Endpoint trả dữ liệu mẫu — thay bằng DB query thực tế
app.get('/api/items', (req, res) => {
  const items = [
    { id: 1, name: 'Sản phẩm A', price: 100000, inStock: true },
    { id: 2, name: 'Sản phẩm B', price: 250000, inStock: true },
    { id: 3, name: 'Sản phẩm C', price: 75000,  inStock: false },
  ];

  res.json({
    success: true,
    count: items.length,
    data: items,
  });
});

// Endpoint lấy item theo id
app.get('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 1 || id > 3) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy item' });
  }
  res.json({ success: true, data: { id, name: `Sản phẩm ${String.fromCharCode(64 + id)}` } });
});

// Xử lý 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route không tồn tại' });
});

// Xử lý lỗi toàn cục
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
});

// Khởi động server
const server = app.listen(config.PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${config.PORT}`);
  console.log(`Môi trường: ${config.NODE_ENV}`);
});

// Graceful shutdown — đóng kết nối sạch khi nhận tín hiệu SIGTERM (từ Docker/PM2)
process.on('SIGTERM', () => {
  console.log('Nhận SIGTERM, đang tắt server...');
  server.close(() => {
    console.log('Server đã tắt');
    process.exit(0);
  });
});

module.exports = app; // export để test
