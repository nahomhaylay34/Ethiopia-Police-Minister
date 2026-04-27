require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

const app = require('./app');
const sequelize = require('./config/database');
require('./models'); // Load associations

const PORT = process.env.PORT || 5000;

sequelize.authenticate().then(() => {
  console.log('✅ Database connected');
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
}).catch((err) => {
  console.error('❌ Unable to connect to the database:', err);
  process.exit(1);
});
