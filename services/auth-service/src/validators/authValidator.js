const Joi = require('joi');
const { ROLE_VALUES } = require('../../../shared/constants/roles');

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
  role: Joi.string()
    .valid(...ROLE_VALUES)
    .required()
    .messages({
      'any.only': 'Role must be either ORGANIZER or PARTICIPANT',
      'any.required': 'Role is required',
    }),
  firstName: Joi.string().max(100).optional(),
  lastName: Joi.string().max(100).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
};
