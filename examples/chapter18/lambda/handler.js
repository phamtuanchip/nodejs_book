// AWS Lambda Handler — router cho nhiều routes
// Nhận event từ API Gateway HTTP API (payload format v2)
// GET  /users       → danh sách users
// POST /users       → tạo user mới
// GET  /users/{id}  → lấy user theo id

'use strict';

// ── Helpers response đúng format API Gateway ────────────────
function response(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',   // CORS
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

// ── Dữ liệu in-memory (thực tế dùng DynamoDB hoặc RDS) ─────
const users = [
  { id: '1', name: 'Nguyễn An',  email: 'an@example.com',    role: 'admin' },
  { id: '2', name: 'Trần Bình',  email: 'binh@example.com',  role: 'user'  },
  { id: '3', name: 'Lê Cường',   email: 'cuong@example.com', role: 'user'  },
];

// ── Route handlers ──────────────────────────────────────────

// GET /users — trả danh sách, có lọc theo role
function listUsers(event) {
  const queryParams = event.queryStringParameters || {};
  const { role, search } = queryParams;

  let result = [...users];

  if (role) {
    result = result.filter((u) => u.role === role);
  }

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  return response(200, {
    success: true,
    count: result.length,
    data: result,
  });
}

// POST /users — tạo user mới
function createUser(event) {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return response(400, { success: false, error: 'Body không phải JSON hợp lệ' });
  }

  const { name, email, role = 'user' } = body;
  if (!name || !email) {
    return response(400, { success: false, error: 'name và email là bắt buộc' });
  }

  const exists = users.find((u) => u.email === email.toLowerCase());
  if (exists) {
    return response(409, { success: false, error: 'Email đã được sử dụng' });
  }

  const newUser = {
    id: String(Date.now()),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    role,
  };
  users.push(newUser);

  return response(201, { success: true, data: newUser });
}

// GET /users/{id} — lấy user theo id
function getUser(userId) {
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return response(404, { success: false, error: 'Không tìm thấy user' });
  }
  return response(200, { success: true, data: user });
}

// ── Main handler: router đơn giản theo path và method ───────
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const method = event.requestContext?.http?.method || event.httpMethod;
  const path   = event.requestContext?.http?.path   || event.path;

  // CORS preflight
  if (method === 'OPTIONS') {
    return response(200, {}, {
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    });
  }

  // Route: GET /users
  if (method === 'GET' && path === '/users') {
    return listUsers(event);
  }

  // Route: POST /users
  if (method === 'POST' && path === '/users') {
    return createUser(event);
  }

  // Route: GET /users/{id} — path dạng /users/123
  const userMatch = path.match(/^\/users\/([^/]+)$/);
  if (method === 'GET' && userMatch) {
    return getUser(userMatch[1]);
  }

  // Health check — API Gateway có thể dùng endpoint này
  if (path === '/health') {
    return response(200, { status: 'ok', timestamp: new Date().toISOString() });
  }

  return response(404, { success: false, error: 'Route không tồn tại' });
};
