// EOTM Service — Employee of the Month
const supabase = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Create a new EOTM event (company admin)
 */
const createEvent = async (companyId, userId, { title, description, month, year }) => {
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

  // Check for existing event in same month/year
  const { data: existing } = await supabase
    .from('eotm_events')
    .select('id')
    .eq('company_id', companyId)
    .eq('month', month)
    .eq('year', year)
    .maybeSingle();

  if (existing) {
    throw new AppError('An EOTM event already exists for this month', 400);
  }

  const { data, error } = await supabase
    .from('eotm_events')
    .insert({
      company_id: companyId,
      title: title || `Employee of the Month - ${month}/${year}`,
      description,
      month: parseInt(month),
      year: parseInt(year),
      status: 'voting',
    })
    .select()
    .single();

  if (error) throw new AppError('Failed to create EOTM event', 500);
  return data;
};

/**
 * Cast a vote in an EOTM event
 */
const castVote = async (eventId, voterId, nomineeId) => {
  // Verify event exists and is open for voting
  const { data: event } = await supabase
    .from('eotm_events')
    .select('id, company_id, status')
    .eq('id', eventId)
    .single();

  if (!event) throw new AppError('EOTM event not found', 404);
  if (event.status !== 'voting') throw new AppError('Voting is closed for this event', 400);

  // Verify voter is employed at company
  const { data: voterEmp } = await supabase
    .from('employments')
    .select('id')
    .eq('user_id', voterId)
    .eq('company_id', event.company_id)
    .eq('verification_status', 'approved')
    .maybeSingle();

  if (!voterEmp) throw new AppError('You must be a verified employee to vote', 403);

  // Check existing vote
  const { data: existingVote } = await supabase
    .from('eotm_votes')
    .select('id')
    .eq('event_id', eventId)
    .eq('voter_id', voterId)
    .maybeSingle();

  if (existingVote) throw new AppError('You have already voted in this event', 400);

  // Can't vote for yourself
  if (voterId === nomineeId) throw new AppError('You cannot vote for yourself', 400);

  const { data, error } = await supabase
    .from('eotm_votes')
    .insert({ event_id: eventId, voter_id: voterId, nominee_id: nomineeId })
    .select()
    .single();

  if (error) throw new AppError('Failed to cast vote', 500);
  return data;
};

/**
 * Close an EOTM event and determine winner
 */
const closeEvent = async (eventId, userId) => {
  const { data: event } = await supabase
    .from('eotm_events')
    .select('id, company_id, status')
    .eq('id', eventId)
    .single();

  if (!event) throw new AppError('Event not found', 404);
  if (event.status !== 'voting') throw new AppError('Event is not in voting state', 400);

  // Verify ownership
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
    .from('eotm_votes')
    .select('nominee_id')
    .eq('event_id', eventId);

  if (!votes || votes.length === 0) {
    await supabase.from('eotm_events').update({ status: 'closed' }).eq('id', eventId);
    return { message: 'Event closed with no votes', winner: null };
  }

  // Tally votes
  const tally = {};
  votes.forEach(v => {
    tally[v.nominee_id] = (tally[v.nominee_id] || 0) + 1;
  });

  const winnerId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];

  // Record the winner
  await supabase.from('employee_of_month').insert({
    company_id: event.company_id,
    employee_id: winnerId,
    event_id: eventId,
    month: event.month,
    year: event.year,
    vote_count: tally[winnerId],
  });

  await supabase.from('eotm_events').update({
    status: 'closed',
    winner_id: winnerId,
  }).eq('id', eventId);

  // Get winner name
  const { data: winner } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', winnerId)
    .single();

  return {
    message: 'Event closed',
    winner: { id: winnerId, name: winner?.full_name || winner?.email, voteCount: tally[winnerId] },
  };
};

/**
 * Get EOTM events for a company
 */
const getCompanyEvents = async (companyId) => {
  const { data, error } = await supabase
    .from('eotm_events')
    .select('*, winner:users!eotm_events_winner_id_fkey(full_name, email)')
    .eq('company_id', companyId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) return [];
  return data || [];
};

/**
 * Get nominees (employees) for an event
 */
const getEventNominees = async (eventId) => {
  const { data: event } = await supabase
    .from('eotm_events')
    .select('company_id')
    .eq('id', eventId)
    .single();

  if (!event) throw new AppError('Event not found', 404);

  // Get all verified employees at this company
  const { data: employees } = await supabase
    .from('employments')
    .select('user_id, users!inner(full_name, email)')
    .eq('company_id', event.company_id)
    .eq('verification_status', 'approved');

  // Get vote counts
  const { data: votes } = await supabase
    .from('eotm_votes')
    .select('nominee_id')
    .eq('event_id', eventId);

  const tally = {};
  (votes || []).forEach(v => {
    tally[v.nominee_id] = (tally[v.nominee_id] || 0) + 1;
  });

  return (employees || []).map(e => ({
    userId: e.user_id,
    name: e.users?.full_name || e.users?.email || 'Unknown',
    votes: tally[e.user_id] || 0,
  })).sort((a, b) => b.votes - a.votes);
};

/**
 * Get past winners for a company
 */
const getCompanyWinners = async (companyId) => {
  const { data } = await supabase
    .from('employee_of_month')
    .select('*, users!inner(full_name, email)')
    .eq('company_id', companyId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  return (data || []).map(w => ({
    id: w.id,
    month: w.month,
    year: w.year,
    name: w.users?.full_name || w.users?.email,
    voteCount: w.vote_count,
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
