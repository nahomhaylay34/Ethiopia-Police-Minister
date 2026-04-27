const { User } = require('../models');
const sequelize = require('../config/database');

const seedInitialUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected for seeding...');

    await sequelize.sync({ force: false });
    console.log('Database synced for seeding...');

    // Check and create Citizen
    const citizenExists = await User.findOne({ where: { email: 'citizen@cms.com' } });
    if (!citizenExists) {
      await User.create({
        email: 'citizen@cms.com',
        password_hash: 'citizen123', // Will be hashed by beforeCreate hook
        full_name: 'John Citizen',
        phone: '+251911111111',
        national_id: 'CID123456',
        address: 'Addis Ababa, Ethiopia',
        role: 'citizen',
        is_verified: true
      });
      console.log('✅ Citizen user created: citizen@cms.com / citizen123');
    } else {
      console.log('ℹ️ Citizen user already exists.');
    }

    // Check and create Officer
    const officerExists = await User.findOne({ where: { email: 'officer@cms.com' } });
    if (!officerExists) {
      await User.create({
        email: 'officer@cms.com',
        password_hash: 'officer123', // Will be hashed by beforeCreate hook
        full_name: 'Officer Smith',
        phone: '+251922222222',
        national_id: 'OID123456',
        address: 'Addis Ababa Police Station',
        role: 'officer',
        is_verified: true
      });
      console.log('✅ Officer user created: officer@cms.com / officer123');
    } else {
      console.log('ℹ️ Officer user already exists.');
    }

    // Check and create Admin
    const adminExists = await User.findOne({ where: { email: 'admin2@cms.com' } });
    if (!adminExists) {
      await User.create({
        email: 'admin2@cms.com',
        password_hash: 'admin123456', // Will be hashed by beforeCreate hook
        full_name: 'System Administrator',
        phone: '+251933333333',
        national_id: 'AID123456',
        address: 'HQ Command Center',
        role: 'admin',
        is_verified: true
      });
      console.log('✅ Admin user created: admin2@cms.com / admin123456');
    } else {
      console.log('ℹ️ Admin user already exists.');
    }

    // Check and create Help Center
    const helpCenterExists = await User.findOne({ where: { email: 'helpcenter@cms.com' } });
    if (!helpCenterExists) {
      await User.create({
        email: 'helpcenter@cms.com',
        password_hash: 'helpcenter123', // Will be hashed by beforeCreate hook
        full_name: 'Help Center',
        phone: '+251944444444',
        national_id: 'HC123456',
        address: 'HQ Support Desk',
        role: 'admin',
        is_verified: true
      });
      console.log('✅ Help Center user created: helpcenter@cms.com / helpcenter123');
    } else {
      console.log('ℹ️ Help Center user already exists.');
    }

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
};

seedInitialUsers();
