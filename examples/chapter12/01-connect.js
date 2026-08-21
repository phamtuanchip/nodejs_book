// Kết nối MongoDB với retry logic và xử lý connection events
// Chạy: node 01-connect.js  (cần: npm install mongoose)
// Yêu cầu: MongoDB đang chạy tại localhost:27017

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nodejs_book_ch12';
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

// ── Cấu hình connection events ─────────────────────────────────────
mongoose.connection.on('connected', () => {
  console.log('[MongoDB] Kết nối thành công tới:', MONGO_URI);
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Lỗi kết nối:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Mất kết nối');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Kết nối lại thành công');
});

// ── Hàm kết nối với retry ──────────────────────────────────────────
async function connectWithRetry(attempt = 1) {
  try {
    console.log(`[MongoDB] Đang kết nối... (lần ${attempt}/${MAX_RETRIES})`);

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // timeout sau 5s nếu không tìm thấy server
      socketTimeoutMS: 45000
    });

    console.log('[MongoDB] Sẵn sàng! Database:', mongoose.connection.db.databaseName);
    return mongoose.connection;
  } catch (err) {
    console.error(`[MongoDB] Thất bại lần ${attempt}:`, err.message);

    if (attempt < MAX_RETRIES) {
      console.log(`[MongoDB] Thử lại sau ${RETRY_DELAY_MS / 1000} giây...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectWithRetry(attempt + 1);
    }

    throw new Error(`Không thể kết nối MongoDB sau ${MAX_RETRIES} lần thử`);
  }
}

// ── Hàm đóng kết nối an toàn ──────────────────────────────────────
async function disconnect() {
  await mongoose.disconnect();
  console.log('[MongoDB] Đã đóng kết nối');
}

// ── Xử lý tắt ứng dụng (graceful shutdown) ────────────────────────
process.on('SIGINT', async () => {
  console.log('\n[App] Nhận tín hiệu SIGINT, đang đóng kết nối...');
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[App] Nhận tín hiệu SIGTERM, đang đóng kết nối...');
  await disconnect();
  process.exit(0);
});

// ── Demo chạy standalone ──────────────────────────────────────────
(async () => {
  try {
    await connectWithRetry();

    // Kiểm tra kết nối bằng cách ping database
    await mongoose.connection.db.admin().ping();
    console.log('[MongoDB] Ping OK!');

    // Hiển thị danh sách collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('[MongoDB] Collections:', collections.map((c) => c.name));

    await disconnect();
  } catch (err) {
    console.error('[App] Lỗi:', err.message);
    process.exit(1);
  }
})();

module.exports = { connectWithRetry, disconnect };
