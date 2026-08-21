/**
 * Cấu hình Jest cho dự án Node.js
 */

module.exports = {
  // Chạy trong môi trường Node.js (không phải jsdom của browser)
  testEnvironment: 'node',

  // Thư mục chứa test files
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js',
  ],

  // Bỏ qua node_modules
  testPathIgnorePatterns: ['/node_modules/'],

  // Cấu hình coverage
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/api-server.js', // có thể bỏ qua entry point
  ],

  coverageThresholds: {
    global: {
      branches: 70,   // ít nhất 70% nhánh được test
      functions: 80,  // ít nhất 80% hàm được test
      lines: 80,      // ít nhất 80% dòng được test
      statements: 80,
    },
  },

  // Format report coverage
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',

  // Timeout mặc định 5 giây cho mỗi test
  testTimeout: 5000,

  // Chạy file setup trước mỗi test suite
  // setupFilesAfterFramework: ['<rootDir>/tests/setup.js'],

  // Hiển thị verbose khi chạy riêng lẻ
  verbose: false,
};
