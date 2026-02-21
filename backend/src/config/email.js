const { Resend } = require('resend');

// Make Resend optional - if no API key, email won't work but app will still run
const resendApiKey = process.env.RESEND_API_KEY || 'dummy-key-for-testing';
const resend = new Resend(resendApiKey);
const EMAIL_FROM = process.env.EMAIL_FROM || 'RateHub <onboarding@resend.dev>';

/**
 * Send an email via Resend
 * @param {object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 */
const sendEmail = async ({ to, subject, html }) => {
  // Skip email if no real API key configured
  if (!process.env.RESEND_API_KEY) {
    console.log('⚠️  Email sending skipped (no RESEND_API_KEY):', { to, subject });
    return { id: 'test-email-id', message: 'Email skipped in development' };
  }

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
