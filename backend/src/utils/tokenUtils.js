const jwt = require('jsonwebtoken');

const signAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY
  });
};

const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

const signEmailToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_EMAIL_SECRET, {
    expiresIn: process.env.JWT_EMAIL_EXPIRY || '1d'
  });
};

const verifyEmailToken = (token) => {
  return jwt.verify(token, process.env.JWT_EMAIL_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  signEmailToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyEmailToken
};
