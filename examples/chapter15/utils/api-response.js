/**
 * Helper tạo response chuẩn cho REST API
 * Format: { success, data, meta, error }
 */

/**
 * Response thành công
 * @param {*} data - Dữ liệu trả về
 * @param {Object} meta - Metadata thêm (optional)
 * @param {string} message - Thông báo (optional)
 */
function success(data, meta = null, message = null) {
  const response = { success: true, data };
  if (meta) response.meta = meta;
  if (message) response.message = message;
  return response;
}

/**
 * Response lỗi
 * @param {string} message - Thông báo lỗi
 * @param {string} code - Mã lỗi (ERROR_CODE)
 * @param {*} details - Chi tiết lỗi (validation errors...)
 */
function error(message, code = 'INTERNAL_ERROR', details = null) {
  const response = {
    success: false,
    error: { message, code },
  };
  if (details) response.error.details = details;
  return response;
}

/**
 * Response danh sách có phân trang
 * @param {Array} items - Mảng dữ liệu
 * @param {number} total - Tổng số items
 * @param {number} page - Trang hiện tại
 * @param {number} limit - Số items mỗi trang
 * @param {string} baseUrl - Base URL để tạo links
 */
function paginated(items, total, page, limit, baseUrl = '') {
  const totalPages = Math.ceil(total / limit);

  // Tạo navigation links theo chuẩn REST
  const links = {};
  if (page > 1) {
    links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
    links.first = `${baseUrl}?page=1&limit=${limit}`;
  }
  if (page < totalPages) {
    links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
    links.last = `${baseUrl}?page=${totalPages}&limit=${limit}`;
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
    },
    links,
  };
}

/**
 * Response tạo mới thành công (201)
 */
function created(data, message = 'Tạo mới thành công') {
  return { success: true, data, message };
}

/**
 * Response 204 No Content (xóa thành công)
 */
function noContent() {
  return null; // Caller sẽ dùng res.status(204).send()
}

module.exports = { success, error, paginated, created, noContent };
