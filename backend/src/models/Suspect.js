const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Suspect = sequelize.define('Suspect', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  national_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  photo_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  criminal_status: {
    type: DataTypes.ENUM('unknown', 'suspected', 'arrested', 'convicted', 'released'),
    defaultValue: 'unknown'
  }
}, {
  tableName: 'suspects',
  underscored: true
});

module.exports = Suspect;
