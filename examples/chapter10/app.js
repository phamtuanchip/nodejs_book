// Express app — đầy đủ auth flow với JWT
// Chạy: node app.js  (cần: npm install express bcrypt jsonwebtoken cookie-parser)
//
// Routes:
//   POST /auth/register  — đăng ký (hash password, lưu in-memory)
//   POST /auth/login     — đăng nhập (verify password, trả token)
//   GET  /api/me         — xem thông tin bản thân (cần token)
//   POST /auth/refresh   — lấy access token mới từ refresh token
//   POST /auth/logout    — xóa refresh token

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { verifyToken, requireRole } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3010;

// Config
const SALT_ROUNDS = 12;
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_key_change_in_production';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_key_change_in_production';
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';

// In-memory stores (thay bằng database trong thực tế)
const users = new Map();          // email -> user object
const refreshTokens = new Set();  // danh sách refresh tokens hợp lệ

app.use(express.json());
app.use(cookieParser());

// ── Helper: tạo token pair ─────────────────────────────────────────
function generateTokens(user) {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );
  const refreshToken = jwt.sign(
    { sub: user.id },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  );
  return { accessToken, refreshToken };
}

// ── POST /auth/register ───────────────────────────────────────────
app.post('/auth/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate đơn giản
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Thiếu name, email hoặc password' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password phải có ít nhất 8 ký tự' });
    }
    if (users.has(email)) {
      return res.status(409).json({ error: 'Email đã được đăng ký' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Lưu user
    const user = {
      id: `user_${Date.now()}`,
      name,
      email,
      password: hashedPassword, // KHÔNG bao giờ lưu plain text
      role: 'user',
      createdAt: new Date().toISOString()
    };
    users.set(email, user);

    // Tạo tokens ngay sau đăng ký
    const { accessToken, refreshToken } = generateTokens(user);
    refreshTokens.add(refreshToken);

    res.status(201).json({
      message: 'Đăng ký thành công',
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/login ──────────────────────────────────────────────
app.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Thiếu email hoặc password' });
    }

    const user = users.get(email);
    if (!user) {
      // Không tiết lộ email có tồn tại hay không
      return res.status(401).json({ error: 'Email hoặc password không đúng' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Email hoặc password không đúng' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    refreshTokens.add(refreshToken);

    // Có thể set refresh token vào httpOnly cookie để bảo mật hơn
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
    });

    res.json({
      message: 'Đăng nhập thành công',
      accessToken,
      refreshToken, // cũng trả trong body để client mobile dùng
      expiresIn: ACCESS_EXPIRES
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/me — protected route ─────────────────────────────────
app.get('/api/me', verifyToken, (req, res) => {
  // req.user được gắn bởi verifyToken middleware
  const user = users.get(req.user.email);
  if (!user) {
    return res.status(404).json({ error: 'User không tồn tại' });
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  });
});

// ── POST /auth/refresh — lấy access token mới ─────────────────────
app.post('/auth/refresh', (req, res) => {
  // Lấy từ body hoặc cookie
  const token = req.body.refreshToken || req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ error: 'Thiếu refresh token' });
  }

  if (!refreshTokens.has(token)) {
    return res.status(401).json({ error: 'Refresh token không hợp lệ hoặc đã bị thu hồi' });
  }

  try {
    const payload = jwt.verify(token, REFRESH_SECRET);

    // Tìm user
    const user = [...users.values()].find((u) => u.id === payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User không tồn tại' });
    }

    // Tạo access token mới
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      ACCESS_SECRET,
      { expiresIn: ACCESS_EXPIRES }
    );

    res.json({ accessToken, expiresIn: ACCESS_EXPIRES });
  } catch (err) {
    refreshTokens.delete(token); // thu hồi token không hợp lệ
    return res.status(401).json({ error: 'Refresh token không hợp lệ hoặc hết hạn' });
  }
});

// ── POST /auth/logout ─────────────────────────────────────────────
app.post('/auth/logout', (req, res) => {
  const token = req.body.refreshToken || req.cookies.refreshToken;
  if (token) {
    refreshTokens.delete(token); // thu hồi refresh token
  }
  res.clearCookie('refreshToken');
  res.json({ message: 'Đăng xuất thành công' });
});

// ── Route demo phân quyền ─────────────────────────────────────────
app.get('/api/admin', verifyToken, requireRole('admin'), (req, res) => {
  res.json({ message: 'Trang admin — chỉ role admin mới thấy được' });
});

// ── Error handler đơn giản ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Lỗi máy chủ' });
});

app.listen(PORT, () => {
  console.log(`[Ch10] Auth server chạy tại http://localhost:${PORT}`);
  console.log('Test với curl:');
  console.log(`  curl -X POST http://localhost:${PORT}/auth/register \\`);
  console.log(`    -H 'Content-Type: application/json' \\`);
  console.log(`    -d '{"name":"Alice","email":"alice@example.com","password":"pass1234"}'`);
});

module.exports = app;
