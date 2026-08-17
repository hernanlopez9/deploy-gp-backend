import Joi from 'joi';
import type {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
} from '../../../shared/types/auth.types';

export const registerSchema = Joi.object<RegisterDto>({
  username: Joi.string().min(3).max(50).trim().required().messages({
    'string.empty': 'El username es obligatorio',
    'string.min': 'El username debe tener al menos 3 caracteres',
    'string.max': 'El username no puede superar los 50 caracteres',
  }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(100)
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'El email no es válido',
      'string.empty': 'El email es obligatorio',
    }),

  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.pattern.base':
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
      'string.empty': 'La contraseña es obligatoria',
    }),
});

export const loginSchema = Joi.object<LoginDto>({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'El email no es válido',
      'string.empty': 'El email es obligatorio',
    }),

  password: Joi.string().required().messages({
    'string.empty': 'La contraseña es obligatoria',
  }),
});

export const changePasswordSchema = Joi.object<ChangePasswordDto>({
  oldPassword: Joi.string().required().messages({
    'string.empty': 'La contraseña actual es obligatoria',
  }),

  newPassword: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .required()
    .invalid(Joi.ref('oldPassword'))
    .messages({
      'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
      'string.pattern.base':
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
      'any.invalid': 'La nueva contraseña no puede ser igual a la anterior',
    }),
});
