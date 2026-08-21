// Cloudflare Worker — chạy tại Edge (200+ PoP toàn cầu)
// Dùng Web APIs chuẩn (Fetch API, Request, Response) — không phải Node.js APIs
// Test local: wrangler dev
// Deploy: wrangler deploy
//
// Routes:
//   GET  /api/hello           → Hello World với thông tin edge
//   GET  /api/kv/:key         → đọc giá trị từ KV storage
//   PUT  /api/kv/:key         → ghi giá trị vào KV storage
//   GET  /api/cache-demo      → demo Cache API của Cloudflare

// ── Helper tạo Response JSON ─────────────────────────────────
function jsonResponse(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      ...headers,
    },
  });
}

// ── Route: GET /api/hello ────────────────────────────────────
function handleHello(request, env) {
  const url = new URL(request.url);
  const name = url.searchParams.get('name') || 'World';

  return jsonResponse({
    message: `Xin chào, ${name}! Từ Cloudflare Workers`,
    // CF inject thông tin edge qua request.cf
    location: request.cf
      ? {
          country: request.cf.country,
          city:    request.cf.city,
          colo:    request.cf.colo,   // mã điểm edge (VD: "SGP" = Singapore)
        }
      : null,
    timestamp: new Date().toISOString(),
  });
}

// ── Route: GET /api/kv/:key — đọc từ KV ─────────────────────
async function handleKvGet(key, env) {
  if (!env.MY_KV) {
    return jsonResponse({ error: 'KV namespace chưa được bind' }, 500);
  }

  // getWithMetadata trả cả giá trị và metadata
  const { value, metadata } = await env.MY_KV.getWithMetadata(key);

  if (value === null) {
    return jsonResponse({ error: `Key "${key}" không tồn tại` }, 404);
  }

  return jsonResponse({ key, value, metadata });
}

// ── Route: PUT /api/kv/:key — ghi vào KV ────────────────────
async function handleKvPut(key, request, env) {
  if (!env.MY_KV) {
    return jsonResponse({ error: 'KV namespace chưa được bind' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Body phải là JSON' }, 400);
  }

  const { value, ttl } = body;
  if (value === undefined) {
    return jsonResponse({ error: '"value" là bắt buộc' }, 400);
  }

  // Lưu vào KV — tối đa 25MB/value, TTL tính bằng giây
  await env.MY_KV.put(key, String(value), {
    expirationTtl: ttl || 3600,          // mặc định 1 giờ
    metadata: { updatedAt: new Date().toISOString() },
  });

  return jsonResponse({ success: true, key, value, ttl: ttl || 3600 });
}

// ── Route: GET /api/cache-demo — demo Cache API ──────────────
async function handleCacheDemo(request, env, ctx) {
  const cacheKey = new Request(request.url, request.clone());
  const cache = caches.default;   // Cloudflare Cache API — phân tán toàn cầu

  // Thử lấy từ cache trước
  let cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    // Thêm header để biết response đến từ cache
    const headers = new Headers(cachedResponse.headers);
    headers.set('X-Cache', 'HIT');
    return new Response(cachedResponse.body, { headers });
  }

  // Cache MISS — tạo response mới
  const data = {
    message: 'Response này được cache trong 60 giây',
    generatedAt: new Date().toISOString(),
    tip: 'Gọi lại endpoint này, X-Cache sẽ là HIT',
  };

  const freshResponse = new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',   // cache 60 giây
      'X-Cache': 'MISS',
    },
  });

  // Lưu vào cache — ctx.waitUntil không block response
  ctx.waitUntil(cache.put(cacheKey, freshResponse.clone()));

  return freshResponse;
}

// ── Main fetch handler — entry point của Worker ──────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Router đơn giản bằng pattern matching
    if (path === '/api/hello') {
      return handleHello(request, env);
    }

    // KV routes: /api/kv/:key
    const kvMatch = path.match(/^\/api\/kv\/([^/]+)$/);
    if (kvMatch) {
      const key = decodeURIComponent(kvMatch[1]);
      if (request.method === 'GET') return handleKvGet(key, env);
      if (request.method === 'PUT') return handleKvPut(key, request, env);
    }

    if (path === '/api/cache-demo' && request.method === 'GET') {
      return handleCacheDemo(request, env, ctx);
    }

    return jsonResponse({ error: 'Route không tồn tại' }, 404);
  },
};
