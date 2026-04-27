const { Message, User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');
const { notifyUserByEmail } = require('../utils/notificationService');

// POST /messages/send
exports.sendMessage = catchAsync(async (req, res, next) => {
  const { receiver_id, content } = req.body;

  if (!receiver_id || !content) {
    return next(new AppError('receiver_id and content are required', 400));
  }

  const receiver = await User.findByPk(receiver_id);
  if (!receiver) {
    return next(new AppError('Receiver not found', 404));
  }

  const newMessage = await Message.create({
    sender_id: req.user.id,
    receiver_id,
    content
  });

  // Notify receiver
  try {
    await notifyUserByEmail({
      user: receiver,
      type: 'message',
      title: `New message from ${req.user.full_name}`,
      content: `You have a new message: "${content.substring(0, 80)}${content.length > 80 ? '...' : ''}"`,
      metadata: { messageId: newMessage.id, senderId: req.user.id }
    });
  } catch (_) { /* email is optional */ }

  // Return the full message with sender/receiver info
  const fullMessage = await Message.findByPk(newMessage.id, {
    include: [
      { model: User, as: 'Sender', attributes: ['id', 'full_name', 'email', 'role'] },
      { model: User, as: 'Receiver', attributes: ['id', 'full_name', 'email', 'role'] }
    ]
  });

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: { message: fullMessage },
    timestamp: new Date().toISOString()
  });
});

// GET /messages/conversations
// Returns the list of unique conversation partners for the current user
exports.getConversations = catchAsync(async (req, res, next) => {
  // Get all messages where the current user is sender or receiver
  const messages = await Message.findAll({
    where: {
      [Op.or]: [
        { sender_id: req.user.id },
        { receiver_id: req.user.id }
      ]
    },
    include: [
      { model: User, as: 'Sender', attributes: ['id', 'full_name', 'email', 'role'] },
      { model: User, as: 'Receiver', attributes: ['id', 'full_name', 'email', 'role'] }
    ],
    order: [['created_at', 'DESC']]
  });

  // Build a map of unique conversation partners (keyed by other user's ID)
  const convMap = new Map();
  for (const msg of messages) {
    const m = msg.toJSON();
    const otherId = m.sender_id === req.user.id ? m.receiver_id : m.sender_id;
    if (!convMap.has(otherId)) {
      convMap.set(otherId, {
        other_user: m.sender_id === req.user.id ? m.Receiver : m.Sender,
        last_message: m.content,
        last_message_at: m.created_at,
        is_read: m.sender_id === req.user.id ? true : m.is_read
      });
    }
  }

  // For citizens: ensure Help Center thread always exists
  if (req.user.role === 'citizen') {
    const helpCenterUser = await User.findOne({
      where: { email: 'helpcenter@cms.com' },
      attributes: ['id', 'full_name', 'email', 'role']
    });

    if (helpCenterUser && !convMap.has(helpCenterUser.id)) {
      // No real messages yet – inject a synthetic entry so the citizen sees the channel
      convMap.set(helpCenterUser.id, {
        other_user: helpCenterUser.toJSON(),
        last_message: 'Welcome! Tap to start chatting with the Help Center.',
        last_message_at: new Date().toISOString(),
        is_read: true,
        is_virtual: true  // flag for frontend if needed
      });
    }
  }

  const conversations = Array.from(convMap.values());

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: { conversations },
    timestamp: new Date().toISOString()
  });
});

// GET /messages/conversations/:userId
// Returns all messages between current user and the given userId
exports.getConversation = catchAsync(async (req, res, next) => {
  const otherUserId = req.params.userId;

  const otherUser = await User.findByPk(otherUserId, {
    attributes: ['id', 'full_name', 'email', 'role']
  });
  if (!otherUser) {
    return next(new AppError('User not found', 404));
  }

  const messages = await Message.findAll({
    where: {
      [Op.or]: [
        { sender_id: req.user.id, receiver_id: otherUserId },
        { sender_id: otherUserId, receiver_id: req.user.id }
      ]
    },
    include: [
      { model: User, as: 'Sender', attributes: ['id', 'full_name', 'email', 'role'] },
      { model: User, as: 'Receiver', attributes: ['id', 'full_name', 'email', 'role'] }
    ],
    order: [['created_at', 'ASC']]
  });

  // Mark unread messages as read
  const unreadIds = messages
    .filter(m => m.receiver_id === req.user.id && !m.is_read)
    .map(m => m.id);

  if (unreadIds.length > 0) {
    await Message.update(
      { is_read: true, read_at: new Date() },
      { where: { id: { [Op.in]: unreadIds } } }
    );
  }

  // For Help Center: inject a welcome message if no messages exist
  const msgList = messages.map(m => m.toJSON());
  if (msgList.length === 0 && otherUser.email === 'helpcenter@cms.com') {
    msgList.push({
      id: 'hc-welcome',
      sender_id: otherUser.id,
      receiver_id: req.user.id,
      content: `Hello ${req.user.full_name}! Welcome to the Help Center. How can we assist you today?`,
      created_at: new Date().toISOString(),
      is_read: true,
      Sender: otherUser.toJSON(),
      Receiver: { id: req.user.id, full_name: req.user.full_name, email: req.user.email, role: req.user.role }
    });
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: { messages: msgList, other_user: otherUser },
    timestamp: new Date().toISOString()
  });
});

// GET /messages/users?email=...
exports.searchUsers = catchAsync(async (req, res, next) => {
  const { email, full_name } = req.query;

  if (!email && !full_name) {
    return next(new AppError('Provide email or full_name to search', 400));
  }

  const where = {};
  if (email) where.email = { [Op.like]: `%${email}%` };
  if (full_name) where.full_name = { [Op.like]: `%${full_name}%` };

  // Exclude the Help Center from search results (it's handled separately)
  where.email = where.email
    ? { [Op.and]: [where.email, { [Op.ne]: 'helpcenter@cms.com' }] }
    : { [Op.ne]: 'helpcenter@cms.com' };

  const users = await User.findAll({
    where,
    attributes: ['id', 'email', 'full_name', 'role']
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: { users },
    timestamp: new Date().toISOString()
  });
});

// PUT /messages/:id/read
exports.markMessageRead = catchAsync(async (req, res, next) => {
  const message = await Message.findByPk(req.params.id);
  if (!message) return next(new AppError('Message not found', 404));

  message.is_read = true;
  message.read_at = new Date();
  await message.save();

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: { message },
    timestamp: new Date().toISOString()
  });
});
