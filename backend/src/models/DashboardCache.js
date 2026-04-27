const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DashboardCache = sequelize.define('DashboardCache', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  cache_key: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false
  },
  cache_data: {
    type: DataTypes.JSON,
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

module.exports = DashboardCache;
