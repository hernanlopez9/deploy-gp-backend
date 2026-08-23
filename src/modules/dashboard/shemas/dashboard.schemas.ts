import Joi from 'joi';

export const dashboardFilterSchema = Joi.object({
  from: Joi.string()
    .isoDate()
    .optional()
    .messages({ 'string.isoDate': 'from must be in YYYY-MM-DD format' }),

  to: Joi.string()
    .isoDate()
    .optional()
    .messages({ 'string.isoDate': 'to must be in YYYY-MM-DD format' }),

  territory: Joi.string()
    .max(50)
    .trim()
    .allow('')
    .optional()
    .custom((value) => {
      return value === '' ? undefined : value;
    }),

  includeTrend: Joi.boolean()
    .truthy('true', '1')
    .falsy('false', '0')
    .default(true),
});
