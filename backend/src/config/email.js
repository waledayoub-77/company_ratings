const nodemailer = require('nodemailer');

const EMAIL_FROM = process.env.EMAIL_FROM || `RateHub <${process.env.EMAIL_USER}>`;

/**
 * Create a Nodemailer transporter using Gmail SMTP
 */
function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password (16 chars, no spaces)
    },
  });
}

/**
 * Send an email via Nodemailer + Gmail SMTP
 * @param {object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 */
const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('⚠️  Email sending skipped (EMAIL_USER/EMAIL_PASS not set):', { to, subject });
    return { message: 'Email skipped — configure EMAIL_USER and EMAIL_PASS in .env' };
  }

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  });

  console.log('✅ Email sent:', info.messageId);
  return info;
};

module.exports = { sendEmail };
