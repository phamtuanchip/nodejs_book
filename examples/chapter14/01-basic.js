/**
 * Chương 14: Redis cơ bản với ioredis
 * String, Hash, List, Set, Sorted Set
 * EXPIRE, TTL, DEL, EXISTS
 *
 * Yêu cầu: Redis server đang chạy (localhost:6379)
 * Cài đặt: npm install ioredis
 * Chạy: node 01-basic.js
 */

const Redis = require('ioredis');

// Kết nối Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  // Tự động reconnect khi mất kết nối
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  // Thời gian chờ kết nối
  connectTimeout: 5000,
  lazyConnect: true, // Kết nối khi dùng lần đầu
});

// Xử lý lỗi kết nối
redis.on('error', (err) => console.error('Redis lỗi:', err.message));
redis.on('connect', () => console.log('Redis kết nối thành công'));

// === 1. STRING ===
async function demoString() {
  console.log('\n--- STRING ---');

  // SET: lưu giá trị với thời hạn 60 giây
  await redis.set('user:1:name', 'Alice Nguyễn');
  await redis.set('user:1:age', '28');
  await redis.set('session:abc123', '{"userId": 1}', 'EX', 3600); // hết hạn 1 giờ

  // GET: lấy giá trị
  const name = await redis.get('user:1:name');
  const age = await redis.get('user:1:age');
  console.log(`Tên: ${name}, Tuổi: ${age}`);

  // MSET/MGET: set/get nhiều key cùng lúc
  await redis.mset('color:1', 'đỏ', 'color:2', 'xanh', 'color:3', 'vàng');
  const colors = await redis.mget('color:1', 'color:2', 'color:3');
  console.log('Màu sắc:', colors);

  // INCR/DECR: tăng/giảm số (atomic)
  await redis.set('counter:visits', '0');
  await redis.incr('counter:visits');
  await redis.incr('counter:visits');
  await redis.incrby('counter:visits', 5);
  const visits = await redis.get('counter:visits');
  console.log(`Lượt truy cập: ${visits}`); // 7

  // TTL: kiểm tra thời gian sống còn lại (giây)
  const ttl = await redis.ttl('session:abc123');
  console.log(`Session còn hạn: ${ttl} giây`);

  // EXISTS: kiểm tra key tồn tại
  const exists = await redis.exists('user:1:name');
  console.log(`user:1:name tồn tại: ${exists === 1}`);

  // DEL: xóa key
  await redis.del('user:1:age');
  const afterDel = await redis.get('user:1:age');
  console.log(`Sau khi xóa: ${afterDel}`); // null

  // EXPIRE: đặt thời hạn cho key đã có
  await redis.expire('user:1:name', 120); // 2 phút
  const ttl2 = await redis.ttl('user:1:name');
  console.log(`TTL sau khi set expire: ${ttl2}s`);
}

// === 2. HASH ===
async function demoHash() {
  console.log('\n--- HASH ---');

  // HSET: lưu nhiều field trong 1 key
  await redis.hset('user:2', {
    name: 'Bob Trần',
    email: 'bob@example.com',
    role: 'admin',
    age: '30',
  });

  // HGET: lấy 1 field
  const email = await redis.hget('user:2', 'email');
  console.log(`Email: ${email}`);

  // HMGET: lấy nhiều fields
  const [bobName, bobRole] = await redis.hmget('user:2', 'name', 'role');
  console.log(`Tên: ${bobName}, Role: ${bobRole}`);

  // HGETALL: lấy toàn bộ hash
  const allFields = await redis.hgetall('user:2');
  console.log('Toàn bộ user:', allFields);

  // HINCRBY: tăng số trong hash
  await redis.hincrby('user:2', 'login_count', 1);
  await redis.hincrby('user:2', 'login_count', 1);
  const loginCount = await redis.hget('user:2', 'login_count');
  console.log(`Login count: ${loginCount}`);

  // HDEL: xóa field
  await redis.hdel('user:2', 'age');

  // HKEYS, HVALS, HLEN
  const keys = await redis.hkeys('user:2');
  console.log('Các fields:', keys);
}

// === 3. LIST ===
async function demoList() {
  console.log('\n--- LIST ---');

  // Xóa list cũ nếu có
  await redis.del('queue:emails', 'history:pages');

  // LPUSH: thêm vào đầu list (queue)
  await redis.rpush('queue:emails', 'email1@test.com', 'email2@test.com', 'email3@test.com');

  // RPUSH: thêm vào cuối list
  await redis.rpush('history:pages', '/home', '/about', '/contact');

  // LLEN: độ dài list
  const queueLen = await redis.llen('queue:emails');
  console.log(`Email queue: ${queueLen} items`);

  // LRANGE: lấy từ index start đến end (0 đến -1 = tất cả)
  const emails = await redis.lrange('queue:emails', 0, -1);
  console.log('Email queue:', emails);

  // LPOP: lấy và xóa phần tử đầu (dequeue)
  const nextEmail = await redis.lpop('queue:emails');
  console.log(`Xử lý email: ${nextEmail}`);
  console.log(`Còn lại: ${await redis.llen('queue:emails')} emails`);

  // LINDEX: lấy theo index
  const firstPage = await redis.lindex('history:pages', 0);
  const lastPage = await redis.lindex('history:pages', -1);
  console.log(`Trang đầu: ${firstPage}, Trang cuối: ${lastPage}`);

  // LTRIM: giữ lại N phần tử cuối (rolling list)
  await redis.rpush('history:pages', '/blog', '/contact');
  await redis.ltrim('history:pages', -3, -1); // giữ 3 trang gần nhất
  const recentPages = await redis.lrange('history:pages', 0, -1);
  console.log('3 trang gần nhất:', recentPages);
}

