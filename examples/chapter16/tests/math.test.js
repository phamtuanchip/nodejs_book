/**
 * Chương 16: Unit tests cho math.js
 * Jest: describe/it/expect, toBe, toThrow, toEqual
 */

const { add, subtract, multiply, divide, factorial, fibonacci, isPrime, average, round } = require('../src/math');

// === ADD ===
describe('add()', () => {
  it('cộng 2 số dương', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('cộng số âm', () => {
    expect(add(-1, -2)).toBe(-3);
    expect(add(-5, 3)).toBe(-2);
  });

  it('cộng với 0', () => {
    expect(add(0, 5)).toBe(5);
    expect(add(0, 0)).toBe(0);
  });

  it('cộng số thập phân', () => {
    // Dùng toBeCloseTo để tránh floating point issue
    expect(add(0.1, 0.2)).toBeCloseTo(0.3);
    expect(add(1.5, 2.5)).toBe(4);
  });

  it('ném lỗi nếu không phải số', () => {
    expect(() => add('a', 1)).toThrow(TypeError);
    expect(() => add(1, null)).toThrow('Tham số phải là số');
    expect(() => add(undefined, 2)).toThrow(TypeError);
  });
});

// === SUBTRACT ===
describe('subtract()', () => {
  it('trừ 2 số dương', () => {
    expect(subtract(10, 3)).toBe(7);
  });

  it('kết quả âm', () => {
    expect(subtract(3, 10)).toBe(-7);
  });

  it('trừ cho 0', () => {
    expect(subtract(5, 0)).toBe(5);
  });

  it('ném lỗi khi tham số không hợp lệ', () => {
    expect(() => subtract('5', 2)).toThrow(TypeError);
  });
});

// === MULTIPLY ===
describe('multiply()', () => {
  it('nhân hai số dương', () => {
    expect(multiply(3, 4)).toBe(12);
  });

  it('nhân với số âm', () => {
    expect(multiply(-3, 4)).toBe(-12);
    expect(multiply(-3, -4)).toBe(12);
  });

  it('nhân với 0', () => {
    expect(multiply(100, 0)).toBe(0);
    expect(multiply(0, 0)).toBe(0);
  });

  it('nhân với 1 (tính chất đơn vị)', () => {
    expect(multiply(7, 1)).toBe(7);
  });
});

// === DIVIDE ===
describe('divide()', () => {
  it('chia số nguyên', () => {
    expect(divide(10, 2)).toBe(5);
    expect(divide(9, 3)).toBe(3);
  });

  it('chia ra số thập phân', () => {
    expect(divide(10, 3)).toBeCloseTo(3.333);
    expect(divide(1, 4)).toBe(0.25);
  });

  it('chia số âm', () => {
    expect(divide(-10, 2)).toBe(-5);
    expect(divide(-10, -2)).toBe(5);
  });

  it('ném lỗi khi chia cho 0', () => {
    expect(() => divide(10, 0)).toThrow('Không thể chia cho 0');
    expect(() => divide(0, 0)).toThrow(Error);
  });

  it('ném lỗi khi tham số không phải số', () => {
    expect(() => divide('10', 2)).toThrow(TypeError);
  });
});

// === FACTORIAL ===
describe('factorial()', () => {
  it('giai thừa các giá trị cơ bản', () => {
    expect(factorial(0)).toBe(1);
    expect(factorial(1)).toBe(1);
    expect(factorial(5)).toBe(120);
    expect(factorial(10)).toBe(3628800);
  });

  it('giai thừa các giá trị lớn hơn', () => {
    expect(factorial(6)).toBe(720);
    expect(factorial(7)).toBe(5040);
  });

  it('ném lỗi khi số âm', () => {
    expect(() => factorial(-1)).toThrow('Đầu vào phải là số nguyên không âm');
    expect(() => factorial(-5)).toThrow(Error);
  });

  it('ném lỗi khi không phải số nguyên', () => {
    expect(() => factorial(2.5)).toThrow(Error);
    expect(() => factorial('5')).toThrow(Error);
  });
});

// === FIBONACCI ===
describe('fibonacci()', () => {
  // Dãy Fibonacci: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34...
  it('các giá trị cơ bản', () => {
    expect(fibonacci(0)).toBe(0);
    expect(fibonacci(1)).toBe(1);
    expect(fibonacci(2)).toBe(1);
    expect(fibonacci(3)).toBe(2);
  });

  it('giá trị lớn hơn', () => {
    expect(fibonacci(6)).toBe(8);
    expect(fibonacci(7)).toBe(13);
    expect(fibonacci(10)).toBe(55);
  });

  it('ném lỗi khi số âm', () => {
    expect(() => fibonacci(-1)).toThrow(Error);
  });

  it('ném lỗi khi không phải số nguyên', () => {
    expect(() => fibonacci(1.5)).toThrow(Error);
    expect(() => fibonacci(NaN)).toThrow(Error);
  });
});

// === IS PRIME ===
describe('isPrime()', () => {
  it('số nguyên tố', () => {
    expect(isPrime(2)).toBe(true);
    expect(isPrime(3)).toBe(true);
    expect(isPrime(17)).toBe(true);
    expect(isPrime(97)).toBe(true);
  });

  it('số không nguyên tố', () => {
    expect(isPrime(1)).toBe(false);
    expect(isPrime(4)).toBe(false);
    expect(isPrime(15)).toBe(false);
    expect(isPrime(100)).toBe(false);
  });

  it('trường hợp biên: 0, số âm', () => {
    expect(isPrime(0)).toBe(false);
    expect(isPrime(-7)).toBe(false);
  });
});

// === AVERAGE ===
describe('average()', () => {
  it('tính trung bình cộng', () => {
    expect(average([1, 2, 3, 4, 5])).toBe(3);
    expect(average([10, 20])).toBe(15);
  });

  it('mảng 1 phần tử', () => {
    expect(average([42])).toBe(42);
  });

  it('ném lỗi khi mảng rỗng', () => {
    expect(() => average([])).toThrow('Mảng không được rỗng');
  });

  it('ném lỗi khi không phải mảng', () => {
    expect(() => average(null)).toThrow(Error);
    expect(() => average('1,2,3')).toThrow(Error);
  });

  it('ném lỗi khi có phần tử không phải số', () => {
    expect(() => average([1, 'two', 3])).toThrow(TypeError);
  });
});

// === ROUND ===
describe('round()', () => {
  it('làm tròn không có tham số (về số nguyên)', () => {
    expect(round(3.5)).toBe(4);
    expect(round(3.4)).toBe(3);
    expect(round(-3.5)).toBe(-3); // Math.round: -3.5 -> -3
  });

  it('làm tròn đến N chữ số thập phân', () => {
    expect(round(3.14159, 2)).toBe(3.14);
    expect(round(3.14159, 4)).toBe(3.1416);
    expect(round(1.005, 2)).toBeCloseTo(1.01, 1);
  });

  it('làm tròn số nguyên', () => {
    expect(round(100, 0)).toBe(100);
  });
});
