// EOTY Service — Employee of the Year
const supabase = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Create a new EOTY event (company admin)
 */
const createEvent = async (companyId, userId, { year }) => {
  // Verify the user owns this company
  const { data: company } = await supabase
    .from('companies')
    .select('id, user_id')
    .eq('id', companyId)
    .is('deleted_at', null)
    .single();

  if (!company || company.user_id !== userId) {
    throw new AppError('You do not own this company', 403);
  }

  // Only allow for current year
  const now = new Date();
  const currentYear = now.getFullYear();
  if (parseInt(year) !== currentYear) {
    throw new AppError('EOTY events can only be created for the current year', 400);
  }

  // Only allow EOTY event creation in December
  if (now.getMonth() !== 11) {
    throw new AppError('Employee of the Year events can only be created in December', 400);
  }

  // Check for existing event
  const { data: existing } = await supabase
    .from('eoty_events')
    .select('id')
    .eq('company_id', companyId)
    .eq('year', year)
    .maybeSingle();

  if (existing) {
    throw new AppError('An EOTY event already exists for this year', 400);
  }

  const { data, error } = await supabase
    .from('eoty_events')
    .insert({
      company_id: companyId,
      year: parseInt(year),
      is_active: true,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase error in createEotyEvent:', error);
    throw new AppError('Failed to create EOTY event', 500);
  }
  return data;
};

/**
 * Cast a vote in an EOTY event
 */
const castVote = async (eventId, userId, candidateEmployeeId) => {
  const { data: event } = await supabase
    .from('eoty_events')
    .select('id, company_id, is_active')
    .eq('id', eventId)
    .single();

  if (!event) throw new AppError('EOTY event not found', 404);
  if (!event.is_active) throw new AppError('Voting is closed for this event', 400);

  // Look up voter's employee record
  const { data: voterEmployee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!voterEmployee) throw new AppError('Employee profile not found', 404);

  const voterEmployeeId = voterEmployee.id;

  // Verify voter is employed at this company
  const { data: voterEmps } = await supabase
    .from('employments')
    .select('id')
    .eq('employee_id', voterEmployeeId)
    .eq('company_id', event.company_id)
    .eq('verification_status', 'approved')
    .eq('is_current', true)
    .limit(1);

  if (!voterEmps || voterEmps.length === 0) throw new AppError('You must be a current verified employee to vote', 403);

  // Check existing vote
  const { data: existingVote } = await supabase
    .from('eoty_votes')
    .select('id')
    .eq('event_id', eventId)
    .eq('voter_id', voterEmployeeId)
    .maybeSingle();

  if (existingVote) throw new AppError('You have already voted in this event', 400);
  if (voterEmployeeId === candidateEmployeeId) throw new AppError('You cannot vote for yourself', 400);

  const { data, error } = await supabase
    .from('eoty_votes')
    .insert({ event_id: eventId, voter_id: voterEmployeeId, candidate_id: candidateEmployeeId })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase error in castEotyVote:', error);
    throw new AppError('Failed to cast vote', 500);
  }
  return data;
};

/**
 * Close an EOTY event and determine winner
 */
