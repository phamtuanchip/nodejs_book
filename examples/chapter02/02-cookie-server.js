// Demo cookie: server ghi cookie, browser tự gửi lại trong các request sau
// Cần: npm install express cookie-parser
// Chạy: node 02-cookie-server.js rồi mở http://localhost:3000
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 3000;

// Middleware parse cookie từ header "Cookie: ..."
app.use(cookieParser());

// Trang chủ: set cookie và đọc cookie hiện có
app.get('/', (req, res) => {
  const visits = parseInt(req.cookies.visits || '0') + 1;

  // Set cookie: maxAge tính bằng milliseconds
  res.cookie('visits', visits, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    httpOnly: true,  // JS phía client không đọc được (bảo mật hơn)
  });

  // Set cookie có thể đọc từ JS client
  res.cookie('theme', 'dark', { maxAge: 3600000 });

  res.send(`
    <h1>Cookie Demo</h1>
    <p>Bạn đã thăm trang này <strong>${visits}</strong> lần.</p>
    <p>Cookie được lưu trong browser và gửi lại mỗi request.</p>
    <p><a href="/info">Xem thông tin cookie</a> | <a href="/clear">Xóa cookie</a></p>
  `);
});

// Hiện tất cả cookie đang có
app.get('/info', (req, res) => {
  console.log('Cookies nhận được:', req.cookies);
  res.json({
    message: 'Các cookie hiện có trong request',
    cookies: req.cookies,
  });
});

// Xóa cookie: set maxAge = 0 hoặc dùng res.clearCookie
app.get('/clear', (req, res) => {
  res.clearCookie('visits');
  res.clearCookie('theme');
  res.send('<h1>Đã xóa cookie!</h1><a href="/">Quay lại</a>');
});

app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
  console.log('Mở trình duyệt, refresh nhiều lần để thấy visits tăng');
});
