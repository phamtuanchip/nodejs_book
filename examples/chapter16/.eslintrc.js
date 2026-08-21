/**
 * Cấu hình ESLint cho dự án có Jest
 */

module.exports = {
  // Môi trường chạy
  env: {
    node: true,       // biến toàn cục của Node.js (process, __dirname...)
    es2022: true,     // cú pháp ES2022
    jest: true,       // biến toàn cục của Jest (describe, it, expect...)
  },

  // Bộ rules cơ bản
  extends: [
    'eslint:recommended',
    'plugin:jest/recommended', // rules tốt nhất cho Jest
  ],

  plugins: ['jest'],

  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'commonjs',
  },

  rules: {
    // === Lỗi nghiêm trọng ===
    'no-console': 'off',                  // Cho phép console.log trong Node.js
    'no-unused-vars': ['warn', {          // Cảnh báo biến không dùng
      argsIgnorePattern: '^_',            // Bỏ qua params bắt đầu bằng _
    }],

    // === Code style ===
    'eqeqeq': ['error', 'always'],       // Luôn dùng === thay vì ==
    'no-var': 'error',                   // Dùng const/let thay vì var
    'prefer-const': 'warn',              // Ưu tiên const khi không reassign
    'prefer-template': 'warn',           // Ưu tiên template literal

    // === Jest specific ===
    'jest/no-disabled-tests': 'warn',    // Cảnh báo test bị skip
    'jest/no-focused-tests': 'error',    // Không được dùng .only trong CI
    'jest/no-identical-title': 'error',  // Không trùng tên test
    'jest/prefer-to-be': 'warn',         // Dùng toBe thay vì toEqual cho primitives
    'jest/valid-expect': 'error',        // expect phải có matcher
    'jest/expect-expect': 'warn',        // Mỗi test phải có ít nhất 1 expect
  },
};
