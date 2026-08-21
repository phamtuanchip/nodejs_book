// fs.promises - thao tác file BẤT ĐỒNG BỘ với async/await
// Không block event loop, phù hợp cho server
// Chạy: node 02-fs-async.js
const fs = require('fs').promises;
const path = require('path');

const TEMP_DIR = path.join(__dirname, 'temp-async');

async function main() {
  try {
    // 1. Tạo thư mục
    await fs.mkdir(TEMP_DIR, { recursive: true });
    console.log('Đã tạo thư mục:', TEMP_DIR);

    // 2. Ghi nhiều file song song (Promise.all - nhanh hơn tuần tự)
    console.log('\n=== Ghi 3 file song song ===');
    const writeStart = Date.now();
    await Promise.all([
      fs.writeFile(path.join(TEMP_DIR, 'file1.txt'), 'Nội dung file 1\n', 'utf-8'),
      fs.writeFile(path.join(TEMP_DIR, 'file2.txt'), 'Nội dung file 2\n', 'utf-8'),
      fs.writeFile(path.join(TEMP_DIR, 'file3.json'), JSON.stringify({ key: 'value', num: 42 }, null, 2)),
    ]);
    console.log(`Ghi 3 file song song: ${Date.now() - writeStart}ms`);

    // 3. Đọc nhiều file song song
    console.log('\n=== Đọc file song song ===');
    const [content1, content2, content3] = await Promise.all([
      fs.readFile(path.join(TEMP_DIR, 'file1.txt'), 'utf-8'),
      fs.readFile(path.join(TEMP_DIR, 'file2.txt'), 'utf-8'),
      fs.readFile(path.join(TEMP_DIR, 'file3.json'), 'utf-8'),
    ]);
    console.log('file1.txt:', content1.trim());
    console.log('file2.txt:', content2.trim());
    console.log('file3.json:', JSON.parse(content3));

    // 4. Liệt kê thư mục với thông tin chi tiết
    console.log('\n=== Đọc thư mục ===');
    const entries = await fs.readdir(TEMP_DIR, { withFileTypes: true });
    for (const entry of entries) {
      const filePath = path.join(TEMP_DIR, entry.name);
      const stats = await fs.stat(filePath);
      const type = entry.isDirectory() ? 'DIR' : 'FILE';
      console.log(`  [${type}] ${entry.name} - ${stats.size} bytes`);
    }

    // 5. Copy file
    const src = path.join(TEMP_DIR, 'file1.txt');
    const dst = path.join(TEMP_DIR, 'file1-copy.txt');
    await fs.copyFile(src, dst);
    console.log('\nĐã copy file1.txt → file1-copy.txt');

    // 6. Đọc file không tồn tại - xử lý lỗi đúng cách
    console.log('\n=== Xử lý lỗi ===');
    try {
      await fs.readFile(path.join(TEMP_DIR, 'khong-ton-tai.txt'), 'utf-8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('File không tồn tại (ENOENT) - đây là lỗi dự kiến, bắt được!');
      } else {
        throw err; // Lỗi khác thì re-throw
      }
    }

  } finally {
    // Dọn dẹp dù có lỗi hay không
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
    console.log('\nĐã xóa thư mục tạm:', TEMP_DIR);
  }
}

main().catch((err) => {
  console.error('Lỗi không xử lý được:', err);
  process.exit(1);
});
