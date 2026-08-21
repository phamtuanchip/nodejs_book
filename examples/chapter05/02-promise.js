/**
 * Chương 05 - Ví dụ 02: Promise
 * Promise API, chaining, xử lý lỗi và các static methods
 */

// ─── Tạo Promise cơ bản ──────────────────────────────────────────────────────

console.log('=== TẠO PROMISE ===');

// Constructor nhận executor(resolve, reject)
const fetchProduct = (id) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id <= 0) {
        reject(new Error(`ID không hợp lệ: ${id}`));
        return;
      }
      resolve({
        id,
        name: `Sản phẩm ${id}`,
        price: id * 10000,
        category: id % 2 === 0 ? 'electronics' : 'clothing',
      });
    }, 50 + Math.random() * 100); // delay ngẫu nhiên
  });

// ─── then / catch / finally ──────────────────────────────────────────────────

console.log('\n=== THEN / CATCH / FINALLY ===');

fetchProduct(1)
  .then((product) => {
    console.log('✓ Sản phẩm:', product.name, '-', product.price.toLocaleString('vi-VN'), 'đ');
    return product; // truyền xuống .then tiếp theo
  })
  .then((product) => {
    // Chaining: mỗi .then nhận giá trị từ .then trước
    console.log('  Danh mục:', product.category);
    return { ...product, discount: product.price * 0.1 };
  })
  .then((product) => {
    console.log('  Giảm giá:', product.discount.toLocaleString('vi-VN'), 'đ');
  })
  .catch((err) => {
    // Bắt lỗi từ bất kỳ bước nào trong chain
    console.error('✗ Lỗi:', err.message);
  })
  .finally(() => {
    // Luôn chạy dù resolve hay reject - dùng để cleanup
    console.log('  [Hoàn thành request]');
  });

// Thử với ID không hợp lệ
fetchProduct(-1)
  .then((p) => console.log('Không bao giờ chạy đến đây'))
  .catch((err) => console.error('\n✗ ID âm:', err.message))
  .finally(() => console.log('  [Cleanup sau lỗi]'));

// ─── Promise.all - chạy song song, chờ TẤT CẢ hoàn thành ───────────────────

console.log('\n=== PROMISE.ALL (song song) ===');

const start = Date.now();

Promise.all([fetchProduct(1), fetchProduct(2), fetchProduct(3)])
  .then((products) => {
    const elapsed = Date.now() - start;
    console.log(`✓ Tải ${products.length} sản phẩm song song trong ${elapsed}ms`);
    products.forEach((p) => console.log(`  - ${p.name}: ${p.price.toLocaleString('vi-VN')}đ`));

    // Tính tổng giá trị
    const total = products.reduce((sum, p) => sum + p.price, 0);
    console.log(`  Tổng: ${total.toLocaleString('vi-VN')}đ`);
  })
  .catch((err) => {
    // Nếu BẤT KỲ promise nào reject → cả Promise.all reject ngay
    console.error('✗ Một trong các request thất bại:', err.message);
  });

// ─── Promise.allSettled - không dừng khi có lỗi ─────────────────────────────

console.log('\n=== PROMISE.ALLSETTLED (chờ tất cả, kể cả lỗi) ===');

Promise.allSettled([
  fetchProduct(1),
  fetchProduct(-99), // sẽ bị lỗi
  fetchProduct(3),
]).then((results) => {
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`✓ [${index}] ${result.value.name}`);
    } else {
      console.error(`✗ [${index}] Lỗi: ${result.reason.message}`);
    }
  });

  // Tách thành công / thất bại
  const succeeded = results.filter((r) => r.status === 'fulfilled');
  const failed = results.filter((r) => r.status === 'rejected');
  console.log(`  Kết quả: ${succeeded.length} thành công, ${failed.length} thất bại`);
});

// ─── Promise.race - lấy kết quả của Promise NHANH NHẤT ──────────────────────

console.log('\n=== PROMISE.RACE (nhanh nhất thắng) ===');

// Ứng dụng: timeout pattern
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout sau ${ms}ms`)), ms)
    ),
  ]);

withTimeout(fetchProduct(5), 200)
  .then((p) => console.log('✓ Kịp timeout:', p.name))
  .catch((err) => console.error('✗ Quá thời gian:', err.message));

// ─── Promise.any - lấy Promise THÀNH CÔNG đầu tiên ──────────────────────────

console.log('\n=== PROMISE.ANY (thành công đầu tiên) ===');

// Ứng dụng: fallback - thử nhiều server, lấy server nào phản hồi trước
const fetchFromMirror = (mirrorId, delay) =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      if (mirrorId === 2) reject(new Error(`Mirror ${mirrorId} down`));
      else resolve(`Dữ liệu từ Mirror ${mirrorId}`);
    }, delay)
  );

Promise.any([
  fetchFromMirror(2, 50),  // mirror này sẽ fail
  fetchFromMirror(3, 150), // mirror này ok
  fetchFromMirror(1, 200), // mirror này ok nhưng chậm hơn
])
  .then((data) => console.log('✓ Nhận được:', data))
  .catch((err) => console.error('✗ Tất cả mirror đều fail:', err.message));

// ─── Promise chaining thực tế: giỏ hàng ─────────────────────────────────────

console.log('\n=== ỨNG DỤNG THỰC TẾ: XỬ LÝ GIỎ HÀNG ===');

const cart = [1, 2, 3];

Promise.all(cart.map((id) => fetchProduct(id)))
  .then((products) => {
    const total = products.reduce((sum, p) => sum + p.price, 0);
    return { products, total, discount: total > 20000 ? total * 0.05 : 0 };
  })
  .then(({ products, total, discount }) => {
    console.log('Giỏ hàng:');
    products.forEach((p) => console.log(`  + ${p.name}: ${p.price.toLocaleString('vi-VN')}đ`));
    console.log(`  Tổng: ${total.toLocaleString('vi-VN')}đ`);
    if (discount > 0) {
      console.log(`  Giảm 5%: -${discount.toLocaleString('vi-VN')}đ`);
      console.log(`  Thanh toán: ${(total - discount).toLocaleString('vi-VN')}đ`);
    }
  })
  .catch((err) => console.error('Lỗi xử lý giỏ hàng:', err.message));
