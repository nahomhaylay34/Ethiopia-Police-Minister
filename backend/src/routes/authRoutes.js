const express = require('express');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { register, login } = require('../validators/authValidator');
const webauthnController = require('../controllers/webauthnController');

const router = express.Router();

router.post('/register', validate(register), authController.register);
router.post('/login', validate(login), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

router.get('/me', authenticate, authController.getMe);
router.get('/verify', authController.verifyEmail);
router.get('/verify/:token', authController.verifyEmail);

// WebAuthn Biometric Login
router.post('/webauthn/login-options', webauthnController.generateLoginOptions);
router.post('/webauthn/login-verify', webauthnController.verifyLoginResponse);

// WebAuthn Biometric Registration (Requires Authentication)
router.get('/webauthn/register-options', authenticate, webauthnController.generateRegistrationOptions);
router.post('/webauthn/register-verify', authenticate, webauthnController.verifyRegistrationResponse);

module.exports = router;
