/**
 * Chương 13: Prisma Raw Queries
 * $queryRaw — câu query phức tạp mà Prisma ORM không hỗ trợ tốt
 * Aggregation, JOIN phức tạp, window functions
 *
 * Chạy: node 04-raw-query.js
 */

const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient();

// === $queryRaw: SELECT với kết quả trả về ===

// Thống kê posts theo từng tháng (dùng date_trunc của PostgreSQL)
async function getPostsByMonth(year = 2024) {
  // Dùng Prisma.sql để tránh SQL injection
  const results = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC('month', created_at) AS month,
      COUNT(*)::int                   AS post_count,
      COUNT(*) FILTER (WHERE published = true)::int AS published_count
    FROM posts
    WHERE EXTRACT(YEAR FROM created_at) = ${year}
    GROUP BY month
    ORDER BY month ASC
  `;

  return results;
}

// Lấy top authors theo số lượng post và tổng view
async function getTopAuthors(limit = 10) {
  const results = await prisma.$queryRaw`
    SELECT
      u.id,
      u.name,
      u.email,
      COUNT(p.id)::int          AS total_posts,
      COUNT(p.id) FILTER (WHERE p.published = true)::int AS published_posts,
      COALESCE(SUM(p.view_count), 0)::int AS total_views,
      MAX(p.created_at)         AS last_post_at
    FROM users u
    LEFT JOIN posts p ON p.author_id = u.id
    GROUP BY u.id, u.name, u.email
    HAVING COUNT(p.id) > 0
    ORDER BY total_posts DESC, total_views DESC
    LIMIT ${limit}
  `;

  return results;
}

// Full-text search trong posts (PostgreSQL ts_vector)
async function fullTextSearch(searchTerm) {
  // to_tsquery hỗ trợ tìm kiếm tiếng Anh tốt hơn LIKE
  const results = await prisma.$queryRaw`
    SELECT
      p.id,
      p.title,
      LEFT(p.content, 200) AS excerpt,
      ts_rank(
        to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.content, '')),
        plainto_tsquery('english', ${searchTerm})
      ) AS relevance,
      u.name AS author_name
    FROM posts p
    JOIN users u ON u.id = p.author_id
    WHERE
      p.published = true
      AND to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.content, ''))
          @@ plainto_tsquery('english', ${searchTerm})
    ORDER BY relevance DESC
    LIMIT 20
  `;

  return results;
}

// Window function: xếp hạng user trong mỗi nhóm role
async function getUserRankByRole() {
  const results = await prisma.$queryRaw`
    SELECT
      u.id,
      u.name,
      u.role,
      COUNT(p.id)::int AS post_count,
      RANK() OVER (
        PARTITION BY u.role
        ORDER BY COUNT(p.id) DESC
      ) AS rank_in_role
    FROM users u
    LEFT JOIN posts p ON p.author_id = u.id
    GROUP BY u.id, u.name, u.role
    ORDER BY u.role, rank_in_role
  `;

  return results;
}

// Lấy posts phổ biến nhất (nhiều comment nhất trong 7 ngày)
async function getTrendingPosts(days = 7, limit = 5) {
  const results = await prisma.$queryRaw`
    SELECT
      p.id,
      p.title,
      p.view_count,
      COUNT(c.id)::int AS comment_count,
      u.name AS author_name,
      p.created_at
    FROM posts p
    JOIN users u ON u.id = p.author_id
    LEFT JOIN comments c ON c.post_id = p.id
      AND c.created_at > NOW() - INTERVAL '1 day' * ${days}
    WHERE p.published = true
    GROUP BY p.id, p.title, p.view_count, u.name, p.created_at
    ORDER BY comment_count DESC, p.view_count DESC
    LIMIT ${limit}
  `;

  return results;
}

// === $executeRaw: UPDATE/INSERT/DELETE không trả kết quả ===

// Bulk update: publish tất cả posts của 1 user
async function publishAllUserPosts(userId) {
  const affectedRows = await prisma.$executeRaw`
    UPDATE posts
    SET published = true, updated_at = NOW()
    WHERE author_id = ${userId}
    AND published = false
  `;

  return affectedRows;
}

// Tăng view count hàng loạt (hiệu quả hơn update từng cái)
async function bulkIncrementViews(postIds) {
  if (postIds.length === 0) return 0;

  // Dùng ANY() với array
  const affected = await prisma.$executeRaw`
    UPDATE posts
    SET view_count = view_count + 1
    WHERE id = ANY(${Prisma.raw(`ARRAY[${postIds.join(',')}]::int[]`)})
  `;

  return affected;
}

// Xóa comments cũ hơn N ngày (cleanup job)
async function cleanupOldComments(olderThanDays = 365) {
  const deleted = await prisma.$executeRaw`
    DELETE FROM comments
    WHERE created_at < NOW() - INTERVAL '1 day' * ${olderThanDays}
  `;

  return deleted;
}

// === $queryRawUnsafe: Dùng khi cần dynamic query (CẨN THẬN SQL injection!) ===
// Chỉ dùng khi Prisma.sql không đáp ứng được
async function dynamicSort(tableName, sortColumn, sortOrder = 'DESC') {
  // CẢNH BÁO: Chỉ dùng $queryRawUnsafe với giá trị đã được validate!
  const allowedColumns = ['created_at', 'view_count', 'id'];
  const allowedOrders = ['ASC', 'DESC'];

  if (!allowedColumns.includes(sortColumn)) throw new Error('Cột không hợp lệ');
  if (!allowedOrders.includes(sortOrder.toUpperCase())) throw new Error('Thứ tự không hợp lệ');

  // Chỉ tableName, sortColumn, sortOrder từ whitelist mới được dùng unsafe
  const results = await prisma.$queryRawUnsafe(
    `SELECT id, title, ${sortColumn} FROM posts WHERE published = true ORDER BY ${sortColumn} ${sortOrder} LIMIT 10`
  );

  return results;
}

// === MAIN ===
async function main() {
  try {
    console.log('=== Demo Prisma Raw Queries ===\n');

    // Top authors
    const topAuthors = await getTopAuthors(5);
    console.log(`Top ${topAuthors.length} tác giả:`);
    topAuthors.forEach(a => {
      console.log(`  ${a.name}: ${a.total_posts} posts, ${a.total_views} views`);
    });

    // Trending posts
    const trending = await getTrendingPosts(7, 3);
    console.log(`\nBài viết trending (7 ngày):`);
    trending.forEach(p => {
      console.log(`  "${p.title}" - ${p.comment_count} comments, ${p.view_count} views`);
    });

    // Full-text search
    const searchResults = await fullTextSearch('nodejs prisma');
    console.log(`\nTìm kiếm "nodejs prisma": ${searchResults.length} kết quả`);

    // User ranking
    const rankings = await getUserRankByRole();
    console.log(`\nXếp hạng theo role:`);
    rankings.forEach(r => {
      console.log(`  [${r.role}] #${r.rank_in_role} ${r.name}: ${r.post_count} posts`);
    });

    // Thống kê theo tháng
    const monthlyStats = await getPostsByMonth(2024);
    console.log(`\nThống kê posts 2024:`);
    monthlyStats.forEach(m => {
      console.log(`  ${new Date(m.month).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}: ${m.post_count} bài (${m.published_count} đã publish)`);
    });

  } catch (err) {
    console.error('Lỗi:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
