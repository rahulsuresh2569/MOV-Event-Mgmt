const Joi = require('joi');

const enrollEventSchema = Joi.object({
  eventId: Joi.number().integer().positive().required().messages({
    'number.base': 'Event ID must be a number',
    'number.integer': 'Event ID must be an integer',
    'number.positive': 'Event ID must be positive',
    'any.required': 'Event ID is required',
  }),
});

module.exports = {
  enrollEventSchema,
};
