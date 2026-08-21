/**
 * Chương 15: Products API v1
 * Full CRUD với filter, sort, pagination
 * Response format chuẩn: { success, data, meta, links }
 */

const express = require('express');
const router = express.Router();
const { paginate, sortable } = require('../../middleware/paginate');
const { validateProduct } = require('../../middleware/validate');
const { success, error, created } = require('../../utils/api-response');

// === GIẢ LẬP DATABASE ===
let products = [
  { id: 1, name: 'Laptop Dell XPS 13', price: 28000000, category: 'laptop', description: 'Laptop siêu mỏng cao cấp', inStock: true, tags: ['dell', 'ultrabook'], createdAt: new Date('2024-01-10') },
  { id: 2, name: 'iPhone 15 Pro Max', price: 35000000, category: 'phone', description: 'Điện thoại Apple mới nhất', inStock: true, tags: ['apple', 'ios'], createdAt: new Date('2024-01-15') },
  { id: 3, name: 'Sony WH-1000XM5', price: 8500000, category: 'audio', description: 'Tai nghe chống ồn tốt nhất', inStock: false, tags: ['sony', 'headphone'], createdAt: new Date('2024-02-01') },
  { id: 4, name: 'iPad Pro M4', price: 22000000, category: 'tablet', description: 'Máy tính bảng mạnh nhất của Apple', inStock: true, tags: ['apple', 'ipad'], createdAt: new Date('2024-02-10') },
  { id: 5, name: 'Mouse Logitech MX Master 3', price: 2800000, category: 'accessory', description: 'Chuột không dây cao cấp', inStock: true, tags: ['logitech', 'mouse'], createdAt: new Date('2024-02-15') },
  { id: 6, name: 'Samsung Galaxy S24', price: 22000000, category: 'phone', description: 'Flagship của Samsung', inStock: true, tags: ['samsung', 'android'], createdAt: new Date('2024-03-01') },
  { id: 7, name: 'MacBook Air M3', price: 32000000, category: 'laptop', description: 'MacBook nhẹ nhất từ Apple', inStock: true, tags: ['apple', 'macbook'], createdAt: new Date('2024-03-10') },
];
let nextId = 8;

// Helper tìm product và check tồn tại
function findProduct(id) {
  return products.find(p => p.id === parseInt(id));
}

// === GET /api/v1/products ===
// Danh sách với filter, sort, pagination
router.get('/',
  validateProduct.list,
  paginate({ defaultLimit: 5, maxLimit: 100 }),
  sortable(['id', 'name', 'price', 'createdAt']),
  (req, res) => {
    const { category, search, minPrice, maxPrice, inStock } = req.query;
    const { field, order } = req.sort;

    // Lọc dữ liệu
    let filtered = [...products];

    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }

    if (search) {
      const keyword = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(keyword) ||
        p.description?.toLowerCase().includes(keyword) ||
        p.tags?.some(t => t.toLowerCase().includes(keyword))
      );
    }

    if (minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= minPrice);
    }

    if (maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= maxPrice);
    }

    if (inStock !== undefined) {
      filtered = filtered.filter(p => p.inStock === inStock);
    }

    // Sắp xếp
    filtered.sort((a, b) => {
      let comparison = 0;
      if (a[field] < b[field]) comparison = -1;
      if (a[field] > b[field]) comparison = 1;
      return order === 'desc' ? -comparison : comparison;
    });

    // Tổng số sau filter
    const total = filtered.length;

    // Phân trang
    const { offset, limit, page } = req.pagination;
    const paginated = filtered.slice(offset, offset + limit);

    res.json(req.paginate(paginated, total));
  }
);

// === GET /api/v1/products/:id ===
router.get('/:id', validateProduct.getById, (req, res) => {
  const product = findProduct(req.params.id);

  if (!product) {
    return res.status(404).json(error(`Không tìm thấy sản phẩm #${req.params.id}`, 'NOT_FOUND'));
  }

  res.json(success(product));
});

// === POST /api/v1/products ===
router.post('/', validateProduct.create, (req, res) => {
  const { name, price, category, description, inStock, tags } = req.body;

  const newProduct = {
    id: nextId++,
    name,
    price,
    category,
    description: description || '',
    inStock: inStock !== undefined ? inStock : true,
    tags: tags || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  products.push(newProduct);

  // 201 Created + Location header
  res.status(201)
    .set('Location', `/api/v1/products/${newProduct.id}`)
    .json(created(newProduct, 'Thêm sản phẩm thành công'));
});

// === PUT /api/v1/products/:id ===
router.put('/:id', validateProduct.update, (req, res) => {
  const index = products.findIndex(p => p.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json(error(`Không tìm thấy sản phẩm #${req.params.id}`, 'NOT_FOUND'));
  }

  // Cập nhật chỉ các field được gửi lên (partial update)
  products[index] = {
    ...products[index],
    ...req.body,
    id: products[index].id,        // không đổi ID
    createdAt: products[index].createdAt, // không đổi createdAt
    updatedAt: new Date(),
  };

  res.json(success(products[index], null, 'Cập nhật thành công'));
});

// === PATCH /api/v1/products/:id ===
// PATCH: cập nhật một phần (giống PUT ở đây vì đã handle partial update)
router.patch('/:id', validateProduct.update, (req, res) => {
  const index = products.findIndex(p => p.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json(error(`Không tìm thấy sản phẩm #${req.params.id}`, 'NOT_FOUND'));
  }

  products[index] = { ...products[index], ...req.body, updatedAt: new Date() };
  res.json(success(products[index], null, 'Cập nhật thành công'));
});

// === DELETE /api/v1/products/:id ===
router.delete('/:id', validateProduct.getById, (req, res) => {
  const index = products.findIndex(p => p.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json(error(`Không tìm thấy sản phẩm #${req.params.id}`, 'NOT_FOUND'));
  }

  products.splice(index, 1);

  // 204 No Content: không trả body
  res.status(204).send();
});

// === GET /api/v1/products/categories/summary ===
// Thống kê theo category
router.get('/categories/summary', (req, res) => {
  const summary = products.reduce((acc, p) => {
    if (!acc[p.category]) {
      acc[p.category] = { count: 0, inStock: 0, avgPrice: 0, totalPrice: 0 };
    }
    acc[p.category].count++;
    acc[p.category].totalPrice += p.price;
    if (p.inStock) acc[p.category].inStock++;
    return acc;
  }, {});

  // Tính giá trung bình
  Object.keys(summary).forEach(cat => {
    summary[cat].avgPrice = Math.round(summary[cat].totalPrice / summary[cat].count);
    delete summary[cat].totalPrice;
  });

  res.json(success(summary));
});

module.exports = router;
