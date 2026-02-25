const { sendEmail } = require('../config/email');

// ─── TEMPLATES ───────────────────────────────────────────────────────────────

function welcomeTemplate(name) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#1a1a2e;">Welcome to RateHub 👋</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your account has been created. Please verify your email to unlock all features.</p>
      <p style="color:#888;font-size:13px;">If you didn't create this account, you can ignore this email.</p>
    </div>
  `;
}

function verifyEmailTemplate(name, verifyUrl) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#1a1a2e;">Verify your email</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Click the button below to verify your email address. This link expires in <strong>24 hours</strong>.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${verifyUrl}"
           style="background:#4f46e5;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Verify Email
        </a>
      </div>
      <p style="color:#888;font-size:13px;">Or copy this link: ${verifyUrl}</p>
      <p style="color:#888;font-size:13px;">If you didn't create this account, ignore this email.</p>
    </div>
  `;
}

function resetPasswordTemplate(name, resetUrl) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#1a1a2e;">Reset your password</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset your password. Click the button below. This link expires in <strong>1 hour</strong>.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}"
           style="background:#dc2626;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Reset Password
        </a>
      </div>
      <p style="color:#888;font-size:13px;">Or copy this link: ${resetUrl}</p>
      <p style="color:#888;font-size:13px;">If you didn't request a password reset, ignore this email. Your password won't change.</p>
    </div>
  `;
}

function employmentApprovedTemplate(name, companyName) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#16a34a;">Employment Approved ✅</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your employment at <strong>${companyName}</strong> has been <strong>approved</strong>.</p>
      <p>You can now submit reviews for this company.</p>
    </div>
  `;
}

function employmentRejectedTemplate(name, companyName, reason) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#dc2626;">Employment Request Rejected</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your employment request at <strong>${companyName}</strong> was <strong>rejected</strong>.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you believe this is a mistake, please contact the company admin.</p>
    </div>
  `;
}

function employmentRequestTemplate(adminName, employeeName, companyName) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#4f46e5;">New Employment Request 📋</h2>
      <p>Hi <strong>${adminName}</strong>,</p>
      <p><strong>${employeeName}</strong> has submitted an employment verification request for <strong>${companyName}</strong>.</p>
      <p>Please review and approve or reject the request from your admin dashboard.</p>
      <p style="color:#888;font-size:13px;">— The RateHub Team</p>
    </div>
  `;
}

function accountSuspendedTemplate(name, reason) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#dc2626;">Account Suspended</h2>
      <p>Hi <strong>${name || 'User'}</strong>,</p>
      <p>Your RateHub account has been <strong>suspended</strong> by a system administrator.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you believe this is a mistake, please contact support.</p>
      <p style="color:#888;font-size:13px;">— The RateHub Team</p>
    </div>
  `;
}

function accountUnsuspendedTemplate(name) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#16a34a;">Account Reactivated ✅</h2>
      <p>Hi <strong>${name || 'User'}</strong>,</p>
      <p>Your RateHub account has been <strong>reactivated</strong>. You can now log in and use the platform again.</p>
      <p style="color:#888;font-size:13px;">— The RateHub Team</p>
    </div>
  `;
}

function accountDeletedTemplate(name) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#dc2626;">Account Deleted</h2>
      <p>Hi <strong>${name || 'User'}</strong>,</p>
      <p>Your RateHub account has been <strong>permanently deleted</strong> by a system administrator.</p>
      <p>Your reviews will remain on the platform attributed to a deleted account.</p>
      <p>If you believe this is a mistake, please contact support.</p>
      <p style="color:#888;font-size:13px;">— The RateHub Team</p>
    </div>
  `;
}

function reportResolutionTemplate(decision) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#4f46e5;">Report Update</h2>
      <p>Your report has been reviewed by our moderation team.</p>
      <p><strong>Decision:</strong> ${decision === 'remove' ? 'The review has been removed.' : 'After review, the reported content does not violate our guidelines.'}</p>
      <p>Thank you for helping keep RateHub a trustworthy platform.</p>
      <p style="color:#888;font-size:13px;">— The RateHub Team</p>
    </div>
  `;
}

// ─── SEND FUNCTIONS ───────────────────────────────────────────────────────────

async function sendWelcomeEmail({ to, name }) {
  return sendEmail({
    to,
    subject: 'Welcome to RateHub!',
    html: welcomeTemplate(name),
  });
}

async function sendVerifyEmail({ to, name, token }) {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
  const verifyUrl = `${frontendUrl}/verify-email/${token}`;
  return sendEmail({
    to,
    subject: 'Verify your email — RateHub',
    html: verifyEmailTemplate(name, verifyUrl),
  });
}

async function sendResetPasswordEmail({ to, name, token }) {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
  const resetUrl = `${frontendUrl}/reset-password/${token}`;
  return sendEmail({
    to,
    subject: 'Reset your password — RateHub',
    html: resetPasswordTemplate(name, resetUrl),
  });
}

async function sendEmploymentApprovedEmail({ to, name, companyName }) {
  return sendEmail({
    to,
    subject: `Your employment at ${companyName} was approved`,
    html: employmentApprovedTemplate(name, companyName),
  });
}

async function sendEmploymentRejectedEmail({ to, name, companyName, reason }) {
  return sendEmail({
    to,
    subject: `Your employment request at ${companyName}`,
    html: employmentRejectedTemplate(name, companyName, reason),
  });
}

async function sendEmploymentRequestEmail({ to, adminName, employeeName, companyName }) {
  return sendEmail({
    to,
    subject: `New employment request for ${companyName} — RateHub`,
    html: employmentRequestTemplate(adminName, employeeName, companyName),
  });
}

async function sendAccountSuspendedEmail({ to, name, reason }) {
  return sendEmail({
    to,
    subject: 'Your RateHub account has been suspended',
    html: accountSuspendedTemplate(name, reason),
  });
}

async function sendAccountUnsuspendedEmail({ to, name }) {
  return sendEmail({
    to,
    subject: 'Your RateHub account has been reactivated',
    html: accountUnsuspendedTemplate(name),
  });
}

async function sendAccountDeletedEmail({ to, name }) {
  return sendEmail({
    to,
    subject: 'Your RateHub account has been deleted',
    html: accountDeletedTemplate(name),
  });
}

async function sendReportResolutionEmail({ to, decision }) {
  return sendEmail({
    to,
    subject: 'Your report has been reviewed — RateHub',
    html: reportResolutionTemplate(decision),
  });
}

module.exports = {
  sendWelcomeEmail,
  sendVerifyEmail,
  sendResetPasswordEmail,
  sendEmploymentApprovedEmail,
  sendEmploymentRejectedEmail,
  sendEmploymentRequestEmail,
  sendAccountSuspendedEmail,
  sendAccountUnsuspendedEmail,
  sendAccountDeletedEmail,
  sendReportResolutionEmail,
};
