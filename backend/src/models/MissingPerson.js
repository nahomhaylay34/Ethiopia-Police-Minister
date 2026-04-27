const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MissingPerson = sequelize.define('MissingPerson', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: true
  },
  last_seen_wearing: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  last_seen_location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date_missing: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: false
  },
  photo_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  case_ref: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('active', 'found', 'closed'),
    defaultValue: 'active'
  },
  posted_by: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'missing_persons',
  underscored: true
});

module.exports = MissingPerson;
