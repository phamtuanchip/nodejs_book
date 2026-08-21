// Demo jsonwebtoken: sign, verify, decode
// Access token (15 phút) + Refresh token (7 ngày)
// Chạy: node 02-jwt-demo.js  (cần: npm install jsonwebtoken)

const jwt = require('jsonwebtoken');

// Secrets — trong thực tế lưu trong biến môi trường .env
const ACCESS_SECRET = 'access_secret_key_do_not_commit';
const REFRESH_SECRET = 'refresh_secret_key_do_not_commit';

// ── 1. Tạo token pair ──────────────────────────────────────────────
function createTokens(user) {
  // Access token: ngắn hạn, dùng để xác thực API
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: '15m', issuer: 'nodejs-book' }
  );

  // Refresh token: dài hạn, dùng để lấy access token mới
  const refreshToken = jwt.sign(
    { sub: user.id },          // payload tối giản
    REFRESH_SECRET,
    { expiresIn: '7d', issuer: 'nodejs-book' }
  );

  return { accessToken, refreshToken };
}

// ── 2. Verify access token ─────────────────────────────────────────
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET, { issuer: 'nodejs-book' });
}

// ── 3. Decode không verify (chỉ đọc payload) ──────────────────────
function decodeToken(token) {
  return jwt.decode(token, { complete: true }); // trả header + payload + signature
}

// ── 4. Middleware Express xác thực JWT ────────────────────────────
const verifyTokenMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Thiếu Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload; // gắn thông tin user vào request
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token đã hết hạn', code: 'TOKEN_EXPIRED' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token không hợp lệ', code: 'INVALID_TOKEN' });
    }
    next(err);
  }
};

// ── Demo chạy standalone ──────────────────────────────────────────
(async () => {
  console.log('=== Demo JSON Web Token ===\n');

  const user = { id: 'user_123', email: 'alice@example.com', role: 'admin' };

  // Tạo tokens
  const { accessToken, refreshToken } = createTokens(user);
  console.log('Access Token:\n', accessToken);
  console.log('\nRefresh Token:\n', refreshToken);

  // Decode để xem cấu trúc
  console.log('\n── Decoded Access Token ──');
  const decoded = decodeToken(accessToken);
  console.log('Header:', decoded.header);
  console.log('Payload:', decoded.payload);

  // Verify hợp lệ
  console.log('\n── Verify Access Token ──');
  try {
    const payload = verifyAccessToken(accessToken);
    console.log('Hợp lệ! Payload:', payload);
  } catch (err) {
    console.error('Lỗi:', err.message);
  }

  // Verify token giả mạo
  console.log('\n── Verify Token Giả Mạo ──');
  try {
    verifyAccessToken(accessToken + 'tampered');
  } catch (err) {
    console.log('Bị bắt:', err.name, '-', err.message);
  }

  // Verify token hết hạn (tạo token expire ngay)
  console.log('\n── Verify Token Hết Hạn ──');
  const expiredToken = jwt.sign({ sub: 'x' }, ACCESS_SECRET, { expiresIn: '1ms' });
  await new Promise((r) => setTimeout(r, 10)); // đợi hết hạn
  try {
    verifyAccessToken(expiredToken);
  } catch (err) {
    console.log('Bị bắt:', err.name, '-', err.message);
  }

  console.log('\nverifyTokenMiddleware đã export — dùng trong Express app');
})();

module.exports = { createTokens, verifyAccessToken, verifyTokenMiddleware };
