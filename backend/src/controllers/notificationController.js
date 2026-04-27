const { Notification } = require('../models');
const catchAsync = require('../utils/catchAsync');

exports.getNotifications = catchAsync(async (req, res, next) => {
  const notifications = await Notification.findAll({
    where: { user_id: req.user.id },
    order: [['created_at', 'DESC']]
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      notifications
    },
    timestamp: new Date().toISOString()
  });
});

exports.getUnreadCount = catchAsync(async (req, res, next) => {
  const count = await Notification.count({
    where: { user_id: req.user.id, is_read: false }
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      count
    },
    timestamp: new Date().toISOString()
  });
});

exports.markNotificationRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findByPk(req.params.id);

  if (!notification) {
    return next(new AppError('No notification found with that ID', 404));
  }

  notification.is_read = true;
  await notification.save();

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      notification
    },
    timestamp: new Date().toISOString()
  });
});

exports.markAllRead = catchAsync(async (req, res, next) => {
  await Notification.update(
    { is_read: true },
    { where: { user_id: req.user.id, is_read: false } }
  );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'All notifications marked as read',
    timestamp: new Date().toISOString()
  });
});
