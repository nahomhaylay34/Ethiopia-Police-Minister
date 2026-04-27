const { User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const { signAccessToken, signRefreshToken } = require('../utils/tokenUtils');
const { RefreshToken } = require('../models');

const rpName = 'CMS Ethiopia';
const rpID = 'localhost'; // In production, this should be the domain, e.g., cms.ethiopia.gov
const origin = `http://localhost:3000`; // Frontend URL

const createSendToken = async (user, statusCode, res) => {
  const accessToken = signAccessToken(user.id);
  const refreshTokenValue = signRefreshToken(user.id);

  await RefreshToken.create({
    user_id: user.id,
    token: refreshTokenValue,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  user.password_hash = undefined;

  res.cookie('refreshToken', refreshTokenValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  res.status(statusCode).json({
    success: true,
    data: { user, accessToken }
  });
};

exports.generateRegistrationOptions = catchAsync(async (req, res, next) => {
  const user = req.user;
  
  const userPasskeys = user.webauthn_credentials || [];

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.id,
    userName: user.email,
    userDisplayName: user.full_name,
    attestationType: 'none',
    excludeCredentials: userPasskeys.map(passkey => ({
      id: passkey.credentialID,
      type: 'public-key',
      transports: passkey.transports,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  user.webauthn_current_challenge = options.challenge;
  await user.save();

  res.status(200).json(options);
});

exports.verifyRegistrationResponse = catchAsync(async (req, res, next) => {
  const user = req.user;
  const expectedChallenge = user.webauthn_current_challenge;

  if (!expectedChallenge) {
    return next(new AppError('No challenge found', 400));
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError(error.message, 400));
  }

  const { verified, registrationInfo } = verification;

  if (verified && registrationInfo) {
    const { credentialPublicKey, credentialID, counter } = registrationInfo;

    const newCredential = {
      credentialID: Array.from(credentialID),
      credentialPublicKey: Array.from(credentialPublicKey),
      counter,
      transports: req.body.response.transports,
    };

    const currentCredentials = user.webauthn_credentials || [];
    currentCredentials.push(newCredential);

    user.webauthn_credentials = currentCredentials;
    user.webauthn_current_challenge = null;
    await user.save();

    res.status(200).json({ success: true, verified: true });
  } else {
    res.status(400).json({ success: false, verified: false });
  }
});

exports.generateLoginOptions = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const userPasskeys = user.webauthn_credentials || [];
  
  if (userPasskeys.length === 0) {
    return next(new AppError('No biometric credentials registered for this user', 400));
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: userPasskeys.map(passkey => ({
      id: new Uint8Array(passkey.credentialID),
      type: 'public-key',
      transports: passkey.transports,
    })),
    userVerification: 'preferred',
  });

  user.webauthn_current_challenge = options.challenge;
  await user.save();

  res.status(200).json(options);
});

exports.verifyLoginResponse = catchAsync(async (req, res, next) => {
  const { email, response } = req.body;
  
  if (!email || !response) {
    return next(new AppError('Email and response are required', 400));
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const expectedChallenge = user.webauthn_current_challenge;
  if (!expectedChallenge) {
    return next(new AppError('No challenge found', 400));
  }

  const userPasskeys = user.webauthn_credentials || [];
  const bodyCredIDBuffer = Buffer.from(response.id, 'base64');

  // Find the right credential
  const passkey = userPasskeys.find(p => {
    const pIdStr = Buffer.from(p.credentialID).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return pIdStr === response.id;
  });

  if (!passkey) {
    return next(new AppError('Could not find matching credential', 400));
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: new Uint8Array(passkey.credentialPublicKey),
        credentialID: new Uint8Array(passkey.credentialID),
        counter: passkey.counter,
      },
    });
  } catch (error) {
    console.error(error);
    return next(new AppError(error.message, 400));
  }

  const { verified, authenticationInfo } = verification;

  if (verified) {
    // Update counter
    passkey.counter = authenticationInfo.newCounter;
    // Replace the credential in the array
    const newPasskeys = userPasskeys.map(p => {
      const pIdStr = Buffer.from(p.credentialID).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      if (pIdStr === response.id) {
        return passkey;
      }
      return p;
    });

    user.webauthn_credentials = newPasskeys;
    user.webauthn_current_challenge = null;
    await user.save();

    await createSendToken(user, 200, res);
  } else {
    res.status(400).json({ success: false, message: 'Verification failed' });
  }
});
