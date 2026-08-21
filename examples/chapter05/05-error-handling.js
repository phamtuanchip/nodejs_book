/**
 * Chương 05 - Ví dụ 05: Xử lý lỗi Async đúng cách
 * Custom errors, unhandled rejection, retry, circuit breaker
 */

// ─── Custom Error Classes ─────────────────────────────────────────────────────

// Tạo error class riêng để phân loại lỗi rõ ràng
class AppError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name = this.constructor.name; // tên class làm error name
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor); // bỏ constructor khỏi stack trace
  }
}

class NetworkError extends AppError {
  constructor(message, url) {
    super(message, 'NETWORK_ERROR', 503);
    this.url = url;
  }
}

class ValidationError extends AppError {
  constructor(message, field) {
    super(message, 'VALIDATION_ERROR', 400);
    this.field = field;
  }
}

class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} với id=${id} không tìm thấy`, 'NOT_FOUND', 404);
    this.resource = resource;
    this.id = id;
  }
}

// ─── Xử lý lỗi với instanceof ────────────────────────────────────────────────

console.log('=== CUSTOM ERROR CLASSES ===');

async function processRequest(userId) {
  if (typeof userId !== 'number') throw new ValidationError('userId phải là số', 'userId');
  if (userId < 0) throw new ValidationError('userId phải >= 0', 'userId');
  if (userId > 1000) throw new NotFoundError('User', userId);

  await new Promise((r) => setTimeout(r, 50));
  return { id: userId, name: `User_${userId}` };
}

async function handleRequest(userId) {
  try {
    const user = await processRequest(userId);
    console.log('✓ Thành công:', user);
  } catch (err) {
    // Phân loại lỗi theo type
    if (err instanceof ValidationError) {
      console.error(`✗ Validation [${err.field}]: ${err.message} (HTTP ${err.statusCode})`);
    } else if (err instanceof NotFoundError) {
      console.error(`✗ Not Found: ${err.message} (HTTP ${err.statusCode})`);
    } else if (err instanceof NetworkError) {
      console.error(`✗ Network [${err.url}]: ${err.message}`);
    } else {
      // Lỗi không mong đợi - log đầy đủ
      console.error('✗ Unexpected error:', err);
    }
  }
}

handleRequest(42);
handleRequest('abc');
handleRequest(-5);
handleRequest(9999);

// ─── Unhandled Promise Rejection ─────────────────────────────────────────────

console.log('\n=== UNHANDLED PROMISE REJECTION ===');

// Lắng nghe unhandled rejections - LUÔN làm điều này trong production
process.on('unhandledRejection', (reason, promise) => {
  console.error('CẢNH BÁO: Unhandled Promise Rejection!');
  console.error('Reason:', reason instanceof Error ? reason.message : reason);
  // Trong production: ghi log + graceful shutdown
  // process.exit(1);
});

// Ví dụ promise bị reject nhưng không có .catch
// (comment ra để không dừng script)
// Promise.reject(new Error('Promise bị bỏ quên'));

// ĐÚNG: luôn handle rejection
Promise.reject(new Error('Lỗi này được xử lý đúng cách'))
  .catch((err) => console.log('✓ Caught:', err.message));

// ─── Uncaught Exception ───────────────────────────────────────────────────────

// Lắng nghe uncaught sync exceptions
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception:', err.message);
  // Trong production: log → alert team → graceful shutdown
  // process.exit(1);
});

// ─── Retry Pattern với Exponential Backoff ────────────────────────────────────

console.log('\n=== RETRY PATTERN ===');

let failCount = 0;

async function flakyService() {
  failCount++;
  await new Promise((r) => setTimeout(r, 30));
  if (failCount % 3 !== 0) { // thất bại 2/3 lần
    throw new NetworkError(`Service không phản hồi (lần ${failCount})`, 'https://api.example.com');
  }
  return { data: `Kết quả lần ${failCount}` };
}

async function retryWithBackoff(fn, options = {}) {
  const { maxRetries = 3, baseDelay = 100, maxDelay = 2000, shouldRetry } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLastAttempt = attempt === maxRetries;
      const canRetry = shouldRetry ? shouldRetry(err) : true;

      if (isLastAttempt || !canRetry) {
        throw err; // re-throw nếu hết retry hoặc không nên retry
      }

      // Exponential backoff: delay tăng theo mũ, có jitter để tránh thundering herd
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      const jitter = Math.random() * 0.3 * exponentialDelay;
      const waitMs = Math.floor(exponentialDelay + jitter);

      console.log(`  Lần ${attempt}/${maxRetries} thất bại: ${err.message}. Thử lại sau ${waitMs}ms...`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}

retryWithBackoff(flakyService, {
  maxRetries: 5,
  baseDelay: 50,
  // Chỉ retry với NetworkError, không retry ValidationError
  shouldRetry: (err) => err instanceof NetworkError,
})
  .then((result) => console.log('✓ Retry thành công:', result.data))
  .catch((err) => console.error('✗ Hết retry:', err.message));

// ─── Circuit Breaker Pattern ──────────────────────────────────────────────────

console.log('\n=== CIRCUIT BREAKER ===');

class CircuitBreaker {
  constructor(fn, options = {}) {
    this.fn = fn;
    this.failureThreshold = options.failureThreshold || 3;
    this.recoveryTime = options.recoveryTime || 5000;
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED = hoạt động bình thường
    this.nextAttempt = null;
  }

  async call(...args) {
    if (this.state === 'OPEN') {
      // Mạch đang ngắt: kiểm tra đã đến lúc thử lại chưa
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit OPEN - thử lại sau ${Math.ceil((this.nextAttempt - Date.now()) / 1000)}s`);
      }
      this.state = 'HALF_OPEN'; // thử một request để kiểm tra
      console.log('  Circuit → HALF_OPEN (đang thử phục hồi)');
    }

    try {
      const result = await this.fn(...args);
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      console.log('  Circuit → CLOSED (đã phục hồi)');
    }
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.recoveryTime;
      console.log(`  Circuit → OPEN (${this.failureCount} lỗi, tạm ngắt ${this.recoveryTime}ms)`);
    }
  }
}

