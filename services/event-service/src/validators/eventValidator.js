const Joi = require('joi');
const { EVENT_STATE_VALUES } = require('../../../shared/constants/eventStates');

const createEventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    'string.min': 'Title must be at least 3 characters long',
    'string.max': 'Title must not exceed 200 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().max(1000).optional(),
  date: Joi.date().greater('now').required().messages({
    'date.greater': 'Event date must be in the future',
    'any.required': 'Event date is required',
  }),
  location: Joi.string().max(255).required().messages({
    'any.required': 'Location is required',
  }),
  maxParticipants: Joi.number().integer().min(1).max(10000).required().messages({
    'number.min': 'Maximum participants must be at least 1',
    'number.max': 'Maximum participants cannot exceed 10000',
    'any.required': 'Maximum participants is required',
  }),
  category: Joi.string().max(50).required().messages({
    'any.required': 'Category is required',
  }),
});

const updateEventSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  date: Joi.date().greater('now').optional(),
  location: Joi.string().max(255).optional(),
  maxParticipants: Joi.number().integer().min(1).max(10000).optional(),
  category: Joi.string().max(50).optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...EVENT_STATE_VALUES)
    .required()
    .messages({
      'any.only': 'Invalid event status',
      'any.required': 'Status is required',
    }),
});

module.exports = {
  createEventSchema,
  updateEventSchema,
  updateStatusSchema,
};
