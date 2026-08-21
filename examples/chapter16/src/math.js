/**
 * Chương 16: Pure functions để test unit test
 * Toán học cơ bản và nâng cao
 */

/**
 * Cộng hai số
 */
function add(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Tham số phải là số');
  }
  return a + b;
}

/**
 * Trừ hai số
 */
function subtract(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Tham số phải là số');
  }
  return a - b;
}

/**
 * Nhân hai số
 */
function multiply(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Tham số phải là số');
  }
  return a * b;
}

/**
 * Chia hai số — ném lỗi khi chia cho 0
 */
function divide(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Tham số phải là số');
  }
  if (b === 0) {
    throw new Error('Không thể chia cho 0');
  }
  return a / b;
}

/**
 * Giai thừa — chỉ nhận số nguyên không âm
 */
function factorial(n) {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('Đầu vào phải là số nguyên không âm');
  }
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}

/**
 * Số Fibonacci thứ n (0-indexed)
 * fibonacci(0) = 0, fibonacci(1) = 1, fibonacci(6) = 8
 */
function fibonacci(n) {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('Đầu vào phải là số nguyên không âm');
  }
  if (n === 0) return 0;
  if (n === 1) return 1;

  // Dùng iteration thay vì recursion để tránh stack overflow
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

/**
 * Kiểm tra số nguyên tố
 */
function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;

  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

/**
 * Tính trung bình cộng của mảng số
 */
function average(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    throw new Error('Mảng không được rỗng');
  }
  if (!numbers.every(n => typeof n === 'number')) {
    throw new TypeError('Tất cả phần tử phải là số');
  }
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Làm tròn đến N chữ số thập phân
 */
function round(n, decimals = 0) {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

module.exports = { add, subtract, multiply, divide, factorial, fibonacci, isPrime, average, round };
