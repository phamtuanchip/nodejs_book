/**
 * Chương 06 - Ví dụ 04: HTTPS Server với self-signed certificate
 *
 * BƯỚC 1: Tạo self-signed certificate (chạy 1 lần)
 *   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
 *     -subj "/C=VN/ST=HoChiMinh/L=HoChiMinh/O=Dev/CN=localhost"
 *
 * BƯỚC 2: Chạy server
 *   node 04-https-server.js
 *
 * BƯỚC 3: Truy cập https://localhost:3443
 *   (Trình duyệt sẽ cảnh báo cert không tin cậy - bấm "Advanced" → "Proceed")
 *
 * Chạy: node 04-https-server.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HTTPS_PORT = 3443;
const HTTP_PORT = 3080; // redirect HTTP → HTTPS
const CERT_DIR = __dirname;

// ─── Tạo self-signed cert tự động nếu chưa có ────────────────────────────────

function ensureCertExists() {
  const keyPath = path.join(CERT_DIR, 'key.pem');
  const certPath = path.join(CERT_DIR, 'cert.pem');

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('✓ Đã có certificate');
    return { keyPath, certPath };
  }

  console.log('Đang tạo self-signed certificate...');

  try {
    // Thử dùng openssl nếu có cài đặt
    execSync(
      `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes` +
        ` -subj "/C=VN/ST=HoChiMinh/L=HoChiMinh/O=Dev/CN=localhost"`,
      { stdio: 'pipe' }
    );
    console.log('✓ Đã tạo certificate bằng openssl');
    return { keyPath, certPath };
  } catch {
    // openssl không có sẵn, tạo cert giả để demo
    console.log('⚠ openssl không tìm thấy. Tạo placeholder certificate cho demo...');
    console.log('  Để có HTTPS thật: cài openssl và chạy lại, hoặc dùng mkcert');
    return null;
  }
}

// ─── App logic (dùng chung cho HTTP và HTTPS) ─────────────────────────────────

function handleRequest(req, res) {
  const isHTTPS = req.socket.encrypted;
  const host = req.headers.host || `localhost:${HTTPS_PORT}`;

  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>HTTPS Server Demo</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 700px; margin: 50px auto; padding: 20px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-weight: bold; }
    .https { background: #d4edda; color: #155724; }
    .http { background: #f8d7da; color: #721c24; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>HTTPS Server Demo</h1>
  <p>Kết nối: <span class="badge ${isHTTPS ? 'https' : 'http'}">${isHTTPS ? 'HTTPS (An toàn)' : 'HTTP (Không mã hóa)'}</span></p>

  <h2>Thông tin request:</h2>
  <pre>${JSON.stringify({
    method: req.method,
    url: req.url,
    host,
    protocol: isHTTPS ? 'https' : 'http',
    httpVersion: req.httpVersion,
    userAgent: req.headers['user-agent'],
  }, null, 2)}</pre>

  <h2>Lệnh tạo certificate:</h2>
  <pre>openssl req -x509 -newkey rsa:2048 \\
  -keyout key.pem -out cert.pem \\
  -days 365 -nodes \\
  -subj "/C=VN/ST=HoChiMinh/O=Dev/CN=localhost"</pre>

  <h2>So sánh HTTP vs HTTPS:</h2>
  <ul>
    <li><strong>HTTP</strong>: Dữ liệu truyền dạng plaintext, không mã hóa</li>
    <li><strong>HTTPS</strong>: Dữ liệu được mã hóa bằng TLS/SSL</li>
    <li><strong>Self-signed cert</strong>: Dùng trong development, browser sẽ cảnh báo</li>
    <li><strong>Let's Encrypt</strong>: Dùng trong production, miễn phí, được browser tin tưởng</li>
  </ul>
</body>
</html>`);
  } else if (req.url === '/api/info') {
    const data = {
      secure: isHTTPS,
      server: 'Node.js HTTPS Demo',
      protocol: isHTTPS ? 'TLS 1.3' : 'HTTP/1.1',
      cipher: req.socket.getCipher ? req.socket.getCipher() : null,
      timestamp: new Date().toISOString(),
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
}

// ─── HTTP → HTTPS redirect server ────────────────────────────────────────────

const httpRedirectServer = http.createServer((req, res) => {
  const httpsUrl = `https://${req.headers.host?.replace(HTTP_PORT, HTTPS_PORT) || 'localhost:' + HTTPS_PORT}${req.url}`;
  console.log(`[Redirect] HTTP → ${httpsUrl}`);
  // 301 Permanent redirect
  res.writeHead(301, { Location: httpsUrl });
  res.end();
});

// ─── Khởi động servers ────────────────────────────────────────────────────────

const certPaths = ensureCertExists();

if (certPaths) {
  try {
    const sslOptions = {
      key: fs.readFileSync(certPaths.keyPath),
      cert: fs.readFileSync(certPaths.certPath),
      // Tùy chọn bảo mật nâng cao:
      // minVersion: 'TLSv1.2',   // tối thiểu TLS 1.2
      // ciphers: 'HIGH:!aNULL:!MD5', // chỉ dùng cipher mạnh
    };

    const httpsServer = https.createServer(sslOptions, handleRequest);

    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`✓ HTTPS server tại https://localhost:${HTTPS_PORT}`);
      console.log('  (Bỏ qua cảnh báo cert không tin cậy trong browser)');
    });

    httpRedirectServer.listen(HTTP_PORT, () => {
      console.log(`✓ HTTP redirect server tại http://localhost:${HTTP_PORT} → HTTPS`);
    });

    console.log('\nEndpoints:');
    console.log(`  https://localhost:${HTTPS_PORT}/`);
    console.log(`  https://localhost:${HTTPS_PORT}/api/info`);
    console.log(`  http://localhost:${HTTP_PORT}/ (redirect → HTTPS)`);
  } catch (err) {
    console.error('✗ Không thể đọc certificate:', err.message);
    console.log('\nFallback: Chạy HTTP server bình thường...');
    startHttpFallback();
  }
} else {
  startHttpFallback();
}

function startHttpFallback() {
  // Fallback: chạy HTTP bình thường để demo logic
  const fallbackServer = http.createServer(handleRequest);
  fallbackServer.listen(HTTP_PORT, () => {
    console.log(`✓ HTTP fallback server tại http://localhost:${HTTP_PORT}`);
    console.log('  Cài openssl để dùng HTTPS thật sự');
  });
}
