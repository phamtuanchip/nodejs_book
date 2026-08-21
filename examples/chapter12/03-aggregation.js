// MongoDB Aggregation Pipeline với Mongoose
// Chạy: node 03-aggregation.js  (cần dữ liệu từ 02-crud.js)
// Yêu cầu: đã chạy 02-crud.js để có dữ liệu mẫu

const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nodejs_book_ch12';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Kết nối MongoDB thành công\n');

  // ── 1. Đếm số posts theo từng user (group by author) ─────────────
  console.log('=== 1. Số bài viết theo tác giả ===');
  const postsByUser = await Post.aggregate([
    // Stage 1: Nhóm theo author, đếm số bài và tổng views
    {
      $group: {
        _id: '$author',
        postCount: { $sum: 1 },
        totalViews: { $sum: '$views' },
        publishedCount: {
          $sum: { $cond: ['$published', 1, 0] }
        }
      }
    },
    // Stage 2: Join với collection users
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'authorInfo'
      }
    },
    // Stage 3: Unwind array từ lookup
    { $unwind: '$authorInfo' },
    // Stage 4: Chỉ giữ các fields cần thiết
    {
      $project: {
        _id: 0,
        author: '$authorInfo.name',
        email: '$authorInfo.email',
        postCount: 1,
        publishedCount: 1,
        totalViews: 1
      }
    },
    // Stage 5: Sắp xếp theo số bài giảm dần
    { $sort: { postCount: -1 } }
  ]);

  console.table(postsByUser);

  // ── 2. Top tags phổ biến ──────────────────────────────────────────
  console.log('\n=== 2. Top Tags Phổ Biến ===');
  const topTags = await Post.aggregate([
    // Stage 1: Chỉ lấy bài đã published
    { $match: { published: true } },
    // Stage 2: Unwind array tags — mỗi tag thành một document riêng
    { $unwind: '$tags' },
    // Stage 3: Nhóm theo tag, đếm số lần xuất hiện
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 },
        totalViews: { $sum: '$views' }
      }
    },
    // Stage 4: Sắp xếp theo số lần xuất hiện
    { $sort: { count: -1 } },
    // Stage 5: Chỉ lấy top 10
    { $limit: 10 },
    // Stage 6: Đặt lại tên fields
    {
      $project: {
        _id: 0,
        tag: '$_id',
        postCount: '$count',
        totalViews: 1
      }
    }
  ]);

  console.table(topTags);

  // ── 3. Thống kê bài viết theo tháng ──────────────────────────────
  console.log('\n=== 3. Thống Kê Bài Viết Theo Tháng ===');
  const monthlyStats = await Post.aggregate([
    // Stage 1: Chỉ lấy bài có publishedAt
    { $match: { publishedAt: { $ne: null } } },
    // Stage 2: Nhóm theo năm + tháng
    {
      $group: {
        _id: {
          year: { $year: '$publishedAt' },
          month: { $month: '$publishedAt' }
        },
        postCount: { $sum: 1 },
        totalViews: { $sum: '$views' },
        avgViews: { $avg: '$views' }
      }
    },
    // Stage 3: Sắp xếp theo thời gian
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    // Stage 4: Định dạng lại output
    {
      $project: {
        _id: 0,
        period: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            {
              $cond: {
                if: { $lt: ['$_id.month', 10] },
                then: { $concat: ['0', { $toString: '$_id.month' }] },
                else: { $toString: '$_id.month' }
              }
            }
          ]
        },
        postCount: 1,
        totalViews: 1,
        avgViews: { $round: ['$avgViews', 1] }
      }
    }
  ]);

  if (monthlyStats.length > 0) {
    console.table(monthlyStats);
  } else {
    console.log('Chưa có dữ liệu publishedAt (chạy 02-crud.js trước)');
  }

  // ── 4. Pipeline phức tạp: users với thống kê bài viết ────────────
  console.log('\n=== 4. User Stats (Facet Pipeline) ===');
  const userStats = await User.aggregate([
    // Stage 1: Chỉ lấy user active
    { $match: { isActive: true } },
    // Stage 2: Lookup posts của mỗi user
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'author',
        as: 'posts'
      }
    },
    // Stage 3: Thêm các computed fields
    {
      $addFields: {
        totalPosts: { $size: '$posts' },
        publishedPosts: {
          $size: {
            $filter: {
              input: '$posts',
              as: 'p',
              cond: { $eq: ['$$p.published', true] }
            }
          }
        },
        totalViews: { $sum: '$posts.views' }
      }
    },
    // Stage 4: Bỏ array posts khỏi output (quá nhiều data)
    { $project: { posts: 0, password: 0 } },
    { $sort: { totalPosts: -1 } }
  ]);

  userStats.forEach((u) => {
    console.log(`${u.name}: ${u.totalPosts} bài (${u.publishedPosts} đã đăng), ${u.totalViews} views`);
  });
}

main()
  .catch((err) => {
    console.error('Lỗi:', err.message);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
