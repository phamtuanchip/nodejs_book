/**
 * Chương 06 - Ví dụ 03: Serve static files
 * Phục vụ HTML, CSS, JS, ảnh từ thư mục public/
 * Chạy: node 03-serve-static.js
 * Truy cập: http://localhost:3002
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3002;
const PUBLIC_DIR = path.join(__dirname, 'public');

// ─── MIME types mapping ───────────────────────────────────────────────────────

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// ─── Tạo cấu trúc public/ nếu chưa có ───────────────────────────────────────

function createPublicFiles() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Static File Server</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="container">
    <h1>Static File Server</h1>
    <p>Server đang phục vụ file tĩnh từ thư mục <code>public/</code></p>
    <ul>
      <li><a href="/about.html">about.html</a></li>
      <li><a href="/style.css">style.css</a></li>
      <li><a href="/data.json">data.json</a></li>
    </ul>
  </div>
  <script src="/app.js"></script>
</body>
</html>`;

  const aboutHtml = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>Giới thiệu</title><link rel="stylesheet" href="/style.css"></head>
<body><div class="container"><h1>Giới thiệu</h1><p>Trang giới thiệu.</p><a href="/">← Trang chủ</a></div></body>
</html>`;

  const styleCss = `body { font-family: Arial, sans-serif; margin: 0; background: #f0f2f5; }
.container { max-width: 800px; margin: 50px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,.1); }
h1 { color: #333; } code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }`;

  const appJs = `console.log('App.js đã được tải thành công!');
document.querySelector('h1').style.color = '#007bff';`;

  const dataJson = JSON.stringify({ message: 'Đây là file JSON tĩnh', items: ['item1', 'item2', 'item3'] }, null, 2);

  fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), indexHtml);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'about.html'), aboutHtml);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'style.css'), styleCss);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'app.js'), appJs);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'data.json'), dataJson);
  console.log('✓ Đã tạo thư mục public/ với các file mẫu');
}

// ─── Serve file với streaming ─────────────────────────────────────────────────

function serveFile(res, filePath) {
  // Kiểm tra file tồn tại và lấy stats (không dùng existsSync để tránh race condition)
  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return send404(res);
      }
      return send500(res, err);
    }

    if (stats.isDirectory()) {
      // Nếu là directory, thử serve index.html bên trong
      return serveFile(res, path.join(filePath, 'index.html'));
    }

    const mimeType = getMimeType(filePath);
    const isText = mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('javascript');

    res.writeHead(200, {
      'Content-Type': mimeType,
      'Content-Length': stats.size,
      // Cache 1 giờ cho file tĩnh
      'Cache-Control': 'public, max-age=3600',
      'Last-Modified': stats.mtime.toUTCString(),
    });

    // Dùng stream để không load toàn bộ file vào RAM - hiệu quả với file lớn
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    stream.on('error', (streamErr) => {
      console.error('Stream error:', streamErr.message);
      if (!res.headersSent) send500(res, streamErr);
    });
  });
}

function send404(res) {
  const body = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body><h1>404 - Không tìm thấy file</h1><p><a href="/">Quay về trang chủ</a></p></body></html>`;
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(body);
}

function send500(res, err) {
  res.writeHead(500, { 'Content-Type': 'text/plain' });
  res.end('500 Internal Server Error');
  console.error('Server error:', err);
}

// ─── Path traversal protection ────────────────────────────────────────────────

function sanitizePath(urlPath) {
  // Giải mã URL encoding, resolve path, đảm bảo không thoát ra ngoài PUBLIC_DIR
  const decoded = decodeURIComponent(urlPath);
  const resolved = path.resolve(PUBLIC_DIR, '.' + decoded);

  // Kiểm tra resolved path có bắt đầu bằng PUBLIC_DIR không
  if (!resolved.startsWith(PUBLIC_DIR)) {
    return null; // Path traversal attack!
  }
  return resolved;
}

// ─── Main server ──────────────────────────────────────────────────────────────

createPublicFiles();

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain', Allow: 'GET, HEAD' });
    return res.end('405 Method Not Allowed');
  }

  const parsedUrl = url.parse(req.url);
  const filePath = sanitizePath(parsedUrl.pathname);

  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${parsedUrl.pathname}`);

  if (!filePath) {
    // Path traversal bị chặn
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`✓ Static file server tại http://localhost:${PORT}`);
  console.log(`  Phục vụ file từ: ${PUBLIC_DIR}`);
});
