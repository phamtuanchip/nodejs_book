// Demo server-side session: đếm số lần visit per user, lưu trên server
// Cần: npm install express express-session
// Chạy: node 03-session-server.js
// Test: mở nhiều tab, dùng incognito để thấy session riêng biệt
const express = require('express');
const session = require('express-session');
const app = express();
const PORT = 3000;

app.use(express.json());

// Cấu hình session middleware
app.use(session({
  secret: 'my-super-secret-key-change-this-in-production',
  resave: false,           // Không lưu lại nếu session không thay đổi
  saveUninitialized: false, // Không tạo session cho request chưa cần
  cookie: {
    maxAge: 30 * 60 * 1000, // Session hết hạn sau 30 phút không hoạt động
    httpOnly: true,
  },
}));

// Trang chủ: đếm visit, lưu vào session
app.get('/', (req, res) => {
  // req.session là object, lưu trên server, client chỉ có session ID qua cookie
  if (!req.session.visits) {
    req.session.visits = 0;
    req.session.firstVisit = new Date().toISOString();
  }
  req.session.visits++;
  req.session.lastVisit = new Date().toISOString();

  res.send(`
    <h1>Session Demo</h1>
    <p>Session ID: <code>${req.session.id}</code></p>
    <p>Số lần visit: <strong>${req.session.visits}</strong></p>
    <p>Lần đầu: ${req.session.firstVisit}</p>
    <p>Lần cuối: ${req.session.lastVisit}</p>
    <p><a href="/login">Đăng nhập</a> | <a href="/profile">Profile</a> | <a href="/logout">Đăng xuất</a></p>
  `);
});

// Đăng nhập: lưu thông tin user vào session
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Thực tế phải kiểm tra DB, đây chỉ là demo
  if (username === 'admin' && password === '1234') {
    req.session.user = { id: 1, username, role: 'admin' };
    res.json({ success: true, message: 'Đăng nhập thành công' });
  } else {
    res.status(401).json({ success: false, message: 'Sai username hoặc password' });
  }
});

app.get('/login', (req, res) => {
  res.send(`
    <h2>Login (test: admin / 1234)</h2>
    <form method="POST" action="/login" onsubmit="event.preventDefault();
      fetch('/login', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({username: document.getElementById('u').value, password: document.getElementById('p').value})})
      .then(r=>r.json()).then(d=>alert(JSON.stringify(d)))">
      <input id="u" placeholder="username" value="admin"><br>
      <input id="p" type="password" placeholder="password" value="1234"><br>
      <button type="submit">Login</button>
    </form>
  `);
});

// Middleware kiểm tra đăng nhập
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Chưa đăng nhập' });
  }
  next();
}

// Route cần đăng nhập
app.get('/profile', requireAuth, (req, res) => {
  res.json({ user: req.session.user, visits: req.session.visits });
});

// Đăng xuất: xóa session khỏi server
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Lỗi khi destroy session:', err);
    res.clearCookie('connect.sid'); // Xóa cookie chứa session ID
    res.send('<h1>Đã đăng xuất</h1><a href="/">Quay lại</a>');
  });
});

app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
  console.log('Refresh trang để thấy visit count tăng trong cùng session');
  console.log('Dùng incognito để có session riêng biệt');
});
