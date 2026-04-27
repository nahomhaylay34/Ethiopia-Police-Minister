const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EvidenceCustody = sequelize.define('EvidenceCustody', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  evidence_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  from_location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  to_location: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'evidence_custody',
  underscored: true
});

module.exports = EvidenceCustody;
