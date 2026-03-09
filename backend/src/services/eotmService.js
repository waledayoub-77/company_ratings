// EOTM Service — Employee of the Month
const supabase = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Create a new EOTM event (company admin)
 * Schema: eotm_events(id, company_id, department, month, year, start_date, end_date, is_active, created_by, created_at)
 */
const createEvent = async (companyId, userId, { department, month, year, startDate, endDate }) => {
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

  // Feature 6: EOTM events can only be created for the current month
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  if (parseInt(month) !== currentMonth || parseInt(year) !== currentYear) {
    throw new AppError('EOTM events can only be created for the current month', 400);
  }

  // Check for existing event in same department/month/year
  const dept = department || 'General';
  const { data: existing } = await supabase
    .from('eotm_events')
    .select('id')
    .eq('company_id', companyId)
    .eq('department', dept)
    .eq('month', month)
    .eq('year', year)
    .maybeSingle();

  if (existing) {
    throw new AppError('An EOTM event already exists for this department/month', 400);
  }

  // Calculate sensible defaults for start/end date if not provided
  const m = parseInt(month);
  const y = parseInt(year);
  const defaultStart = startDate || new Date(y, m - 1, 1).toISOString();
  const defaultEnd = endDate || new Date(y, m, 0, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from('eotm_events')
    .insert({
      company_id: companyId,
      department: dept,
      month: m,
      year: y,
      start_date: defaultStart,
      end_date: defaultEnd,
      is_active: true,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase error in createEvent:', error);
    throw new AppError('Failed to create EOTM event', 500);
  }
  return data;
};

/**
 * Cast a vote in an EOTM event
 * Schema: eotm_votes(id, event_id, voter_id→employees, candidate_id→employees, created_at)
 * voter_id and candidate_id reference employees(id), NOT users(id)
 */
const castVote = async (eventId, userId, candidateEmployeeId) => {
  // Verify event exists and is active
  const { data: event } = await supabase
    .from('eotm_events')
    .select('id, company_id, is_active')
    .eq('id', eventId)
    .single();

  if (!event) throw new AppError('EOTM event not found', 404);
  if (!event.is_active) throw new AppError('Voting is closed for this event', 400);

  // Look up the voter's employee record from their user_id
  const { data: voterEmployee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!voterEmployee) throw new AppError('Employee profile not found. Create your employee profile first.', 404);

  const voterEmployeeId = voterEmployee.id;

  // Verify voter is employed at this company (via employments table: employee_id FK)
  // Use limit(1) instead of maybeSingle() — an employee may have multiple approved rows
  const { data: voterEmps } = await supabase
    .from('employments')
    .select('id')
    .eq('employee_id', voterEmployeeId)
    .eq('company_id', event.company_id)
    .eq('verification_status', 'approved')
    .eq('is_current', true)
    .limit(1);

  if (!voterEmps || voterEmps.length === 0) throw new AppError('You must be a current verified employee to vote', 403);

  // Check existing vote (unique constraint: event_id + voter_id)
  const { data: existingVote } = await supabase
    .from('eotm_votes')
    .select('id')
    .eq('event_id', eventId)
    .eq('voter_id', voterEmployeeId)
    .maybeSingle();

  if (existingVote) throw new AppError('You have already voted in this event', 400);

  // Can't vote for yourself
  if (voterEmployeeId === candidateEmployeeId) throw new AppError('You cannot vote for yourself', 400);

  const { data, error } = await supabase
    .from('eotm_votes')
    .insert({ event_id: eventId, voter_id: voterEmployeeId, candidate_id: candidateEmployeeId })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase error in castVote:', error);
    throw new AppError('Failed to cast vote', 500);
  }
  return data;
};

/**
 * Close an EOTM event and determine winner
 * Winner goes into employee_of_month(event_id, company_id, employee_id, department, month, year, votes_count)
 */
const closeEvent = async (eventId, userId) => {
  const { data: event } = await supabase
    .from('eotm_events')
    .select('id, company_id, is_active, department, month, year')
    .eq('id', eventId)
    .single();

  if (!event) throw new AppError('Event not found', 404);
  if (!event.is_active) throw new AppError('Event is already closed', 400);

  // Verify ownership
  const { data: company } = await supabase
    .from('companies')
    .select('user_id')
    .eq('id', event.company_id)
    .single();

  if (!company || company.user_id !== userId) {
    throw new AppError('Only the company admin can close an event', 403);
  }

  // Count votes with timestamps for deterministic tie-breaking
  const { data: votes } = await supabase
    .from('eotm_votes')
    .select('candidate_id, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (!votes || votes.length === 0) {
    // Record "no winner" so Hall of Fame shows the month
    await supabase.from('employee_of_month').insert({
      company_id: event.company_id,
      employee_id: null,
      event_id: eventId,
      department: event.department || 'all',
      month: event.month,
      year: event.year,
      votes_count: 0,
    });
    await supabase.from('eotm_events').update({ is_active: false }).eq('id', eventId);
    return { message: 'Event closed with no votes', winner: null };
  }

  // Tally votes by candidate_id and track earliest vote per candidate
  const tally = {};
  const earliestVote = {};
  votes.forEach(v => {
    tally[v.candidate_id] = (tally[v.candidate_id] || 0) + 1;
    if (!earliestVote[v.candidate_id]) {
      earliestVote[v.candidate_id] = v.created_at;
    }
  });

  // Sort: highest votes wins; on tie, candidate who received first vote earliest wins
  const winnerEmployeeId = Object.entries(tally)
    .sort((a, b) => b[1] - a[1] || new Date(earliestVote[a[0]]) - new Date(earliestVote[b[0]]))[0][0];

  // Record the winner in employee_of_month
  await supabase.from('employee_of_month').insert({
    company_id: event.company_id,
    employee_id: winnerEmployeeId,
    event_id: eventId,
    department: event.department,
    month: event.month,
    year: event.year,
    votes_count: tally[winnerEmployeeId],
  });

  // Close the event
  await supabase.from('eotm_events').update({ is_active: false }).eq('id', eventId);

  // Get winner name from employees table
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
 * Get EOTM events for a company
 * No winner_id FK on eotm_events, so no winner join
 */
const getCompanyEvents = async (companyId) => {
  const { data, error } = await supabase
    .from('eotm_events')
    .select('*')
    .eq('company_id', companyId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) return [];
  return (data || []).map(ev => ({ ...ev, status: ev.is_active ? 'open' : 'closed' }));
};

/**
 * Get nominees (employees) for an event
 * employments.employee_id → employees.id, employees.user_id → users.id
 * eotm_votes.candidate_id → employees.id
 */
const getEventNominees = async (eventId, userRole) => {
  const { data: event } = await supabase
    .from('eotm_events')
    .select('company_id, is_active')
    .eq('id', eventId)
    .single();

  if (!event) throw new AppError('Event not found', 404);

  // Get all verified employees at this company via employments → employees
  const { data: employments } = await supabase
    .from('employments')
    .select('employee_id, employees!inner(id, full_name, user_id)')
    .eq('company_id', event.company_id)
    .eq('verification_status', 'approved')
    .eq('is_current', true);

  // Get vote counts (candidate_id is employee id)
  const { data: votes } = await supabase
    .from('eotm_votes')
    .select('candidate_id')
    .eq('event_id', eventId);

  const tally = {};
  (votes || []).forEach(v => {
    tally[v.candidate_id] = (tally[v.candidate_id] || 0) + 1;
  });

  // Deduplicate by employee_id (an employee may have multiple employment records)
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
 * Get past winners for a company
 * employee_of_month.employee_id → employees.id
 */
const getCompanyWinners = async (companyId) => {
  const { data } = await supabase
    .from('employee_of_month')
    .select('*, employees(full_name, user_id), companies(name)')
    .eq('company_id', companyId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  return (data || []).map(w => ({
    id: w.id,
    employee_id: w.employee_id,
    month: w.month,
    year: w.year,
    department: w.department,
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
