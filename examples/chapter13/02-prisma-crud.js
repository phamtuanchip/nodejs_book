/**
 * Chương 13: Prisma Client CRUD
 * create, findMany, findUnique, update, delete
 * Include relations: author, comments
 *
 * Yêu cầu: chạy `npx prisma generate` trước
 * Chạy: node 02-prisma-crud.js
 */

const { PrismaClient } = require('@prisma/client');

// Khởi tạo Prisma Client với logging
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// === CREATE ===

// Tạo user mới
async function createUser(data) {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role || 'USER',
    },
  });
  return user;
}

// Tạo post kèm tags (nested create)
async function createPost(authorId, title, content, tagNames = []) {
  const post = await prisma.post.create({
    data: {
      title,
      content,
      published: false,
      author: {
        connect: { id: authorId }, // kết nối với user đã có
      },
      tags: {
        connectOrCreate: tagNames.map(name => ({
          where: { slug: name.toLowerCase().replace(/\s+/g, '-') },
          create: {
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-'),
          },
        })),
      },
    },
    // Include để trả về relations
    include: {
      author: { select: { name: true, email: true } },
      tags: true,
    },
  });
  return post;
}

// Thêm comment vào post
async function addComment(postId, authorId, content) {
  return prisma.comment.create({
    data: { content, postId, authorId },
    include: {
      author: { select: { name: true } },
      post: { select: { title: true } },
    },
  });
}

// === READ ===

// Lấy tất cả posts đã publish kèm author và số comment
async function getPublishedPosts(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where: { published: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, email: true } },
        tags: true,
        _count: { select: { comments: true } }, // đếm comment
      },
    }),
    prisma.post.count({ where: { published: true } }),
  ]);

  return { posts, total, page, limit };
}

// Lấy post theo ID kèm đầy đủ relations
async function getPostById(id) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, email: true, role: true },
      },
      comments: {
        include: {
          author: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      tags: true,
    },
  });

  if (!post) throw new Error(`Post ${id} không tồn tại`);
  return post;
}

// Tìm kiếm post theo từ khóa
async function searchPosts(keyword) {
  return prisma.post.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: keyword, mode: 'insensitive' } },
        { content: { contains: keyword, mode: 'insensitive' } },
      ],
    },
    include: {
      author: { select: { name: true } },
      _count: { select: { comments: true } },
    },
  });
}

// Lấy users kèm số lượng posts
async function getUsersWithPostCount() {
  return prisma.user.findMany({
    include: {
      _count: {
        select: { posts: true, comments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// === UPDATE ===

// Cập nhật post (publish hoặc chỉnh nội dung)
async function updatePost(id, data) {
  return prisma.post.update({
    where: { id },
    data,
    include: {
      author: { select: { name: true } },
      tags: true,
    },
  });
}

// Tăng view count
async function incrementViewCount(postId) {
  return prisma.post.update({
    where: { id: postId },
    data: { viewCount: { increment: 1 } },
    select: { id: true, viewCount: true },
  });
}

// === DELETE ===

// Xóa post (comments tự xóa theo cascade trong schema)
async function deletePost(id) {
  await prisma.post.delete({ where: { id } });
}

// Xóa user kèm tất cả dữ liệu liên quan
async function deleteUser(id) {
  // Nhờ onDelete: Cascade trong schema, posts và comments sẽ tự xóa
  await prisma.user.delete({ where: { id } });
}

// === MAIN ===
async function main() {
  try {
    console.log('=== Prisma CRUD Demo ===\n');

    // Tạo users
    const alice = await createUser({ email: 'alice@prisma.dev', name: 'Alice', role: 'ADMIN' });
    const bob = await createUser({ email: 'bob@prisma.dev', name: 'Bob' });
    console.log('Tạo users:', alice.name, ',', bob.name);

    // Tạo posts với tags
    const post1 = await createPost(alice.id, 'Giới thiệu Prisma', 'Prisma là ORM hiện đại...', ['nodejs', 'database', 'prisma']);
    const post2 = await createPost(bob.id, 'PostgreSQL Tips', 'Các mẹo dùng PostgreSQL...', ['database', 'postgresql']);
    console.log(`\nTạo post: "${post1.title}" với ${post1.tags.length} tags`);

    // Publish post
    const published = await updatePost(post1.id, { published: true });
    console.log(`Publish: "${published.title}"`);

    // Thêm comments
    await addComment(post1.id, bob.id, 'Bài viết rất hay!');
    await addComment(post1.id, alice.id, 'Cảm ơn bạn!');
    console.log('Thêm 2 comments');

    // Tăng view count
    const views = await incrementViewCount(post1.id);
    console.log(`View count: ${views.viewCount}`);

    // Lấy posts đã publish
    const { posts, total } = await getPublishedPosts();
    console.log(`\nBài viết đã xuất bản: ${total} bài`);
    posts.forEach(p => {
      console.log(`  - "${p.title}" | ${p._count.comments} comments | tags: ${p.tags.map(t => t.name).join(', ')}`);
    });

    // Lấy post chi tiết
    const detail = await getPostById(post1.id);
    console.log(`\nChi tiết post "${detail.title}":`);
    detail.comments.forEach(c => console.log(`  Comment từ ${c.author.name}: "${c.content}"`));

    // Tìm kiếm
    const results = await searchPosts('prisma');
    console.log(`\nTìm "prisma": ${results.length} kết quả`);

    // Thống kê users
    const usersStats = await getUsersWithPostCount();
    usersStats.forEach(u => {
      console.log(`${u.name}: ${u._count.posts} posts, ${u._count.comments} comments`);
    });

  } catch (err) {
    console.error('Lỗi:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
