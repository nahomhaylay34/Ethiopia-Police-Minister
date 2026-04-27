const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CaseUpdate = sequelize.define('CaseUpdate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  case_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  update_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'case_updates',
  underscored: true
});

module.exports = CaseUpdate;
