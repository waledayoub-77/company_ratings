// EOTY Service — Employee of the Year (Feature 7)
const supabase = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Create a new EOTY event for the current year (admin only)
 */
const createEvent = async (companyId, userId, { year }) => {
  const currentYear = new Date().getFullYear();
  const eventYear = parseInt(year) || currentYear;
  if (eventYear !== currentYear) {
    throw new AppError(`EOTY events can only be created for the current year (${currentYear})`, 400);
  }

  const { data: company } = await supabase
    .from('companies')
    .select('id, user_id')
    .eq('id', companyId)
    .is('deleted_at', null)
    .single();
  if (!company || company.user_id !== userId) throw new AppError('You do not own this company', 403);

  const { data: existing } = await supabase
    .from('eoty_events')
    .select('id')
    .eq('company_id', companyId)
    .eq('year', eventYear)
    .maybeSingle();
  if (existing) throw new AppError('An EOTY event already exists for this year', 400);

  const { data, error } = await supabase
    .from('eoty_events')
    .insert({ company_id: companyId, year: eventYear, is_active: true, created_by: userId })
    .select()
    .single();
  if (error) throw new AppError('Failed to create EOTY event', 500);
  return data;
};

/**
 * Nominate an employee for an EOTY event
 */
const nominateEmployee = async (eventId, nominatorUserId, nomineeEmployeeId) => {
  const { data: event } = await supabase
    .from('eoty_events')
    .select('id, company_id, is_active')
    .eq('id', eventId)
    .single();
  if (!event) throw new AppError('EOTY event not found', 404);
  if (!event.is_active) throw new AppError('Nominations are closed for this event', 400);

  // Verify nominee is an approved employee at this company
  const { data: nominee } = await supabase
    .from('employments')
    .select('id')
    .eq('employee_id', nomineeEmployeeId)
    .eq('company_id', event.company_id)
    .eq('verification_status', 'approved')
    .eq('is_current', true)
    .is('deleted_at', null)
    .maybeSingle();
  if (!nominee) throw new AppError('Nominee is not an active employee at this company', 400);

  // Check duplicate nomination
  const { data: existing } = await supabase
    .from('eoty_nominees')
    .select('id')
    .eq('event_id', eventId)
    .eq('employee_id', nomineeEmployeeId)
    .maybeSingle();
  if (existing) throw new AppError('This employee has already been nominated', 400);

  const { data, error } = await supabase
    .from('eoty_nominees')
    .insert({ event_id: eventId, employee_id: nomineeEmployeeId, nominated_by: nominatorUserId })
    .select()
    .single();
  if (error) throw new AppError('Failed to nominate employee: ' + error.message, 500);
  return data;
};

/**
 * Cast a vote in an EOTY event
 */
