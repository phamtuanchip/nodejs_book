// Vercel Serverless Function — /api/users
// GET  /api/users        → danh sách users (có phân trang)
// POST /api/users        → tạo user mới
// Kết nối MongoDB Atlas

import { MongoClient, ObjectId } from 'mongodb';

// Tái dùng kết nối giữa các invocation (warm start)
// Vercel giữ process sống một thời gian, không nên mở kết nối mới mỗi request
let cachedClient = null;

async function getDb() {
  if (cachedClient) {
    return cachedClient.db('myapp');
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI chưa được cấu hình');

  // Tắt serverApi nếu dùng Atlas miễn phí tier
  const client = new MongoClient(uri, {
    maxPoolSize: 1,       // serverless: chỉ cần 1 kết nối
  });

  await client.connect();
  cachedClient = client;
  return client.db('myapp');
}

export default async function handler(req, res) {
  try {
    const db = await getDb();
    const collection = db.collection('users');

    if (req.method === 'GET') {
      // Phân trang: /api/users?page=1&limit=10
      const page  = Math.max(1, parseInt(req.query.page  || '1', 10));
      const limit = Math.min(50, parseInt(req.query.limit || '10', 10));
      const skip  = (page - 1) * limit;

      const [users, total] = await Promise.all([
        collection.find({}, { projection: { password: 0 } })  // ẩn password
                  .sort({ createdAt: -1 })
                  .skip(skip)
                  .limit(limit)
                  .toArray(),
        collection.countDocuments(),
      ]);

      return res.status(200).json({
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    if (req.method === 'POST') {
      const { name, email, role = 'user' } = req.body;

      // Validate đơn giản
      if (!name || !email) {
        return res.status(400).json({ success: false, error: 'name và email là bắt buộc' });
      }

      // Kiểm tra email đã tồn tại chưa
      const existing = await collection.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({ success: false, error: 'Email đã được sử dụng' });
      }

      const newUser = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(newUser);

      return res.status(201).json({
        success: true,
        data: { _id: result.insertedId, ...newUser },
      });
    }

    // Method không hỗ trợ
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, error: `Method ${req.method} không được phép` });

  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ success: false, error: 'Lỗi server' });
  }
}
