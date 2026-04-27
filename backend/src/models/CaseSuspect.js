const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CaseSuspect = sequelize.define('CaseSuspect', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  case_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  suspect_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true
  },
  linked_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'case_suspects',
  underscored: true
});

module.exports = CaseSuspect;
