/**
 * Chương 16: Unit tests cho string-utils.js
 * Nhiều cases kể cả edge cases: empty string, null, undefined
 */

const { truncate, capitalize, slugify, countWords, maskEmail, reverse, isPalindrome, countOccurrences } = require('../src/string-utils');

// === TRUNCATE ===
describe('truncate()', () => {
  it('không cắt khi chuỗi đủ ngắn', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
    expect(truncate('Hello', 5)).toBe('Hello'); // bằng maxLength -> không cắt
  });

  it('cắt và thêm suffix mặc định ...', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...');
    expect(truncate('Đây là một chuỗi dài', 10)).toBe('Đây là...');
  });

  it('dùng suffix tùy chỉnh', () => {
    expect(truncate('Hello World', 8, ' [...]')).toBe('He [...]');
    expect(truncate('Hello', 10, '>>>')).toBe('Hello');
  });

  it('edge cases: chuỗi rỗng', () => {
    expect(truncate('', 10)).toBe('');
    expect(truncate('', 0)).toBe('');
  });

  it('edge cases: null/undefined trả về rỗng', () => {
    expect(truncate(null, 10)).toBe('');
    expect(truncate(undefined, 10)).toBe('');
  });

  it('maxLength = 0 trả về rỗng', () => {
    expect(truncate('Hello', 0)).toBe('');
  });

  it('chuyển non-string thành string rồi xử lý', () => {
    expect(truncate(12345, 3)).toBe('12...');
  });
});

// === CAPITALIZE ===
describe('capitalize()', () => {
  it('viết hoa chữ đầu mỗi từ', () => {
    expect(capitalize('hello world')).toBe('Hello World');
    expect(capitalize('nodejs is great')).toBe('Nodejs Is Great');
  });

  it('chuyển chữ hoa về thường rồi capitalize', () => {
    expect(capitalize('HELLO WORLD')).toBe('Hello World');
    expect(capitalize('hELLO wORLD')).toBe('Hello World');
  });

  it('1 từ', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('edge cases: rỗng/null', () => {
    expect(capitalize('')).toBe('');
    expect(capitalize(null)).toBe('');
    expect(capitalize(undefined)).toBe('');
  });

  it('không phải string', () => {
    expect(capitalize(123)).toBe('');
  });
});

// === SLUGIFY ===
describe('slugify()', () => {
  it('chuyển chuỗi thường thành slug', () => {
    expect(slugify('hello world')).toBe('hello-world');
    expect(slugify('Node.js is Awesome')).toBe('nodejs-is-awesome');
  });

  it('xóa ký tự đặc biệt', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
    expect(slugify('price: $100 (discount)')).toBe('price-100-discount');
  });

  it('thu gọn nhiều dấu gạch liên tiếp', () => {
    expect(slugify('hello   world')).toBe('hello-world');
    expect(slugify('a---b')).toBe('a-b');
  });

  it('xóa dấu đầu/cuối', () => {
    expect(slugify('  hello world  ')).toBe('hello-world');
  });

  it('edge cases: rỗng/null', () => {
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
  });

  it('chỉ có ký tự đặc biệt', () => {
    expect(slugify('!@#$%')).toBe('');
  });
});

// === COUNT WORDS ===
describe('countWords()', () => {
  it('đếm từ trong câu thông thường', () => {
    expect(countWords('Hello World')).toBe(2);
    expect(countWords('Tôi yêu lập trình Node.js')).toBe(5);
  });

  it('nhiều khoảng trắng giữa từ', () => {
    expect(countWords('hello    world')).toBe(2);
    expect(countWords('  hello  world  ')).toBe(2);
  });

  it('1 từ', () => {
    expect(countWords('hello')).toBe(1);
  });

  it('edge cases: rỗng/whitespace only', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
    expect(countWords(null)).toBe(0);
    expect(countWords(undefined)).toBe(0);
  });
});

// === MASK EMAIL ===
describe('maskEmail()', () => {
  it('che giấu email thông thường', () => {
    expect(maskEmail('alice@example.com')).toBe('al***@example.com');
    expect(maskEmail('bob@test.vn')).toBe('bo***@test.vn');
  });

  it('email ngắn (local part <= 2 ký tự)', () => {
    expect(maskEmail('ab@test.com')).toBe('a***@test.com');
    expect(maskEmail('a@test.com')).toBe('a***@test.com');
  });

  it('giữ domain nguyên vẹn', () => {
    const result = maskEmail('user@sub.domain.com');
    expect(result).toContain('@sub.domain.com');
  });

  it('edge cases: không phải email', () => {
    expect(maskEmail('notanemail')).toBe('notanemail');
    expect(maskEmail('')).toBe('');
    expect(maskEmail(null)).toBe('');
    expect(maskEmail(undefined)).toBe('');
  });
});

// === REVERSE ===
describe('reverse()', () => {
  it('đảo ngược chuỗi thông thường', () => {
    expect(reverse('hello')).toBe('olleh');
    expect(reverse('NodeJS')).toBe('SJedoN');
  });

  it('palindrome sau khi đảo = chính nó', () => {
    expect(reverse('racecar')).toBe('racecar');
    expect(reverse('abcba')).toBe('abcba');
  });

  it('chuỗi 1 ký tự', () => {
    expect(reverse('a')).toBe('a');
  });

  it('edge cases: rỗng/null', () => {
    expect(reverse('')).toBe('');
    expect(reverse(null)).toBe('');
    expect(reverse(undefined)).toBe('');
  });
});

// === IS PALINDROME ===
describe('isPalindrome()', () => {
  it('palindrome đơn giản', () => {
    expect(isPalindrome('racecar')).toBe(true);
    expect(isPalindrome('level')).toBe(true);
    expect(isPalindrome('noon')).toBe(true);
  });

  it('không phân biệt hoa/thường', () => {
    expect(isPalindrome('Racecar')).toBe(true);
    expect(isPalindrome('RaceCar')).toBe(true);
  });

  it('bỏ qua khoảng trắng và ký tự đặc biệt', () => {
    expect(isPalindrome('A man a plan a canal Panama')).toBe(true);
    expect(isPalindrome('Was it a car or a cat I saw')).toBe(true);
  });

  it('không phải palindrome', () => {
    expect(isPalindrome('hello')).toBe(false);
    expect(isPalindrome('nodejs')).toBe(false);
  });

  it('edge cases', () => {
    expect(isPalindrome('')).toBe(false);
    expect(isPalindrome(null)).toBe(false);
    expect(isPalindrome('a')).toBe(true); // 1 ký tự là palindrome
  });
});

// === COUNT OCCURRENCES ===
describe('countOccurrences()', () => {
  it('đếm số lần xuất hiện', () => {
    expect(countOccurrences('hello world', 'l')).toBe(3);
    expect(countOccurrences('banana', 'an')).toBe(2);
  });

  it('không phân biệt vị trí (case sensitive)', () => {
    expect(countOccurrences('Hello', 'h')).toBe(0); // 'h' != 'H'
    expect(countOccurrences('Hello', 'H')).toBe(1);
  });

  it('không tìm thấy', () => {
    expect(countOccurrences('hello', 'xyz')).toBe(0);
  });

  it('edge cases: chuỗi rỗng', () => {
    expect(countOccurrences('', 'a')).toBe(0);
    expect(countOccurrences('hello', '')).toBe(0);
    expect(countOccurrences(null, 'a')).toBe(0);
  });
});
