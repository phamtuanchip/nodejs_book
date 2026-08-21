// crypto module - mã hóa, hash, và tạo dữ liệu ngẫu nhiên (built-in)
// Chạy: node 06-crypto.js
const crypto = require('crypto');

// ===== 1. Hash một chiều (không giải mã được) =====
console.log('=== Hash (SHA-256) ===');
const message = 'Hello, Node.js!';
const sha256Hash = crypto.createHash('sha256').update(message).digest('hex');
console.log('Input   :', message);
console.log('SHA-256 :', sha256Hash);

// MD5 - dùng để kiểm tra toàn vẹn file, KHÔNG dùng cho password
const md5Hash = crypto.createHash('md5').update(message).digest('hex');
console.log('MD5     :', md5Hash, '(chỉ dùng cho checksum, không dùng cho password!)');

// Hash file content
const fileContent = 'Nội dung file quan trọng';
const fileHash = crypto.createHash('sha256').update(fileContent, 'utf-8').digest('hex');
console.log('File checksum:', fileHash);

// ===== 2. Password hashing với PBKDF2 (có salt) =====
console.log('\n=== Password Hashing (PBKDF2) ===');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex'); // Salt ngẫu nhiên mỗi lần
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`; // Lưu cả salt lẫn hash
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  // timingSafeEqual ngăn timing attack
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
}

const password = 'MySecretPassword123!';
const stored = hashPassword(password);
console.log('Password gốc  :', password);
console.log('Stored (salt:hash):', stored.slice(0, 50) + '...');
console.log('Đúng password?:', verifyPassword(password, stored));
console.log('Sai password? :', verifyPassword('wrongpassword', stored));

// ===== 3. HMAC - xác thực thông điệp (có key) =====
console.log('\n=== HMAC (Hash-based Message Authentication Code) ===');
const secretKey = 'my-secret-key';
const data = JSON.stringify({ userId: 123, action: 'transfer', amount: 1000 });

const hmac = crypto.createHmac('sha256', secretKey).update(data).digest('hex');
console.log('Data  :', data);
console.log('HMAC  :', hmac);
console.log('Dùng để ký API request, webhook validation, JWT...');

// Verify HMAC
function verifyHmac(data, receivedHmac, key) {
  const expected = crypto.createHmac('sha256', key).update(data).digest('hex');
  // Phải dùng timingSafeEqual để tránh timing attack
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(receivedHmac));
}
console.log('HMAC valid?   :', verifyHmac(data, hmac, secretKey));

// ===== 4. Random bytes - tạo dữ liệu ngẫu nhiên an toàn =====
console.log('\n=== Random Bytes ===');
const randomBytes = crypto.randomBytes(16);
console.log('Random hex    :', randomBytes.toString('hex'));
console.log('Random base64 :', randomBytes.toString('base64'));

// Token ngẫu nhiên cho session, reset password, v.v.
const sessionToken = crypto.randomBytes(32).toString('hex');
console.log('Session token :', sessionToken);

// Random số nguyên an toàn trong khoảng [min, max)
function randomInt(min, max) {
  return crypto.randomInt(min, max);
}
console.log('Random int [0, 100):', randomInt(0, 100));
console.log('Random int [0, 100):', randomInt(0, 100));

// ===== 5. Mã hóa đối xứng AES-256 =====
console.log('\n=== Mã hóa AES-256-GCM (đối xứng) ===');

function encrypt(plaintext, key) {
  const iv = crypto.randomBytes(12); // IV ngẫu nhiên mỗi lần encrypt
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  const tag = cipher.getAuthTag(); // Authentication tag (GCM mode)
  // Trả về iv + tag + encrypted để decrypt sau
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(ciphertext, key) {
  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.slice(0, 12);
  const tag = buf.slice(12, 28);
  const encrypted = buf.slice(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf-8');
}

// Key phải đúng 32 bytes cho AES-256
const aesKey = crypto.scryptSync('password-to-derive-key', 'salt', 32);
const secretMessage = 'Thông tin bí mật cần mã hóa';
const ciphertext = encrypt(secretMessage, aesKey);
const decrypted = decrypt(ciphertext, aesKey);

console.log('Plaintext    :', secretMessage);
console.log('Ciphertext   :', ciphertext);
console.log('Decrypted    :', decrypted);
console.log('Khớp?        :', secretMessage === decrypted);
