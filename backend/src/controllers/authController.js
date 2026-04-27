const { User, RefreshToken } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { signAccessToken, signRefreshToken, verifyRefreshToken, signEmailToken, verifyEmailToken } = require('../utils/tokenUtils');
const { sendEmail, buildVerificationEmail } = require('../utils/emailService');

const createSendToken = async (user, statusCode, res) => {
  const accessToken = signAccessToken(user.id);
  const refreshTokenValue = signRefreshToken(user.id);

  // Store refresh token in database
  await RefreshToken.create({
    user_id: user.id,
    token: refreshTokenValue,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  // Remove password from output
  user.password_hash = undefined;

  res.cookie('refreshToken', refreshTokenValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  res.status(statusCode).json({
    success: true,
    statusCode,
    data: {
      user,
      accessToken
    },
    timestamp: new Date().toISOString()
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const existingUser = await User.findOne({ where: { email: req.body.email } });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 409));
  }

  const newUser = await User.create({
    email: req.body.email,
    password_hash: req.body.password,
    full_name: req.body.full_name,
    phone: req.body.phone,
    national_id: req.body.national_id,
    address: req.body.address,
    role: 'citizen',
    is_verified: true
  });

  const emailToken = signEmailToken(newUser.id);
  const verificationEmail = buildVerificationEmail(newUser, emailToken);

  try {
    await sendEmail({
      to: newUser.email,
      subject: verificationEmail.subject,
      text: verificationEmail.text,
      html: verificationEmail.html
    });
  } catch (err) {
    console.error('Email verification send error:', err);
  }

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: 'Account created successfully. You can now log in.',
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        is_verified: newUser.is_verified
      }
    },
    timestamp: new Date().toISOString()
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ where: { email } });

  if (!user) {
    console.log(`Login failed: User with email ${email} not found`);
    return next(new AppError('Incorrect email or password', 401));
  }

  if (user.is_locked) {
    const now = new Date();
    if (user.lock_until && now > user.lock_until) {
      user.is_locked = false;
      user.failed_attempts = 0;
      user.lock_until = null;
      await user.save();
    } else {
      const minutesLeft = user.lock_until ? Math.ceil((user.lock_until - now) / 60000) : null;
      const lockMsg = minutesLeft
        ? `Account locked. Please try again after ${minutesLeft} minute(s).`
        : 'Your account is locked. Please contact the administrator.';
      console.log(`Login failed: Account locked for user ${email}`);
      return next(new AppError(lockMsg, 403));
    }
  }

  const isPasswordCorrect = await user.comparePassword(password);
  
  if (!isPasswordCorrect) {
    console.log(`Login failed: Incorrect password for user ${email}`);
    user.failed_attempts += 1;
    if (user.failed_attempts >= 5) {
      user.is_locked = true;
      user.lock_until = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
    await user.save();
    return next(new AppError('Incorrect email or password', 401));
  }

  if (user.is_locked && user.lock_until > new Date()) {
    console.log(`Login failed: Account locked for user ${email}`);
    return next(new AppError(`Account locked. Please try again after ${Math.ceil((user.lock_until - new Date()) / 60000)} minutes.`, 403));
  }

  // Remove verification check block completely
  
  if (user.failed_attempts > 0) {
    user.failed_attempts = 0;
    user.is_locked = false;
    user.lock_until = null;
    await user.save();
  }

  // 3) If everything ok, send token to client
  await createSendToken(user, 200, res);
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  const refreshTokenValue = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshTokenValue) {
    return next(new AppError('No refresh token provided', 401));
  }

  const decoded = verifyRefreshToken(refreshTokenValue);

  const storedToken = await RefreshToken.findOne({
    where: {
      token: refreshTokenValue,
      user_id: decoded.id,
      revoked_at: null
    }
  });

  if (!storedToken || storedToken.expires_at < new Date()) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }

  const accessToken = signAccessToken(decoded.id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      accessToken
    },
    timestamp: new Date().toISOString()
  });
});

exports.logout = catchAsync(async (req, res, next) => {
  const refreshTokenValue = req.cookies.refreshToken || req.body.refreshToken;

  if (refreshTokenValue) {
    await RefreshToken.update(
      { revoked_at: new Date() },
      { where: { token: refreshTokenValue } }
    );
  }

  res.clearCookie('refreshToken');
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Logged out successfully',
    timestamp: new Date().toISOString()
  });
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const token = req.params.token || req.query.token;
  if (!token) {
    return next(new AppError('Verification token is required', 400));
  }

  let decoded;
  try {
    decoded = verifyEmailToken(token);
  } catch (error) {
    return next(new AppError('Invalid or expired verification token', 400));
  }

  const user = await User.findByPk(decoded.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.is_verified) {
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Account already verified'
    });
  }

  user.is_verified = true;
  await user.save();

  // Automatically set up Help Center chat
  try {
    const { Message } = require('../models');
    const helpCenterUser = await User.findOne({ where: { email: 'helpcenter@cms.com' } });
    if (helpCenterUser) {
      await Message.create({
        sender_id: helpCenterUser.id,
        receiver_id: user.id,
        content: `Welcome to the Ethiopia Crime Management System, ${user.full_name}! We are here to help. You can use this channel to ask general questions or provide additional tips.`
      });
    }
  } catch (err) {
    console.error('Failed to set up Help Center chat:', err);
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Account verified successfully'
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      user: req.user
    },
    timestamp: new Date().toISOString()
  });
});
