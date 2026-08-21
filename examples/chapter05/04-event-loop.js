/**
 * Chương 05 - Ví dụ 04: Event Loop
 * Minh họa thứ tự thực thi: macrotask, microtask, nextTick
 *
 * THỨ TỰ THỰC THI:
 * 1. Synchronous code (call stack)
 * 2. process.nextTick callbacks
 * 3. Promise microtasks (.then, .catch)
 * 4. setImmediate callbacks
 * 5. setTimeout / setInterval callbacks (macrotasks)
 * 6. I/O callbacks
 */

console.log('=== MINH HỌA EVENT LOOP ===\n');

// ─── Demo 1: Thứ tự cơ bản ───────────────────────────────────────────────────

console.log('--- Demo 1: Thứ tự cơ bản ---');

console.log('[1] Sync: Bắt đầu');

setTimeout(() => console.log('[5] Macrotask: setTimeout 0ms'), 0);

setImmediate(() => console.log('[4] Check phase: setImmediate'));

Promise.resolve().then(() => console.log('[3] Microtask: Promise.then'));

process.nextTick(() => console.log('[2] NextTick: process.nextTick'));

console.log('[1] Sync: Kết thúc');

// Output thực tế:
// [1] Sync: Bắt đầu
// [1] Sync: Kết thúc
// [2] NextTick: process.nextTick
// [3] Microtask: Promise.then
// [4] Check phase: setImmediate
// [5] Macrotask: setTimeout 0ms

// ─── Demo 2: Microtask queue được drain hết trước macrotask ──────────────────

setTimeout(() => {
  console.log('\n--- Demo 2: Microtask drain ---');

  // Trong một macrotask, tất cả microtask chạy xong trước khi macrotask tiếp theo
  console.log('[A] setTimeout callback');

  Promise.resolve()
    .then(() => {
      console.log('[B] Promise 1');
      // Promise trong Promise vẫn là microtask, chạy trước macrotask tiếp
      return Promise.resolve();
    })
    .then(() => console.log('[C] Promise 2 (chained)'));

  process.nextTick(() => console.log('[D] nextTick trong setTimeout'));

  setTimeout(() => console.log('[E] setTimeout lồng nhau - chạy SAU khi microtask hết'), 0);
}, 0);

// ─── Demo 3: process.nextTick vs Promise - nextTick luôn nhanh hơn ───────────

setTimeout(() => {
  console.log('\n--- Demo 3: nextTick vs Promise ---');

  Promise.resolve().then(() => console.log('Promise microtask'));
  process.nextTick(() => console.log('nextTick - chạy trước Promise'));

  // nextTick có riêng queue, chạy trước Promise microtask queue
}, 100);

// ─── Demo 4: I/O callbacks ───────────────────────────────────────────────────

const fs = require('fs');
const os = require('os');
const path = require('path');

setTimeout(() => {
  console.log('\n--- Demo 4: I/O và Event Loop ---');

  const tmpFile = path.join(os.tmpdir(), 'eventloop_demo.txt');
  fs.writeFile(tmpFile, 'hello', () => {
    // I/O callback chạy trong poll phase
    console.log('[I/O] writeFile callback');

    // setImmediate trong I/O callback LUÔN chạy trước setTimeout
    setImmediate(() => console.log('[I/O] setImmediate trong I/O callback - chạy trước setTimeout'));
    setTimeout(() => {
      console.log('[I/O] setTimeout trong I/O callback - chạy sau setImmediate');
      fs.unlinkSync(tmpFile); // dọn dẹp
    }, 0);
  });
}, 200);

// ─── Demo 5: Blocking vs Non-blocking ────────────────────────────────────────

setTimeout(() => {
  console.log('\n--- Demo 5: Blocking vs Non-blocking ---');

  // BAD: Blocking - ngăn event loop xử lý các task khác
  function blockingOperation(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) {} // busy-wait, chiếm CPU
    return 'Done blocking';
  }

  // GOOD: Non-blocking - trả quyền kiểm soát cho event loop
  function nonBlockingOperation(ms) {
    return new Promise((resolve) => setTimeout(() => resolve('Done non-blocking'), ms));
  }

  console.time('blocking 50ms');
  blockingOperation(50); // event loop bị đóng băng 50ms
  console.timeEnd('blocking 50ms');

  console.time('non-blocking 50ms');
  nonBlockingOperation(50).then((result) => {
    console.timeEnd('non-blocking 50ms');
    console.log('✓', result, '- event loop vẫn tự do trong thời gian chờ');
  });
}, 400);

// ─── Demo 6: setInterval và clear ────────────────────────────────────────────

setTimeout(() => {
  console.log('\n--- Demo 6: setInterval ---');

  let count = 0;
  const interval = setInterval(() => {
    count++;
    console.log(`  Tick ${count}/3`);
    if (count >= 3) {
      clearInterval(interval); // QUAN TRỌNG: luôn clear interval khi xong
      console.log('  Interval đã dừng\n');
    }
  }, 50);
}, 700);

// ─── Tóm tắt thứ tự event loop ───────────────────────────────────────────────

setTimeout(() => {
  console.log('=== TÓM TẮT EVENT LOOP ===');
  console.log(`
Phases của Event Loop (Node.js):
  timers        → setTimeout, setInterval callbacks
  pending I/O   → I/O callbacks bị hoãn từ vòng trước
  idle/prepare  → nội bộ
  poll          → nhận I/O events mới
  check         → setImmediate callbacks
  close         → close events (socket.on('close'))

Microtask queue (ưu tiên cao hơn, chạy giữa các phases):
  1. process.nextTick (cao nhất)
  2. Promise .then/.catch/.finally
  3. queueMicrotask()
  `);
}, 1200);
