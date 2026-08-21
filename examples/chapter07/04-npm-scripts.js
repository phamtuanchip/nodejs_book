/**
 * Chương 07 - Ví dụ 04: npm scripts
 * File này GIẢI THÍCH npm scripts - không chạy trực tiếp
 * Xem package.json trong cùng thư mục để thấy scripts thực tế
 *
 * Chạy các lệnh sau từ thư mục chapter07/:
 *   npm start          - Chạy app production
 *   npm run dev        - Chạy với nodemon (auto-restart)
 *   npm test           - Chạy tests
 *   npm run build      - Build (minify, bundle)
 *   npm run lint       - Kiểm tra code style
 *   npm run format     - Format code bằng prettier
 */

// ─── Giới thiệu npm scripts ───────────────────────────────────────────────────

const scripts = {
  // Script cơ bản - không cần "run"
  start: {
    command: 'node src/index.js',
    shortcut: 'npm start',
    giaiThich: 'Chạy app ở chế độ production',
  },

  test: {
    command: 'jest --coverage',
    shortcut: 'npm test',
    giaiThich: 'Chạy tests và tạo báo cáo coverage',
  },

  // Scripts tùy chỉnh - cần "npm run"
  dev: {
    command: 'cross-env NODE_ENV=development nodemon src/index.js',
    shortcut: 'npm run dev',
    giaiThich: 'Development mode: auto-restart khi file thay đổi, dùng cross-env để hoạt động Windows/Mac/Linux',
  },

  build: {
    command: 'cross-env NODE_ENV=production node scripts/build.js',
    shortcut: 'npm run build',
    giaiThich: 'Build cho production: minify, bundle, optimize',
  },

  lint: {
    command: 'eslint src/ --ext .js,.ts',
    shortcut: 'npm run lint',
    giaiThich: 'Kiểm tra lỗi và code style',
  },

  'lint:fix': {
    command: 'eslint src/ --ext .js,.ts --fix',
    shortcut: 'npm run lint:fix',
    giaiThich: 'Tự động sửa các lỗi lint có thể fix',
  },

  format: {
    command: 'prettier --write "src/**/*.{js,ts,json}"',
    shortcut: 'npm run format',
    giaiThich: 'Format code theo style guide',
  },

  // Script lifecycle hooks - tự động chạy
  prestart: {
    command: 'node scripts/check-env.js',
    shortcut: 'Tự động chạy TRƯỚC npm start',
    giaiThich: 'Hook lifecycle: pre + tên script. Kiểm tra env trước khi khởi động',
  },

  postbuild: {
    command: 'node scripts/upload-to-s3.js',
    shortcut: 'Tự động chạy SAU npm run build',
    giaiThich: 'Hook lifecycle: post + tên script. Upload artifacts sau khi build',
  },

  // Script phức tạp: chạy nhiều lệnh
  'check-all': {
    command: 'npm run lint && npm test && npm run build',
    shortcut: 'npm run check-all',
    giaiThich: 'Chạy tuần tự: lint → test → build. Dừng nếu bất kỳ bước nào fail (&&)',
  },

  // Script song song với npm-run-all hoặc concurrently
  'dev:all': {
    command: 'concurrently "npm run dev:server" "npm run dev:client" "npm run dev:worker"',
    shortcut: 'npm run dev:all',
    giaiThich: 'Chạy nhiều process song song: server + client + worker',
  },

  // Cross-platform environment variables
  'start:staging': {
    command: 'cross-env NODE_ENV=staging PORT=4000 node src/index.js',
    shortcut: 'npm run start:staging',
    giaiThich: 'cross-env đặt env var theo cú pháp Unix, hoạt động trên Windows',
  },
};

// ─── In hướng dẫn ─────────────────────────────────────────────────────────────

console.log('=== NPM SCRIPTS GUIDE ===\n');

Object.entries(scripts).forEach(([name, info]) => {
  console.log(`📦 "${name}"`);
  console.log(`   Lệnh:    ${info.command}`);
  console.log(`   Dùng:    ${info.shortcut}`);
  console.log(`   Mô tả:   ${info.giaiThich}`);
  console.log();
});

// ─── Lifecycle hooks ─────────────────────────────────────────────────────────

console.log('=== LIFECYCLE HOOKS ===\n');
console.log('npm start tự động chạy theo thứ tự:');
console.log('  1. prestart  (nếu có)');
console.log('  2. start     ← lệnh chính');
console.log('  3. poststart (nếu có)\n');

console.log('Tương tự cho: prebuild/build/postbuild, pretest/test/posttest...\n');

// ─── Tricks hay ─────────────────────────────────────────────────────────────

console.log('=== MẸO HỮU ÍCH ===\n');

const tips = [
  {
    title: 'Truyền arguments vào script',
    example: 'npm test -- --watch',
    note: '-- phân cách args của npm với args truyền vào script',
  },
  {
    title: 'Xem tất cả scripts có sẵn',
    example: 'npm run',
    note: 'Liệt kê mọi script trong package.json',
  },
  {
    title: 'Dùng $npm_package_version',
    example: 'echo "Version: $npm_package_version"',
    note: 'npm tự inject thông tin từ package.json vào env',
  },
  {
    title: 'Cross-platform scripts',
    example: 'cross-env NODE_ENV=production node app.js',
    note: 'Tránh dùng SET (Windows) hay export (Unix) trực tiếp',
  },
  {
    title: 'Chạy script trong package con (monorepo)',
    example: 'npm run build --workspace=packages/api',
    note: 'npm workspaces cho monorepo',
  },
];

tips.forEach(({ title, example, note }, i) => {
  console.log(`${i + 1}. ${title}`);
  console.log(`   $ ${example}`);
  console.log(`   → ${note}\n`);
});

console.log('Xem package.json để thấy scripts hoàn chỉnh.');
