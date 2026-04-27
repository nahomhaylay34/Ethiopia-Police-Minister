const { Sequelize } = require('sequelize');
const config = require('./config');

let sequelize;

// Use Vercel Postgres if available
const pgUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (pgUrl) {
  console.log('📡 Connecting to Vercel Postgres...');
  sequelize = new Sequelize(pgUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    logging: false
  });
} else {
  console.log('🏠 Connecting to Local MySQL...');
  sequelize = new Sequelize(config.db.database, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    logging: false
  });
}

module.exports = sequelize;