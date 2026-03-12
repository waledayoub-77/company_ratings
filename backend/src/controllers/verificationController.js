// Verification Controller
const verificationService = require('../services/verificationService');
const { logAdminAction } = require('../utils/auditLogger');
const path = require('path')


// POST /api/verification/upload-id
const submitIdentityVerification = async (req, res, next) => {
  try {
    const { documentUrl, documentType } = req.body;
    if (!documentUrl) {
      return res.status(400).json({ success: false, error: 'Document URL is required' });
    }
    const result = await verificationService.submitIdentityVerification(req.user.userId, {
      documentUrl,
      documentType,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/verification/upload-company-doc
const submitCompanyVerification = async (req, res, next) => {
  try {
    const { documentUrl, documentType, companyId } = req.body;
    if (!documentUrl || !companyId) {
      return res.status(400).json({ success: false, error: 'Document URL and company ID are required' });
    }
    const result = await verificationService.submitCompanyVerification(req.user.userId, companyId, {
      documentUrl,
      documentType,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/verification/upload-company-doc-file (multipart)
const submitCompanyVerificationFile = async (req, res, next) => {
  try {
    // multer places file on req.file
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const companyId = req.body.companyId || req.body.company_id
    if (!companyId) return res.status(400).json({ success: false, error: 'companyId is required' });

    // Build a URL pointing to the served uploads path
    const fileUrl = `/uploads/verifications/${req.file.filename}`

    const result = await verificationService.submitCompanyVerification(req.user.userId, companyId, {
      documentUrl: fileUrl,
      documentType: req.body.documentType || 'business_license',
    })

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// GET /api/verification/status
const getMyVerificationStatus = async (req, res, next) => {
  try {
    const result = await verificationService.getMyVerificationStatus(req.user.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/verifications
const getVerificationRequests = async (req, res, next) => {
  try {
    const result = await verificationService.getVerificationRequests(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/verifications/:id/approve
const approveVerification = async (req, res, next) => {
  try {
    const result = await verificationService.approveVerification(
      req.params.id,
      req.user.userId,
      req.body.adminNotes
    );
    await logAdminAction({
      adminId: req.user.userId,
      action: 'verification_approved',
      entityType: 'verification_request',
      entityId: req.params.id,
      details: { notes: req.body.adminNotes },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/verifications/:id/reject
const rejectVerification = async (req, res, next) => {
  try {
    const result = await verificationService.rejectVerification(
      req.params.id,
      req.user.userId,
      req.body.adminNotes
    );
    await logAdminAction({
      adminId: req.user.userId,
      action: 'verification_rejected',
      entityType: 'verification_request',
      entityId: req.params.id,
      details: { notes: req.body.adminNotes },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitIdentityVerification,
  submitCompanyVerification,
  submitCompanyVerificationFile,
  getMyVerificationStatus,
  getVerificationRequests,
  approveVerification,
  rejectVerification,
};
