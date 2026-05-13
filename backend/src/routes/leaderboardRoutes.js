const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const auth = require('../middleware/authMiddleware');

// @route   GET /api/leaderboard
// @desc    Get weekly leaderboard
// @access  Private
router.get('/', auth, leaderboardController.getLeaderboard);

module.exports = router;
