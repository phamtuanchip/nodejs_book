// Global error handler middleware — phải có 4 tham số (err, req, res, next)
// Phân biệt operational error (lỗi dự đoán được) vs programming error (bug)
// Trả response chi tiết khi dev, ẩn chi tiết khi production

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Tạo operational error có statusCode
 * Dùng khi muốn throw lỗi có kiểm soát từ route/service
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // đánh dấu đây là lỗi "biết trước"
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error handler — đăng ký CUỐI CÙNG: app.use(errorHandler)
 */
const errorHandler = (err, req, res, next) => {
  // Nếu response đã bắt đầu gửi, chuyển cho Express mặc định xử lý
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const isOperational = err.isOperational === true;

  // Log lỗi ra console (production chỉ log 500)
  if (statusCode >= 500 || isDev) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`, {
      message: err.message,
      stack: isDev ? err.stack : undefined
    });
  }

  // Response cho client
  const response = {
    error: isOperational ? err.message : 'Lỗi máy chủ nội bộ',
    statusCode
  };

  // Trong môi trường dev: trả thêm stack trace để debug
  if (isDev) {
    response.stack = err.stack;
    response.type = isOperational ? 'OperationalError' : 'ProgrammingError';
  }

  res.status(statusCode).json(response);
};

module.exports = { errorHandler, AppError };