const castVote = async (eventId, userId, nomineeId) => {
  const { data: event } = await supabase
    .from('eoty_events')
    .select('id, company_id, is_active')
    .eq('id', eventId)
    .single();
  if (!event) throw new AppError('EOTY event not found', 404);
  if (!event.is_active) throw new AppError('Voting is closed for this event', 400);

  const { data: voterEmployee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (!voterEmployee) throw new AppError('Employee profile not found', 404);

  // Voter must be an approved employee at this company
  const { data: voterEmp } = await supabase
    .from('employments')
    .select('id')
    .eq('employee_id', voterEmployee.id)
    .eq('company_id', event.company_id)
    .eq('verification_status', 'approved')
    .eq('is_current', true)
    .is('deleted_at', null)
    .maybeSingle();
  if (!voterEmp) throw new AppError('You must be an active employee at this company to vote', 403);

  // Prevent self-vote
  const { data: nom } = await supabase
    .from('eoty_nominees')
    .select('id, employee_id')
    .eq('id', nomineeId)
    .single();
  if (!nom) throw new AppError('Nominee not found', 404);
  if (nom.employee_id === voterEmployee.id) throw new AppError('You cannot vote for yourself', 400);

  // Prevent double vote
  const { data: existingVote } = await supabase
    .from('eoty_votes')
    .select('id')
    .eq('event_id', eventId)
    .eq('voter_id', voterEmployee.id)
    .maybeSingle();
  if (existingVote) throw new AppError('You have already voted in this event', 400);

  const { data, error } = await supabase
    .from('eoty_votes')
    .insert({ event_id: eventId, voter_id: voterEmployee.id, nominee_id: nomineeId })
    .select()
    .single();
  if (error) throw new AppError('Failed to cast vote', 500);
  return data;
};

/**
 * Close an EOTY event and record the winner
 */
const closeEvent = async (eventId, adminUserId, companyId) => {
  const { data: event } = await supabase
    .from('eoty_events')
    .select('*')
    .eq('id', eventId)
    .eq('company_id', companyId)
    .single();
  if (!event) throw new AppError('EOTY event not found', 404);
  if (!event.is_active) throw new AppError('Event is already closed', 400);

  // Tally votes
  const { data: votes } = await supabase
    .from('eoty_votes')
    .select('nominee_id')
    .eq('event_id', eventId);

  let winnerId = null;
  let winnerEmployeeId = null;
  if (votes && votes.length > 0) {
    const tally = {};
    for (const v of votes) { tally[v.nominee_id] = (tally[v.nominee_id] || 0) + 1; }
    const topNomineeId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
    const { data: nom } = await supabase.from('eoty_nominees').select('employee_id').eq('id', topNomineeId).single();
    winnerId = topNomineeId;
    winnerEmployeeId = nom?.employee_id || null;
  }

  await supabase.from('eoty_events').update({ is_active: false }).eq('id', eventId);

  // Insert winner record
  const { data: winner, error } = await supabase
    .from('employee_of_year')
    .insert({ company_id: companyId, year: event.year, employee_id: winnerEmployeeId, event_id: eventId })
    .select()
    .single();
  if (error) throw new AppError('Failed to record winner: ' + error.message, 500);

  return { event, winner, winnerEmployeeId };
};

const getCompanyEvents = async (companyId) => {
  const { data, error } = await supabase
    .from('eoty_events')
    .select('*')
    .eq('company_id', companyId)
    .order('year', { ascending: false });
  if (error) throw new AppError('Failed to fetch EOTY events', 500);
  return data;
};

const getEventNominees = async (eventId) => {
  const { data: event } = await supabase
    .from('eoty_events')
    .select('is_active')
    .eq('id', eventId)
    .single();

  const { data, error } = await supabase
    .from('eoty_nominees')
    .select(`
      id,
      employee_id,
      employees:employee_id ( id, full_name, headline, profile_picture_url ),
      vote_count
    `)
    .eq('event_id', eventId)
    .order('vote_count', { ascending: false });
  if (error) throw new AppError('Failed to fetch nominees', 500);

  // Hide vote counts while event is active
  if (event?.is_active) {
    return data.map(n => { const { vote_count, ...rest } = n; return rest; });
  }
  return data;
};

const getCompanyWinners = async (companyId) => {
  const { data, error } = await supabase
    .from('employee_of_year')
    .select(`
      id,
      year,
      employee_id,
      event_id,
      employees:employee_id ( id, full_name, headline, profile_picture_url )
    `)
    .eq('company_id', companyId)
    .order('year', { ascending: false });
  if (error) throw new AppError('Failed to fetch EOTY winners', 500);
  return data;
};

/**
 * Get certificate data for EOTY winner (Feature 9)
 * Returns { employeeName, companyName, award, year }
 */
const getCertificateData = async (eventId) => {
  const { data: event } = await supabase
    .from('eoty_events')
    .select('company_id, year')
    .eq('id', eventId)
    .single();

  if (!event) throw new AppError('Event not found', 404);

  const { data: winner } = await supabase
    .from('employee_of_year')
    .select('employee_id, employees(full_name)')
    .eq('event_id', eventId)
    .single();

  if (!winner) throw new AppError('No winner for this event', 404);

  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', event.company_id)
    .single();

  return {
    employeeName: winner.employees?.full_name || 'Unknown',
    companyName: company?.name || 'Unknown Company',
    award: 'Employee of the Year',
    year: event.year,
  };
};

module.exports = {
  createEvent,
  nominateEmployee,
  castVote,
  closeEvent,
  getCompanyEvents,
  getEventNominees,
  getCompanyWinners,
  getCertificateData,
};
