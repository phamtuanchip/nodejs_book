/**
 * Chương 15: Validation Middleware với Joi
 * Validate request body, params, query
 */

const Joi = require('joi');

/**
 * Tạo middleware validate với Joi schema
 * @param {Object} schemas - { body, params, query }
 * @param {Object} options - Joi options
 */
function validate(schemas, options = {}) {
  const joiOptions = {
    abortEarly: false,   // Báo tất cả lỗi, không dừng ở lỗi đầu
    stripUnknown: true,  // Xóa các field không khai báo trong schema
    ...options,
  };

  return (req, res, next) => {
    const errors = [];

    // Validate từng phần của request
    for (const part of ['body', 'params', 'query']) {
      if (schemas[part]) {
        const { error, value } = schemas[part].validate(req[part], joiOptions);

        if (error) {
          const partErrors = error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message.replace(/["]/g, ''),
            type: d.type,
          }));
          errors.push(...partErrors);
        } else {
          // Gán lại giá trị đã được làm sạch (strip unknown, coerce types)
          req[part] = value;
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Dữ liệu không hợp lệ',
          code: 'VALIDATION_ERROR',
          details: errors,
        },
      });
    }

    next();
  };
}

// === SCHEMAS ===

// Schema cho product
const productSchema = {
  // POST /products
  create: Joi.object({
    name: Joi.string().trim().min(2).max(200).required()
      .messages({
        'string.min': 'Tên sản phẩm phải có ít nhất {#limit} ký tự',
        'string.max': 'Tên sản phẩm tối đa {#limit} ký tự',
        'any.required': 'Tên sản phẩm là bắt buộc',
      }),
    price: Joi.number().positive().required()
      .messages({
        'number.positive': 'Giá phải là số dương',
        'any.required': 'Giá là bắt buộc',
      }),
    category: Joi.string().valid('laptop', 'phone', 'tablet', 'audio', 'accessory', 'other').required()
      .messages({
        'any.only': 'Category phải là một trong: laptop, phone, tablet, audio, accessory, other',
      }),
    description: Joi.string().trim().max(1000).optional().allow(''),
    inStock: Joi.boolean().default(true),
    tags: Joi.array().items(Joi.string().trim()).max(10).optional(),
  }),

  // PUT /products/:id
  update: Joi.object({
    name: Joi.string().trim().min(2).max(200).optional(),
    price: Joi.number().positive().optional(),
    category: Joi.string().valid('laptop', 'phone', 'tablet', 'audio', 'accessory', 'other').optional(),
    description: Joi.string().trim().max(1000).optional().allow(''),
    inStock: Joi.boolean().optional(),
    tags: Joi.array().items(Joi.string().trim()).max(10).optional(),
  }).min(1).messages({
    'object.min': 'Phải có ít nhất 1 trường để cập nhật',
  }),

  // Params: GET/PUT/DELETE /products/:id
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({
        'number.integer': 'ID phải là số nguyên',
        'number.positive': 'ID phải là số dương',
      }),
  }),

  // Query: GET /products
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('id', 'name', 'price', 'createdAt').default('id'),
    order: Joi.string().valid('asc', 'desc').default('asc'),
    category: Joi.string().valid('laptop', 'phone', 'tablet', 'audio', 'accessory', 'other').optional(),
    search: Joi.string().trim().max(100).optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    inStock: Joi.boolean().optional(),
  }),
};

// Middleware cụ thể
const validateProduct = {
  create: validate({ body: productSchema.create }),
  update: validate({
    params: productSchema.params,
    body: productSchema.update,
  }),
  getById: validate({ params: productSchema.params }),
  list: validate({ query: productSchema.query }),
};

module.exports = { validate, validateProduct };
