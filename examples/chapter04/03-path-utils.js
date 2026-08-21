// path module - xây dựng và phân tích đường dẫn file (cross-platform)
// Chạy: node 03-path-utils.js
const path = require('path');

console.log('=== Phân tích đường dẫn ===');
const filePath = '/var/www/app/public/images/avatar.png';
console.log('Đường dẫn    :', filePath);
console.log('dirname      :', path.dirname(filePath));   // /var/www/app/public/images
console.log('basename     :', path.basename(filePath));  // avatar.png
console.log('basename(ext):', path.basename(filePath, '.png')); // avatar (không có ext)
console.log('extname      :', path.extname(filePath));   // .png

console.log('\n=== Nối đường dẫn ===');
// path.join: nối thành phần, tự dùng dấu / hay \ tùy OS
const joined = path.join('folder', 'subfolder', '..', 'other', 'file.txt');
console.log('join result  :', joined); // folder/other/file.txt (tự normalize ..)

// path.resolve: tạo đường dẫn tuyệt đối từ working directory
const resolved = path.resolve('config', 'database.json');
console.log('resolve      :', resolved); // /current/working/dir/config/database.json

console.log('\n=== path.sep và path.delimiter ===');
console.log('path.sep     :', JSON.stringify(path.sep));       // '/' hoặc '\\'
console.log('path.delimiter:', JSON.stringify(path.delimiter)); // ':' hoặc ';'

console.log('\n=== normalize - dọn dẹp đường dẫn ===');
console.log(path.normalize('/foo/bar//baz/./qux/../file.txt'));
// → /foo/bar/baz/file.txt

console.log('\n=== Ví dụ thực tế: Hệ thống upload file ===');
const UPLOADS_ROOT = path.join(__dirname, 'uploads');
const userId = 'user_123';
const filename = 'my photo.jpg';

// Tạo cấu trúc thư mục theo user
const userUploadDir = path.join(UPLOADS_ROOT, userId);

// Tạo tên file an toàn (thay space bằng -, chỉ giữ chữ/số/dấu chấm/gạch)
const safeName = filename
  .replace(/\s+/g, '-')
  .replace(/[^a-zA-Z0-9._-]/g, '');

const uploadPath = path.join(userUploadDir, safeName);
console.log('Upload root :', UPLOADS_ROOT);
console.log('User dir    :', userUploadDir);
console.log('Safe name   :', safeName);
console.log('Upload path :', uploadPath);

// Kiểm tra path traversal attack (bảo mật)
// Kẻ tấn công có thể dùng ../../etc/passwd
const userInput = '../../etc/passwd';
const requestedPath = path.resolve(userUploadDir, userInput);
const isInsideUploads = requestedPath.startsWith(UPLOADS_ROOT);
console.log('\n=== Bảo mật: kiểm tra path traversal ===');
console.log('Input nguy hiểm :', userInput);
console.log('Resolved path   :', requestedPath);
console.log('An toàn?        :', isInsideUploads ? 'OK' : 'NGUY HIỂM - path traversal!');

// Lấy extension để kiểm tra loại file
const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ext = path.extname(safeName).toLowerCase();
console.log('\nExtension       :', ext);
console.log('Loại file OK?   :', allowedExts.includes(ext));
