// Job Controller — Job Positions + Applications
const jobService = require('../services/jobService');
const { createNotification } = require('../services/notificationService');
const { sendJobApplicationStatusEmail } = require('../services/emailService');
const supabase = require('../config/database');

// POST /api/jobs — create job posting (company admin)
const createJobPosition = async (req, res, next) => {
  try {
    const { companyId, title, department, description, requirements, employmentType } = req.body;
    if (!companyId || !title || !description) {
      return res.status(400).json({ success: false, message: 'companyId, title, and description are required' });
    }
    const data = await jobService.createJobPosition(companyId, req.user.userId, {
      title, department, description, requirements, employmentType
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

// GET /api/jobs/all?companyId=X — list all job postings (admin)
const getAllJobPositions = async (req, res, next) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ success: false, message: 'companyId query param required' });
    const data = await jobService.getAllJobPositions(companyId);
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
    const { coverLetter } = req.body;

    // Handle CV URL - in a production system this would use file upload
    // For now, accept cvUrl from body or set from uploaded file path
    let cvUrl = req.body.cvUrl;
    if (req.file) {
      // If multer middleware is used, file info is in req.file
      cvUrl = req.file.path || req.file.location || `/uploads/cvs/${req.file.filename}`;
    }

    if (!cvUrl) {
      return res.status(400).json({ success: false, message: 'CV is required (cvUrl or file upload)' });
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
            link: '/dashboard',
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
};
