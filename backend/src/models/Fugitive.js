const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Fugitive = sequelize.define('Fugitive', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  alias: {
    type: DataTypes.STRING,
    allowNull: true
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: true
  },
  crime_committed: {
    type: DataTypes.STRING,
    allowNull: false
  },
  crime_details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  last_seen_location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_seen_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  warning_level: {
    type: DataTypes.ENUM('ARMED & DANGEROUS', 'DO NOT APPROACH', 'WANTED FOR ARREST'),
    defaultValue: 'WANTED FOR ARREST'
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
  reward: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'apprehended', 'closed'),
    defaultValue: 'active'
  },
  posted_by: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'fugitives',
  underscored: true
});

module.exports = Fugitive;
