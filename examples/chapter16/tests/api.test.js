/**
 * Chương 16: Integration tests dùng Supertest
 * Test Express API: GET/POST/PUT/DELETE /api/users
 */

const request = require('supertest');
const { app, userService } = require('../src/api-server');

// Reset data trước mỗi test để tránh ảnh hưởng lẫn nhau
beforeEach(() => {
  userService.reset();
});

// Seed dữ liệu mẫu khi cần
async function seedUsers() {
  await userService.seed([
    { name: 'Alice Nguyễn', email: 'alice@test.com', age: 28, role: 'admin' },
    { name: 'Bob Trần', email: 'bob@test.com', age: 32 },
    { name: 'Charlie Lê', email: 'charlie@test.com', age: 25 },
  ]);
}

// === GET /api/users ===
describe('GET /api/users', () => {
  it('trả về mảng rỗng khi chưa có user', async () => {
    const res = await request(app).get('/api/users');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it('trả về danh sách users', async () => {
    await seedUsers();

    const res = await request(app).get('/api/users');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.meta.total).toBe(3);
  });

  it('filter theo role', async () => {
    await seedUsers();

    const res = await request(app).get('/api/users?role=admin');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Alice Nguyễn');
  });

  it('trả về Content-Type application/json', async () => {
    const res = await request(app).get('/api/users');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

// === GET /api/users/:id ===
describe('GET /api/users/:id', () => {
  it('lấy user theo ID thành công', async () => {
    const created = await userService.create({ name: 'Alice', email: 'alice@test.com' });

    const res = await request(app).get(`/api/users/${created.id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(created.id);
    expect(res.body.data.name).toBe('Alice');
  });

  it('trả về 404 khi ID không tồn tại', async () => {
    const res = await request(app).get('/api/users/999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeTruthy();
  });

  it('trả về 400 khi ID không phải số', async () => {
    const res = await request(app).get('/api/users/abc');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// === POST /api/users ===
describe('POST /api/users', () => {
  it('tạo user mới thành công', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'New User', email: 'new@test.com', age: 25 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: expect.any(Number),
      name: 'New User',
      email: 'new@test.com',
      age: 25,
    });
  });

  it('trả về 400 khi thiếu name', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'test@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('trả về 400 khi thiếu email', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Test User' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('trả về 400 khi email không hợp lệ', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Test', email: 'notanemail' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('trả về 409 khi email trùng', async () => {
    await userService.create({ name: 'Existing', email: 'exists@test.com' });

    const res = await request(app)
      .post('/api/users')
      .send({ name: 'New User', email: 'exists@test.com' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('số users tăng thêm 1 sau khi POST thành công', async () => {
    await seedUsers();
    const before = await userService.count();

    await request(app)
      .post('/api/users')
      .send({ name: 'New User', email: 'new@test.com' });

    const after = await userService.count();
    expect(after).toBe(before + 1);
  });
});

// === PUT /api/users/:id ===
describe('PUT /api/users/:id', () => {
  let userId;

  beforeEach(async () => {
    const user = await userService.create({ name: 'Alice', email: 'alice@test.com', age: 25 });
    userId = user.id;
  });

  it('cập nhật user thành công', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .send({ name: 'Alice Updated', age: 26 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Alice Updated');
    expect(res.body.data.age).toBe(26);
  });

  it('không thay đổi ID khi cập nhật', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .send({ name: 'Updated' });

    expect(res.body.data.id).toBe(userId);
  });

  it('trả về 404 khi user không tồn tại', async () => {
    const res = await request(app)
      .put('/api/users/999')
      .send({ name: 'Test' });

    expect(res.status).toBe(404);
  });

  it('trả về 409 khi email mới đã tồn tại', async () => {
    await userService.create({ name: 'Bob', email: 'bob@test.com' });

    const res = await request(app)
      .put(`/api/users/${userId}`)
      .send({ email: 'bob@test.com' });

    expect(res.status).toBe(409);
  });

  it('trả về 400 khi ID không phải số', async () => {
    const res = await request(app)
      .put('/api/users/abc')
      .send({ name: 'Test' });

    expect(res.status).toBe(400);
  });
});

// === DELETE /api/users/:id ===
describe('DELETE /api/users/:id', () => {
  let userId;

  beforeEach(async () => {
    const user = await userService.create({ name: 'Alice', email: 'alice@test.com' });
    userId = user.id;
  });

  it('xóa user thành công — trả về 204', async () => {
    const res = await request(app).delete(`/api/users/${userId}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({}); // 204 No Content: body rỗng
  });

  it('user thực sự bị xóa sau DELETE', async () => {
    await request(app).delete(`/api/users/${userId}`);

    // Verify bằng GET
    const getRes = await request(app).get(`/api/users/${userId}`);
    expect(getRes.status).toBe(404);
  });

  it('trả về 404 khi xóa user không tồn tại', async () => {
    const res = await request(app).delete('/api/users/999');
    expect(res.status).toBe(404);
  });

  it('trả về 400 khi ID không phải số', async () => {
    const res = await request(app).delete('/api/users/abc');
    expect(res.status).toBe(400);
  });
});

// === GET /api/users/email/:email ===
describe('GET /api/users/email/:email', () => {
  it('tìm user theo email', async () => {
    await userService.create({ name: 'Alice', email: 'alice@test.com' });

    const res = await request(app).get('/api/users/email/alice@test.com');

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Alice');
  });

  it('trả về 404 khi email không tồn tại', async () => {
    const res = await request(app).get('/api/users/email/notfound@test.com');
    expect(res.status).toBe(404);
  });
});

// === 404 ROUTE ===
describe('404 handler', () => {
  it('trả về 404 cho route không tồn tại', async () => {
    const res = await request(app).get('/api/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('trả về 404 cho method không hỗ trợ', async () => {
    const res = await request(app).patch('/api/users');
    expect(res.status).toBe(404);
  });
});

// === TEST TOÀN BỘ FLOW (End-to-End trong memory) ===
describe('User lifecycle: tạo -> đọc -> cập nhật -> xóa', () => {
  it('hoàn thành CRUD cycle', async () => {
    // 1. Tạo user
    const createRes = await request(app)
      .post('/api/users')
      .send({ name: 'Test User', email: 'test@lifecycle.com', age: 30 });
    expect(createRes.status).toBe(201);
    const userId = createRes.body.data.id;

    // 2. Đọc user vừa tạo
    const getRes = await request(app).get(`/api/users/${userId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.name).toBe('Test User');

    // 3. Cập nhật user
    const updateRes = await request(app)
      .put(`/api/users/${userId}`)
      .send({ name: 'Updated User', age: 31 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe('Updated User');

    // 4. Xóa user
    const deleteRes = await request(app).delete(`/api/users/${userId}`);
    expect(deleteRes.status).toBe(204);

    // 5. Confirm đã xóa
    const finalGet = await request(app).get(`/api/users/${userId}`);
    expect(finalGet.status).toBe(404);
  });
});
