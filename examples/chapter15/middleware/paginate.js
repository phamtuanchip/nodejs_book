/**
 * Chương 15: Pagination Middleware
 * Tự động parse page, limit từ query params
 * Gắn vào req.pagination để routes sử dụng
 */

/**
 * Tạo pagination middleware
 * @param {Object} options
 * @param {number} options.defaultLimit - Số items mặc định mỗi trang
 * @param {number} options.maxLimit - Giới hạn tối đa items mỗi trang
 * @param {number} options.defaultPage - Trang mặc định
 */
function paginate(options = {}) {
  const {
    defaultLimit = 10,
    maxLimit = 100,
    defaultPage = 1,
  } = options;

  return (req, res, next) => {
    // Parse và validate page
    let page = parseInt(req.query.page) || defaultPage;
    if (page < 1) page = 1;

    // Parse và validate limit
    let limit = parseInt(req.query.limit) || defaultLimit;
    if (limit < 1) limit = 1;
    if (limit > maxLimit) limit = maxLimit;

    // Tính offset cho DB query
    const offset = (page - 1) * limit;

    // Gắn vào req để routes dùng
    req.pagination = { page, limit, offset };

    // Hàm tiện ích: tạo response với links
    req.paginate = (items, total) => {
      const totalPages = Math.ceil(total / limit);
      const baseUrl = `${req.baseUrl}${req.path}`;
      const query = { ...req.query };
      delete query.page;
      delete query.limit;

      // Tạo URL helper
      const buildUrl = (p) => {
        const params = new URLSearchParams({ ...query, page: p, limit });
        return `${baseUrl}?${params}`;
      };

      const links = {};
      links.self = buildUrl(page);
      if (page > 1) {
        links.prev = buildUrl(page - 1);
        links.first = buildUrl(1);
      }
      if (page < totalPages) {
        links.next = buildUrl(page + 1);
        links.last = buildUrl(totalPages);
      }

      return {
        success: true,
        data: items,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          count: items.length,
        },
        links,
      };
    };

    next();
  };
}

// Middleware kiểm tra sort params
function sortable(allowedFields = []) {
  return (req, res, next) => {
    const { sort, order } = req.query;

    // Mặc định sort
    let sortField = sort || 'id';
    let sortOrder = (order || 'asc').toLowerCase();

    // Validate sort field
    if (allowedFields.length > 0 && !allowedFields.includes(sortField)) {
      sortField = allowedFields[0]; // fallback về field đầu tiên
    }

    // Chỉ cho phép asc hoặc desc
    if (!['asc', 'desc'].includes(sortOrder)) {
      sortOrder = 'asc';
    }

    req.sort = { field: sortField, order: sortOrder };
    next();
  };
}

module.exports = { paginate, sortable };
