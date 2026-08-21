// Streams - xử lý dữ liệu lớn theo từng chunk, không buffer toàn bộ vào RAM
// Chạy: node 07-streams.js
const fs = require('fs');
const path = require('path');
const { Transform, Readable, Writable, pipeline } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);
const TEMP_DIR = path.join(__dirname, 'temp-streams');

// ===== Chuẩn bị: tạo file lớn để test =====
async function setup() {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  const inputFile = path.join(TEMP_DIR, 'input.txt');
  const ws = fs.createWriteStream(inputFile);
  // Ghi 50,000 dòng → khoảng 2MB
  for (let i = 1; i <= 50000; i++) {
    ws.write(`Dòng ${i}: Đây là nội dung mẫu để test stream processing.\n`);
  }
  return new Promise((resolve) => ws.end(resolve));
}

// ===== 1. Readable Stream =====
async function demoReadable() {
  console.log('=== 1. Readable Stream (đọc file từng chunk) ===');
  const inputFile = path.join(TEMP_DIR, 'input.txt');
  const rs = fs.createReadStream(inputFile, { encoding: 'utf-8', highWaterMark: 64 * 1024 }); // 64KB/chunk

  let chunkCount = 0;
  let totalBytes = 0;

  for await (const chunk of rs) { // async iteration trên stream
    chunkCount++;
    totalBytes += Buffer.byteLength(chunk, 'utf-8');
  }

  console.log(`Đọc xong: ${chunkCount} chunks, tổng ${(totalBytes / 1024).toFixed(1)} KB`);
  console.log('RAM dùng (heapUsed):', (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2), 'MB');
}

// ===== 2. Transform Stream =====
async function demoTransform() {
  console.log('\n=== 2. Transform Stream (biến đổi dữ liệu khi đang đọc) ===');
  const inputFile = path.join(TEMP_DIR, 'input.txt');
  const outputFile = path.join(TEMP_DIR, 'output-upper.txt');

  // Transform: đổi text thành UPPERCASE và đếm dòng
  let lineCount = 0;
  const upperCaseTransform = new Transform({
    transform(chunk, encoding, callback) {
      const text = chunk.toString();
      lineCount += (text.match(/\n/g) || []).length;
      // push() đẩy dữ liệu đã transform vào output
      this.push(text.toUpperCase());
      callback(); // Báo hiệu đã xử lý xong chunk này
    },
    flush(callback) {
      // Được gọi khi tất cả input đã xử lý, dùng để push dữ liệu cuối cùng
      this.push(`\n--- TỔNG SỐ DÒNG: ${lineCount} ---\n`);
      callback();
    },
  });

  // Pipeline: đọc → transform → ghi (tự xử lý backpressure và cleanup)
  const start = Date.now();
  await pipelineAsync(
    fs.createReadStream(inputFile),
    upperCaseTransform,
    fs.createWriteStream(outputFile)
  );

  const inputSize = fs.statSync(inputFile).size;
  const outputSize = fs.statSync(outputFile).size;
  console.log(`Xong trong ${Date.now() - start}ms`);
  console.log(`Input : ${(inputSize / 1024).toFixed(1)} KB`);
  console.log(`Output: ${(outputSize / 1024).toFixed(1)} KB`);
  console.log(`Số dòng đếm được: ${lineCount}`);

  // Xem vài dòng đầu output
  const sample = fs.readFileSync(outputFile, 'utf-8').split('\n').slice(0, 3).join('\n');
  console.log('Sample output:', sample);
}

// ===== 3. Custom Readable Stream =====
async function demoCustomReadable() {
  console.log('\n=== 3. Custom Readable Stream (tạo dữ liệu on-demand) ===');

  // Readable stream tự tạo dữ liệu (giống generator)
  let counter = 0;
  const numberStream = new Readable({
    objectMode: true, // Cho phép push object thay vì Buffer/string
    read() {
      if (counter < 5) {
        this.push({ id: ++counter, value: counter * counter, ts: Date.now() });
      } else {
        this.push(null); // null = kết thúc stream
      }
    },
  });

  // Custom Writable để nhận object
  const printStream = new Writable({
    objectMode: true,
    write(obj, encoding, callback) {
      console.log(`  Nhận: id=${obj.id}, value=${obj.value}`);
      callback();
    },
  });

  await pipelineAsync(numberStream, printStream);
}

// ===== 4. Multi-transform pipeline =====
async function demoMultiPipeline() {
  console.log('\n=== 4. Pipeline nhiều Transform (filter + count) ===');
  const inputFile = path.join(TEMP_DIR, 'input.txt');
  const filteredFile = path.join(TEMP_DIR, 'filtered.txt');

  // Transform 1: Chỉ lấy các dòng có số chẵn
  let passedLines = 0;
  const lineFilter = new Transform({
    transform(chunk, enc, cb) {
      const lines = chunk.toString().split('\n');
      const kept = lines.filter((line) => {
        const match = line.match(/^Dòng (\d+)/);
        return match && parseInt(match[1]) % 2 === 0; // Chỉ giữ dòng chẵn
      });
      passedLines += kept.length;
      if (kept.length) this.push(kept.join('\n') + '\n');
      cb();
    },
  });

  // Transform 2: Thêm prefix vào mỗi chunk
  const addPrefix = new Transform({
    transform(chunk, enc, cb) {
      this.push('>> ' + chunk.toString().replace(/\n/g, '\n>> '));
      cb();
    },
  });

  await pipelineAsync(
    fs.createReadStream(inputFile),
    lineFilter,
    addPrefix,
    fs.createWriteStream(filteredFile)
  );

  console.log(`Giữ lại ${passedLines} dòng chẵn`);
  const size = fs.statSync(filteredFile).size;
  console.log(`File filtered: ${(size / 1024).toFixed(1)} KB`);
}

// ===== Cleanup =====
function cleanup() {
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  console.log('\nĐã xóa thư mục tạm:', TEMP_DIR);
}

// ===== Main =====
async function main() {
  console.log('Tạo file test (~2MB)...');
  await setup();
  console.log('File sẵn sàng\n');

  await demoReadable();
  await demoTransform();
  await demoCustomReadable();
  await demoMultiPipeline();
  cleanup();
}

main().catch((err) => {
  console.error('Lỗi:', err);
  process.exit(1);
});