// === 4. SET ===
async function demoSet() {
  console.log('\n--- SET ---');

  await redis.del('tags:post:1', 'tags:post:2');

  // SADD: thêm phần tử vào set (tự động dedup)
  await redis.sadd('tags:post:1', 'nodejs', 'javascript', 'backend');
  await redis.sadd('tags:post:2', 'javascript', 'frontend', 'react');
  await redis.sadd('tags:post:1', 'nodejs'); // thêm trùng -> bỏ qua

  // SMEMBERS: lấy tất cả thành viên
  const tags1 = await redis.smembers('tags:post:1');
  console.log('Tags post 1:', tags1);

  // SCARD: số lượng phần tử
  const count = await redis.scard('tags:post:1');
  console.log(`Số tags: ${count}`);

  // SISMEMBER: kiểm tra thành viên
  const hasNodejs = await redis.sismember('tags:post:1', 'nodejs');
  console.log(`Có tag nodejs: ${hasNodejs === 1}`);

  // SINTER: giao 2 set (tags chung)
  const commonTags = await redis.sinter('tags:post:1', 'tags:post:2');
  console.log('Tags chung:', commonTags);

  // SUNION: hợp 2 set
  const allTags = await redis.sunion('tags:post:1', 'tags:post:2');
  console.log('Tất cả tags:', allTags);

  // SDIFF: hiệu set (tags của post 1 mà post 2 không có)
  const uniqueTags = await redis.sdiff('tags:post:1', 'tags:post:2');
  console.log('Tags riêng của post 1:', uniqueTags);

  // SREM: xóa phần tử
  await redis.srem('tags:post:1', 'backend');
}

// === 5. SORTED SET ===
async function demoSortedSet() {
  console.log('\n--- SORTED SET ---');

  await redis.del('leaderboard', 'trending:posts');

  // ZADD: thêm với điểm số (score)
  await redis.zadd('leaderboard',
    100, 'Alice',
    85,  'Bob',
    95,  'Charlie',
    110, 'Diana',
    75,  'Eve'
  );

  // ZRANGE: lấy theo thứ tự tăng dần (mặc định)
  const ascending = await redis.zrange('leaderboard', 0, -1, 'WITHSCORES');
  console.log('Xếp hạng tăng dần:', ascending);

  // ZREVRANGE: thứ tự giảm dần (top players)
  const topPlayers = await redis.zrevrange('leaderboard', 0, 2, 'WITHSCORES');
  console.log('Top 3:', topPlayers); // Diana, Alice, Charlie

  // ZSCORE: lấy điểm của 1 thành viên
  const aliceScore = await redis.zscore('leaderboard', 'Alice');
  console.log(`Điểm Alice: ${aliceScore}`);

  // ZINCRBY: tăng điểm
  await redis.zincrby('leaderboard', 20, 'Eve');
  const eveScore = await redis.zscore('leaderboard', 'Eve');
  console.log(`Điểm Eve sau khi cộng: ${eveScore}`);

  // ZRANK: xếp hạng (0-indexed, tăng dần)
  const aliceRank = await redis.zrevrank('leaderboard', 'Alice'); // giảm dần
  console.log(`Xếp hạng Alice (giảm dần): ${aliceRank + 1}`); // +1 vì 0-indexed

  // ZRANGEBYSCORE: lấy thành viên trong khoảng điểm
  const midRange = await redis.zrangebyscore('leaderboard', 85, 100, 'WITHSCORES');
  console.log('Điểm 85-100:', midRange);

  // ZCARD: số phần tử
  const totalPlayers = await redis.zcard('leaderboard');
  console.log(`Tổng người chơi: ${totalPlayers}`);
}

// === MAIN ===
async function main() {
  try {
    await redis.connect();
    console.log('=== Demo Redis với ioredis ===');

    await demoString();
    await demoHash();
    await demoList();
    await demoSet();
    await demoSortedSet();

    console.log('\nHoàn thành demo Redis!');
  } catch (err) {
    console.error('Lỗi:', err.message);
  } finally {
    // Dọn dẹp và đóng kết nối
    await redis.flushdb(); // Xóa tất cả data test (KHÔNG dùng trong production!)
    redis.disconnect();
  }
}

main();
