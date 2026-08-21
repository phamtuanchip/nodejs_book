/**
 * Chương 14: Redis Pub/Sub
 * Publisher và Subscriber cho notification system
 *
 * Chạy trong 2 terminal:
 *   Terminal 1: node 05-pub-sub.js subscriber
 *   Terminal 2: node 05-pub-sub.js publisher
 *   Hoặc: node 05-pub-sub.js demo (chạy cả 2)
 */

const Redis = require('ioredis');

// === CHANNELS ===
const CHANNELS = {
  USER_EVENTS: 'user:events',       // user đăng ký, login, logout
  ORDER_EVENTS: 'order:events',     // đặt hàng, thanh toán
  NOTIFICATION: 'notifications',    // thông báo chung
  CHAT: 'chat:general',             // tin nhắn chat
};

// === SUBSCRIBER ===
class NotificationSubscriber {
  constructor() {
    // Subscriber cần connection riêng (không dùng chung với publisher)
    this.subscriber = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: 6379,
      lazyConnect: true,
    });

    this.handlers = new Map(); // Map channel -> [handlers]
  }

  async connect() {
    await this.subscriber.connect();
    console.log('[Subscriber] Kết nối Redis thành công');

    // Lắng nghe tất cả messages
    this.subscriber.on('message', (channel, message) => {
      this.handleMessage(channel, message);
    });

    // Pattern subscribe: lắng nghe nhiều channel cùng lúc
    this.subscriber.on('pmessage', (pattern, channel, message) => {
      console.log(`[Pattern: ${pattern}] Channel: ${channel}`);
      this.handleMessage(channel, message);
    });
  }

  handleMessage(channel, rawMessage) {
    try {
      const message = JSON.parse(rawMessage);
      const timestamp = new Date().toISOString();

      console.log(`\n[${timestamp}] Nhận từ "${channel}":`);
      console.log(JSON.stringify(message, null, 2));

      // Gọi handlers đã đăng ký
      const channelHandlers = this.handlers.get(channel) || [];
      channelHandlers.forEach(handler => {
        try {
          handler(message, channel);
        } catch (err) {
          console.error(`Handler lỗi cho channel "${channel}":`, err.message);
        }
      });
    } catch {
      // Message không phải JSON
      console.log(`[${channel}] Raw message: ${rawMessage}`);
    }
  }

  // Đăng ký handler cho channel
  on(channel, handler) {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, []);
    }
    this.handlers.get(channel).push(handler);
    return this;
  }

  // Subscribe vào channel
  async subscribe(...channels) {
    await this.subscriber.subscribe(...channels);
    console.log(`[Subscriber] Đang lắng nghe: ${channels.join(', ')}`);
  }

  // Pattern subscribe: 'user:*' sẽ match 'user:events', 'user:login', ...
  async psubscribe(pattern) {
    await this.subscriber.psubscribe(pattern);
    console.log(`[Subscriber] Pattern subscribe: ${pattern}`);
  }

  async disconnect() {
    await this.subscriber.quit();
  }
}

// === PUBLISHER ===
class NotificationPublisher {
  constructor() {
    this.publisher = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: 6379,
      lazyConnect: true,
    });
  }

  async connect() {
    await this.publisher.connect();
    console.log('[Publisher] Kết nối Redis thành công');
  }

  // Publish message đến channel
  async publish(channel, data) {
    const message = JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
      source: 'notification-service',
    });

    const subscriberCount = await this.publisher.publish(channel, message);
    console.log(`[Publisher] Gửi đến "${channel}" -> ${subscriberCount} subscribers nhận`);
    return subscriberCount;
  }

  // Các hàm tiện ích cho từng loại event
  async notifyUserRegistered(userId, email, name) {
    return this.publish(CHANNELS.USER_EVENTS, {
      type: 'USER_REGISTERED',
      userId,
      email,
      name,
    });
  }

  async notifyUserLogin(userId, ip) {
    return this.publish(CHANNELS.USER_EVENTS, {
      type: 'USER_LOGIN',
      userId,
      ip,
    });
  }

  async notifyOrderCreated(orderId, userId, total) {
    return this.publish(CHANNELS.ORDER_EVENTS, {
      type: 'ORDER_CREATED',
      orderId,
      userId,
      total,
      currency: 'VND',
    });
  }

  async notifyOrderPaid(orderId, paymentMethod) {
    return this.publish(CHANNELS.ORDER_EVENTS, {
      type: 'ORDER_PAID',
      orderId,
      paymentMethod,
    });
  }

  async sendNotification(userId, title, body, type = 'info') {
    return this.publish(CHANNELS.NOTIFICATION, {
      type: 'PUSH_NOTIFICATION',
      userId,
      notification: { title, body, type },
    });
  }

  async sendChatMessage(userId, username, text) {
    return this.publish(CHANNELS.CHAT, {
      type: 'CHAT_MESSAGE',
      userId,
      username,
      text,
    });
  }

  async disconnect() {
    await this.publisher.quit();
  }
}

