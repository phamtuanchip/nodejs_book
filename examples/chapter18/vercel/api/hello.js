// Vercel Serverless Function — GET /api/hello
// Chạy local: vercel dev
// Deploy: vercel --prod

// Mỗi file trong thư mục /api/ tự động trở thành một endpoint
// Function nhận (req, res) giống Express nhưng không cần server

export default function handler(req, res) {
  // Chỉ chấp nhận GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method không được phép' });
  }

  // Đọc query params — /api/hello?name=An
  const { name = 'World', lang = 'vi' } = req.query;

  const greetings = {
    vi: `Xin chào, ${name}!`,
    en: `Hello, ${name}!`,
    ja: `こんにちは、${name}！`,
  };

  const message = greetings[lang] || greetings.vi;

  // Header cho phép cache trên Vercel Edge 60 giây
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  res.status(200).json({
    message,
    query: { name, lang },
    timestamp: new Date().toISOString(),
    region: process.env.VERCEL_REGION || 'local',  // Vercel tự inject biến này
  });
}
