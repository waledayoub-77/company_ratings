const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'RateHub <onboarding@resend.dev>';

/**
 * Send an email via Resend
 * @param {object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 */
const sendEmail = async ({ to, subject, html }) => {
  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    console.error('❌ Email send failed:', error);
    throw new Error(error.message);
  }

  console.log('✅ Email sent:', data.id);
  return data;
};

module.exports = { sendEmail };
