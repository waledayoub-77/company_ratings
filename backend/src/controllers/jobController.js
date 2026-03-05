// Job Controller — Feature 5: Job Positions + CV Pipeline
const multer = require('multer');
const path = require('path');
const supabase = require('../config/database');
const jobService = require('../services/jobService');
const { createNotification } = require('../services/notificationService');

// Multer: 5MB limit, memory storage, PDF/DOC only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOC/DOCX files are allowed'), false);
    }
  },
});

exports.uploadMiddleware = upload.single('cv');

// ─── Admin: positions ─────────────────────────────────────────────────────────

exports.createPosition = async (req, res) => {
  try {
    if (req.user.role !== 'company_admin') return res.status(403).json({ message: 'Company admin only' });
    const { companyId, title, description, requirements, salaryMin, salaryMax, isActive } = req.body;
    if (!companyId || !title) return res.status(400).json({ message: 'companyId and title required' });
    const result = await jobService.createPosition({
      companyId, adminUserId: req.user.userId, title, description, requirements, salaryMin, salaryMax, isActive,
    });
    if (result.error) return res.status(400).json({ message: result.error });
    return res.status(201).json({ success: true, data: result.data });
  } catch (e) {
    console.error('createPosition error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePosition = async (req, res) => {
  try {
    if (req.user.role !== 'company_admin') return res.status(403).json({ message: 'Company admin only' });
    const { companyId, title, description, requirements, salaryMin, salaryMax, isActive } = req.body;
    if (!companyId) return res.status(400).json({ message: 'companyId required' });

    const { data: companies } = await supabase.from('companies').select('id').eq('user_id', req.user.userId).is('deleted_at', null);
    if (!companies?.find(c => c.id === companyId)) return res.status(403).json({ message: 'Not authorized for this company' });

    const result = await jobService.updatePosition({
      positionId: req.params.id, companyId, adminUserId: req.user.userId, title, description, requirements, salaryMin, salaryMax, isActive,
    });
    if (result.error) return res.status(400).json({ message: result.error });
    return res.json({ success: true, data: result.data });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePosition = async (req, res) => {
  try {
    if (req.user.role !== 'company_admin') return res.status(403).json({ message: 'Company admin only' });
    const { companyId } = req.body;
    if (!companyId) return res.status(400).json({ message: 'companyId required' });

    const { data: companies } = await supabase.from('companies').select('id').eq('user_id', req.user.userId).is('deleted_at', null);
    if (!companies?.find(c => c.id === companyId)) return res.status(403).json({ message: 'Not authorized for this company' });

    const result = await jobService.deletePosition({
      positionId: req.params.id, companyId, adminUserId: req.user.userId,
    });
    if (result.error) return res.status(400).json({ message: result.error });
    return res.json({ success: true, message: 'Position deleted' });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/jobs/company/:companyId — public: active only; admin: all
exports.getCompanyPositions = async (req, res) => {
  try {
    const { companyId } = req.params;
    const isAdmin = req.user?.role === 'company_admin';
    // If admin, verify they own this company
    let adminOnly = false;
    if (isAdmin) {
      const { data: company } = await supabase.from('companies').select('id').eq('id', companyId).eq('user_id', req.user.userId).single();
      adminOnly = !!company;
    }
    const result = await jobService.getCompanyPositions(companyId, adminOnly);
    if (result.error) return res.status(400).json({ message: result.error });
    return res.json({ success: true, data: result.data });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── Employee: applications ───────────────────────────────────────────────────

exports.applyToPosition = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { positionId, coverLetter } = req.body;
    if (!positionId) return res.status(400).json({ message: 'positionId required' });

    const { data: employee } = await supabase.from('employees').select('id').eq('user_id', userId).single();
    if (!employee) return res.status(400).json({ message: 'Employee profile not found' });

    let cvUrl = null;
    let cvFileName = null;

    // Upload CV to Supabase Storage if provided
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const filePath = `cvs/${employee.id}/${Date.now()}${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('cvs')
        .upload(filePath, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
      if (uploadErr) {
        console.error('CV upload error:', uploadErr.message);
        return res.status(500).json({ message: 'Failed to upload CV: ' + uploadErr.message });
      }
      const { data: urlData } = supabase.storage.from('cvs').getPublicUrl(filePath);
      cvUrl = urlData?.publicUrl || null;
      cvFileName = req.file.originalname;
    }

    const result = await jobService.applyToPosition({
      positionId, applicantId: employee.id, coverLetter, cvUrl, cvFileName,
    });
    if (result.error) return res.status(400).json({ message: result.error });

    // Notify company admin (non-blocking)
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('user_id, name')
        .eq('id', result.position.company_id)
        .single();
      if (company?.user_id) {
        const { data: empData } = await supabase.from('employees').select('full_name').eq('id', employee.id).single();
        await createNotification({
          userId: company.user_id,
          type: 'job_application',
          title: 'New Job Application',
          message: `${empData?.full_name || 'An applicant'} applied for "${result.position.title}" at ${company.name}.`,
          link: '/company-admin#jobs',
          entityType: 'job_application',
          entityId: result.data.id,
        });
      }
    } catch (_) {}

    return res.status(201).json({ success: true, data: result.data });
  } catch (e) {
    console.error('applyToPosition error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { data: employee } = await supabase.from('employees').select('id').eq('user_id', userId).single();
    if (!employee) return res.status(400).json({ message: 'Employee profile not found' });
    const result = await jobService.getMyApplications(employee.id);
    if (result.error) return res.status(400).json({ message: result.error });
    return res.json({ success: true, data: result.data });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getApplicationsForPosition = async (req, res) => {
  try {
    if (req.user.role !== 'company_admin') return res.status(403).json({ message: 'Company admin only' });
    const { positionId } = req.params;
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ message: 'companyId required' });

    const { data: companies } = await supabase.from('companies').select('id').eq('user_id', req.user.userId).is('deleted_at', null);
    if (!companies?.find(c => c.id === companyId)) return res.status(403).json({ message: 'Not authorized' });

    const result = await jobService.getApplicationsForPosition(positionId, companyId);
    if (result.error) return res.status(400).json({ message: result.error });
    return res.json({ success: true, data: result.data });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    if (req.user.role !== 'company_admin') return res.status(403).json({ message: 'Company admin only' });
    const { applicationId } = req.params;
    const { status, companyId } = req.body;
    if (!companyId || !status) return res.status(400).json({ message: 'companyId and status required' });

    const { data: companies } = await supabase.from('companies').select('id, name').eq('user_id', req.user.userId).is('deleted_at', null);
    const company = companies?.find(c => c.id === companyId);
    if (!company) return res.status(403).json({ message: 'Not authorized' });

    const result = await jobService.updateApplicationStatus({
      applicationId, companyId, status, adminUserId: req.user.userId,
    });
    if (result.error) return res.status(400).json({ message: result.error });

    // Notify applicant (non-blocking)
    try {
      const { data: emp } = await supabase.from('employees').select('user_id').eq('id', result.applicantId).single();
      if (emp?.user_id) {
        const statusLabels = { interview: 'shortlisted for an interview', approved: 'approved', rejected: 'not moving forward' };
        await createNotification({
          userId: emp.user_id,
          type: 'application_update',
          title: 'Application Update',
          message: `Your job application at ${company.name} has been updated: ${statusLabels[status] || status}.`,
          link: '/dashboard#applications',
          entityType: 'job_application',
          entityId: applicationId,
        });
      }
    } catch (_) {}

    return res.json({ success: true, data: result.data });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};
