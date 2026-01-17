const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { EVENT_STATE_VALUES } = require('../constants/eventStates');

const Event = sequelize.define(
  'Event',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    organizerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'organizer_id',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_date',
      validate: {
        isAfterStartDate(value) {
          if (value && this.startDate && new Date(value) <= new Date(this.startDate)) {
            throw new Error('Event end date must be after start date');
          }
        },
      },
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'max_participants',
      validate: {
        min: 1,
      },
    },
    currentParticipants: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'current_participants',
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...EVENT_STATE_VALUES),
      allowNull: false,
      defaultValue: 'Planning',
    },
  },
  {
    tableName: 'events',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['organizer_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['start_date'],
      },
      {
        fields: ['end_date'],
      },
      {
        fields: ['category'],
      },
    ],
  }
);

module.exports = Event;
