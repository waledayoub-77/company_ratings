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

function feedbackReceivedTemplate(recipientName, senderName, companyName) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#4f46e5;">New Peer Feedback 💬</h2>
      <p>Hi <strong>${recipientName}</strong>,</p>
      <p>You have received new peer feedback from <strong>${senderName || 'a colleague'}</strong> at <strong>${companyName}</strong>.</p>
      <p>Log in to your RateHub dashboard to view the full feedback.</p>
      <p style="color:#888;font-size:13px;">— The RateHub Team</p>
    </div>
  `;
}

function employmentInviteTemplate(companyName, acceptUrl) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#4f46e5;">You've Been Invited to Join ${companyName} 🎉</h2>
      <p>A company admin at <strong>${companyName}</strong> has invited you to join their team on RateHub.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${acceptUrl}"
           style="background:#4f46e5;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Accept Invitation
        </a>
      </div>
      <p style="color:#888;font-size:13px;">This invitation expires in 7 days. If you don't have an account yet, you'll be asked to register first.</p>
      <p style="color:#888;font-size:13px;">— The RateHub Team</p>
    </div>
  `;
}

function employmentEndedByAdminTemplate(name, companyName, reason) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#dc2626;">Employment Ended</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your employment at <strong>${companyName}</strong> has been ended by the company administrator.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>You can still view your past reviews on RateHub.</p>
      <p style="color:#888;font-size:13px;">— The RateHub Team</p>
    </div>
  `;
}

function jobApplicationStatusTemplate(name, positionTitle, companyName, status) {
  const statusMessages = {
    interview: 'has moved to the <strong>Interview</strong> stage',
    approved: 'has been <strong>Approved</strong> — congratulations!',
    rejected: 'has been <strong>Rejected</strong>'
  };
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#4f46e5;">Application Update</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your application for <strong>${positionTitle}</strong> at <strong>${companyName}</strong> ${statusMessages[status] || 'has been updated'}.</p>
      <p>Log in to your RateHub dashboard for details.</p>
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

async function sendFeedbackReceivedEmail({ to, recipientName, senderName, companyName }) {
  return sendEmail({
    to,
    subject: 'You received new peer feedback — RateHub',
    html: feedbackReceivedTemplate(recipientName, senderName, companyName),
  });
}

async function sendEmploymentInviteEmail({ to, companyName, token }) {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
  const acceptUrl = `${frontendUrl}/accept-invite?token=${token}`;
  return sendEmail({
    to,
    subject: `You've been invited to join ${companyName} — RateHub`,
    html: employmentInviteTemplate(companyName, acceptUrl),
  });
}

async function sendEmploymentEndedByAdminEmail({ to, name, companyName, reason }) {
  return sendEmail({
    to,
    subject: `Your employment at ${companyName} has ended — RateHub`,
    html: employmentEndedByAdminTemplate(name, companyName, reason),
  });
}

async function sendJobApplicationStatusEmail({ to, name, positionTitle, companyName, status }) {
  return sendEmail({
    to,
    subject: `Application update: ${positionTitle} at ${companyName} — RateHub`,
    html: jobApplicationStatusTemplate(name, positionTitle, companyName, status),
  });
}

function interviewInviteTemplate(name, positionTitle, companyName) {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#1a1a2e;">Interview Invitation 🎉</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>You have been invited for an interview for the position of <strong>${positionTitle}</strong> at <strong>${companyName}</strong>.</p>
      <p>Please log in to your RateHub dashboard to accept this invitation.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${frontendUrl}/dashboard?tab=jobs"
           style="background:#1a1a2e;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Accept Invitation
        </a>
      </div>
      <p style="color:#888;font-size:13px;">— The RateHub Team</p>
    </div>
  `;
}

async function sendInterviewInviteEmail({ to, name, positionTitle, companyName }) {
  return sendEmail({
    to,
    subject: `Interview Invitation: ${positionTitle} at ${companyName} — RateHub`,
    html: interviewInviteTemplate(name, positionTitle, companyName),
  });
}

function hireInviteTemplate(name, positionTitle, companyName) {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#1a1a2e;">You're Hired! 🎉</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Congratulations! <strong>${companyName}</strong> would like to officially welcome you as a new team member for the position of <strong>${positionTitle}</strong>.</p>
      <p>Please log in to your RateHub dashboard to accept this employment offer. Once accepted, you'll gain full access to the company portal including peer feedback and reviews.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${frontendUrl}/dashboard?tab=jobs"
           style="background:#1a1a2e;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Accept Employment Offer
        </a>
      </div>
      <p style="color:#888;font-size:13px;">— The RateHub Team</p>
    </div>
  `;
}

async function sendHireInviteEmail({ to, name, positionTitle, companyName }) {
  return sendEmail({
    to,
    subject: `Employment Offer: ${positionTitle} at ${companyName} — RateHub`,
    html: hireInviteTemplate(name, positionTitle, companyName),
  });
}

function companyVerifiedTemplate(name, companyName) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#16a34a;">Company Verified ✅</h2>
      <p>Hi <strong>${name || 'Company Admin'}</strong>,</p>
      <p>Your company <strong>${companyName}</strong> has been verified by our moderation team. You can now access the company admin features.</p>
      <p style="color:#888;font-size:13px;">— The RateHub Team</p>
    </div>
  `
}

function companyRejectedTemplate(name, companyName, reason) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#dc2626;">Company Verification Rejected</h2>
      <p>Hi <strong>${name || 'Company Admin'}</strong>,</p>
      <p>Unfortunately, the verification documents for <strong>${companyName}</strong> were rejected.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>Please review your documents and submit a new verification request.</p>
      <p style="color:#888;font-size:13px;">— The RateHub Team</p>
    </div>
  `
}

async function sendCompanyVerifiedEmail({ to, name, companyName }) {
  return sendEmail({
    to,
    subject: `Your company ${companyName} has been verified — RateHub`,
    html: companyVerifiedTemplate(name, companyName),
  })
}

async function sendCompanyRejectedEmail({ to, name, companyName, reason }) {
  return sendEmail({
    to,
    subject: `Company verification rejected — ${companyName} — RateHub`,
    html: companyRejectedTemplate(name, companyName, reason),
  })
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
  sendFeedbackReceivedEmail,
  sendEmploymentInviteEmail,
  sendEmploymentEndedByAdminEmail,
  sendJobApplicationStatusEmail,
  sendInterviewInviteEmail,
  sendHireInviteEmail,
  sendCompanyVerifiedEmail,
  sendCompanyRejectedEmail,
};
