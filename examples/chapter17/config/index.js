// Config validation với fail-fast pattern
// App dừng ngay khi khởi động nếu thiếu biến môi trường bắt buộc
// Tốt hơn để app chạy rồi crash giữa chừng vì thiếu config

'use strict';

// Danh sách biến bắt buộc phải có trong môi trường production
const REQUIRED_IN_PRODUCTION = ['JWT_SECRET', 'MONGODB_URI'];

function validate(config) {
  const errors = [];

  if (config.NODE_ENV === 'production') {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!config[key]) {
        errors.push(`Thiếu biến môi trường bắt buộc: ${key}`);
      }
    }

    // JWT_SECRET không được dùng giá trị mặc định trong production
    if (config.JWT_SECRET === 'change-this-to-random-string-in-production') {
      errors.push('JWT_SECRET vẫn là giá trị mặc định — thay bằng chuỗi ngẫu nhiên dài >= 32 ký tự');
    }
  }

  if (config.PORT < 1 || config.PORT > 65535) {
    errors.push(`PORT không hợp lệ: ${config.PORT}`);
  }

  if (errors.length > 0) {
    console.error('=== LỖI CẤU HÌNH ===');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    console.error('====================');
    process.exit(1); // dừng ngay — fail-fast
  }
}

// Đọc và chuẩn hoá biến môi trường
const config = {
  PORT:         parseInt(process.env.PORT || '3000', 10),
  NODE_ENV:     process.env.NODE_ENV || 'development',
  MONGODB_URI:  process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp',
  JWT_SECRET:   process.env.JWT_SECRET || 'change-this-to-random-string-in-production',
  REDIS_URL:    process.env.REDIS_URL || 'redis://localhost:6379',

  // Cờ tiện lợi
  IS_PRODUCTION:  process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
};

// Validate ngay khi module được load
validate(config);

module.exports = config;
