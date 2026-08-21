/**
 * Chương 16: UserService — dùng in-memory array để test dễ
 * Không cần DB kết nối, dễ reset giữa các tests
 */

// Lỗi tùy chỉnh để test .rejects.toThrow
class UserNotFoundError extends Error {
  constructor(id) {
    super(`User ID=${id} không tồn tại`);
    this.name = 'UserNotFoundError';
    this.statusCode = 404;
  }
}

class DuplicateEmailError extends Error {
  constructor(email) {
    super(`Email ${email} đã được sử dụng`);
    this.name = 'DuplicateEmailError';
    this.statusCode = 409;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class UserService {
  constructor() {
    // In-memory storage — dễ reset trong tests
    this._users = [];
    this._nextId = 1;
  }

  // Validate dữ liệu user
  _validate(data) {
    if (!data.name || data.name.trim().length < 2) {
      throw new ValidationError('Tên phải có ít nhất 2 ký tự');
    }
    if (!data.email || !data.email.includes('@')) {
      throw new ValidationError('Email không hợp lệ');
    }
    if (data.age !== undefined && (data.age < 0 || data.age > 150)) {
      throw new ValidationError('Tuổi không hợp lệ');
    }
  }

  /**
   * Tạo user mới
   * @param {Object} data - { name, email, age?, role? }
   * @returns {Object} user đã tạo
   */
  async create(data) {
    this._validate(data);

    // Kiểm tra email trùng
    const existing = this._users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new DuplicateEmailError(data.email);
    }

    const user = {
      id: this._nextId++,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      age: data.age || null,
      role: data.role || 'user',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this._users.push(user);
    return { ...user }; // Trả copy, không phải reference
  }

  /**
   * Lấy tất cả users (có thể filter)
   * @param {Object} filters - { role?, active? }
   */
  async findAll(filters = {}) {
    let result = [...this._users];

    if (filters.role !== undefined) {
      result = result.filter(u => u.role === filters.role);
    }
    if (filters.active !== undefined) {
      result = result.filter(u => u.active === filters.active);
    }

    return result.map(u => ({ ...u }));
  }

  /**
   * Lấy user theo ID
   * @throws {UserNotFoundError} nếu không tìm thấy
   */
  async findById(id) {
    const user = this._users.find(u => u.id === id);
    if (!user) throw new UserNotFoundError(id);
    return { ...user };
  }

  /**
   * Lấy user theo email
   * @returns {Object|null}
   */
  async findByEmail(email) {
    if (!email) return null;
    const user = this._users.find(u => u.email === email.toLowerCase().trim());
    return user ? { ...user } : null;
  }

  /**
   * Cập nhật user
   * @throws {UserNotFoundError} nếu không tìm thấy
   */
  async update(id, data) {
    const index = this._users.findIndex(u => u.id === id);
    if (index === -1) throw new UserNotFoundError(id);

    // Kiểm tra email mới không trùng với user khác
    if (data.email) {
      const emailLower = data.email.toLowerCase().trim();
      const duplicate = this._users.find(u => u.email === emailLower && u.id !== id);
      if (duplicate) throw new DuplicateEmailError(data.email);
    }

    // Chỉ cập nhật các field được phép
    const allowedFields = ['name', 'email', 'age', 'role', 'active'];
    const updates = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updates[field] = typeof data[field] === 'string' ? data[field].trim() : data[field];
      }
    });

    this._users[index] = {
      ...this._users[index],
      ...updates,
      updatedAt: new Date(),
    };

    return { ...this._users[index] };
  }

  /**
   * Xóa user
   * @throws {UserNotFoundError} nếu không tìm thấy
   * @returns {boolean} true nếu xóa thành công
   */
  async delete(id) {
    const index = this._users.findIndex(u => u.id === id);
    if (index === -1) throw new UserNotFoundError(id);

    this._users.splice(index, 1);
    return true;
  }

  /**
   * Đếm số users
   */
  async count(filters = {}) {
    const users = await this.findAll(filters);
    return users.length;
  }

  /**
   * Reset toàn bộ data — dùng trong tests
   */
  reset() {
    this._users = [];
    this._nextId = 1;
  }

  /**
   * Seed data mẫu — dùng trong tests
   */
  async seed(usersData) {
    for (const data of usersData) {
      await this.create(data);
    }
  }
}

module.exports = { UserService, UserNotFoundError, DuplicateEmailError, ValidationError };
