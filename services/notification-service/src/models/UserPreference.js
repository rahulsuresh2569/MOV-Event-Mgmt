const mongoose = require('mongoose');

const userPreferenceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: Boolean,
    default: true
  },
  push: {
    type: Boolean,
    default: true
  },
  sms: {
    type: Boolean,
    default: false
  },
  preferences: {
    enrollments: {
      type: Boolean,
      default: true
    },
    eventUpdates: {
      type: Boolean,
      default: true
    },
    capacityAlerts: {
      type: Boolean,
      default: true
    },
    messages: {
      type: Boolean,
      default: true
    },
    systemNotifications: {
      type: Boolean,
      default: true
    }
  },
  quietHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    start: {
      type: String,
      default: '22:00'
    },
    end: {
      type: String,
      default: '08:00'
    }
  }
}, {
  timestamps: true
});

// Static method to get or create default preferences
userPreferenceSchema.statics.getOrCreate = async function(userId) {
  let preference = await this.findOne({ userId });
  
  if (!preference) {
    preference = await this.create({ userId });
  }
  
  return preference;
};

// Method to check if notification should be sent based on preferences
userPreferenceSchema.methods.shouldNotify = function(notificationType, channel = 'push') {
  // Check if channel is enabled
  if (!this[channel]) {
    return false;
  }

  // Map notification types to preference categories
  const typeMapping = {
    'ENROLLMENT_CREATED': 'enrollments',
    'ENROLLMENT_CANCELLED': 'enrollments',
    'ENROLLMENT_APPROVED': 'enrollments',
    'ENROLLMENT_REJECTED': 'enrollments',
    'EVENT_STATUS_CHANGED': 'eventUpdates',
    'EVENT_PUBLISHED': 'eventUpdates',
    'EVENT_CANCELLED': 'eventUpdates',
    'EVENT_COMPLETED': 'eventUpdates',
    'EVENT_UPDATED': 'eventUpdates',
    'CAPACITY_80_PERCENT': 'capacityAlerts',
    'CAPACITY_90_PERCENT': 'capacityAlerts',
    'CAPACITY_FULL': 'capacityAlerts',
    'CAPACITY_AVAILABLE': 'capacityAlerts',
    'MESSAGE_RECEIVED': 'messages',
    'INQUIRY_RECEIVED': 'messages',
    'SYSTEM_NOTIFICATION': 'systemNotifications'
  };

  const preferenceKey = typeMapping[notificationType];
  
  if (!preferenceKey) {
    return true; // Default to send if type not mapped
  }

  return this.preferences[preferenceKey] !== false;
};

// Method to check if currently in quiet hours
userPreferenceSchema.methods.isQuietHours = function() {
  if (!this.quietHours.enabled) {
    return false;
  }

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const { start, end } = this.quietHours;

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  }
  
  // Handle same-day quiet hours (e.g., 12:00 to 14:00)
  return currentTime >= start && currentTime <= end;
};

module.exports = mongoose.model('UserPreference', userPreferenceSchema);
