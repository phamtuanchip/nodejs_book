// fs module - thao tác file và thư mục theo cách ĐỒNG BỘ (blocking)
// Chạy: node 01-fs-basics.js
const fs = require('fs');
const path = require('path');

const TEMP_DIR = path.join(__dirname, 'temp');
const FILE_PATH = path.join(TEMP_DIR, 'hello.txt');
const APPEND_PATH = path.join(TEMP_DIR, 'log.txt');

// 1. Tạo thư mục (recursive: tạo cả thư mục cha nếu chưa có)
console.log('=== Thao tác thư mục ===');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  console.log('Đã tạo thư mục:', TEMP_DIR);
} else {
  console.log('Thư mục đã tồn tại:', TEMP_DIR);
}

// 2. Ghi file (ghi đè nếu đã tồn tại)
console.log('\n=== Ghi file ===');
const content = `Xin chào Node.js!\nThời gian: ${new Date().toLocaleString('vi-VN')}\n`;
fs.writeFileSync(FILE_PATH, content, 'utf-8');
console.log('Đã ghi file:', FILE_PATH);

// 3. Đọc file
console.log('\n=== Đọc file ===');
const data = fs.readFileSync(FILE_PATH, 'utf-8');
console.log('Nội dung:');
console.log(data);

// 4. Append (ghi thêm vào cuối file)
console.log('=== Append vào file ===');
for (let i = 1; i <= 3; i++) {
  fs.appendFileSync(APPEND_PATH, `Log entry ${i}: ${new Date().toISOString()}\n`);
}
console.log('Đã append 3 dòng vào:', APPEND_PATH);
console.log(fs.readFileSync(APPEND_PATH, 'utf-8'));

// 5. Thống kê file (stats)
console.log('=== File Stats ===');
const stats = fs.statSync(FILE_PATH);
console.log('Kích thước   :', stats.size, 'bytes');
console.log('Tạo lúc      :', stats.birthtime.toLocaleString('vi-VN'));
console.log('Sửa lần cuối :', stats.mtime.toLocaleString('vi-VN'));
console.log('Là file?     :', stats.isFile());
console.log('Là thư mục?  :', stats.isDirectory());

// 6. Liệt kê files trong thư mục
console.log('\n=== Liệt kê thư mục temp/ ===');
const files = fs.readdirSync(TEMP_DIR);
files.forEach((f) => {
  const s = fs.statSync(path.join(TEMP_DIR, f));
  console.log(`  ${f} (${s.size} bytes)`);
});

// 7. Đổi tên file
const renamedPath = path.join(TEMP_DIR, 'hello-renamed.txt');
fs.renameSync(FILE_PATH, renamedPath);
console.log('\nĐã đổi tên:', path.basename(FILE_PATH), '→', path.basename(renamedPath));

// 8. Xóa file
fs.unlinkSync(renamedPath);
fs.unlinkSync(APPEND_PATH);
console.log('Đã xóa các file tạm');

// 9. Xóa thư mục (phải rỗng hoặc dùng recursive)
fs.rmdirSync(TEMP_DIR);
console.log('Đã xóa thư mục temp/');
console.log('\nHoàn thành!');
