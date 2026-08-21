// Mongoose Schema: Post
// Fields: title, content, author (ref User), tags, published, slug
// Index, virtuals, methods

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề không được bỏ trống'],
      trim: true,
      minlength: [3, 'Tiêu đề phải có ít nhất 3 ký tự'],
      maxlength: [200, 'Tiêu đề không vượt quá 200 ký tự']
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true
    },

    content: {
      type: String,
      required: [true, 'Nội dung không được bỏ trống']
    },

    // Tham chiếu đến User model — populate('author') để lấy thông tin đầy đủ
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Bài viết phải có tác giả']
    },

    tags: {
      type: [String],
      default: [],
      set: (tags) => tags.map((t) => t.toLowerCase().trim()) // chuẩn hóa tags
    },

    published: {
      type: Boolean,
      default: false
    },

    publishedAt: {
      type: Date,
      default: null
    },

    views: {
      type: Number,
      default: 0,
      min: 0
    },

    // Lưu tóm tắt ngắn (có thể tự động tạo từ content)
    excerpt: {
      type: String,
      maxlength: 300
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ── Virtual: thời gian đọc ước tính ──────────────────────────────
postSchema.virtual('readingTime').get(function () {
  const wordsPerMinute = 200;
  const wordCount = this.content ? this.content.split(/\s+/).length : 0;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} phút đọc`;
});

// ── Pre-save: tạo slug từ title ───────────────────────────────────
postSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    // Thêm timestamp để đảm bảo slug unique
    this.slug = `${this.slug}-${Date.now()}`;
  }

  // Tự động set publishedAt khi publish lần đầu
  if (this.isModified('published') && this.published && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Tạo excerpt tự động nếu chưa có
  if (!this.excerpt && this.content) {
    this.excerpt = this.content.substring(0, 200).trim() + '...';
  }

  next();
});

// ── Instance method: tăng view ────────────────────────────────────
postSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save({ validateModifiedOnly: true });
};

// ── Static method: tìm posts đã published, có phân trang ─────────
postSchema.statics.findPublished = function ({ page = 1, limit = 10, tag } = {}) {
  const filter = { published: true };
  if (tag) filter.tags = tag;

  return this.find(filter)
    .sort({ publishedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('author', 'name email'); // chỉ lấy name và email của author
};

// ── Indexes ───────────────────────────────────────────────────────
postSchema.index({ slug: 1 });
postSchema.index({ author: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ published: 1, publishedAt: -1 }); // query phổ biến
postSchema.index({ title: 'text', content: 'text' }); // full-text search

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
