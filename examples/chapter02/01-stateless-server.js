// Server stateless: mỗi request hoàn toàn độc lập, không lưu bất kỳ state nào
// Cần: npm install express
// Chạy: node 01-stateless-server.js
// Test: curl http://localhost:3000/api/counter (luôn trả về 1)
const express = require('express');
const app = express();
const PORT = 3000;

// Biến này trong module-scope nhưng KHÔNG được truyền giữa requests
// Đây là ví dụ minh họa — server stateless THỰC SỰ sẽ đọc từ DB
let requestCount = 0;

// Route stateless: không dùng biến ngoài, chỉ tính từ request
app.get('/api/counter', (req, res) => {
  // Mỗi request tự tính, không phụ thuộc request trước
  const result = { count: 1, message: 'Luôn trả về 1 vì không lưu state' };
  console.log(`[${new Date().toISOString()}] GET /api/counter`);
  res.json(result);
});

// Route stateless khác: xử lý dữ liệu từ request, không dùng state ngoài
app.get('/api/greet', (req, res) => {
  const name = req.query.name || 'World';
  // Kết quả chỉ phụ thuộc vào INPUT, không phụ thuộc lịch sử
  res.json({ message: `Hello, ${name}!`, timestamp: Date.now() });
});

// So sánh: route STATEFUL (anti-pattern cho stateless server)
app.get('/api/counter-stateful', (req, res) => {
  requestCount++; // GHI NHỚ state → không còn stateless!
  console.log(`[STATEFUL] Request #${requestCount}`);
  res.json({ count: requestCount, warning: 'Đây là stateful — count tăng mỗi request' });
});

app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
  console.log('Thử:');
  console.log(`  GET http://localhost:${PORT}/api/counter`);
  console.log(`  GET http://localhost:${PORT}/api/greet?name=Alice`);
  console.log(`  GET http://localhost:${PORT}/api/counter-stateful`);
});
