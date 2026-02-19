const nodemailer = require('nodemailer');
const config = require('./env');

// Create email transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

// Test email connection
const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service ready');
    return true;
  } catch (error) {
    console.warn('⚠️  Email service not configured:', error.message);
    return false;
  }
};

module.exports = { transporter, testEmailConnection };
