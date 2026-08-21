// Middleware xác thực JWT — tái sử dụng trong Express app
// Gắn req.user = payload nếu token hợp lệ

const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_key_change_in_production';

/**
 * verifyToken — bảo vệ routes yêu cầu đăng nhập
 * Dùng: router.get('/me', verifyToken, handler)
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      error: 'Chưa xác thực',
      message: 'Thiếu Authorization header'
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Định dạng sai',
      message: 'Authorization phải có dạng: Bearer <token>'
    });
  }

  const token = authHeader.slice(7); // bỏ "Bearer "

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token hết hạn',
        code: 'TOKEN_EXPIRED',
        message: 'Vui lòng đăng nhập lại hoặc dùng refresh token'
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token không hợp lệ',
        code: 'INVALID_TOKEN'
      });
    }
    next(err); // lỗi không xác định — chuyển cho error handler
  }
};

/**
 * requireRole — phân quyền theo role (dùng SAU verifyToken)
 * Dùng: router.delete('/users/:id', verifyToken, requireRole('admin'), handler)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Chưa xác thực' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Không có quyền',
        message: `Route này yêu cầu role: ${roles.join(' hoặc ')}`
      });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };
