const { verifyAccessToken } = require('../utils/tokenUtils');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { User } = require('../models');

module.exports = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // 2) Verification token
  const decoded = verifyAccessToken(token);

  // 3) Check if user still exists
  const currentUser = await User.findByPk(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 4) Check if user is locked
  if (currentUser.is_locked) {
    const now = new Date();
    if (currentUser.lock_until && now > currentUser.lock_until) {
      currentUser.is_locked = false;
      currentUser.failed_attempts = 0;
      currentUser.lock_until = null;
      await currentUser.save();
    } else {
      const minutesLeft = currentUser.lock_until ? Math.ceil((currentUser.lock_until - now) / 60000) : null;
      const lockMsg = minutesLeft
        ? `Your account is locked. Try again after ${minutesLeft} minute(s).`
        : 'Your account is locked. Please contact the administrator.';
      return next(new AppError(lockMsg, 403));
    }
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});
