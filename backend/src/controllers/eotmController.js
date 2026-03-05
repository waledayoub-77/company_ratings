// EOTM Controller — Employee of the Month
const eotmService = require('../services/eotmService');

// POST /api/eotm/events
const createEvent = async (req, res, next) => {
  try {
    const { companyId, department, month, year, startDate, endDate } = req.body;
    const data = await eotmService.createEvent(companyId, req.user.userId, { department, month, year, startDate, endDate });
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

// POST /api/eotm/events/:id/vote
const castVote = async (req, res, next) => {
  try {
    const data = await eotmService.castVote(req.params.id, req.user.userId, req.body.candidateId || req.body.nomineeId);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

// PATCH /api/eotm/events/:id/close
const closeEvent = async (req, res, next) => {
  try {
    const data = await eotmService.closeEvent(req.params.id, req.user.userId);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

// GET /api/eotm/company/:companyId
const getCompanyEvents = async (req, res, next) => {
  try {
    const data = await eotmService.getCompanyEvents(req.params.companyId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/eotm/events/:id/nominees
const getEventNominees = async (req, res, next) => {
  try {
    const data = await eotmService.getEventNominees(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/eotm/company/:companyId/winners
const getCompanyWinners = async (req, res, next) => {
  try {
    const data = await eotmService.getCompanyWinners(req.params.companyId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/eotm/events/:id/certificate (Feature 9)
const getCertificate = async (req, res, next) => {
  try {
    const data = await eotmService.getCertificateData(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { createEvent, castVote, closeEvent, getCompanyEvents, getEventNominees, getCompanyWinners, getCertificate };
