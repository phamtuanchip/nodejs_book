// Middleware validate request body
// Trả 400 nếu thiếu các fields bắt buộc

/**
 * Tạo middleware validate fields bắt buộc
 * @param {string[]} requiredFields - Danh sách tên field bắt buộc
 * @returns Express middleware
 *
 * Ví dụ: router.post('/login', validateBody(['email', 'password']), handler)
 */
const validateBody = (requiredFields = []) => {
  return (req, res, next) => {
    const body = req.body;

    // Kiểm tra body tồn tại
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        error: 'Yêu cầu không hợp lệ',
        message: 'Request body phải là JSON object'
      });
    }

    // Tìm các field bị thiếu hoặc rỗng
    const missing = requiredFields.filter((field) => {
      const value = body[field];
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Thiếu thông tin bắt buộc',
        missing,
        message: `Vui lòng cung cấp: ${missing.join(', ')}`
      });
    }

    // Kiểm tra thêm: email format (nếu có field email)
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        message: 'Email không đúng định dạng'
      });
    }

    next();
  };
};

module.exports = validateBody;
