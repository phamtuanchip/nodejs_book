/**
 * Chương 05 - Ví dụ 03: Async/Await
 * Viết async code như sync, xử lý lỗi, tuần tự vs song song
 */

const fs = require('fs').promises; // fs module với Promise API
const path = require('path');
const os = require('os');

// ─── Helper: giả lập API calls ───────────────────────────────────────────────

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchUser(id) {
  await delay(100);
  if (id > 100) throw new Error(`User ${id} không tồn tại`);
  return { id, name: `User_${id}`, score: Math.floor(Math.random() * 100) };
}

async function fetchOrders(userId) {
  await delay(80);
  return Array.from({ length: 3 }, (_, i) => ({
    orderId: `ORD-${userId}-${i + 1}`,
    amount: (i + 1) * 150000,
    status: i === 0 ? 'delivered' : 'pending',
  }));
}

async function fetchRecommendations(category) {
  await delay(120);
  return [`Sản phẩm ${category}-A`, `Sản phẩm ${category}-B`];
}

// ─── Async/Await cơ bản: đọc tuần tự ────────────────────────────────────────

console.log('=== TUẦN TỰ (sequential) ===');

async function loadUserProfile(userId) {
  // try/catch thay cho .catch() - dễ đọc hơn
  try {
    console.log(`Đang tải profile user ${userId}...`);

    const user = await fetchUser(userId);          // chờ xong mới tiếp
    console.log('✓ User:', user.name);

    const orders = await fetchOrders(user.id);    // chờ xong mới tiếp
    console.log(`✓ Orders: ${orders.length} đơn hàng`);

    return { user, orders };
  } catch (err) {
    console.error('✗ Lỗi tải profile:', err.message);
    throw err; // re-throw để caller biết
  }
}

loadUserProfile(42);

// ─── Song song với Promise.all - nhanh hơn nhiều ─────────────────────────────

console.log('\n=== SONG SONG (parallel với Promise.all) ===');

async function loadDashboard(userId) {
  const startTime = Date.now();

  try {
    // Chạy 3 requests CÙNG LÚC, không chờ nhau
    const [user, orders, recommendations] = await Promise.all([
      fetchUser(userId),
      fetchOrders(userId),
      fetchRecommendations('electronics'),
    ]);

    const elapsed = Date.now() - startTime;
    console.log(`✓ Dashboard tải xong trong ${elapsed}ms (song song)`);
    console.log(`  User: ${user.name} | Score: ${user.score}`);
    console.log(`  Orders: ${orders.length} | Gợi ý: ${recommendations.length} sản phẩm`);

    return { user, orders, recommendations };
  } catch (err) {
    console.error('✗ Dashboard error:', err.message);
  }
}

loadDashboard(7);

// ─── Đọc nhiều file: tuần tự vs song song ────────────────────────────────────

console.log('\n=== ĐỌC FILE: TUẦN TỰ vs SONG SONG ===');

async function setupTempFiles() {
  // Tạo file tạm để demo
  const files = [];
  for (let i = 1; i <= 3; i++) {
    const filePath = path.join(os.tmpdir(), `demo_ch05_${i}.txt`);
    await fs.writeFile(filePath, `Nội dung file ${i}\nDữ liệu dòng 2\nDữ liệu dòng 3`);
    files.push(filePath);
  }
  return files;
}

async function readFilesSequential(filePaths) {
  const start = Date.now();
  const contents = [];

  // Tuần tự: await từng file một → tổng time = sum(time mỗi file)
  for (const filePath of filePaths) {
    const content = await fs.readFile(filePath, 'utf8');
    contents.push({ file: path.basename(filePath), lines: content.split('\n').length });
  }

  console.log(`Tuần tự: ${Date.now() - start}ms`);
  return contents;
}

async function readFilesParallel(filePaths) {
  const start = Date.now();

  // Song song: tạo tất cả Promise trước, rồi await cùng lúc
  const promises = filePaths.map((fp) => fs.readFile(fp, 'utf8'));
  const contents = await Promise.all(promises);

  const result = filePaths.map((fp, i) => ({
    file: path.basename(fp),
    lines: contents[i].split('\n').length,
  }));

  console.log(`Song song: ${Date.now() - start}ms`);
  return result;
}

async function compareReadMethods() {
  const files = await setupTempFiles();

  const sequential = await readFilesSequential(files);
  const parallel = await readFilesParallel(files);

  console.log('Kết quả tuần tự:', sequential.map((f) => f.file).join(', '));
  console.log('Kết quả song song:', parallel.map((f) => f.file).join(', '));

  // Dọn dẹp file tạm
  await Promise.all(files.map((f) => fs.unlink(f)));
  console.log('✓ Đã xóa file tạm');
}

compareReadMethods();

// ─── Lỗi bất ngờ: async trong forEach - KHÔNG hoạt động như mong đợi ────────

console.log('\n=== CẠNH BẪY: async trong forEach ===');

async function wrongWay() {
  const ids = [1, 2, 3];
  const results = [];

  // SAI: forEach không await, results sẽ rỗng
  ids.forEach(async (id) => {
    const user = await fetchUser(id);
    results.push(user);
  });

  // results vẫn rỗng tại đây vì forEach không chờ
  console.log('WRONG forEach results length:', results.length); // 0
}

async function rightWay() {
  const ids = [1, 2, 3];

  // ĐÚNG cách 1: for...of loop
  const sequential = [];
  for (const id of ids) {
    const user = await fetchUser(id);
    sequential.push(user.name);
  }
  console.log('✓ for...of:', sequential.join(', '));

  // ĐÚNG cách 2: map + Promise.all (song song)
  const parallel = await Promise.all(ids.map((id) => fetchUser(id)));
  console.log('✓ map+all:', parallel.map((u) => u.name).join(', '));
}

wrongWay();
setTimeout(() => rightWay(), 500);

// ─── Retry pattern với async/await ───────────────────────────────────────────

console.log('\n=== RETRY PATTERN ===');

let attemptCount = 0;

async function unstableAPI() {
  attemptCount++;
  await delay(50);
  // Giả lập API thất bại 2 lần đầu
  if (attemptCount < 3) throw new Error(`Lần thử ${attemptCount} thất bại`);
  return { data: 'Thành công ở lần thứ 3' };
}

async function withRetry(fn, maxRetries = 3, delayMs = 100) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      console.log(`✓ Thành công sau ${attempt} lần thử`);
      return result;
    } catch (err) {
      console.log(`  Lần ${attempt}/${maxRetries} thất bại: ${err.message}`);
      if (attempt === maxRetries) throw err;
      await delay(delayMs * attempt); // exponential backoff đơn giản
    }
  }
}

setTimeout(async () => {
  try {
    const result = await withRetry(unstableAPI, 3);
    console.log('  Kết quả:', result.data);
  } catch (err) {
    console.error('✗ Tất cả lần thử đều thất bại:', err.message);
  }
}, 1000);
