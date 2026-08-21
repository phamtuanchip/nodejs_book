// Mongoose Schema: User
// Fields: name, email, password (hashed), role, createdAt
// Pre-save hook: hash password trước khi lưu
// Instance method: comparePassword

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên không được bỏ trống'],
      trim: true,
      minlength: [2, 'Tên phải có ít nhất 2 ký tự'],
      maxlength: [100, 'Tên không được vượt quá 100 ký tự']
    },

    email: {
      type: String,
      required: [true, 'Email không được bỏ trống'],
      unique: true,          // tạo index unique
      lowercase: true,       // tự động chuyển về chữ thường
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email không hợp lệ']
    },

    password: {
      type: String,
      required: [true, 'Password không được bỏ trống'],
      minlength: [8, 'Password phải có ít nhất 8 ký tự'],
      select: false          // mặc định không trả password trong query
    },

    role: {
      type: String,
      enum: {
        values: ['user', 'admin', 'editor'],
        message: 'Role phải là: user, admin, hoặc editor'
      },
      default: 'user'
    },

    isActive: {
      type: Boolean,
      default: true
    },

    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,  // tự động thêm createdAt và updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ── Virtual: số bài viết (dùng khi populate) ──────────────────────
// (tham chiếu đến collection posts, không lưu trong DB)
userSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author'
});

// ── Pre-save hook: hash password ───────────────────────────────────
userSchema.pre('save', async function (next) {
  // Chỉ hash khi password được thay đổi (tránh hash lại khi update field khác)
  if (!this.isModified('password')) return next();

  try {
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Instance method: so sánh password ────────────────────────────
userSchema.methods.comparePassword = async function (plainPassword) {
  // Cần .select('+password') khi query để có field này
  return bcrypt.compare(plainPassword, this.password);
};

// ── Instance method: chuyển sang JSON an toàn (bỏ password) ──────
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// ── Static method: tìm user active ───────────────────────────────
userSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

// ── Index ─────────────────────────────────────────────────────────
userSchema.index({ email: 1 });       // đã có unique index
userSchema.index({ createdAt: -1 });  // sắp xếp mới nhất

const User = mongoose.model('User', userSchema);
module.exports = User;
