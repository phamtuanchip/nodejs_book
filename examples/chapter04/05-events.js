// EventEmitter - trái tim của Node.js async pattern
// Chạy: node 05-events.js
const { EventEmitter } = require('events');

// ===== Class Logger tùy chỉnh =====
class Logger extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.logCount = 0;
  }

  log(message) {
    this.logCount++;
    const entry = { level: 'info', message, time: new Date().toISOString(), count: this.logCount };
    this.emit('log', entry); // Phát sự kiện 'log'
  }

  warn(message) {
    const entry = { level: 'warn', message, time: new Date().toISOString() };
    this.emit('warn', entry);
    this.emit('log', entry); // warn cũng trigger log
  }

  error(message, err) {
    const entry = { level: 'error', message, error: err?.message, time: new Date().toISOString() };
    this.emit('error', entry); // 'error' event đặc biệt: nếu không có listener sẽ throw!
  }
}

const logger = new Logger('AppLogger');

// ===== Đăng ký listeners =====
console.log('=== Đăng ký listeners ===\n');

// Listener in ra console (màu theo level)
logger.on('log', (entry) => {
  const prefix = entry.level === 'warn' ? '[WARN]' : '[INFO]';
  console.log(`${prefix} ${entry.time} - ${entry.message}`);
});

// Listener thứ 2: lưu vào "database" (giả lập)
const logHistory = [];
logger.on('log', (entry) => {
  logHistory.push(entry);
});

// once: chỉ chạy 1 lần duy nhất
logger.once('log', (entry) => {
  console.log('>>> Đây là log đầu tiên! (once listener)');
});

// Listener riêng cho warn
logger.on('warn', (entry) => {
  console.log(`   ^ Cảnh báo cần chú ý: ${entry.message}`);
});

// PHẢI có listener cho 'error' nếu không muốn crash!
logger.on('error', (entry) => {
  console.error(`[ERROR] ${entry.time} - ${entry.message}`, entry.error || '');
});

// ===== Sử dụng =====
console.log('=== Ghi logs ===\n');
logger.log('Server khởi động');
logger.log('Kết nối database thành công');
logger.warn('Bộ nhớ sắp đầy: 85%');
logger.log('Request từ 192.168.1.1');
logger.error('Không thể đọc file config', new Error('ENOENT: no such file'));

// ===== Thông tin về listeners =====
console.log('\n=== Listener Info ===');
console.log('Số listeners trên "log":', logger.listenerCount('log'));
console.log('Tên các events:', logger.eventNames());

// ===== removeListener =====
function tempListener(entry) {
  console.log('[TEMP]', entry.message);
}
logger.on('log', tempListener);
logger.log('Log này có temp listener');
logger.removeListener('log', tempListener); // hoặc logger.off('log', tempListener)
logger.log('Log này KHÔNG có temp listener nữa');

console.log('\n=== Log History (lưu bởi listener thứ 2) ===');
console.log(`Tổng số entries: ${logHistory.length}`);
logHistory.forEach((e, i) => console.log(`  ${i + 1}. [${e.level}] ${e.message}`));

// ===== Ví dụ nâng cao: EventEmitter cho task queue =====
console.log('\n=== Task Queue với EventEmitter ===');

class TaskQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.running = false;
  }

  add(task) {
    this.queue.push(task);
    this.emit('taskAdded', { total: this.queue.length });
    if (!this.running) this.run();
  }

  async run() {
    this.running = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      this.emit('taskStart', task);
      try {
        const result = await task.fn();
        this.emit('taskDone', { ...task, result });
      } catch (err) {
        this.emit('taskError', { ...task, error: err.message });
      }
    }
    this.running = false;
    this.emit('queueEmpty');
  }
}

const queue = new TaskQueue();
queue.on('taskAdded', ({ total }) => console.log(`Task thêm vào, queue size: ${total}`));
queue.on('taskStart', (t) => console.log(`Bắt đầu: ${t.name}`));
queue.on('taskDone', (t) => console.log(`Xong: ${t.name} → ${t.result}`));
queue.on('taskError', (t) => console.log(`Lỗi: ${t.name} - ${t.error}`));
queue.on('queueEmpty', () => console.log('Tất cả tasks hoàn thành!'));

// Thêm tasks
queue.add({ name: 'Task A', fn: () => Promise.resolve('kết quả A') });
queue.add({ name: 'Task B', fn: () => Promise.resolve('kết quả B') });
queue.add({ name: 'Task C', fn: () => Promise.reject(new Error('lỗi C')) });
