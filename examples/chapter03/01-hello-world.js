// Bài đầu tiên: tìm hiểu môi trường Node.js
// Chạy: node 01-hello-world.js
console.log('Hello, World!');
console.log('Xin chào từ Node.js!\n');

// Thông tin phiên bản
console.log('=== Thông tin Node.js ===');
console.log('Node version  :', process.version);
console.log('V8 version    :', process.versions.v8);
console.log('Platform      :', process.platform); // win32, linux, darwin
console.log('Architecture  :', process.arch);     // x64, arm64

// Thư mục làm việc
console.log('\n=== Đường dẫn ===');
console.log('Working dir   :', process.cwd());
console.log('Script dir    :', __dirname);
console.log('Script file   :', __filename);

// Thời gian chạy process (tính bằng giây)
console.log('\n=== Process ===');
console.log('PID           :', process.pid);
console.log('Uptime        :', process.uptime().toFixed(3), 'giây');

// Memory usage
const mem = process.memoryUsage();
console.log('\n=== Memory Usage ===');
console.log('RSS (total)   :', (mem.rss / 1024 / 1024).toFixed(2), 'MB');
console.log('Heap used     :', (mem.heapUsed / 1024 / 1024).toFixed(2), 'MB');
console.log('Heap total    :', (mem.heapTotal / 1024 / 1024).toFixed(2), 'MB');

// console có nhiều phương thức
console.log('\n=== Console methods ===');
console.info('info: thông tin thông thường');
console.warn('warn: cảnh báo');
console.error('error: lỗi (in ra stderr)');
console.time('vòng lặp');
let sum = 0;
for (let i = 0; i < 1_000_000; i++) sum += i;
console.timeEnd('vòng lặp');
console.log('Kết quả vòng lặp:', sum);
