import Joi from 'joi';

export const productOptionsQuerySchema = Joi.object({
  q: Joi.string()
    .trim()
    .allow('')
    .optional()
    .custom((value) => (value === '' ? undefined : value))
    .messages({
      'string.base': 'Search term must be a string',
    }),

  limit: Joi.number().integer().min(1).max(50).default(10).messages({
    'number.base': 'Limit must be a number',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 50',
  }),
});

export const productFilterSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),

  name: Joi.string()
    .max(50)
    .trim()
    .allow('')
    .optional()
    .custom((value) => (value === '' ? undefined : value)),

  category: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({ 'number.base': 'Category must be a valid number' }),

  subcategory: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({ 'number.base': 'Subcategory must be a valid number' }),
});
