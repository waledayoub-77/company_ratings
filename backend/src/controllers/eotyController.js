// EOTY Controller — Feature 7: Employee of the Year
const supabase = require('../config/database');
const eotyService = require('../services/eotyService');
const { createNotification } = require('../services/notificationService');

const getAdminCompany = async (userId) => {
  const { data } = await supabase
    .from('companies')
    .select('id, name')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .limit(1)
    .single();
  return data;
};

exports.createEvent = async (req, res) => {
  try {
    if (req.user.role !== 'company_admin') return res.status(403).json({ message: 'Company admin only' });
    const company = await getAdminCompany(req.user.userId);
    if (!company) return res.status(400).json({ message: 'No company found for this admin' });
    const event = await eotyService.createEvent(company.id, req.user.userId, { year: req.body.year });
    return res.status(201).json({ success: true, data: event });
  } catch (e) {
    if (e.statusCode) return res.status(e.statusCode).json({ message: e.message });
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.nominate = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { eventId, nomineeEmployeeId } = req.body;
    if (!eventId || !nomineeEmployeeId) return res.status(400).json({ message: 'eventId and nomineeEmployeeId required' });

    const nominee = await eotyService.nominateEmployee(eventId, userId, nomineeEmployeeId);
    return res.status(201).json({ success: true, data: nominee });
  } catch (e) {
    if (e.statusCode) return res.status(e.statusCode).json({ message: e.message });
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.vote = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { eventId, nomineeId } = req.body;
    if (!eventId || !nomineeId) return res.status(400).json({ message: 'eventId and nomineeId required' });

    const vote = await eotyService.castVote(eventId, userId, nomineeId);

    // Notify the nominee (non-blocking)
    try {
      const { data: nom } = await supabase.from('eoty_nominees').select('employee_id').eq('id', nomineeId).single();
      if (nom?.employee_id) {
        const { data: emp } = await supabase.from('employees').select('user_id').eq('id', nom.employee_id).single();
        if (emp?.user_id) {
          await createNotification({
            userId: emp.user_id,
            type: 'eoty_vote',
            title: 'You received an EOTY vote!',
            message: 'Someone voted for you in the Employee of the Year event.',
            link: '/dashboard#eoty',
          });
        }
      }
    } catch (_) {}

    return res.json({ success: true, data: vote });
  } catch (e) {
    if (e.statusCode) return res.status(e.statusCode).json({ message: e.message });
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.closeEvent = async (req, res) => {
  try {
    if (req.user.role !== 'company_admin') return res.status(403).json({ message: 'Company admin only' });
    const company = await getAdminCompany(req.user.userId);
    if (!company) return res.status(400).json({ message: 'No company found' });

    const result = await eotyService.closeEvent(req.params.id, req.user.userId, company.id);

    // Notify winner (non-blocking)
    try {
      if (result.winnerEmployeeId) {
        const { data: winnerEmp } = await supabase.from('employees').select('user_id, full_name').eq('id', result.winnerEmployeeId).single();
        if (winnerEmp?.user_id) {
          await createNotification({
            userId: winnerEmp.user_id,
            type: 'eoty_winner',
            title: `🏆 You are the Employee of the Year ${result.event.year}!`,
            message: `Congratulations! You were selected as Employee of the Year at ${company.name}.`,
            link: '/dashboard#eoty',
          });
        }
      }
    } catch (_) {}

    return res.json({ success: true, data: result });
  } catch (e) {
    if (e.statusCode) return res.status(e.statusCode).json({ message: e.message });
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCompanyEvents = async (req, res) => {
  try {
    const company = await getAdminCompany(req.user.userId);
    if (!company) return res.status(400).json({ message: 'No company found' });
    const data = await eotyService.getCompanyEvents(company.id);
    return res.json({ success: true, data });
  } catch (e) {
    if (e.statusCode) return res.status(e.statusCode).json({ message: e.message });
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getEventNominees = async (req, res) => {
  try {
    const data = await eotyService.getEventNominees(req.params.id);
    return res.json({ success: true, data });
  } catch (e) {
    if (e.statusCode) return res.status(e.statusCode).json({ message: e.message });
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCompanyWinners = async (req, res) => {
  try {
    const { companyId } = req.params;
    const data = await eotyService.getCompanyWinners(companyId);
    return res.json({ success: true, data });
  } catch (e) {
    if (e.statusCode) return res.status(e.statusCode).json({ message: e.message });
    return res.status(500).json({ message: 'Server error' });
  }
};

// Feature 9: Get certificate data for EOTY winner
exports.getCertificate = async (req, res) => {
  try {
    const data = await eotyService.getCertificateData(req.params.id);
    return res.json({ success: true, data });
  } catch (e) {
    if (e.statusCode) return res.status(e.statusCode).json({ message: e.message });
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /eoty/company/:companyId — for any authenticated user (employees viewing EOTY events)
exports.getEventsByCompanyId = async (req, res) => {
  try {
    const data = await eotyService.getCompanyEvents(req.params.companyId);
    return res.json({ success: true, data });
  } catch (e) {
    if (e.statusCode) return res.status(e.statusCode).json({ message: e.message });
    return res.status(500).json({ message: 'Server error' });
  }
};
