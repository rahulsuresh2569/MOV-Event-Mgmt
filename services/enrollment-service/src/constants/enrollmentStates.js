// Enrollment statuses
const ENROLLMENT_STATUS = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
};

const ENROLLMENT_STATUS_VALUES = Object.values(ENROLLMENT_STATUS);

// Event states that allow enrollment/unrollment
const ENROLLABLE_EVENT_STATES = ['Published'];

module.exports = {
  ENROLLMENT_STATUS,
  ENROLLMENT_STATUS_VALUES,
  ENROLLABLE_EVENT_STATES,
};
