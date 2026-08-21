// Middleware ghi log mỗi request: method, url, status, thời gian xử lý, IP
// Sử dụng: app.use(requestLogger)

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  // Ghi lại khi response kết thúc
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();

    // Chọn màu theo status code
    const status = res.statusCode;
    let color = '\x1b[32m'; // xanh lá = 2xx
    if (status >= 400) color = '\x1b[33m'; // vàng = 4xx
    if (status >= 500) color = '\x1b[31m'; // đỏ = 5xx
    const reset = '\x1b[0m';

    console.log(
      `${color}[${timestamp}] ${req.method} ${req.originalUrl} ${status} ${duration}ms — IP: ${ip}${reset}`
    );
  });

  next();
};

module.exports = requestLogger;
