/**
 * Chương 16: Express API Server nhỏ để integration test
 * /api/users CRUD endpoints
 */

const express = require('express');
const { UserService, UserNotFoundError, DuplicateEmailError, ValidationError } = require('./user-service');

const app = express();
app.use(express.json());

// Tạo 1 instance UserService cho toàn app
const userService = new UserService();

// Seed một số data ban đầu
(async () => {
  try {
    await userService.seed([
      { name: 'Alice Nguyễn', email: 'alice@example.com', age: 28, role: 'admin' },
      { name: 'Bob Trần', email: 'bob@example.com', age: 32 },
    ]);
  } catch {
    // Bỏ qua lỗi seed khi restart
  }
})();

// Helper xử lý lỗi chung
function handleError(res, err) {
  if (err instanceof UserNotFoundError) {
    return res.status(404).json({ success: false, error: err.message });
  }
  if (err instanceof DuplicateEmailError) {
    return res.status(409).json({ success: false, error: err.message });
  }
  if (err instanceof ValidationError) {
    return res.status(400).json({ success: false, error: err.message });
  }
  // Lỗi không xác định
  console.error(err);
  return res.status(500).json({ success: false, error: 'Lỗi server nội bộ' });
}

// === ROUTES ===

// GET /api/users — danh sách users
app.get('/api/users', async (req, res) => {
  try {
    const { role, active } = req.query;
    const filters = {};
    if (role) filters.role = role;
    if (active !== undefined) filters.active = active === 'true';

    const users = await userService.findAll(filters);
    const total = users.length;

    res.json({
      success: true,
      data: users,
      meta: { total },
    });
  } catch (err) {
    handleError(res, err);
  }
});

// GET /api/users/:id — lấy user theo ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID phải là số nguyên' });
    }

    const user = await userService.findById(id);
    res.json({ success: true, data: user });
  } catch (err) {
    handleError(res, err);
  }
});

// POST /api/users — tạo user mới
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, age, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu name hoặc email',
      });
    }

    const user = await userService.create({ name, email, age, role });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    handleError(res, err);
  }
});

// PUT /api/users/:id — cập nhật user
app.put('/api/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID phải là số nguyên' });
    }

    const user = await userService.update(id, req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    handleError(res, err);
  }
});

// DELETE /api/users/:id — xóa user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID phải là số nguyên' });
    }

    await userService.delete(id);
    res.status(204).send();
  } catch (err) {
    handleError(res, err);
  }
});

// GET /api/users/email/:email — tìm theo email
app.get('/api/users/email/:email', async (req, res) => {
  try {
    const user = await userService.findByEmail(req.params.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: `Không tìm thấy user với email: ${req.params.email}`,
      });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    handleError(res, err);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.path} không tồn tại` });
});

// Chỉ start server khi chạy trực tiếp (không phải khi import để test)
if (require.main === module) {
  const PORT = process.env.PORT || 3004;
  app.listen(PORT, () => {
    console.log(`API Server chạy tại http://localhost:${PORT}`);
    console.log('Endpoints: GET/POST /api/users, GET/PUT/DELETE /api/users/:id');
  });
}

// Export app và service để integration test dùng
module.exports = { app, userService };
