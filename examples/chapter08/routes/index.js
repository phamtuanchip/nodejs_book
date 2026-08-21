/**
 * Routes chính: trang chủ và các trang tĩnh
 */

const express = require('express');
const router = express.Router();

// GET / - Trang chủ
router.get('/', (req, res) => {
  // res.render dùng template engine (nếu có), ở đây dùng JSON đơn giản
  res.json({
    message: 'Chào mừng đến với Express.js API!',
    version: '1.0.0',
    endpoints: {
      home: 'GET /',
      about: 'GET /about',
      users: 'GET /api/users',
      userById: 'GET /api/users/:id',
      createUser: 'POST /api/users',
      updateUser: 'PUT /api/users/:id',
      deleteUser: 'DELETE /api/users/:id',
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /about
router.get('/about', (req, res) => {
  res.json({
    name: 'Express.js Demo App',
    description: 'Ví dụ Express.js từ sách Node.js tiếng Việt',
    chapter: 8,
    author: 'Node.js Book VN',
    tech: ['Node.js', 'Express.js', 'REST API'],
  });
});

// GET /health - health check endpoint (dùng cho Docker, load balancer)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
