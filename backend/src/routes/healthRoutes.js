const express = require('express');
const sequelize = require('../config/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      success: true,
      statusCode: 200,
      data: {
        status: 'UP',
        database: 'Connected',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      statusCode: 503,
      data: {
        status: 'DOWN',
        database: 'Disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;
