/**
 * Chương 07 - Ví dụ 03: dotenv + Joi validation
 * Load env vars từ .env file, validate và fail-fast nếu thiếu
 * Cài đặt: npm install (trong thư mục chapter07/)
 * Chạy: node 03-use-dotenv.js
 */

// QUAN TRỌNG: Load dotenv TRƯỚC KHI dùng process.env
require('dotenv').config();

const Joi = require('joi');

// ─── Tạo .env mẫu nếu chưa có (chỉ để demo, production không làm vậy) ────────

const fs = require('fs');
const path = require('path');
const envFile = path.join(__dirname, '.env');

if (!fs.existsSync(envFile)) {
  fs.writeFileSync(
    envFile,
    `# Cấu hình ứng dụng
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_db
DB_USER=admin
DB_PASSWORD=secret123

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Email (tùy chọn)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@example.com
# EMAIL_PASS= (comment để test missing optional)

# Rate limiting
MAX_REQUESTS_PER_MINUTE=100
`
  );
  console.log('✓ Đã tạo file .env mẫu\n');
  // Load lại sau khi tạo
  require('dotenv').config({ override: true });
}

// ─── Schema validation với Joi ────────────────────────────────────────────────

const configSchema = Joi.object({
  // === BẮT BUỘC ===
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),

  PORT: Joi.number()
    .integer()
    .min(1024)
    .max(65535)
    .default(3000),

  HOST: Joi.string().hostname().default('localhost'),

  // Database: tất cả bắt buộc
  DB_HOST: Joi.string().required().messages({
    'any.required': 'DB_HOST là bắt buộc - địa chỉ database server',
  }),
  DB_PORT: Joi.number().integer().min(1).max(65535).default(5432),
  DB_NAME: Joi.string().min(1).required(),
  DB_USER: Joi.string().min(1).required(),
  DB_PASSWORD: Joi.string().min(6).required().messages({
    'string.min': 'DB_PASSWORD phải có ít nhất 6 ký tự',
    'any.required': 'DB_PASSWORD là bắt buộc',
  }),

  // JWT
  JWT_SECRET: Joi.string()
    .min(32) // ít nhất 32 chars để đủ entropy
    .required()
    .messages({
      'string.min': 'JWT_SECRET quá ngắn, cần ít nhất 32 ký tự để an toàn',
    }),
  JWT_EXPIRES_IN: Joi.string().pattern(/^\d+[smhd]$/).default('7d'),

  // Email (không bắt buộc)
  EMAIL_HOST: Joi.string().hostname().optional(),
  EMAIL_PORT: Joi.number().integer().default(587),
  EMAIL_USER: Joi.string().email().optional(),
  EMAIL_PASS: Joi.string().optional(),

  // Rate limiting
  MAX_REQUESTS_PER_MINUTE: Joi.number().integer().min(1).max(10000).default(100),
})
  .unknown(true) // cho phép env vars khác (PATH, HOME, etc.)
  .options({ convert: true }); // tự động convert string → number

// ─── Validate và fail-fast ───────────────────────────────────────────────────

function loadConfig() {
  const { error, value } = configSchema.validate(process.env, {
    abortEarly: false, // báo TẤT CẢ lỗi, không dừng ở lỗi đầu tiên
  });

  if (error) {
    // Fail-fast: in tất cả lỗi và thoát ngay
    console.error('\n╔════════════════════════════════════════╗');
    console.error('║  LỖI CẤU HÌNH - Ứng dụng không thể chạy  ║');
    console.error('╚════════════════════════════════════════╝');
    console.error('\nCác env vars bị thiếu hoặc không hợp lệ:');
    error.details.forEach((detail, i) => {
      console.error(`  ${i + 1}. ${detail.message}`);
    });
    console.error('\nKiểm tra file .env và thêm các biến còn thiếu.\n');
    process.exit(1); // thoát với exit code 1 = lỗi
  }

  // Trả về object config đã validate và có defaults
  return {
    env: value.NODE_ENV,
    port: value.PORT,
    host: value.HOST,
    database: {
      host: value.DB_HOST,
      port: value.DB_PORT,
      name: value.DB_NAME,
      user: value.DB_USER,
      password: value.DB_PASSWORD,
      // Connection string được tạo từ các parts
      url: `postgresql://${value.DB_USER}:${value.DB_PASSWORD}@${value.DB_HOST}:${value.DB_PORT}/${value.DB_NAME}`,
    },
    jwt: {
      secret: value.JWT_SECRET,
      expiresIn: value.JWT_EXPIRES_IN,
    },
    email: value.EMAIL_HOST
      ? {
          host: value.EMAIL_HOST,
          port: value.EMAIL_PORT,
          user: value.EMAIL_USER,
          pass: value.EMAIL_PASS,
          enabled: !!(value.EMAIL_USER && value.EMAIL_PASS),
        }
      : null,
    rateLimit: {
      maxRequests: value.MAX_REQUESTS_PER_MINUTE,
      windowMs: 60 * 1000,
    },
    isProduction: value.NODE_ENV === 'production',
    isDevelopment: value.NODE_ENV === 'development',
  };
}

// ─── Load config một lần, export để dùng toàn app ────────────────────────────

const config = loadConfig();

// ─── In kết quả (che password) ───────────────────────────────────────────────

console.log('✓ Config đã load thành công!\n');
console.log('Environment:', config.env.toUpperCase());
console.log('Server:     ', `${config.host}:${config.port}`);
console.log('Database:   ', `${config.database.host}:${config.database.port}/${config.database.name}`);
console.log('DB User:    ', config.database.user);
console.log('DB Password:', '*'.repeat(config.database.password.length));
console.log('JWT:        ', `expires in ${config.jwt.expiresIn}`);
console.log('Email:      ', config.email ? `${config.email.enabled ? 'Enabled' : 'Disabled (thiếu pass)'} - ${config.email.host}` : 'Không cấu hình');
console.log('Rate limit: ', `${config.rateLimit.maxRequests} requests/phút`);

// ─── Ví dụ dùng config trong app ─────────────────────────────────────────────

console.log('\n=== VÍ DỤ DÙNG CONFIG ===');

// Chỉ log verbose trong development
if (config.isDevelopment) {
  console.log('[DEV] Verbose logging đang bật');
}

// Kết nối DB với thông tin từ config
function connectDatabase(dbConfig) {
  console.log(`\nĐang kết nối đến database ${dbConfig.name}...`);
  // Trong thực tế: new Pool(dbConfig) với pg, hoặc mongoose.connect(dbConfig.url)
  console.log('✓ Giả lập kết nối thành công');
  return { query: () => Promise.resolve([]) };
}

const db = connectDatabase(config.database);

// Export để các module khác dùng
module.exports = { config };

console.log('\n📌 Best practices:');
console.log('  1. Không commit file .env vào git (thêm vào .gitignore)');
console.log('  2. Tạo .env.example với placeholder values để team reference');
console.log('  3. Dùng khác nhau: .env (local), .env.test (test), env vars thật (production)');
console.log('  4. Validate ngay khi app khởi động (fail-fast)');
