// Express REST API với Mongoose — Chương 12
// Chạy: node app.js  (cần: npm install express mongoose bcrypt)
//
// API Endpoints:
//   Users:
//     GET    /api/users              — danh sách users
//     POST   /api/users              — tạo user mới
//     GET    /api/users/:id          — thông tin user
//     PUT    /api/users/:id          — cập nhật user
//     DELETE /api/users/:id          — xóa user
//
//   Posts:
//     GET    /api/posts              — danh sách posts (filter, pagination, populate)
//     POST   /api/posts              — tạo post mới
//     GET    /api/posts/:id          — chi tiết post
//     PUT    /api/posts/:id          — cập nhật post
//     DELETE /api/posts/:id          — xóa post

const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');

const app = express();
const PORT = process.env.PORT || 3012;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nodejs_book_ch12';

app.use(express.json());

// ── Kết nối MongoDB ───────────────────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('[MongoDB] Kết nối thành công'))
  .catch((err) => {
    console.error('[MongoDB] Lỗi kết nối:', err.message);
    process.exit(1);
  });

// ── Helper: validate MongoDB ObjectId ────────────────────────────
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const handleNotFound = (res, resource = 'Resource') =>
  res.status(404).json({ error: `${resource} không tìm thấy` });

// ═══════════════════════════════════════════════════════════════════
// USERS ROUTES
// ═══════════════════════════════════════════════════════════════════

// GET /api/users — danh sách users (có phân trang)
app.get('/api/users', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({ isActive: true })
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ isActive: true })
    ]);

    res.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/users — tạo user mới
app.post('/api/users', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Kiểm tra email đã tồn tại
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email đã được sử dụng' });
    }

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      message: 'Tạo user thành công',
      data: user.toSafeObject()
    });
  } catch (err) {
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: errors });
    }
    next(err);
  }
});

// GET /api/users/:id — thông tin một user
app.get('/api/users/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'ID không hợp lệ' });
    }

    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('posts', 'title published createdAt'); // virtual field posts

    if (!user) return handleNotFound(res, 'User');

    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id — cập nhật user
app.put('/api/users/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'ID không hợp lệ' });
    }

    // Chỉ cho phép cập nhật một số fields nhất định
    const allowedFields = ['name', 'role', 'isActive'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true, select: '-password' }
    );

    if (!user) return handleNotFound(res, 'User');

    res.json({ message: 'Cập nhật thành công', data: user });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: errors });
    }
    next(err);
  }
});

// DELETE /api/users/:id — xóa mềm (set isActive = false)
app.delete('/api/users/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'ID không hợp lệ' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true, select: 'name email isActive' }
    );

    if (!user) return handleNotFound(res, 'User');

    res.json({ message: 'Đã vô hiệu hóa tài khoản', data: user });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════════
// POSTS ROUTES
// ═══════════════════════════════════════════════════════════════════

// GET /api/posts — danh sách posts (filter, pagination, populate author)
app.get('/api/posts', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Xây dựng filter linh hoạt từ query params
    const filter = {};
    if (req.query.published !== undefined) {
      filter.published = req.query.published === 'true';
    }
    if (req.query.tag) {
      filter.tags = req.query.tag; // MongoDB tự match trong array
    }
    if (req.query.author) {
      filter.author = req.query.author;
    }
    // Tìm kiếm full-text (cần index text)
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'name email') // join với users
        .select('-content')               // bỏ content dài, chỉ lấy excerpt
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter)
    ]);

    res.json({
      data: posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts — tạo post mới
app.post('/api/posts', async (req, res, next) => {
  try {
    const { title, content, authorId, tags, published } = req.body;

    if (!isValidId(authorId)) {
      return res.status(400).json({ error: 'authorId không hợp lệ' });
    }

    // Kiểm tra author tồn tại
    const author = await User.findById(authorId);
    if (!author) {
      return res.status(404).json({ error: 'Tác giả không tồn tại' });
    }

    const post = await Post.create({
      title,
      content,
      author: authorId,
      tags,
      published: !!published
    });

    // Populate author trước khi trả về
    await post.populate('author', 'name email');

    res.status(201).json({
      message: 'Tạo bài viết thành công',
      data: post
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: errors });
    }
    next(err);
  }
});

// GET /api/posts/:id — chi tiết post
app.get('/api/posts/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'ID không hợp lệ' });
    }

    const post = await Post.findById(req.params.id)
      .populate('author', 'name email role');

    if (!post) return handleNotFound(res, 'Bài viết');

    // Tăng lượt xem bất đồng bộ (không cần await)
    Post.updateOne({ _id: post._id }, { $inc: { views: 1 } }).exec();

    res.json({
      data: {
        ...post.toObject(),
        readingTime: post.readingTime // virtual field
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/posts/:id — cập nhật post
app.put('/api/posts/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'ID không hợp lệ' });
    }

    const allowedFields = ['title', 'content', 'tags', 'published', 'excerpt'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    if (!post) return handleNotFound(res, 'Bài viết');

    res.json({ message: 'Cập nhật thành công', data: post });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: errors });
    }
    next(err);
  }
});

// DELETE /api/posts/:id — xóa vĩnh viễn
app.delete('/api/posts/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'ID không hợp lệ' });
    }

    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return handleNotFound(res, 'Bài viết');

    res.json({ message: 'Đã xóa bài viết', data: { id: post._id, title: post.title } });
  } catch (err) {
    next(err);
  }
});

// ── Health check ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ── Global error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({
    error: 'Lỗi máy chủ nội bộ',
    message: process.env.NODE_ENV !== 'production' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`[Ch12] REST API chạy tại http://localhost:${PORT}`);
  console.log('Thử nghiệm:');
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  GET  http://localhost:${PORT}/api/users`);
  console.log(`  GET  http://localhost:${PORT}/api/posts?published=true&limit=5`);
});

module.exports = app;
