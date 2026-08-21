/**
 * Chương 06 - Ví dụ 01: HTTP Server cơ bản
 * Tạo server, xử lý routes, trả về HTML và JSON
 * Chạy: node 01-basic-server.js
 * Truy cập: http://localhost:3000
 */

const http = require('http');
const url = require('url');

const PORT = 3000;

// ─── Template HTML đơn giản ───────────────────────────────────────────────────

function renderPage(title, body) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 0 20px; }
    nav a { margin-right: 15px; color: #007bff; text-decoration: none; }
    nav a:hover { text-decoration: underline; }
    .card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
    code { background: #e9ecef; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <nav>
    <a href="/">Trang chủ</a>
    <a href="/about">Giới thiệu</a>
    <a href="/api/time">API Time</a>
    <a href="/api/echo?msg=hello">API Echo</a>
  </nav>
  <hr>
  ${body}
</body>
</html>`;
}

// ─── Route handlers ───────────────────────────────────────────────────────────

const routes = {
  'GET /': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      renderPage(
        'Trang chủ',
        `<h1>Chào mừng đến với Node.js HTTP Server!</h1>
         <div class="card">
           <p>Server đang chạy tại <code>http://localhost:${PORT}</code></p>
           <p>Thời gian server: <strong>${new Date().toLocaleString('vi-VN')}</strong></p>
         </div>
         <h2>Routes có sẵn:</h2>
         <ul>
           <li><a href="/">GET /</a> - Trang chủ</li>
           <li><a href="/about">GET /about</a> - Giới thiệu</li>
           <li><a href="/api/time">GET /api/time</a> - Thời gian JSON</li>
           <li><a href="/api/echo?msg=hello">GET /api/echo?msg=...</a> - Echo message</li>
         </ul>`
      )
    );
  },

  'GET /about': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      renderPage(
        'Giới thiệu',
        `<h1>Giới thiệu</h1>
         <div class="card">
           <p>Đây là HTTP server viết bằng Node.js thuần, không dùng framework.</p>
           <p>Chương 06 - Sách học Node.js tiếng Việt</p>
         </div>`
      )
    );
  },

  // API trả về JSON
  'GET /api/time': (req, res) => {
    const now = new Date();
    const data = {
      timestamp: now.toISOString(),
      locale: now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      unix: Math.floor(now.getTime() / 1000),
      timezone: 'Asia/Ho_Chi_Minh',
    };
    sendJSON(res, 200, data);
  },

  'GET /api/echo': (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const msg = parsedUrl.query.msg || '(không có tin nhắn)';
    sendJSON(res, 200, {
      echo: msg,
      length: msg.length,
      reversed: msg.split('').reverse().join(''),
      timestamp: new Date().toISOString(),
    });
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function send404(res) {
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(
    renderPage(
      '404 - Không tìm thấy',
      `<h1>404 - Trang không tồn tại</h1>
       <p><a href="/">← Quay về trang chủ</a></p>`
    )
  );
}

// ─── Tạo server ───────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const routeKey = `${req.method} ${parsedUrl.pathname}`;

  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);

  const handler = routes[routeKey];
  if (handler) {
    handler(req, res);
  } else {
    send404(res);
  }
});

// Xử lý lỗi server (port đang dùng, etc.)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`✗ Port ${PORT} đang bị chiếm. Hãy dùng port khác hoặc kill process hiện tại.`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`✓ Server đang chạy tại http://localhost:${PORT}`);
  console.log('  Nhấn Ctrl+C để dừng\n');
  console.log('Routes:');
  Object.keys(routes).forEach((r) => console.log(`  ${r}`));
});
