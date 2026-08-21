/**
 * Chương 05 - Ví dụ 01: Callback Pattern
 * Minh họa callback, callback hell và cách cải thiện
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Giả lập async operations ───────────────────────────────────────────────

// Giả lập đọc file config
function readConfig(filePath, callback) {
  // Dùng setTimeout để giả lập I/O bất đồng bộ
  setTimeout(() => {
    const fakeConfig = JSON.stringify({
      apiUrl: 'https://api.example.com',
      timeout: 5000,
      retries: 3,
    });
    callback(null, fakeConfig);
  }, 100);
}

// Giả lập parse JSON
function parseJSON(jsonString, callback) {
  try {
    const data = JSON.parse(jsonString);
    callback(null, data);
  } catch (err) {
    callback(new Error('JSON không hợp lệ: ' + err.message));
  }
}

// Giả lập gọi API
function fetchUserData(config, userId, callback) {
  setTimeout(() => {
    if (userId <= 0) {
      return callback(new Error('userId phải > 0'));
    }
    const user = {
      id: userId,
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@example.com',
      apiSource: config.apiUrl,
    };
    callback(null, user);
  }, 200);
}

// Giả lập lưu kết quả
function saveResult(data, callback) {
  const tmpFile = path.join(os.tmpdir(), `user_${data.id}.json`);
  fs.writeFile(tmpFile, JSON.stringify(data, null, 2), (err) => {
    if (err) return callback(err);
    callback(null, tmpFile);
  });
}

// ─── CALLBACK HELL: Lồng nhau quá sâu, khó đọc và bảo trì ──────────────────

console.log('=== CALLBACK HELL ===');

readConfig('./config.json', (err, configStr) => {
  if (err) return console.error('Lỗi đọc config:', err.message);

  parseJSON(configStr, (err, config) => {
    if (err) return console.error('Lỗi parse config:', err.message);

    fetchUserData(config, 1, (err, user) => {
      if (err) return console.error('Lỗi fetch user:', err.message);

      saveResult(user, (err, filePath) => {
        if (err) return console.error('Lỗi lưu file:', err.message);

        // Còn tiếp... mỗi bước lại thêm một cấp indent
        console.log('✓ Hoàn thành! File đã lưu tại:', filePath);
        console.log('  Dữ liệu:', user);
      });
    });
  });
});

// ─── GIẢI PHÁP 1: Named functions - tách ra thành hàm riêng ─────────────────

console.log('\n=== NAMED FUNCTIONS (cải thiện) ===');

function onSaved(err, filePath) {
  if (err) return console.error('Lỗi lưu file:', err.message);
  console.log('✓ File saved:', filePath);
}

function onUserFetched(err, user) {
  if (err) return console.error('Lỗi fetch:', err.message);
  console.log('✓ User:', user.name);
  saveResult(user, onSaved);
}

function onConfigParsed(err, config) {
  if (err) return console.error('Lỗi parse:', err.message);
  fetchUserData(config, 2, onUserFetched);
}

function onConfigRead(err, configStr) {
  if (err) return console.error('Lỗi đọc:', err.message);
  parseJSON(configStr, onConfigParsed);
}

readConfig('./config.json', onConfigRead);

// ─── GIẢI PHÁP 2: Promisify thủ công - bọc callback trong Promise ────────────

console.log('\n=== PROMISIFY (giải pháp tốt hơn) ===');

function promisify(fn) {
  // Chuyển hàm callback(err, result) thành Promise
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}

const readConfigAsync = promisify(readConfig);
const parseJSONAsync = promisify(parseJSON);
const fetchUserAsync = promisify(fetchUserData);
const saveResultAsync = promisify(saveResult);

// Node.js có sẵn util.promisify cho các hàm Node-style callback
const { promisify: nodePromisify } = require('util');
const writeFileAsync = nodePromisify(fs.writeFile);

readConfigAsync('./config.json')
  .then((configStr) => parseJSONAsync(configStr))
  .then((config) => fetchUserAsync(config, 3))
  .then((user) => {
    console.log('✓ User fetched:', user.name);
    return saveResultAsync(user);
  })
  .then((filePath) => console.log('✓ Saved to:', filePath))
  .catch((err) => console.error('Lỗi:', err.message));
