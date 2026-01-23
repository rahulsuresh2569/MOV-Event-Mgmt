const mongoose = require('mongoose');
const { MESSAGE_TYPES } = require('../constants/messageTypes');

/**
 * Message Schema
 * Stores all chat messages (direct and group)
 */
const messageSchema = new mongoose.Schema(
  {
    // Sender information
    senderId: {
      type: Number,
      required: true,
      index: true,
    },
    senderEmail: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      required: true,
      enum: ['ORGANIZER', 'PARTICIPANT'],
    },

    // Receiver information (for direct messages)
    receiverId: {
      type: Number,
      index: true,
    },
    receiverEmail: {
      type: String,
    },

    // Event information (for group messages)
    eventId: {
      type: Number,
      index: true,
    },
    eventTitle: {
      type: String,
    },

    // Message content
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    // Message type
    type: {
      type: String,
      required: true,
      enum: Object.values(MESSAGE_TYPES),
      default: MESSAGE_TYPES.DIRECT,
    },

    // Read status
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },

    // Conversation reference
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compound indexes for efficient queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ eventId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Virtual for formatted timestamp
messageSchema.virtual('formattedDate').get(function () {
  return this.createdAt.toISOString();
});

// Ensure virtuals are included in JSON
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
