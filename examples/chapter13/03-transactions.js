/**
 * Chương 13: Prisma Transactions
 * Đảm bảo nhiều thao tác DB thực hiện cùng lúc hoặc rollback toàn bộ
 *
 * Chạy: node 03-transactions.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// === TRANSACTION KIỂU 1: $transaction([array]) ===
// Phù hợp khi các query độc lập với nhau, không cần kết quả của nhau

async function createUserWithProfile(userData, postData) {
  console.log('Transaction 1: Tạo user + post đồng thời...');

  // Nếu 1 trong 2 thất bại, cả 2 đều bị rollback
  const [user, post] = await prisma.$transaction([
    prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
      },
    }),
    // Lưu ý: dùng kiểu này thì chưa biết user.id nên dùng connect sau
    prisma.post.create({
      data: {
        title: postData.title,
        content: postData.content,
        author: { create: { email: 'temp@temp.com', name: 'Temp' } }, // ví dụ
      },
    }),
  ]);

  return { user, post };
}

// === TRANSACTION KIỂU 2: $transaction(async (tx) => {}) ===
// Phù hợp khi cần dùng kết quả của query trước cho query sau

async function registerUserAndCreateWelcomePost(email, name) {
  console.log('\nTransaction 2: Đăng ký user + tạo post chào mừng...');

  const result = await prisma.$transaction(async (tx) => {
    // Bước 1: Kiểm tra email đã tồn tại chưa
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error(`Email ${email} đã được đăng ký`);
    }

    // Bước 2: Tạo user
    const user = await tx.user.create({
      data: { email, name },
    });

    // Bước 3: Tạo bài post chào mừng dùng user.id từ bước 2
    const welcomePost = await tx.post.create({
      data: {
        title: `Xin chào từ ${name}!`,
        content: `Đây là bài viết đầu tiên của ${name}.`,
        published: true,
        authorId: user.id, // dùng kết quả từ bước trước
      },
    });

    // Bước 4: Tạo comment tự động
    const autoComment = await tx.comment.create({
      data: {
        content: 'Chào mừng bạn đến với cộng đồng!',
        postId: welcomePost.id,
        authorId: user.id,
      },
    });

    // Trả về toàn bộ kết quả
    return { user, welcomePost, autoComment };
  });

  return result;
}

// === TRANSACTION VỚI TIMEOUT VÀ ISOLATION ===
async function transferPoints(fromUserId, toUserId, points) {
  console.log(`\nTransaction 3: Chuyển ${points} điểm từ user ${fromUserId} -> ${toUserId}...`);

  // Giả lập bảng user_points (cần thêm vào schema thực tế)
  // Ở đây demo logic transaction với kiểm tra số dư
  const result = await prisma.$transaction(
    async (tx) => {
      // Lấy thông tin cả 2 user trong 1 transaction
      const [sender, receiver] = await Promise.all([
        tx.user.findUnique({ where: { id: fromUserId } }),
        tx.user.findUnique({ where: { id: toUserId } }),
      ]);

      if (!sender) throw new Error('Người gửi không tồn tại');
      if (!receiver) throw new Error('Người nhận không tồn tại');

      // Giả lập kiểm tra điểm (thực tế cần thêm trường points vào model)
      console.log(`  Gửi từ: ${sender.name} -> Nhận: ${receiver.name}`);
      console.log(`  Số điểm chuyển: ${points}`);

      // Tạo bản ghi transfer post như ví dụ
      const transferLog = await tx.post.create({
        data: {
          title: `Transfer: ${sender.name} -> ${receiver.name}`,
          content: `Chuyển ${points} điểm`,
          authorId: sender.id,
        },
      });

      return {
        success: true,
        transferId: transferLog.id,
        from: sender.name,
        to: receiver.name,
        points,
      };
    },
    {
      // Cài đặt timeout cho transaction (ms)
      timeout: 10000,
      // Isolation level: đảm bảo không đọc data đang được cập nhật
      isolationLevel: 'Serializable',
    }
  );

  return result;
}

// === TEST ROLLBACK: Transaction thất bại ===
async function demonstrateRollback() {
  console.log('\nTransaction 4: Demo rollback khi có lỗi...');

  let createdUserId = null;

  try {
    await prisma.$transaction(async (tx) => {
      // Bước 1: Tạo user (sẽ bị rollback)
      const user = await tx.user.create({
        data: { email: 'rollback_test@example.com', name: 'Rollback Test' },
      });
      createdUserId = user.id;
      console.log(`  Bước 1: Tạo user ID=${user.id} (chưa commit)`);

      // Bước 2: Giả lập lỗi
      const shouldFail = true;
      if (shouldFail) {
        throw new Error('Lỗi giả lập: bước 2 thất bại!');
      }

      // Bước 3: (sẽ không được chạy do lỗi ở bước 2)
      await tx.post.create({
        data: { title: 'Không bao giờ được tạo', authorId: user.id },
      });
    });
  } catch (err) {
    console.log(`  Lỗi xảy ra: "${err.message}"`);
    console.log('  Transaction đã rollback toàn bộ');

    // Kiểm tra user đã bị rollback chưa
    if (createdUserId) {
      const userStillExists = await prisma.user.findUnique({
        where: { id: createdUserId },
      });
      console.log(`  User ID=${createdUserId} tồn tại sau rollback? ${userStillExists ? 'CÒN' : 'ĐÃ XÓA'}`);
    }
  }
}

// === MAIN ===
async function main() {
  try {
    console.log('=== Demo Prisma Transactions ===');

    // Demo 2: Transaction interactive (cần kết quả của step trước)
    const { user, welcomePost } = await registerUserAndCreateWelcomePost(
      'newuser@example.com',
      'Người Dùng Mới'
    );
    console.log(`  Tạo user: ${user.name} + post: "${welcomePost.title}"`);

    // Demo rollback
    await demonstrateRollback();

    // Demo chuyển điểm giữa 2 user
    const users = await prisma.user.findMany({ take: 2 });
    if (users.length >= 2) {
      const transfer = await transferPoints(users[0].id, users[1].id, 100);
      console.log(`\n  Kết quả: ${JSON.stringify(transfer, null, 2)}`);
    }

  } catch (err) {
    console.error('\nLỗi không xử lý được:', err.message);
  } finally {
    await prisma.$disconnect();
    console.log('\nĐã đóng kết nối Prisma');
  }
}

main();
