const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PerformanceMetric = sequelize.define('PerformanceMetric', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  metric_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  metric_value: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
});

module.exports = PerformanceMetric;
