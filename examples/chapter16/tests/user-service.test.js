/**
 * Chương 16: Unit tests cho UserService
 * Jest: beforeEach reset data, test async, custom errors
 */

const { UserService, UserNotFoundError, DuplicateEmailError, ValidationError } = require('../src/user-service');

// Dùng 1 instance dùng chung, reset trước mỗi test
let service;

beforeEach(() => {
  service = new UserService();
});

// === CREATE ===
describe('UserService.create()', () => {
  it('tạo user mới thành công', async () => {
    const user = await service.create({
      name: 'Alice',
      email: 'alice@test.com',
      age: 25,
    });

    expect(user).toMatchObject({
      id: expect.any(Number),
      name: 'Alice',
      email: 'alice@test.com',
      age: 25,
      role: 'user',
      active: true,
    });
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('email tự động chuyển về lowercase', async () => {
    const user = await service.create({ name: 'Bob', email: 'BOB@TEST.COM' });
    expect(user.email).toBe('bob@test.com');
  });

  it('role mặc định là "user"', async () => {
    const user = await service.create({ name: 'Charlie', email: 'charlie@test.com' });
    expect(user.role).toBe('user');
  });

  it('có thể set role tùy chỉnh', async () => {
    const user = await service.create({ name: 'Admin', email: 'admin@test.com', role: 'admin' });
    expect(user.role).toBe('admin');
  });

  it('ném DuplicateEmailError khi email đã tồn tại', async () => {
    await service.create({ name: 'Alice', email: 'alice@test.com' });

    await expect(
      service.create({ name: 'Alice 2', email: 'alice@test.com' })
    ).rejects.toThrow(DuplicateEmailError);

    await expect(
      service.create({ name: 'Alice 3', email: 'ALICE@TEST.COM' }) // case insensitive
    ).rejects.toThrow(DuplicateEmailError);
  });

  it('ném ValidationError khi thiếu name', async () => {
    await expect(
      service.create({ name: '', email: 'test@test.com' })
    ).rejects.toThrow(ValidationError);

    await expect(
      service.create({ name: 'A', email: 'test@test.com' }) // quá ngắn
    ).rejects.toThrow('Tên phải có ít nhất 2 ký tự');
  });

  it('ném ValidationError khi email không hợp lệ', async () => {
    await expect(
      service.create({ name: 'Alice', email: 'not-an-email' })
    ).rejects.toThrow(ValidationError);

    await expect(
      service.create({ name: 'Alice', email: '' })
    ).rejects.toThrow(ValidationError);
  });

  it('ném ValidationError khi tuổi không hợp lệ', async () => {
    await expect(
      service.create({ name: 'Alice', email: 'a@test.com', age: -1 })
    ).rejects.toThrow('Tuổi không hợp lệ');

    await expect(
      service.create({ name: 'Alice', email: 'b@test.com', age: 200 })
    ).rejects.toThrow(ValidationError);
  });

  it('trả về copy của user, không phải reference', async () => {
    const user = await service.create({ name: 'Alice', email: 'alice@test.com' });
    user.name = 'Modified'; // thay đổi copy

    const found = await service.findById(user.id);
    expect(found.name).toBe('Alice'); // data gốc không thay đổi
  });
});

// === FIND ALL ===
describe('UserService.findAll()', () => {
  beforeEach(async () => {
    await service.seed([
      { name: 'Alice', email: 'alice@test.com', role: 'admin' },
      { name: 'Bob', email: 'bob@test.com' },
      { name: 'Charlie', email: 'charlie@test.com' },
    ]);
  });

  it('lấy tất cả users', async () => {
    const users = await service.findAll();
    expect(users).toHaveLength(3);
  });

  it('filter theo role', async () => {
    const admins = await service.findAll({ role: 'admin' });
    expect(admins).toHaveLength(1);
    expect(admins[0].name).toBe('Alice');
  });

  it('filter theo active', async () => {
    await service.update(2, { active: false });

    const activeUsers = await service.findAll({ active: true });
    expect(activeUsers).toHaveLength(2);

    const inactiveUsers = await service.findAll({ active: false });
    expect(inactiveUsers).toHaveLength(1);
  });

  it('trả về mảng rỗng khi không có user', async () => {
    service.reset();
    const users = await service.findAll();
    expect(users).toEqual([]);
    expect(Array.isArray(users)).toBe(true);
  });
});

// === FIND BY ID ===
describe('UserService.findById()', () => {
  it('lấy user theo ID', async () => {
    const created = await service.create({ name: 'Alice', email: 'alice@test.com' });
    const found = await service.findById(created.id);

    expect(found.id).toBe(created.id);
    expect(found.email).toBe('alice@test.com');
  });

  it('ném UserNotFoundError khi không tìm thấy', async () => {
    await expect(service.findById(999)).rejects.toThrow(UserNotFoundError);
    await expect(service.findById(999)).rejects.toThrow('ID=999');
  });

  it('lỗi có statusCode 404', async () => {
    try {
      await service.findById(999);
    } catch (err) {
      expect(err.statusCode).toBe(404);
      expect(err.name).toBe('UserNotFoundError');
    }
  });
});

// === FIND BY EMAIL ===
describe('UserService.findByEmail()', () => {
  beforeEach(async () => {
    await service.create({ name: 'Alice', email: 'alice@test.com' });
  });

  it('tìm user theo email', async () => {
    const user = await service.findByEmail('alice@test.com');
    expect(user).not.toBeNull();
    expect(user.name).toBe('Alice');
  });

  it('không phân biệt hoa/thường', async () => {
    const user = await service.findByEmail('ALICE@TEST.COM');
    expect(user).not.toBeNull();
  });

  it('trả về null khi không tìm thấy', async () => {
    const user = await service.findByEmail('notfound@test.com');
    expect(user).toBeNull();
  });

  it('trả về null khi email rỗng', async () => {
    expect(await service.findByEmail('')).toBeNull();
    expect(await service.findByEmail(null)).toBeNull();
  });
});

// === UPDATE ===
describe('UserService.update()', () => {
  let userId;

  beforeEach(async () => {
    const user = await service.create({ name: 'Alice', email: 'alice@test.com', age: 25 });
    userId = user.id;
  });

  it('cập nhật tên thành công', async () => {
    const updated = await service.update(userId, { name: 'Alice Nguyễn' });
    expect(updated.name).toBe('Alice Nguyễn');
  });

  it('cập nhật nhiều fields', async () => {
    const updated = await service.update(userId, { name: 'Bob', age: 30, role: 'admin' });
    expect(updated).toMatchObject({ name: 'Bob', age: 30, role: 'admin' });
  });

  it('không thay đổi ID khi update', async () => {
    const updated = await service.update(userId, { name: 'New Name' });
    expect(updated.id).toBe(userId);
  });

  it('ném UserNotFoundError khi ID không tồn tại', async () => {
    await expect(service.update(999, { name: 'Test' })).rejects.toThrow(UserNotFoundError);
  });

  it('ném DuplicateEmailError khi email mới đã tồn tại', async () => {
    await service.create({ name: 'Bob', email: 'bob@test.com' });

    await expect(
      service.update(userId, { email: 'bob@test.com' })
    ).rejects.toThrow(DuplicateEmailError);
  });

  it('cập nhật updatedAt', async () => {
    const before = (await service.findById(userId)).updatedAt;
    await new Promise(r => setTimeout(r, 1)); // đảm bảo thời gian khác nhau
    await service.update(userId, { name: 'Updated' });
    const after = (await service.findById(userId)).updatedAt;

    expect(after.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

// === DELETE ===
describe('UserService.delete()', () => {
  let userId;

  beforeEach(async () => {
    const user = await service.create({ name: 'Alice', email: 'alice@test.com' });
    userId = user.id;
  });

  it('xóa user thành công', async () => {
    const result = await service.delete(userId);
    expect(result).toBe(true);

    // Confirm user đã bị xóa
    await expect(service.findById(userId)).rejects.toThrow(UserNotFoundError);
  });

  it('ném UserNotFoundError khi ID không tồn tại', async () => {
    await expect(service.delete(999)).rejects.toThrow(UserNotFoundError);
  });

  it('giảm tổng số users sau khi xóa', async () => {
    const before = await service.count();
    await service.delete(userId);
    const after = await service.count();
    expect(after).toBe(before - 1);
  });
});

// === COUNT ===
describe('UserService.count()', () => {
  it('đếm tổng số users', async () => {
    expect(await service.count()).toBe(0);

    await service.create({ name: 'Alice', email: 'a@test.com' });
    await service.create({ name: 'Bob', email: 'b@test.com' });

    expect(await service.count()).toBe(2);
  });

  it('đếm theo filter', async () => {
    await service.create({ name: 'Admin', email: 'admin@test.com', role: 'admin' });
    await service.create({ name: 'User', email: 'user@test.com', role: 'user' });

    expect(await service.count({ role: 'admin' })).toBe(1);
    expect(await service.count({ role: 'user' })).toBe(1);
  });
});

// === RESET ===
describe('UserService.reset()', () => {
  it('xóa toàn bộ data', async () => {
    await service.create({ name: 'Alice', email: 'a@test.com' });
    service.reset();
    expect(await service.count()).toBe(0);
  });

  it('reset ID counter về 1', async () => {
    await service.create({ name: 'Alice', email: 'a@test.com' });
    service.reset();
    const newUser = await service.create({ name: 'Bob', email: 'b@test.com' });
    expect(newUser.id).toBe(1);
  });
});
