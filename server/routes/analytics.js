const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');

// @route   POST api/analytics/pulse
// @desc    Update daily focus seconds
// @access  Private
router.post('/pulse', auth, analyticsController.updateActivity);

// @route   GET api/analytics/heatmap
// @desc    Get heatmap data for current user
// @access  Private
router.get('/heatmap', auth, analyticsController.getHeatmapData);

// @route   GET api/analytics/stats
// @desc    Get library usage stats
// @access  Private
router.get('/stats', auth, analyticsController.getLibraryStats);

module.exports = router;
