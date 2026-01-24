const mongoose = require('mongoose');

/**
 * Inquiry Schema
 * Pre-enrollment questions to event organizers
 */
const inquirySchema = new mongoose.Schema(
  {
    // Event information
    eventId: {
      type: Number,
      required: true,
      index: true,
    },
    eventTitle: {
      type: String,
      required: true,
    },
    organizerId: {
      type: Number,
      required: true,
      index: true,
    },

    // Inquirer information (registered users only)
    inquirerId: {
      type: Number,
      required: true,
      index: true,
    },
    inquirerEmail: {
      type: String,
      required: true,
    },
    inquirerName: String,
    inquirerRole: {
      type: String,
      enum: ['ORGANIZER', 'PARTICIPANT'],
      required: true,
    },

    // Inquiry content
    subject: {
      type: String,
      required: true,
      maxlength: 200,
    },
    question: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    // Reply from organizer
    reply: {
      type: String,
      maxlength: 2000,
    },
    repliedAt: Date,

    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'replied', 'closed'],
      default: 'pending',
      index: true,
    },

    // Read tracking
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes
inquirySchema.index({ eventId: 1, status: 1 });
inquirySchema.index({ organizerId: 1, status: 1, createdAt: -1 });
inquirySchema.index({ inquirerId: 1, createdAt: -1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
