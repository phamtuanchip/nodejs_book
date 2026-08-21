// Express + EJS app — Blog đơn giản, Chương 11
// Chạy: node app.js  (cần: npm install express ejs)
//
// Routes:
//   GET  /            — danh sách bài viết
//   GET  /posts/:id   — chi tiết bài viết
//   GET  /posts/new   — form tạo bài viết
//   POST /posts       — xử lý tạo bài viết

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3011;

// Dữ liệu mẫu in-memory
let posts = [
  {
    id: 1,
    title: 'Bắt đầu với Node.js',
    content: 'Node.js là runtime JavaScript phía server, xây dựng trên V8 engine của Chrome. Nó sử dụng mô hình non-blocking I/O và event-driven, rất phù hợp cho các ứng dụng real-time và API.',
    author: 'Nguyễn Văn A',
    tags: ['nodejs', 'javascript', 'backend'],
    createdAt: new Date('2024-01-15').toISOString(),
    views: 342
  },
  {
    id: 2,
    title: 'Express.js Framework cơ bản',
    content: 'Express là framework web phổ biến nhất cho Node.js. Nó cung cấp hệ thống routing linh hoạt, middleware pipeline, và dễ tích hợp với các template engine như EJS, Pug, Handlebars.',
    author: 'Trần Thị B',
    tags: ['express', 'nodejs', 'framework'],
    createdAt: new Date('2024-02-20').toISOString(),
    views: 218
  },
  {
    id: 3,
    title: 'Async/Await trong Node.js',
    content: 'Async/await là cú pháp giúp viết code bất đồng bộ dễ đọc hơn. Thay vì callback hell hay promise chain dài, chúng ta có thể viết code trông giống đồng bộ nhưng thực tế là bất đồng bộ.',
    author: 'Lê Văn C',
    tags: ['javascript', 'async', 'nodejs'],
    createdAt: new Date('2024-03-10').toISOString(),
    views: 489
  }
];
let nextId = 4;

// ── Cấu hình EJS ──────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // parse form POST
app.use(express.static(path.join(__dirname, 'public')));

// ── Middleware gắn dữ liệu chung cho tất cả views ─────────────────
app.use((req, res, next) => {
  res.locals.siteName = 'NodeJS Blog';
  res.locals.currentYear = new Date().getFullYear();
  res.locals.currentPath = req.path;
  next();
});

// ── GET / — Trang chủ: danh sách bài viết ─────────────────────────
app.get('/', (req, res) => {
  // Sắp xếp mới nhất lên đầu
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.render('index', {
    title: 'Trang chủ',
    posts: sortedPosts
  });
});

// ── GET /posts/new — Form tạo bài viết (phải đặt TRƯỚC /posts/:id) ──
app.get('/posts/new', (req, res) => {
  res.render('new', {
    title: 'Tạo bài viết mới',
    error: null,
    formData: {}
  });
});

// ── POST /posts — Xử lý tạo bài viết ─────────────────────────────
app.post('/posts', (req, res) => {
  const { title, content, author, tags } = req.body;

  // Validate
  const errors = [];
  if (!title || title.trim().length < 3) errors.push('Tiêu đề phải có ít nhất 3 ký tự');
  if (!content || content.trim().length < 10) errors.push('Nội dung phải có ít nhất 10 ký tự');
  if (!author || author.trim().length < 2) errors.push('Tên tác giả không được bỏ trống');

  if (errors.length > 0) {
    return res.status(400).render('new', {
      title: 'Tạo bài viết mới',
      error: errors.join('. '),
      formData: req.body
    });
  }

  // Tạo post mới
  const post = {
    id: nextId++,
    title: title.trim(),
    content: content.trim(),
    author: author.trim(),
    tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    createdAt: new Date().toISOString(),
    views: 0
  };
  posts.push(post);

  // Redirect sau khi tạo thành công
  res.redirect(`/posts/${post.id}`);
});

// ── GET /posts/:id — Chi tiết bài viết ────────────────────────────
app.get('/posts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).render('404', { title: 'Không tìm thấy bài viết' });
  }

  post.views++; // tăng lượt xem

  // Bài viết liên quan (cùng tag)
  const related = posts
    .filter((p) => p.id !== id && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 3);

  res.render('post', {
    title: post.title,
    post,
    related
  });
});

// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('404', { title: 'Không tìm thấy trang' });
});

// ── Error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('<h1>Lỗi máy chủ</h1><p>' + err.message + '</p>');
});

app.listen(PORT, () => {
  console.log(`[Ch11] Blog app chạy tại http://localhost:${PORT}`);
});

module.exports = app;
