import Joi from 'joi';

export const createClientSchema = Joi.object({
  FirstName: Joi.string().trim().max(50).required(),
  LastName: Joi.string().trim().max(50).required(),
  EmailAddress: Joi.string().trim().email().lowercase().required(),
  PhoneNumber: Joi.string().trim().max(25).required(),
  Password: Joi.string().min(8).max(64).required(),
  Type: Joi.string().valid('Persona', 'Tienda').required(),
  CompanyName: Joi.string()
    .trim()
    .max(128)
    .allow('')
    .optional()
    .custom((value) => (value === '' ? undefined : value)),
});

export const createAddressSchema = Joi.object({
  AddressLine1: Joi.string().trim().max(60).required(),
  AddressLine2: Joi.string()
    .trim()
    .max(60)
    .allow('')
    .optional()
    .custom((value) => (value === '' ? undefined : value)),
  City: Joi.string().trim().max(30).required(),
  StateProvince: Joi.string().trim().max(50).required(),
  PostalCode: Joi.string().trim().max(15).required(),
  CountryRegion: Joi.string().trim().max(50).required(),
  AddressType: Joi.string().trim().max(50).required(),
});

export const searchClientQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  id: Joi.number().integer().min(1).optional(),
  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .allow('')
    .optional()
    .custom((value) => (value === '' ? undefined : value)),
  name: Joi.string()
    .trim()
    .allow('')
    .optional()
    .custom((value) => (value === '' ? undefined : value)),
});

export const clientOrdersFilterSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  from: Joi.string().isoDate().optional(),
  to: Joi.string().isoDate().optional(),
  status: Joi.string()
    .trim()
    .lowercase()
    .valid(
      'pending',
      'inprocess',
      'approved',
      'backordered',
      'rejected',
      'shipped',
      'cancelled',
      'canceled',
    )
    .allow('')
    .optional()
    .custom((value) => (value === '' ? undefined : value)),
});

export const clientOptionsQuerySchema = Joi.object({
  q: Joi.string()
    .trim()
    .allow('')
    .optional()
    .custom((value) => (value === '' ? undefined : value)),
  limit: Joi.number().integer().min(1).max(50).default(10),
});
