// Job Controller — Job Positions + Applications
const path = require('path');
const jobService = require('../services/jobService');
const { createNotification } = require('../services/notificationService');
const { sendJobApplicationStatusEmail, sendInterviewInviteEmail, sendHireInviteEmail } = require('../services/emailService');
const supabase = require('../config/database');

// POST /api/jobs — create job posting (company admin)
const createJobPosition = async (req, res, next) => {
  try {
    const { companyId, title, department, description, requirements, employmentType, location, salary } = req.body;
    if (!companyId || !title || !description || !location) {
      return res.status(400).json({ success: false, message: 'companyId, title, description, and location are required' });
    }
    const data = await jobService.createJobPosition(companyId, req.user.userId, {
      title, department, description, requirements, employmentType, location, salary
    });
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/jobs?companyId=X — list active job postings
const getJobPositions = async (req, res, next) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ success: false, message: 'companyId query param required' });
    const data = await jobService.getJobPositions(companyId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/jobs/all?companyId=X — list all job postings (admin or employee browsing)
const getAllJobPositions = async (req, res, next) => {
  try {
    let { companyId } = req.query;
    // Sanitize string literals that should be treated as missing
    if (companyId === 'undefined' || companyId === 'null' || companyId === '') companyId = undefined;
    // Auto-detect companyId for company_admin users
    if (!companyId && req.user?.role === 'company_admin') {
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', req.user.userId)
        .is('deleted_at', null)
        .maybeSingle();
      if (company) companyId = company.id;
    }
    if (companyId) {
      const data = await jobService.getAllJobPositions(companyId);
      return res.json({ success: true, data });
    }
    // No companyId — return all active jobs across all companies (for employee job board)
    const data = await jobService.getAllActiveJobs();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/jobs/:id — single job posting
const getJobPositionById = async (req, res, next) => {
  try {
    const data = await jobService.getJobPositionById(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// PATCH /api/jobs/:id/close — close a posting
const closeJobPosition = async (req, res, next) => {
  try {
    const data = await jobService.closeJobPosition(req.params.id, req.user.userId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// DELETE /api/jobs/:id — soft delete
const deleteJobPosition = async (req, res, next) => {
  try {
    const data = await jobService.deleteJobPosition(req.params.id, req.user.userId);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

// POST /api/jobs/:id/apply — apply to a job (authenticated users)
const applyToJob = async (req, res, next) => {
  try {
    const xss = require('xss');
    const coverLetter = req.body.coverLetter ? xss(req.body.coverLetter) : null;

    let cvUrl = null;
    if (req.file) {
      // Upload CV buffer to Supabase Storage bucket 'documents' under cvs/
      const path = require('path');
      const ext = path.extname(req.file.originalname).toLowerCase();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      const storagePath = `cvs/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error('[CV Upload] Supabase storage error:', uploadError);
        return res.status(500).json({ success: false, message: `Failed to upload CV: ${uploadError.message}` });
      }

      cvUrl = storagePath; // stored as 'cvs/<filename>'
    }

    const data = await jobService.applyToJob(req.params.id, req.user.userId, {
      cvUrl,
      coverLetter,
    });

    // Notify company admin (non-blocking)
    try {
      const position = await jobService.getJobPositionById(req.params.id);
      const { data: company } = await supabase
        .from('companies')
        .select('name, user_id')
        .eq('id', position.company_id)
        .single();
      const { data: applicant } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', req.user.userId)
        .single();
      if (company?.user_id) {
        await createNotification({
          userId: company.user_id,
          type: 'job_application',
          title: 'New Job Application',
          message: `${applicant?.full_name || 'Someone'} applied for ${position.title}.`,
          link: '/company-admin',
        });
      }
    } catch (_) {}

    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/jobs/:id/applications — list applications for a position (admin)
const getApplications = async (req, res, next) => {
  try {
    const data = await jobService.getApplications(req.params.id, req.user.userId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// PATCH /api/jobs/applications/:appId/status — update application status
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'status is required' });

    const result = await jobService.updateApplicationStatus(req.params.appId, req.user.userId, {
      status,
      adminNote,
    });

    // Send email + notification to applicant (non-blocking)
    try {
      // applicant_id references employees, so look up employee → user
      const { data: employee } = await supabase
        .from('employees')
        .select('id, user_id, full_name')
        .eq('id', result.data.applicant_id)
        .single();
      if (employee) {
        const { data: user } = await supabase
          .from('users')
          .select('email, id')
          .eq('id', employee.user_id)
          .single();
        if (user) {
          await sendJobApplicationStatusEmail({
            to: user.email,
            name: employee.full_name,
            positionTitle: result.positionTitle,
            companyName: result.companyName,
            status,
          });
          await createNotification({
            userId: user.id,
            type: 'application_status',
            title: 'Application Update',
            message: `Your application for ${result.positionTitle} at ${result.companyName} is now: ${status}.`,
            link: '/dashboard?tab=jobs',
          });
        }
      }
    } catch (_) {}

    res.json({ success: true, data: result.data });
  } catch (err) { next(err); }
};

// GET /api/jobs/my-applications — employee's own applications
const getMyApplications = async (req, res, next) => {
  try {
    const data = await jobService.getMyApplications(req.user.userId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// POST /api/jobs/applications/:appId/invite — admin sends interview invite email
const sendInvite = async (req, res, next) => {
  try {
    const result = await jobService.sendInvite(req.params.appId, req.user.userId);
    // Send invite email (non-blocking)
    try {
      if (result.employee?.users?.email) {
        await sendInterviewInviteEmail({
          to: result.employee.users.email,
          name: result.employee.full_name || 'Applicant',
          positionTitle: result.positionTitle,
          companyName: result.companyName,
        });
      }
      // Notify employee
      if (result.employee?.users?.id) {
        await createNotification({
          userId: result.employee.users.id,
          type: 'interview_invite',
          title: 'Interview Invitation',
          message: `You have been invited for an interview at ${result.companyName} for ${result.positionTitle}.`,
          link: '/dashboard?tab=jobs',
        });
      }
    } catch (_) {}
    res.json({ success: true, data: result.data });
  } catch (err) { next(err); }
};

// POST /api/jobs/applications/:appId/accept-invite — employee accepts interview invitation
const acceptInvite = async (req, res, next) => {
  try {
    const result = await jobService.acceptInvite(req.params.appId, req.user.userId);
    // Notify admin (non-blocking)
    try {
      if (result.adminUserId) {
        await createNotification({
          userId: result.adminUserId,
          type: 'invite_accepted',
          title: 'Interview Accepted',
          message: `A candidate has accepted the interview invitation for ${result.positionTitle}.`,
          link: '/company-admin?tab=jobs',
        });
      }
    } catch (_) {}
    res.json({ success: true, data: result.data });
  } catch (err) { next(err); }
};

// POST /api/jobs/applications/:appId/hire-invite — admin sends employment offer email
const sendHireInvite = async (req, res, next) => {
  try {
    const result = await jobService.sendHireInvite(req.params.appId, req.user.userId);
    // Send hire invite email (non-blocking)
    try {
      if (result.employee?.users?.email) {
        await sendHireInviteEmail({
          to: result.employee.users.email,
          name: result.employee.full_name || 'Applicant',
          positionTitle: result.positionTitle,
          companyName: result.companyName,
        });
      }
      if (result.employee?.users?.id) {
        await createNotification({
          userId: result.employee.users.id,
          type: 'hire_invite',
          title: 'Employment Offer 🎉',
          message: `You have received an employment offer from ${result.companyName} for ${result.positionTitle}. Log in to accept.`,
          link: '/dashboard?tab=jobs',
        });
      }
    } catch (_) {}
    res.json({ success: true, data: result.data });
  } catch (err) { next(err); }
};

// POST /api/jobs/applications/:appId/accept-hire — employee accepts employment offer
const acceptHireInvite = async (req, res, next) => {
  try {
    const result = await jobService.acceptHireInvite(req.params.appId, req.user.userId);
    // Notify admin (non-blocking)
    try {
      if (result.adminUserId) {
        await createNotification({
          userId: result.adminUserId,
          type: 'hire_accepted',
          title: 'Employment Offer Accepted',
          message: `A candidate has accepted the employment offer for ${result.positionTitle}.`,
          link: '/company-admin?tab=jobs',
        });
      }
    } catch (_) {}
    res.json({ success: true, data: result.data });
  } catch (err) { next(err); }
};

// POST /api/jobs/applications/:appId/reject-hire — employee rejects employment offer
const rejectHireInvite = async (req, res, next) => {
  try {
    const result = await jobService.rejectHireInvite(req.params.appId, req.user.userId);
    // Notify admin (non-blocking)
    try {
      if (result.adminUserId) {
        await createNotification({
          userId: result.adminUserId,
          type: 'hire_rejected',
          title: 'Employment Offer Rejected',
          message: `A candidate has rejected the employment offer for ${result.positionTitle}.`,
          link: '/company-admin?tab=jobs',
        });
      }
    } catch (_) {}
    res.json({ success: true, data: result.data });
  } catch (err) { next(err); }
};

// GET /api/jobs/cv/:filename — proxy CV from Supabase Storage (authenticated)
const serveCv = async (req, res, next) => {
  try {
    const path = require('path');
    const filename = path.basename(req.params.filename); // prevent path traversal
    const storagePath = `cvs/${filename}`;

    // Generate a short-lived signed URL (5 minutes)
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 300);

    if (error || !data?.signedUrl) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.removeHeader('X-Frame-Options');
    res.redirect(data.signedUrl);
  } catch (err) { next(err); }
};

module.exports = {
  createJobPosition,
  getJobPositions,
  getAllJobPositions,
  getJobPositionById,
  closeJobPosition,
  deleteJobPosition,
  applyToJob,
  getApplications,
  updateApplicationStatus,
  getMyApplications,
  sendInvite,
  acceptInvite,
  sendHireInvite,
  acceptHireInvite,
  rejectHireInvite,
  serveCv,
};