const closeEvent = async (eventId, userId) => {
  const { data: event } = await supabase
    .from('eoty_events')
    .select('id, company_id, is_active, year')
    .eq('id', eventId)
    .single();

  if (!event) throw new AppError('Event not found', 404);
  if (!event.is_active) throw new AppError('Event is already closed', 400);

  const { data: company } = await supabase
    .from('companies')
    .select('user_id')
    .eq('id', event.company_id)
    .single();

  if (!company || company.user_id !== userId) {
    throw new AppError('Only the company admin can close an event', 403);
  }

  // Count votes
  const { data: votes } = await supabase
    .from('eoty_votes')
    .select('candidate_id, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (!votes || votes.length === 0) {
    await supabase.from('employee_of_year').insert({
      company_id: event.company_id,
      employee_id: null,
      event_id: eventId,
      year: event.year,
      votes_count: 0,
    });
    await supabase.from('eoty_events').update({ is_active: false, closed_at: new Date().toISOString() }).eq('id', eventId);
    return { message: 'Event closed with no votes', winner: null };
  }

  // Tally votes
  const tally = {};
  const earliestVote = {};
  votes.forEach(v => {
    tally[v.candidate_id] = (tally[v.candidate_id] || 0) + 1;
    if (!earliestVote[v.candidate_id]) earliestVote[v.candidate_id] = v.created_at;
  });

  const winnerEmployeeId = Object.entries(tally)
    .sort((a, b) => b[1] - a[1] || new Date(earliestVote[a[0]]) - new Date(earliestVote[b[0]]))[0][0];

  await supabase.from('employee_of_year').insert({
    company_id: event.company_id,
    employee_id: winnerEmployeeId,
    event_id: eventId,
    year: event.year,
    votes_count: tally[winnerEmployeeId],
  });

  await supabase.from('eoty_events').update({ is_active: false, closed_at: new Date().toISOString() }).eq('id', eventId);

  const { data: winner } = await supabase
    .from('employees')
    .select('full_name, user_id')
    .eq('id', winnerEmployeeId)
    .single();

  return {
    message: 'Event closed',
    winner: {
      employeeId: winnerEmployeeId,
      name: winner?.full_name || 'Unknown',
      voteCount: tally[winnerEmployeeId],
    },
  };
};

/**
 * Get EOTY events for a company
 */
const getCompanyEvents = async (companyId) => {
  const { data, error } = await supabase
    .from('eoty_events')
    .select('*')
    .eq('company_id', companyId)
    .order('year', { ascending: false });

  if (error) return [];
  return (data || []).map(ev => ({ ...ev, status: ev.is_active ? 'open' : 'closed' }));
};

/**
 * Get nominees for an EOTY event
 */
const getEventNominees = async (eventId, userRole) => {
  const { data: event } = await supabase
    .from('eoty_events')
    .select('company_id, is_active')
    .eq('id', eventId)
    .single();

  if (!event) throw new AppError('Event not found', 404);

  const { data: employments } = await supabase
    .from('employments')
    .select('employee_id, employees!inner(id, full_name, user_id)')
    .eq('company_id', event.company_id)
    .eq('verification_status', 'approved')
    .eq('is_current', true);

  const { data: votes } = await supabase
    .from('eoty_votes')
    .select('candidate_id')
    .eq('event_id', eventId);

  const tally = {};
  (votes || []).forEach(v => { tally[v.candidate_id] = (tally[v.candidate_id] || 0) + 1; });

  const seen = new Set();
  const nominees = [];
  for (const e of employments || []) {
    const empId = e.employees?.id || e.employee_id;
    if (seen.has(empId)) continue;
    seen.add(empId);
    nominees.push({
      employee_id: empId,
      full_name: e.employees?.full_name || 'Unknown',
      vote_count: tally[empId] || 0,
    });
  }

  // Feature 8: Hide vote counts from non-admin users while event is active
  if (event.is_active && userRole !== 'company_admin' && userRole !== 'system_admin') {
    return nominees.map(n => ({ employee_id: n.employee_id, full_name: n.full_name, vote_count: null }));
  }

  return nominees.sort((a, b) => b.vote_count - a.vote_count);
};

/**
 * Get past EOTY winners for a company
 */
const getCompanyWinners = async (companyId) => {
  const { data } = await supabase
    .from('employee_of_year')
    .select('*, employees(full_name, user_id), companies(name)')
    .eq('company_id', companyId)
    .order('year', { ascending: false });

  return (data || []).map(w => ({
    id: w.id,
    employee_id: w.employee_id,
    year: w.year,
    employee_name: w.employees?.full_name || null,
    user_id: w.employees?.user_id || null,
    company_name: w.companies?.name || null,
    voteCount: w.votes_count,
  }));
};

module.exports = {
  createEvent,
  castVote,
  closeEvent,
  getCompanyEvents,
  getEventNominees,
  getCompanyWinners,
};
