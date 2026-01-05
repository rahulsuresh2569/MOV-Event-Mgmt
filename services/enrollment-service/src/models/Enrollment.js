const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { ENROLLMENT_STATUS_VALUES } = require('../constants/enrollmentStates');

const Enrollment = sequelize.define(
  'Enrollment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'event_id',
    },
    status: {
      type: DataTypes.ENUM(...ENROLLMENT_STATUS_VALUES),
      allowNull: false,
      defaultValue: 'active',
    },
    enrolledAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'enrolled_at',
    },
  },
  {
    tableName: 'enrollments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['event_id'],
      },
      {
        fields: ['status'],
      },
      {
        // Composite unique constraint - user can only have one active enrollment per event
        unique: true,
        fields: ['user_id', 'event_id', 'status'],
        name: 'unique_active_enrollment',
        where: {
          status: 'active',
        },
      },
    ],
  }
);

module.exports = Enrollment;
