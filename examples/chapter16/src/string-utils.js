/**
 * Chương 16: String utility functions để test
 * Pure functions, không có side effect
 */

/**
 * Cắt ngắn chuỗi nếu dài hơn maxLength
 * @param {string} str
 * @param {number} maxLength
 * @param {string} suffix - Hậu tố khi cắt (mặc định '...')
 * @returns {string}
 */
function truncate(str, maxLength, suffix = '...') {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') str = String(str);
  if (maxLength <= 0) return '';
  if (str.length <= maxLength) return str;

  // Tránh cắt giữa chừng suffix
  const effectiveMax = maxLength - suffix.length;
  if (effectiveMax <= 0) return suffix.slice(0, maxLength);

  return str.slice(0, effectiveMax) + suffix;
}

/**
 * Viết hoa chữ cái đầu mỗi từ
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
  if (str === null || str === undefined || str === '') return '';
  if (typeof str !== 'string') return '';

  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Chuyển chuỗi thành slug URL-friendly
 * 'Hello World! Xin Chào' -> 'hello-world-xin-chao'
 * @param {string} str
 * @returns {string}
 */
function slugify(str) {
  if (!str || typeof str !== 'string') return '';

  return str
    .toLowerCase()
    // Chuyển ký tự có dấu tiếng Việt thành không dấu
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    // Thay các ký tự không phải chữ/số thành dấu gạch
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-') // nhiều space/dash -> 1 dash
    .replace(/^-|-$/g, '');  // xóa dash đầu/cuối
}

/**
 * Đếm số từ trong chuỗi
 * @param {string} str
 * @returns {number}
 */
function countWords(str) {
  if (!str || typeof str !== 'string') return 0;

  const trimmed = str.trim();
  if (trimmed === '') return 0;

  // Tách theo khoảng trắng (1 hoặc nhiều)
  return trimmed.split(/\s+/).length;
}

/**
 * Che giấu địa chỉ email
 * 'alice@example.com' -> 'al***@example.com'
 * @param {string} email
 * @returns {string}
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';

  const atIndex = email.indexOf('@');
  if (atIndex === -1) return email; // không phải email hợp lệ

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex); // bao gồm @

  if (local.length <= 2) {
    return local[0] + '***' + domain;
  }

  // Giữ 2 ký tự đầu, che phần còn lại
  const visible = local.slice(0, 2);
  const masked = '*'.repeat(Math.min(local.length - 2, 4));
  return visible + masked + domain;
}

/**
 * Đảo ngược chuỗi
 * @param {string} str
 * @returns {string}
 */
function reverse(str) {
  if (!str || typeof str !== 'string') return '';
  // Dùng spread để handle emoji/unicode đúng
  return [...str].reverse().join('');
}

/**
 * Kiểm tra chuỗi có phải palindrome không
 * (đọc xuôi ngược như nhau, bỏ qua khoảng trắng và hoa thường)
 * @param {string} str
 * @returns {boolean}
 */
function isPalindrome(str) {
  if (!str || typeof str !== 'string') return false;

  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === [...cleaned].reverse().join('');
}

/**
 * Đếm số lần xuất hiện của substring
 * @param {string} str
 * @param {string} substr
 * @returns {number}
 */
function countOccurrences(str, substr) {
  if (!str || !substr || typeof str !== 'string') return 0;
  if (substr === '') return 0;

  let count = 0;
  let index = str.indexOf(substr);
  while (index !== -1) {
    count++;
    index = str.indexOf(substr, index + 1);
  }
  return count;
}

module.exports = {
  truncate,
  capitalize,
  slugify,
  countWords,
  maskEmail,
  reverse,
  isPalindrome,
  countOccurrences,
};
