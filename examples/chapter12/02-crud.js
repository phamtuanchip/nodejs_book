// CRUD operations với Mongoose — chạy standalone
// Chạy: node 02-crud.js  (cần: npm install mongoose bcrypt)
// Yêu cầu: MongoDB chạy tại localhost:27017

const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nodejs_book_ch12';

async function main() {
  // Kết nối
  await mongoose.connect(MONGO_URI);
  console.log('Kết nối MongoDB thành công\n');

  // Xóa dữ liệu cũ để demo sạch
  await User.deleteMany({});
  await Post.deleteMany({});
  console.log('Đã xóa dữ liệu cũ\n');

  // ── CREATE ──────────────────────────────────────────────────────
  console.log('=== CREATE ===');

  const alice = await User.create({
    name: 'Alice Nguyễn',
    email: 'alice@example.com',
    password: 'password123',
    role: 'admin'
  });
  console.log('Tạo user Alice:', alice.name, '| Role:', alice.role);

  const bob = await User.create({
    name: 'Bob Trần',
    email: 'bob@example.com',
    password: 'bobpass456'
  });
  console.log('Tạo user Bob:', bob.name, '| Role:', bob.role);

  // Tạo nhiều documents cùng lúc
  const posts = await Post.insertMany([
    {
      title: 'Giới thiệu Node.js',
      content: 'Node.js là môi trường chạy JavaScript phía server, sử dụng V8 engine. Rất phù hợp cho ứng dụng real-time và API server.',
      author: alice._id,
      tags: ['nodejs', 'javascript'],
      published: true
    },
    {
      title: 'Express.js cơ bản',
      content: 'Express là framework web tối giản cho Node.js, giúp tạo API và web app nhanh chóng với hệ thống middleware linh hoạt.',
      author: alice._id,
      tags: ['express', 'nodejs', 'framework'],
      published: true
    },
    {
      title: 'MongoDB với Mongoose',
      content: 'Mongoose là ODM (Object Data Modeling) cho MongoDB trong Node.js, cung cấp schema validation, middleware, và query builder tiện lợi.',
      author: bob._id,
      tags: ['mongodb', 'mongoose', 'database'],
      published: false // bản nháp
    }
  ]);
  console.log(`Tạo ${posts.length} bài viết`);

  // ── READ ─────────────────────────────────────────────────────────
  console.log('\n=== READ ===');

  // findOne — tìm một document
  const foundUser = await User.findOne({ email: 'alice@example.com' });
  console.log('findOne:', foundUser.name, foundUser.email);

  // findById
  const foundById = await User.findById(alice._id);
  console.log('findById:', foundById.name);

  // find với filter + projection + sort
  const publishedPosts = await Post.find({ published: true })
    .select('title tags views createdAt') // chỉ lấy các fields này
    .sort({ createdAt: -1 })
    .lean(); // trả plain JS object, nhanh hơn Mongoose document
  console.log(`find (published): ${publishedPosts.length} bài viết`);
  publishedPosts.forEach((p) => console.log(' -', p.title, '| Tags:', p.tags.join(', ')));

  // populate — join với collection User
  const postWithAuthor = await Post.findOne({ published: true })
    .populate('author', 'name email role');
  console.log('\npopulate author:', postWithAuthor.title);
  console.log('  Tác giả:', postWithAuthor.author.name, '-', postWithAuthor.author.email);
  console.log('  Reading time:', postWithAuthor.readingTime); // virtual field

  // Đếm documents
  const count = await Post.countDocuments({ published: true });
  console.log('\nSố bài đã published:', count);

  // ── UPDATE ───────────────────────────────────────────────────────
  console.log('\n=== UPDATE ===');

  // updateOne — cập nhật một document (không trả về document)
  const updateResult = await Post.updateOne(
    { _id: posts[2]._id },            // filter
    {
      $set: { published: true },       // cập nhật field
      $push: { tags: 'tutorial' }      // thêm vào array
    }
  );
  console.log('updateOne — đã sửa:', updateResult.modifiedCount, 'document');

  // findByIdAndUpdate — trả về document mới
  const updatedUser = await User.findByIdAndUpdate(
    bob._id,
    { $set: { lastLoginAt: new Date() } },
    { new: true } // new: true = trả document SAU khi update
  );
  console.log('findByIdAndUpdate — lastLoginAt:', updatedUser.lastLoginAt);

  // updateMany — cập nhật nhiều documents
  const bulkResult = await Post.updateMany(
    { tags: 'nodejs' },
    { $addToSet: { tags: 'backend' } } // addToSet = thêm nếu chưa có
  );
  console.log('updateMany — đã sửa:', bulkResult.modifiedCount, 'bài có tag nodejs');

  // ── DELETE ───────────────────────────────────────────────────────
  console.log('\n=== DELETE ===');

  // deleteOne
  const tempPost = await Post.create({
    title: 'Bài tạm thời',
    content: 'Sẽ bị xóa ngay sau đây',
    author: bob._id
  });
  const deleteResult = await Post.deleteOne({ _id: tempPost._id });
  console.log('deleteOne — đã xóa:', deleteResult.deletedCount, 'document');

  // findByIdAndDelete — trả về document bị xóa
  // (demo không xóa thực để giữ dữ liệu cho các file sau)

  // ── Kiểm tra cuối ────────────────────────────────────────────────
  const totalPosts = await Post.countDocuments();
  const totalUsers = await User.countDocuments();
  console.log(`\nTổng kết: ${totalUsers} users, ${totalPosts} posts`);
}

main()
  .catch((err) => {
    console.error('Lỗi:', err.message);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
