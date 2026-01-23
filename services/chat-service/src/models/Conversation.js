const mongoose = require('mongoose');
const { CONVERSATION_TYPES } = require('../constants/messageTypes');

/**
 * Conversation Schema
 * Tracks conversations between users or event groups
 */
const conversationSchema = new mongoose.Schema(
  {
    // Conversation type
    type: {
      type: String,
      required: true,
      enum: Object.values(CONVERSATION_TYPES),
    },

    // Participants (for direct conversations)
    participants: [
      {
        userId: {
          type: Number,
          required: true,
        },
        userEmail: {
          type: String,
          required: true,
        },
        userRole: {
          type: String,
          required: true,
          enum: ['ORGANIZER', 'PARTICIPANT'],
        },
      },
    ],

    // Event information (for group conversations)
    eventId: {
      type: Number,
      index: true,
    },
    eventTitle: {
      type: String,
    },
    organizerId: {
      type: Number,
    },

    // Last message reference
    lastMessage: {
      content: String,
      senderId: Number,
      senderEmail: String,
      timestamp: Date,
    },

    // Unread counts per participant
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
conversationSchema.index({ 'participants.userId': 1 });
conversationSchema.index({ eventId: 1, type: 1 });

// Method to add a participant
conversationSchema.methods.addParticipant = function (userId, userEmail, userRole) {
  if (!this.participants.some((p) => p.userId === userId)) {
    this.participants.push({ userId, userEmail, userRole });
    this.unreadCounts.set(userId.toString(), 0);
  }
};

// Method to update last message
conversationSchema.methods.updateLastMessage = function (message) {
  this.lastMessage = {
    content: message.content,
    senderId: message.senderId,
    senderEmail: message.senderEmail,
    timestamp: message.createdAt || new Date(),
  };
};

// Method to increment unread count for a user
conversationSchema.methods.incrementUnread = function (userId) {
  const count = this.unreadCounts.get(userId.toString()) || 0;
  this.unreadCounts.set(userId.toString(), count + 1);
};

// Method to reset unread count for a user
conversationSchema.methods.resetUnread = function (userId) {
  this.unreadCounts.set(userId.toString(), 0);
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
