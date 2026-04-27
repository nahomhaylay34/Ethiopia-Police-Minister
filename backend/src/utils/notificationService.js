const { Notification, User } = require('../models');
const { sendEmail } = require('./emailService');

const createNotification = async ({ user_id, type, title, content, metadata = {} }) => {
  const notification = await Notification.create({ user_id, type, title, content, metadata });
  return notification;
};

const notifyUserByEmail = async ({ user, type, title, content, metadata = {} }) => {
  await createNotification({ user_id: user.id, type, title, content, metadata });

  if (!user.email) return;

  try {
    await sendEmail({
      to: user.email,
      subject: title,
      text: content,
      html: `<p>${content}</p>`
    });
  } catch (err) {
    console.error('Failed to send notification email', err);
  }
};

const notifyRole = async ({ role, type, title, content, metadata = {} }) => {
  const users = await User.findAll({ where: { role, is_verified: true } });
  await Promise.all(users.map(async (user) => {
    await notifyUserByEmail({ user, type, title, content, metadata });
  }));
};

module.exports = {
  createNotification,
  notifyUserByEmail,
  notifyRole
};