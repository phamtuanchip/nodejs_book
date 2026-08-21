// os module - thông tin về hệ điều hành và phần cứng
// Chạy: node 04-os-info.js
const os = require('os');

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value > 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(2)} ${units[unit]}`;
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d} ngày ${h} giờ ${m} phút ${s} giây`;
}

console.log('==========================================');
console.log('          BÁO CÁO THÔNG TIN HỆ THỐNG     ');
console.log('==========================================\n');

// Thông tin OS
console.log('=== Hệ điều hành ===');
console.log('Tên OS       :', os.type());         // Linux, Darwin, Windows_NT
console.log('Platform     :', os.platform());     // linux, darwin, win32
console.log('Release      :', os.release());      // kernel version
console.log('Architecture :', os.arch());         // x64, arm64
console.log('Hostname     :', os.hostname());

// Thư mục home
console.log('\n=== Thư mục ===');
console.log('Home dir     :', os.homedir());
console.log('Temp dir     :', os.tmpdir());

// Memory
const totalMem = os.totalmem();
const freeMem = os.freemem();
const usedMem = totalMem - freeMem;
const memPercent = ((usedMem / totalMem) * 100).toFixed(1);

console.log('\n=== Bộ nhớ RAM ===');
console.log('Tổng RAM     :', formatBytes(totalMem));
console.log('Đang dùng    :', formatBytes(usedMem), `(${memPercent}%)`);
console.log('Còn trống    :', formatBytes(freeMem));

// Progress bar đơn giản cho RAM
const barLen = 30;
const filled = Math.round((usedMem / totalMem) * barLen);
const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);
console.log(`RAM: [${bar}] ${memPercent}%`);

// CPU
const cpus = os.cpus();
console.log('\n=== CPU ===');
console.log('Số lõi/luồng :', cpus.length);
console.log('Model        :', cpus[0].model);
console.log('Tốc độ       :', cpus[0].speed, 'MHz');

// Tính load trung bình từng core
const totalTimes = cpus.reduce((acc, cpu) => {
  for (const [type, time] of Object.entries(cpu.times)) {
    acc[type] = (acc[type] || 0) + time;
  }
  return acc;
}, {});
const totalTime = Object.values(totalTimes).reduce((a, b) => a + b, 0);
const idlePercent = ((totalTimes.idle / totalTime) * 100).toFixed(1);
console.log('CPU idle     :', idlePercent + '%');
console.log('CPU used     :', (100 - parseFloat(idlePercent)).toFixed(1) + '%');

// Network interfaces
console.log('\n=== Network Interfaces ===');
const nets = os.networkInterfaces();
for (const [name, addrs] of Object.entries(nets)) {
  const ipv4 = addrs.find((a) => a.family === 'IPv4' && !a.internal);
  if (ipv4) {
    console.log(`  ${name}: ${ipv4.address} (${ipv4.mac})`);
  }
}

// Uptime
console.log('\n=== Uptime ===');
console.log('OS uptime    :', formatUptime(os.uptime()));
console.log('Node uptime  :', formatUptime(process.uptime()));

// Load average (chỉ có trên Unix)
if (os.loadavg()[0] > 0) {
  const [avg1, avg5, avg15] = os.loadavg();
  console.log('\n=== Load Average ===');
  console.log(`1 phút: ${avg1.toFixed(2)}  5 phút: ${avg5.toFixed(2)}  15 phút: ${avg15.toFixed(2)}`);
}

console.log('\n==========================================');
