// Rate limiter đơn giản dùng Map, không cần Redis
// Giới hạn 100 requests mỗi phút mỗi IP

const WINDOW_MS = 60 * 1000; // 1 phút
const MAX_REQUESTS = 100;

// Map lưu { ip -> { count, resetTime } }
const clients = new Map();

// Dọn dẹp các IP hết hạn mỗi 5 phút để tránh rò rỉ bộ nhớ
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of clients.entries()) {
    if (now > data.resetTime) {
      clients.delete(ip);
    }
  }
}, 5 * 60 * 1000);

const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  if (!clients.has(ip)) {
    // IP mới: tạo record
    clients.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  const client = clients.get(ip);

  if (now > client.resetTime) {
    // Cửa sổ thời gian đã hết, reset
    client.count = 1;
    client.resetTime = now + WINDOW_MS;
    return next();
  }

  client.count++;

  if (client.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((client.resetTime - now) / 1000);
    res.set('Retry-After', retryAfter);
    return res.status(429).json({
      error: 'Quá nhiều yêu cầu',
      message: `Vượt quá giới hạn ${MAX_REQUESTS} requests/phút`,
      retryAfter: `${retryAfter} giây`
    });
  }

  // Gắn thông tin rate limit vào headers
  res.set('X-RateLimit-Limit', MAX_REQUESTS);
  res.set('X-RateLimit-Remaining', MAX_REQUESTS - client.count);
  res.set('X-RateLimit-Reset', new Date(client.resetTime).toISOString());

  next();
};

module.exports = rateLimiter;