// === DEMO: Chạy cả subscriber và publisher ===
async function runDemo() {
  console.log('=== Redis Pub/Sub Demo ===\n');

  const subscriber = new NotificationSubscriber();
  const publisher = new NotificationPublisher();

  await subscriber.connect();
  await publisher.connect();

  // Đăng ký handlers
  subscriber
    .on(CHANNELS.USER_EVENTS, (msg) => {
      if (msg.type === 'USER_REGISTERED') {
        console.log(`  -> Gửi email chào mừng đến ${msg.email}`);
        console.log(`  -> Tạo profile mặc định cho user ${msg.userId}`);
      } else if (msg.type === 'USER_LOGIN') {
        console.log(`  -> Ghi log: user ${msg.userId} login từ ${msg.ip}`);
      }
    })
    .on(CHANNELS.ORDER_EVENTS, (msg) => {
      if (msg.type === 'ORDER_CREATED') {
        console.log(`  -> Gửi email xác nhận đơn hàng #${msg.orderId}`);
        console.log(`  -> Thông báo cho kho hàng chuẩn bị`);
      } else if (msg.type === 'ORDER_PAID') {
        console.log(`  -> Đơn hàng #${msg.orderId} đã thanh toán qua ${msg.paymentMethod}`);
        console.log(`  -> Kích hoạt giao hàng`);
      }
    })
    .on(CHANNELS.NOTIFICATION, (msg) => {
      console.log(`  -> Push notification đến user ${msg.userId}: "${msg.notification.title}"`);
    })
    .on(CHANNELS.CHAT, (msg) => {
      console.log(`  -> [Chat] ${msg.username}: ${msg.text}`);
    });

  // Subscribe vào các channels
  await subscriber.subscribe(
    CHANNELS.USER_EVENTS,
    CHANNELS.ORDER_EVENTS,
    CHANNELS.NOTIFICATION,
    CHANNELS.CHAT
  );

  // Chờ kết nối ổn định
  await new Promise(resolve => setTimeout(resolve, 500));

  // Publish các events
  console.log('\n=== Bắt đầu publish events ===');

  await publisher.notifyUserRegistered(1, 'newuser@example.com', 'Người Dùng Mới');
  await new Promise(resolve => setTimeout(resolve, 200));

  await publisher.notifyUserLogin(1, '192.168.1.100');
  await new Promise(resolve => setTimeout(resolve, 200));

  await publisher.notifyOrderCreated('ORD-001', 1, 1500000);
  await new Promise(resolve => setTimeout(resolve, 200));

  await publisher.notifyOrderPaid('ORD-001', 'VNPay');
  await new Promise(resolve => setTimeout(resolve, 200));

  await publisher.sendNotification(1, 'Đơn hàng đã giao!', 'ORD-001 đã giao thành công', 'success');
  await new Promise(resolve => setTimeout(resolve, 200));

  await publisher.sendChatMessage(2, 'Bob', 'Xin chào mọi người!');
  await publisher.sendChatMessage(1, 'Alice', 'Chào Bob!');

  // Chờ nhận hết messages
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Dọn dẹp
  await subscriber.disconnect();
  await publisher.disconnect();
  console.log('\nKết thúc demo Pub/Sub');
}

// Entry point
const mode = process.argv[2] || 'demo';

if (mode === 'demo') {
  runDemo().catch(console.error);
} else if (mode === 'subscriber') {
  // Chỉ chạy subscriber (lắng nghe mãi)
  const sub = new NotificationSubscriber();
  sub.connect().then(async () => {
    await sub.subscribe(CHANNELS.USER_EVENTS, CHANNELS.ORDER_EVENTS, CHANNELS.NOTIFICATION, CHANNELS.CHAT);
    sub.on(CHANNELS.USER_EVENTS, (msg) => console.log('User event:', msg.type));
    sub.on(CHANNELS.ORDER_EVENTS, (msg) => console.log('Order event:', msg.type));
    sub.on(CHANNELS.NOTIFICATION, (msg) => console.log('Notification:', msg.notification?.title));
    sub.on(CHANNELS.CHAT, (msg) => console.log(`Chat [${msg.username}]: ${msg.text}`));
    console.log('Subscriber đang chạy, nhấn Ctrl+C để dừng...');
  });
} else if (mode === 'publisher') {
  // Chỉ publish một số events
  const pub = new NotificationPublisher();
  pub.connect().then(async () => {
    await pub.notifyUserRegistered(99, 'test@test.com', 'Test User');
    await pub.sendChatMessage(99, 'TestUser', `Hello từ publisher! ${new Date().toLocaleTimeString()}`);
    await pub.disconnect();
  });
}

module.exports = { NotificationPublisher, NotificationSubscriber, CHANNELS };
