/**
 * Chương 07 - Ví dụ 01: Dùng lodash
 * Xử lý mảng, object với các hàm tiện ích của lodash
 * Cài đặt: npm install (trong thư mục chapter07/)
 * Chạy: node 01-use-lodash.js
 */

const _ = require('lodash');

// ─── Dữ liệu mẫu: danh sách sản phẩm ────────────────────────────────────────

const products = [
  { id: 1, name: 'MacBook Pro M3', category: 'laptop', brand: 'Apple', price: 45000000, stock: 5, rating: 4.8 },
  { id: 2, name: 'Dell XPS 15', category: 'laptop', brand: 'Dell', price: 35000000, stock: 12, rating: 4.5 },
  { id: 3, name: 'iPhone 15 Pro', category: 'phone', brand: 'Apple', price: 28000000, stock: 30, rating: 4.7 },
  { id: 4, name: 'Samsung Galaxy S24', category: 'phone', brand: 'Samsung', price: 22000000, stock: 25, rating: 4.4 },
  { id: 5, name: 'iPad Air M2', category: 'tablet', brand: 'Apple', price: 18000000, stock: 8, rating: 4.6 },
  { id: 6, name: 'Lenovo ThinkPad X1', category: 'laptop', brand: 'Lenovo', price: 30000000, stock: 7, rating: 4.3 },
  { id: 7, name: 'Google Pixel 8', category: 'phone', brand: 'Google', price: 18000000, stock: 15, rating: 4.2 },
  { id: 8, name: 'Surface Pro 10', category: 'tablet', brand: 'Microsoft', price: 28000000, stock: 4, rating: 4.1 },
  { id: 9, name: 'ASUS ROG Phone', category: 'phone', brand: 'ASUS', price: 20000000, stock: 10, rating: 4.0 },
  { id: 10, name: 'HP Spectre x360', category: 'laptop', brand: 'HP', price: 32000000, stock: 0, rating: 4.4 },
];

const fmt = (price) => price.toLocaleString('vi-VN') + 'đ';

// ─── groupBy: Nhóm sản phẩm theo danh mục ────────────────────────────────────

console.log('=== GROUPBY: Nhóm theo danh mục ===');
const byCategory = _.groupBy(products, 'category');
Object.entries(byCategory).forEach(([cat, items]) => {
  console.log(`\n${cat.toUpperCase()} (${items.length} sản phẩm):`);
  items.forEach((p) => console.log(`  - ${p.name}: ${fmt(p.price)}`));
});

// ─── sortBy: Sắp xếp đa tiêu chí ────────────────────────────────────────────

console.log('\n=== SORTBY: Sắp xếp ===');

// Sắp xếp theo price tăng dần
const cheapest = _.sortBy(products, 'price');
console.log('Top 3 rẻ nhất:');
cheapest.slice(0, 3).forEach((p) => console.log(`  ${p.name}: ${fmt(p.price)}`));

// Sắp xếp theo nhiều tiêu chí: category ASC, price DESC
const multiSort = _.orderBy(products, ['category', 'price'], ['asc', 'desc']);
console.log('\nTheo category rồi giá giảm dần (top 5):');
multiSort.slice(0, 5).forEach((p) => console.log(`  [${p.category}] ${p.name}: ${fmt(p.price)}`));

// ─── filter + map: Lọc và biến đổi ──────────────────────────────────────────

console.log('\n=== FILTER + MAP ===');

// Sản phẩm Apple còn hàng, giá dưới 30 triệu
const appleAvailable = _.chain(products)
  .filter((p) => p.brand === 'Apple' && p.stock > 0 && p.price < 30000000)
  .map((p) => _.pick(p, ['name', 'price', 'rating'])) // chỉ lấy fields cần thiết
  .sortBy('price')
  .value();

console.log('Sản phẩm Apple còn hàng, dưới 30tr:');
appleAvailable.forEach((p) => console.log(`  ${p.name} - ${fmt(p.price)} - ⭐${p.rating}`));

// ─── pick / omit: Chọn hoặc loại bỏ fields ───────────────────────────────────

console.log('\n=== PICK / OMIT ===');

const product = products[0];
const summary = _.pick(product, ['id', 'name', 'price']); // chỉ lấy 3 fields
const withoutStock = _.omit(product, ['stock', 'id']); // bỏ 2 fields

console.log('pick (id, name, price):', summary);
console.log('omit (stock, id):', withoutStock);

// ─── chunk: Chia mảng thành trang (pagination) ───────────────────────────────

console.log('\n=== CHUNK: Pagination ===');

const pages = _.chunk(products, 3); // 3 sản phẩm/trang
console.log(`Tổng ${products.length} sản phẩm → ${pages.length} trang (3 sp/trang)`);
console.log('Trang 1:', pages[0].map((p) => p.name));
console.log('Trang 2:', pages[1].map((p) => p.name));

// ─── uniq / uniqBy: Loại bỏ trùng lặp ───────────────────────────────────────

console.log('\n=== UNIQ ===');

const categories = products.map((p) => p.category);
console.log('Tất cả categories:', categories);
console.log('Unique categories:', _.uniq(categories));

const brands = _.uniqBy(products, 'brand').map((p) => p.brand);
console.log('Unique brands:', brands);

// ─── flatten: Làm phẳng mảng lồng nhau ──────────────────────────────────────

console.log('\n=== FLATTEN ===');

const matrix = [[1, 2], [3, [4, 5]], [6]];
console.log('Gốc:', JSON.stringify(matrix));
console.log('flatten (1 cấp):', _.flatten(matrix));
console.log('flattenDeep (tất cả cấp):', _.flattenDeep(matrix));

// ─── _.chain: Pipeline xử lý dữ liệu ─────────────────────────────────────────

console.log('\n=== CHAIN: Pipeline ===');

// Tính thống kê bán hàng theo danh mục
const stats = _.chain(products)
  .filter((p) => p.stock > 0) // chỉ sp còn hàng
  .groupBy('category')
  .mapValues((items) => ({
    count: items.length,
    avgPrice: Math.round(_.meanBy(items, 'price')),
    maxPrice: _.maxBy(items, 'price').price,
    minPrice: _.minBy(items, 'price').price,
    avgRating: _.round(_.meanBy(items, 'rating'), 1),
    totalStock: _.sumBy(items, 'stock'),
  }))
  .value();

console.log('Thống kê theo danh mục:');
Object.entries(stats).forEach(([cat, s]) => {
  console.log(`\n  ${cat.toUpperCase()}:`);
  console.log(`    Số sản phẩm: ${s.count} | Tổng tồn kho: ${s.totalStock}`);
  console.log(`    Giá TB: ${fmt(s.avgPrice)} | Min: ${fmt(s.minPrice)} | Max: ${fmt(s.maxPrice)}`);
  console.log(`    Rating TB: ⭐${s.avgRating}`);
});

// ─── mergeWith / merge: Kết hợp objects ─────────────────────────────────────

console.log('\n=== MERGE ===');

const defaults = { theme: 'light', language: 'vi', notifications: true, pageSize: 10 };
const userPrefs = { theme: 'dark', pageSize: 20 };
const merged = _.merge({}, defaults, userPrefs); // deep merge, không mutate gốc
console.log('Merged config:', merged);
