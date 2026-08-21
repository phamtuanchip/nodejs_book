// Vercel Dynamic Route — /api/users/:id
// GET    /api/users/[id] → lấy thông tin user
// PUT    /api/users/[id] → cập nhật user
// DELETE /api/users/[id] → xoá user

import { MongoClient, ObjectId } from 'mongodb';

// Tái dùng kết nối MongoDB (xem users/index.js để giải thích)
let cachedClient = null;

async function getDb() {
  if (cachedClient) return cachedClient.db('myapp');
  const client = new MongoClient(process.env.MONGODB_URI, { maxPoolSize: 1 });
  await client.connect();
  cachedClient = client;
  return client.db('myapp');
}

// Validate ObjectId tránh crash khi id không đúng format
function isValidObjectId(id) {
  return /^[a-f\d]{24}$/i.test(id);
}

export default async function handler(req, res) {
  // Vercel truyền dynamic segment qua req.query
  const { id } = req.query;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, error: 'ID không hợp lệ' });
  }

  try {
    const db = await getDb();
    const collection = db.collection('users');
    const objectId = new ObjectId(id);

    // ── GET: lấy thông tin user ──────────────────────────────
    if (req.method === 'GET') {
      const user = await collection.findOne(
        { _id: objectId },
        { projection: { password: 0 } }
      );

      if (!user) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy user' });
      }

      return res.status(200).json({ success: true, data: user });
    }

    // ── PUT: cập nhật user ───────────────────────────────────
    if (req.method === 'PUT') {
      const { name, email, role } = req.body;

      // Chỉ cập nhật các field được gửi lên
      const updates = {};
      if (name  !== undefined) updates.name  = name.trim();
      if (email !== undefined) updates.email = email.toLowerCase().trim();
      if (role  !== undefined) updates.role  = role;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: 'Không có dữ liệu để cập nhật' });
      }

      updates.updatedAt = new Date();

      const result = await collection.findOneAndUpdate(
        { _id: objectId },
        { $set: updates },
        { returnDocument: 'after', projection: { password: 0 } }
      );

      if (!result) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy user' });
      }

      return res.status(200).json({ success: true, data: result });
    }

    // ── DELETE: xoá user ─────────────────────────────────────
    if (req.method === 'DELETE') {
      const result = await collection.deleteOne({ _id: objectId });

      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy user' });
      }

      return res.status(200).json({ success: true, message: 'Đã xoá user' });
    }

    // Method không hỗ trợ
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ success: false, error: `Method ${req.method} không được phép` });

  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ success: false, error: 'Lỗi server' });
  }
}
