/**
 * Chương 06 - Ví dụ 02: REST API thuần Node.js
 * CRUD users không dùng framework
 * Chạy: node 02-json-api.js
 * Test: curl hoặc Postman
 *
 * GET    /api/users         - Lấy danh sách (hỗ trợ ?search=&page=&limit=)
 * GET    /api/users/:id     - Lấy một user
 * POST   /api/users         - Tạo user mới
 * PUT    /api/users/:id     - Cập nhật toàn bộ
 * PATCH  /api/users/:id     - Cập nhật một phần
 * DELETE /api/users/:id     - Xóa user
 */

const http = require('http');
const url = require('url');

const PORT = 3001;

// ─── In-memory database ───────────────────────────────────────────────────────

let users = [
  { id: 1, name: 'Nguyễn Văn An', email: 'an@example.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 2, name: 'Trần Thị Bình', email: 'binh@example.com', role: 'user', createdAt: '2024-01-15' },
  { id: 3, name: 'Lê Văn Cường', email: 'cuong@example.com', role: 'user', createdAt: '2024-02-01' },
];

let nextId = 4; // auto-increment ID

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body, 'utf8'),
    'Access-Control-Allow-Origin': '*', // CORS đơn giản
  });
  res.end(body);
}

// Đọc và parse request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 1e6) {
        // Giới hạn 1MB
        req.destroy();
        reject(new Error('Request body quá lớn'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('JSON không hợp lệ'));
      }
    });
    req.on('error', reject);
  });
}

// Validation cơ bản
function validateUser(data) {
  const errors = [];
  if (!data.name || data.name.trim().length < 2) {
    errors.push('name phải có ít nhất 2 ký tự');
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('email không hợp lệ');
  }
  if (data.role && !['admin', 'user', 'moderator'].includes(data.role)) {
    errors.push('role phải là admin, user hoặc moderator');
  }
  return errors;
}

// ─── Route handlers ───────────────────────────────────────────────────────────

// GET /api/users - danh sách với search, sort, pagination
function getUsers(req, res) {
  const { query } = url.parse(req.url, true);
  let result = [...users];

  // Tìm kiếm
  if (query.search) {
    const search = query.search.toLowerCase();
    result = result.filter(
      (u) => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
    );
  }

  // Lọc theo role
  if (query.role) {
    result = result.filter((u) => u.role === query.role);
  }

  // Tổng số trước pagination
  const total = result.length;

  // Pagination
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  result = result.slice(offset, offset + limit);

  sendJSON(res, 200, {
    data: result,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

// GET /api/users/:id
function getUserById(req, res, id) {
  const user = users.find((u) => u.id === id);
  if (!user) {
    return sendJSON(res, 404, { error: 'Not Found', message: `User ${id} không tồn tại` });
  }
  sendJSON(res, 200, { data: user });
}

// POST /api/users
async function createUser(req, res) {
  let body;
  try {
    body = await parseBody(req);
  } catch (err) {
    return sendJSON(res, 400, { error: 'Bad Request', message: err.message });
  }

  const errors = validateUser(body);
  if (errors.length > 0) {
    return sendJSON(res, 422, { error: 'Validation Error', details: errors });
  }

  // Kiểm tra email trùng
  if (users.some((u) => u.email === body.email)) {
    return sendJSON(res, 409, { error: 'Conflict', message: 'Email đã được sử dụng' });
  }

  const newUser = {
    id: nextId++,
    name: body.name.trim(),
    email: body.email.toLowerCase(),
    role: body.role || 'user',
    createdAt: new Date().toISOString().split('T')[0],
  };
  users.push(newUser);

  sendJSON(res, 201, { data: newUser, message: 'Tạo user thành công' });
}

// PUT /api/users/:id - thay thế toàn bộ
async function updateUser(req, res, id) {
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return sendJSON(res, 404, { error: 'Not Found', message: `User ${id} không tồn tại` });
  }

  let body;
  try {
    body = await parseBody(req);
  } catch (err) {
    return sendJSON(res, 400, { error: 'Bad Request', message: err.message });
  }

  const errors = validateUser(body);
  if (errors.length > 0) {
    return sendJSON(res, 422, { error: 'Validation Error', details: errors });
  }

  users[index] = {
    id,
    name: body.name.trim(),
    email: body.email.toLowerCase(),
    role: body.role || 'user',
    createdAt: users[index].createdAt, // giữ nguyên ngày tạo
    updatedAt: new Date().toISOString().split('T')[0],
  };

  sendJSON(res, 200, { data: users[index], message: 'Cập nhật thành công' });
}

// PATCH /api/users/:id - cập nhật một phần
async function patchUser(req, res, id) {
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return sendJSON(res, 404, { error: 'Not Found', message: `User ${id} không tồn tại` });
  }

  let body;
  try {
    body = await parseBody(req);
  } catch (err) {
    return sendJSON(res, 400, { error: 'Bad Request', message: err.message });
  }

  // Chỉ cập nhật fields được gửi lên
  const updatable = ['name', 'email', 'role'];
  const updated = { ...users[index] };
  for (const field of updatable) {
    if (body[field] !== undefined) updated[field] = body[field];
  }
  updated.updatedAt = new Date().toISOString().split('T')[0];
  users[index] = updated;

  sendJSON(res, 200, { data: users[index], message: 'Cập nhật thành công' });
}

// DELETE /api/users/:id
function deleteUser(req, res, id) {
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return sendJSON(res, 404, { error: 'Not Found', message: `User ${id} không tồn tại` });
  }
  const deleted = users.splice(index, 1)[0];
  sendJSON(res, 200, { data: deleted, message: 'Xóa thành công' });
}

// ─── Router ───────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${pathname}`);

  // Match /api/users
  if (pathname === '/api/users') {
    if (req.method === 'GET') return getUsers(req, res);
    if (req.method === 'POST') return createUser(req, res);
  }

  // Match /api/users/:id
  const userMatch = pathname.match(/^\/api\/users\/(\d+)$/);
  if (userMatch) {
    const id = parseInt(userMatch[1]);
    if (req.method === 'GET') return getUserById(req, res, id);
    if (req.method === 'PUT') return updateUser(req, res, id);
    if (req.method === 'PATCH') return patchUser(req, res, id);
    if (req.method === 'DELETE') return deleteUser(req, res, id);
  }

  // 404
  sendJSON(res, 404, { error: 'Not Found', message: `Route ${req.method} ${pathname} không tồn tại` });
});

server.listen(PORT, () => {
  console.log(`✓ REST API server tại http://localhost:${PORT}`);
  console.log('\nTest commands:');
  console.log(`  curl http://localhost:${PORT}/api/users`);
  console.log(`  curl http://localhost:${PORT}/api/users?search=an`);
  console.log(`  curl -X POST http://localhost:${PORT}/api/users \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"name":"Phạm Thị D","email":"d@example.com"}'`);
  console.log(`  curl -X DELETE http://localhost:${PORT}/api/users/1`);
});
