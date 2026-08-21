// Demo bcrypt: hash password, so sánh, benchmark cost factor
// Chạy: node 01-bcrypt-demo.js  (cần: npm install bcrypt)

const bcrypt = require('bcrypt');

// ── 1. Hash password với cost factor mặc định (12) ────────────────
async function demoHash() {
  const plainPassword = 'MySecretPass123!';
  const saltRounds = 12; // cost factor — cao hơn = an toàn hơn nhưng chậm hơn

  console.log('\n=== 1. Hash Password ===');
  console.log('Plain text:', plainPassword);

  const hash = await bcrypt.hash(plainPassword, saltRounds);
  console.log('Bcrypt hash:', hash);
  console.log('Độ dài hash:', hash.length, 'ký tự (luôn là 60)');
  // Hash chứa: $2b$ + cost + salt + password đã hash
  console.log('Cấu trúc: $2b$12$[22 ký tự salt][31 ký tự hash]');
}

// ── 2. Kiểm tra password ───────────────────────────────────────────
async function demoCompare() {
  console.log('\n=== 2. So sánh Password ===');
  const password = 'MySecretPass123!';
  const hash = await bcrypt.hash(password, 10);

  const correct = await bcrypt.compare(password, hash);
  const wrong = await bcrypt.compare('SaiPassword', hash);

  console.log(`'${password}' vs hash: ${correct}`);  // true
  console.log(`'SaiPassword' vs hash: ${wrong}`);      // false
}

// ── 3. Benchmark cost factor ───────────────────────────────────────
async function benchmarkCostFactor() {
  console.log('\n=== 3. Benchmark Cost Factor ===');
  console.log('Cost  | Thời gian | Ghi chú');
  console.log('------|-----------|--------');

  for (const cost of [8, 10, 12, 14]) {
    const start = Date.now();
    await bcrypt.hash('benchmark', cost);
    const ms = Date.now() - start;

    let note = '';
    if (cost === 10) note = '(mặc định cũ)';
    if (cost === 12) note = '(khuyến nghị 2024)';
    if (cost === 14) note = '(cao, dùng cho admin)';

    console.log(`  ${cost}   | ${ms.toString().padStart(5)}ms  | ${note}`);
  }

  console.log('\nLưu ý: Mỗi tăng 1 cost = thời gian nhân đôi');
}

// ── 4. Tạo hash khác nhau từ cùng password (salt ngẫu nhiên) ──────
async function demoUniqueness() {
  console.log('\n=== 4. Mỗi lần hash cho kết quả khác nhau ===');
  const password = 'samepassword';
  const hash1 = await bcrypt.hash(password, 10);
  const hash2 = await bcrypt.hash(password, 10);

  console.log('Hash 1:', hash1);
  console.log('Hash 2:', hash2);
  console.log('Khác nhau?', hash1 !== hash2); // true — vì salt ngẫu nhiên

  // Nhưng compare vẫn hoạt động đúng với cả hai
  console.log('compare(pass, hash1):', await bcrypt.compare(password, hash1)); // true
  console.log('compare(pass, hash2):', await bcrypt.compare(password, hash2)); // true
}

// ── Main ──────────────────────────────────────────────────────────
(async () => {
  try {
    await demoHash();
    await demoCompare();
    await benchmarkCostFactor();
    await demoUniqueness();
    console.log('\nHoàn thành demo bcrypt!');
  } catch (err) {
    console.error('Lỗi:', err.message);
    process.exit(1);
  }
})();
