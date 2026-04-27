const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Null for anonymous reports'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  crime_type: {
    type: DataTypes.ENUM('theft', 'assault', 'burglary', 'fraud', 'cybercrime', 'vandalism', 'missing person', 'other'),
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  urgency_level: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'emergency'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'under_review', 'investigating', 'resolved', 'closed'),
    defaultValue: 'pending'
  },
  occurrence_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  anonymous_reference: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  }
}, {
  tableName: 'reports',
  underscored: true
});

module.exports = Report;
