// Đọc biến môi trường từ process.env
// Chạy cơ bản: node 03-env-vars.js
// Chạy với biến: PORT=8080 NODE_ENV=production node 03-env-vars.js (Linux/Mac)
//               $env:PORT=8080; node 03-env-vars.js (Windows PowerShell)
const path = require('path');
const fs = require('fs');

// Thử load file .env thủ công (không cần dotenv)
function loadDotenv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Bỏ qua comment và dòng trống
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, ''); // bỏ quotes

    // Chỉ set nếu chưa có trong environment (env thực tế ưu tiên hơn .env)
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
  console.log(`Đã load .env từ: ${filePath}`);
}

// Tìm và load .env
const envFile = path.join(__dirname, '.env');
const envExampleFile = path.join(__dirname, '.env.example');

if (fs.existsSync(envFile)) {
  loadDotenv(envFile);
} else if (fs.existsSync(envExampleFile)) {
  console.log('Không tìm thấy .env, đang dùng .env.example để demo');
  loadDotenv(envExampleFile);
} else {
  console.log('Không có file .env, dùng giá trị mặc định');
}

console.log('\n=== Biến môi trường ứng dụng ===');

// Đọc với giá trị mặc định (pattern phổ biến trong production)
const config = {
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbUrl: process.env.DB_URL || 'mongodb://localhost:27017/default',
  secret: process.env.SECRET || 'fallback-secret-not-safe',
  debug: process.env.DEBUG === 'true',
};

console.log('PORT      :', config.port);
console.log('NODE_ENV  :', config.nodeEnv);
console.log('DB_URL    :', config.dbUrl);
// KHÔNG bao giờ log secret trong production!
console.log('SECRET    :', config.nodeEnv === 'production' ? '***hidden***' : config.secret);
console.log('DEBUG     :', config.debug);

// Một số biến môi trường hệ thống hữu ích
console.log('\n=== Biến môi trường hệ thống ===');
console.log('HOME/USERPROFILE:', process.env.HOME || process.env.USERPROFILE);
console.log('PATH (100 ký tự đầu):', (process.env.PATH || '').slice(0, 100) + '...');

console.log('\n=== Kiểm tra môi trường ===');
if (config.nodeEnv === 'production') {
  console.log('PRODUCTION mode: logging tối thiểu, no stack traces');
} else {
  console.log('DEVELOPMENT mode: full logging, hot reload, etc.');
}
