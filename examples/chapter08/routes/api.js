/**
 * API Routes: CRUD users
 * Base path: /api
 */

const express = require('express');
const router = express.Router();

// ─── In-memory "database" ─────────────────────────────────────────────────────

let users = [
  { id: 1, name: 'Nguyễn Văn An', email: 'an@example.com', role: 'admin', active: true, createdAt: '2024-01-01' },
  { id: 2, name: 'Trần Thị Bình', email: 'binh@example.com', role: 'user', active: true, createdAt: '2024-01-15' },
  { id: 3, name: 'Lê Văn Cường', email: 'cuong@example.com', role: 'user', active: false, createdAt: '2024-02-01' },
];
let nextId = 4;

// ─── Validation middleware (áp dụng cho POST và PUT) ─────────────────────────

function validateUserBody(req, res, next) {
  const { name, email, role } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('name phải có ít nhất 2 ký tự');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('email không hợp lệ');
  }
  if (role && !['admin', 'user', 'moderator'].includes(role)) {
    errors.push('role phải là: admin, user, moderator');
  }

  if (errors.length > 0) {
    return res.status(422).json({ error: 'Validation Error', details: errors });
  }
  next();
}

// Middleware: tìm user theo ID từ params (dùng chung cho GET/:id, PUT, DELETE)
function findUser(req, res, next) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID phải là số nguyên' });
  }
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Not Found', message: `User ${id} không tồn tại` });
  }
  req.user = user; // gán vào req để handler dùng
  req.userId = id;
  next();
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/users - lấy danh sách
router.get('/users', (req, res) => {
  let result = [...users];
  const { search, role, active, page = 1, limit = 10 } = req.query;

  // Filter
  if (search) {
    const q = search.toLowerCase();
    result = result.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  if (role) result = result.filter((u) => u.role === role);
  if (active !== undefined) result = result.filter((u) => u.active === (active === 'true'));

  // Pagination
  const total = result.length;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  result = result.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    data: result,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
});

// GET /api/users/:id
router.get('/users/:id', findUser, (req, res) => {
  res.json({ data: req.user });
});

// POST /api/users - tạo mới
router.post('/users', validateUserBody, (req, res) => {
  const { name, email, role = 'user' } = req.body;

  if (users.some((u) => u.email === email.toLowerCase())) {
    return res.status(409).json({ error: 'Conflict', message: 'Email đã được sử dụng' });
  }

  const newUser = {
    id: nextId++,
    name: name.trim(),
    email: email.toLowerCase(),
    role,
    active: true,
    createdAt: new Date().toISOString().split('T')[0],
  };
  users.push(newUser);

  res.status(201).json({ data: newUser, message: 'Tạo user thành công' });
});

// PUT /api/users/:id - cập nhật toàn bộ
router.put('/users/:id', findUser, validateUserBody, (req, res) => {
  const { name, email, role = 'user', active = true } = req.body;
  const index = users.findIndex((u) => u.id === req.userId);

  users[index] = {
    ...req.user,
    name: name.trim(),
    email: email.toLowerCase(),
    role,
    active: Boolean(active),
    updatedAt: new Date().toISOString().split('T')[0],
  };

  res.json({ data: users[index], message: 'Cập nhật thành công' });
});

// PATCH /api/users/:id - cập nhật một phần
router.patch('/users/:id', findUser, (req, res) => {
  const index = users.findIndex((u) => u.id === req.userId);
  const allowedFields = ['name', 'email', 'role', 'active'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Không có field nào để cập nhật' });
  }

  users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString().split('T')[0] };
  res.json({ data: users[index], message: 'Cập nhật thành công' });
});

// DELETE /api/users/:id
router.delete('/users/:id', findUser, (req, res) => {
  users = users.filter((u) => u.id !== req.userId);
  res.json({ data: req.user, message: 'Xóa thành công' });
});

// GET /api/stats - thống kê
router.get('/stats', (req, res) => {
  const roleCount = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  res.json({
    total: users.length,
    active: users.filter((u) => u.active).length,
    inactive: users.filter((u) => !u.active).length,
    byRole: roleCount,
  });
});

module.exports = router;
