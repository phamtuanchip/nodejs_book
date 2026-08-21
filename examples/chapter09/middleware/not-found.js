// 404 handler — đăng ký SAU tất cả routes, TRƯỚC error handler
// Khi không có route nào khớp, middleware này tạo lỗi 404 và chuyển cho errorHandler

const { AppError } = require('./error-handler');

const notFound = (req, res, next) => {
  const err = new AppError(
    `Không tìm thấy: ${req.method} ${req.originalUrl}`,
    404
  );
  next(err);
};

module.exports = notFound;
