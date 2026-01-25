const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      // Enrollment notifications
      'ENROLLMENT_CREATED',
      'ENROLLMENT_CANCELLED',
      'ENROLLMENT_APPROVED',
      'ENROLLMENT_REJECTED',
      
      // Event lifecycle notifications
      'EVENT_STATUS_CHANGED',
      'EVENT_PUBLISHED',
      'EVENT_STARTED',
      'EVENT_CANCELLED',
      'EVENT_COMPLETED',
      'EVENT_UPDATED',
      
      // Capacity notifications
      'CAPACITY_80_PERCENT',
      'CAPACITY_90_PERCENT',
      'CAPACITY_FULL',
      'CAPACITY_AVAILABLE',
      
      // Communication notifications
      'MESSAGE_RECEIVED',
      'INQUIRY_RECEIVED',
      
      // System notifications
      'SYSTEM_NOTIFICATION'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  channel: {
    type: String,
    enum: ['push', 'email', 'sms'],
    default: 'push'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ createdAt: 1 }, { 
  expireAfterSeconds: parseInt(process.env.NOTIFICATION_RETENTION_DAYS || 90) * 24 * 60 * 60 
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, read: false });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, read: false },
    { 
      $set: { 
        read: true, 
        readAt: new Date() 
      } 
    }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);
