/**
 * Custom logger middleware
 * Log: method, URL, status code, thời gian xử lý, IP
 */

const logger = (req, res, next) => {
  const startTime = Date.now();

  // Ghi đè res.end để bắt status code sau khi response gửi đi
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const ip = req.ip || req.connection.remoteAddress || '-';

    // Màu theo HTTP status
    let colorCode;
    if (status >= 500) colorCode = '\x1b[31m'; // đỏ - server error
    else if (status >= 400) colorCode = '\x1b[33m'; // vàng - client error
    else if (status >= 300) colorCode = '\x1b[36m'; // cyan - redirect
    else colorCode = '\x1b[32m'; // xanh - success
    const reset = '\x1b[0m';

    const timestamp = new Date().toLocaleTimeString('vi-VN');
    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} ${colorCode}${status}${reset} ${duration}ms - ${ip}`
    );

    // Gọi hàm end gốc
    return originalEnd.apply(res, args);
  };

  next(); // chuyển tiếp cho middleware/route tiếp theo
};

// Logger tạo request ID để trace (useful cho debugging)
const requestId = (req, res, next) => {
  req.id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  res.setHeader('X-Request-Id', req.id);
  next();
};

module.exports = { logger, requestId };
