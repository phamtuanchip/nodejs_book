/**
 * Chương 13: Kết nối PostgreSQL với module pg (không dùng ORM)
 * Query thuần SQL: SELECT, INSERT, UPDATE, DELETE
 *
 * Cài đặt: npm install pg
 * Tạo DB: createdb nodejs_book
 * Chạy: node 01-connect.js
 */

const { Pool } = require('pg');

// Cấu hình kết nối PostgreSQL
const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'nodejs_book',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'password',
  // Pool size: tối đa 10 kết nối đồng thời
  max: 10,
  // Đóng kết nối không dùng sau 30 giây
  idleTimeoutMillis: 30000,
  // Timeout khi chờ kết nối từ pool
  connectionTimeoutMillis: 2000,
});

// Lắng nghe sự kiện lỗi từ pool
pool.on('error', (err, client) => {
  console.error('Lỗi kết nối PostgreSQL:', err.message);
});

// Hàm tiện ích: chạy query với tham số
async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    // Luôn trả client về pool dù có lỗi
    client.release();
  }
}

// Tạo bảng nếu chưa tồn tại
async function createTables() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id        SERIAL PRIMARY KEY,
      email     VARCHAR(255) UNIQUE NOT NULL,
      name      VARCHAR(255) NOT NULL,
      role      VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS posts (
      id         SERIAL PRIMARY KEY,
      title      VARCHAR(500) NOT NULL,
      content    TEXT,
      published  BOOLEAN DEFAULT FALSE,
      author_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await pool.query(sql);
  console.log('Tạo bảng thành công');
}

// INSERT: thêm user mới
async function insertUser(email, name, role = 'user') {
  const sql = `
    INSERT INTO users (email, name, role)
    VALUES ($1, $2, $3)
    ON CONFLICT (email) DO UPDATE SET name = $2
    RETURNING *
  `;
  const result = await query(sql, [email, name, role]);
  return result.rows[0];
}

// SELECT: lấy tất cả users với phân trang
async function getUsers(page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  // Đếm tổng số user
  const countResult = await query('SELECT COUNT(*) FROM users');
  const total = parseInt(countResult.rows[0].count);

  // Lấy danh sách với phân trang
  const sql = `
    SELECT id, email, name, role, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;
  const result = await query(sql, [limit, offset]);

  return {
    users: result.rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

// SELECT: lấy user theo ID
async function getUserById(id) {
  const sql = `
    SELECT u.*, COUNT(p.id) as post_count
    FROM users u
    LEFT JOIN posts p ON p.author_id = u.id
    WHERE u.id = $1
    GROUP BY u.id
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

// INSERT: thêm bài viết
async function insertPost(authorId, title, content, published = false) {
  const sql = `
    INSERT INTO posts (author_id, title, content, published)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await query(sql, [authorId, title, content, published]);
  return result.rows[0];
}

// SELECT với JOIN: lấy posts kèm thông tin tác giả
async function getPostsWithAuthor() {
  const sql = `
    SELECT
      p.id,
      p.title,
      p.content,
      p.published,
      p.created_at,
      u.name  AS author_name,
      u.email AS author_email
    FROM posts p
    INNER JOIN users u ON u.id = p.author_id
    WHERE p.published = true
    ORDER BY p.created_at DESC
    LIMIT 20
  `;
  const result = await query(sql);
  return result.rows;
}

// UPDATE: cập nhật thông tin user
async function updateUser(id, updates) {
  // Xây dựng câu UPDATE động từ object
  const fields = Object.keys(updates);
  const values = Object.values(updates);

  const setClauses = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
  const sql = `UPDATE users SET ${setClauses} WHERE id = $${fields.length + 1} RETURNING *`;

  const result = await query(sql, [...values, id]);
  return result.rows[0];
}

// DELETE: xóa user (posts sẽ tự xóa theo CASCADE)
async function deleteUser(id) {
  const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

// Chạy thử tất cả chức năng
async function main() {
  try {
    console.log('=== Kết nối PostgreSQL ===\n');

    // Tạo bảng
    await createTables();

    // Thêm users
    const alice = await insertUser('alice@example.com', 'Alice Nguyễn', 'admin');
    const bob = await insertUser('bob@example.com', 'Bob Trần');
    console.log('Đã thêm user:', alice.name, 'và', bob.name);

    // Thêm bài viết
    await insertPost(alice.id, 'Node.js là gì?', 'Node.js là runtime JavaScript...', true);
    await insertPost(alice.id, 'PostgreSQL cơ bản', 'Hướng dẫn dùng PostgreSQL...', true);
    await insertPost(bob.id, 'Draft bài viết', 'Chưa hoàn thành...', false);
    console.log('Đã thêm 3 bài viết');

    // Lấy danh sách users
    const { users, pagination } = await getUsers(1, 5);
    console.log(`\nDanh sách users (${pagination.total} tổng):`);
    users.forEach(u => console.log(`  - ${u.name} <${u.email}> [${u.role}]`));

    // Lấy user theo ID
    const userDetail = await getUserById(alice.id);
    console.log(`\nChi tiết: ${userDetail.name} có ${userDetail.post_count} bài viết`);

    // Lấy posts kèm tác giả
    const posts = await getPostsWithAuthor();
    console.log(`\nBài viết đã xuất bản (${posts.length} bài):`);
    posts.forEach(p => console.log(`  - "${p.title}" bởi ${p.author_name}`));

    // Cập nhật user
    const updated = await updateUser(bob.id, { name: 'Bob Phạm', role: 'moderator' });
    console.log(`\nĐã cập nhật: ${updated.name} -> role: ${updated.role}`);

  } catch (err) {
    console.error('Lỗi:', err.message);
  } finally {
    // Đóng pool khi xong
    await pool.end();
    console.log('\nĐã đóng kết nối PostgreSQL');
  }
}

main();
