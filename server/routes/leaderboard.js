const express = require('express');
const router = express.Router();
const { getGlobalLeaderboard, getGroupLeaderboard, getMyRank } = require('../controllers/leaderboardController');
const { auth, optionalAuth } = require('../middleware/auth');

// Global leaderboard — auth optional so unauthenticated users can view
router.get('/global', optionalAuth, getGlobalLeaderboard);

// My rank this week — auth required, ignores isPublic
router.get('/my-rank', auth, getMyRank);

// Group leaderboard — auth required
router.get('/group/:groupId', auth, getGroupLeaderboard);

module.exports = router;
