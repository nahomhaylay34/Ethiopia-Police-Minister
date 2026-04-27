const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT, 10) || 465,
  secure: process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email transporter not available', error);
    } else {
      console.log('Email transporter ready');
    }
  });
} else {
  console.warn('EMAIL_USER/EMAIL_PASS not configured; email service disabled');
}

const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Skipping sendEmail: EMAIL_USER/EMAIL_PASS not configured');
    return;
  }

  const message = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html
  };

  const info = await transporter.sendMail(message);
  return info;
};

const buildVerificationEmail = (user, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify?token=${token}`;
  const subject = 'Verify your CMS account';
  const text = `Hello ${user.full_name},\n\nPlease verify your account by visiting this link: ${verifyUrl}\n\nIf you did not request access, ignore this email.`;
  const html = `<p>Hello ${user.full_name},</p><p>Please verify your account by clicking <a href="${verifyUrl}">this link</a>.</p><p>If you did not request this, ignore this message.</p>`;
  return { subject, text, html };
};

module.exports = {
  sendEmail,
  buildVerificationEmail
};