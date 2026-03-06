// EOTY Controller — Employee of the Year
const eotyService = require('../services/eotyService');

const createEvent = async (req, res, next) => {
  try {
    const { companyId, year } = req.body;
    const data = await eotyService.createEvent(companyId, req.user.userId, { year });
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const castVote = async (req, res, next) => {
  try {
    const data = await eotyService.castVote(req.params.id, req.user.userId, req.body.candidateId);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const closeEvent = async (req, res, next) => {
  try {
    const data = await eotyService.closeEvent(req.params.id, req.user.userId);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

const getCompanyEvents = async (req, res, next) => {
  try {
    const data = await eotyService.getCompanyEvents(req.params.companyId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getEventNominees = async (req, res, next) => {
  try {
    const data = await eotyService.getEventNominees(req.params.id, req.user?.role);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getCompanyWinners = async (req, res, next) => {
  try {
    const data = await eotyService.getCompanyWinners(req.params.companyId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { createEvent, castVote, closeEvent, getCompanyEvents, getEventNominees, getCompanyWinners };
