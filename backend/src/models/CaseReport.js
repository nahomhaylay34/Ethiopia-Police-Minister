const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CaseReport = sequelize.define('CaseReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  case_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  report_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  linked_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'case_reports',
  underscored: true
});

module.exports = CaseReport;