let cbCallCount = 0;
async function unreliableService() {
  cbCallCount++;
  if (cbCallCount <= 4) throw new Error(`Service down (lần ${cbCallCount})`);
  return 'Service đã phục hồi';
}

const breaker = new CircuitBreaker(unreliableService, {
  failureThreshold: 3,
  recoveryTime: 200,
});

async function testCircuitBreaker() {
  // Gửi 6 requests: 3 fail → circuit open → 1 bị block → service phục hồi
  for (let i = 1; i <= 7; i++) {
    await new Promise((r) => setTimeout(r, i === 5 ? 250 : 30));
    try {
      const result = await breaker.call();
      console.log(`  Request ${i}: ✓ ${result}`);
    } catch (err) {
      console.log(`  Request ${i}: ✗ ${err.message}`);
    }
  }
}

setTimeout(() => testCircuitBreaker(), 500);

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

setTimeout(() => {
  console.log('\n=== GRACEFUL SHUTDOWN PATTERN ===');

  // Lắng nghe SIGINT (Ctrl+C) và SIGTERM (kill)
  const shutdown = async (signal) => {
    console.log(`\nNhận signal ${signal}, đang shutdown...`);
    // Ở đây: đóng DB connections, chờ requests hiện tại xong, etc.
    await new Promise((r) => setTimeout(r, 50));
    console.log('✓ Shutdown hoàn tất');
    // process.exit(0); // trong production thì uncomment
  };

  // Đăng ký handlers (trong production, uncomment những dòng này)
  // process.on('SIGINT', () => shutdown('SIGINT'));
  // process.on('SIGTERM', () => shutdown('SIGTERM'));

  console.log('✓ Graceful shutdown handlers đã đăng ký');
  console.log('  (Dùng Ctrl+C hoặc kill để trigger)');
}, 2000);
