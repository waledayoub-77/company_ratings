// Review Interaction Controller — replies, votes, category ratings
const replyService = require('../services/reviewReplyService');
const voteService = require('../services/reviewVoteService');
const categoryService = require('../services/categoryRatingService');

// POST /api/reviews/:id/reply
const createReply = async (req, res, next) => {
  try {
    const data = await replyService.createReply(req.params.id, req.user.userId, req.body.content);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

// PATCH /api/reviews/replies/:id
const updateReply = async (req, res, next) => {
  try {
    const data = await replyService.updateReply(req.params.id, req.user.userId, req.body.content);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// DELETE /api/reviews/replies/:id
const deleteReply = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'system_admin';
    const data = await replyService.deleteReply(req.params.id, req.user.userId, isAdmin);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

// POST /api/reviews/:id/vote
const toggleVote = async (req, res, next) => {
  try {
    const data = await voteService.toggleVote(req.params.id, req.user.userId, req.body.voteType || 'helpful');
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/reviews/:id/category-ratings
const getCategoryRatings = async (req, res, next) => {
  try {
    const data = await categoryService.getCategoryRatings(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { createReply, updateReply, deleteReply, toggleVote, getCategoryRatings };
