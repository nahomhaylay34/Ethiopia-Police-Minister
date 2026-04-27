const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evidence = sequelize.define('Evidence', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  report_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  case_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  uploaded_by: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'evidence',
  underscored: true
});

module.exports = Evidence;
