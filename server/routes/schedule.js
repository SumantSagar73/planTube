const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { auth } = require('../middleware/auth');

// Schedule retrieval routes
router.get('/today', auth, scheduleController.getTodaySchedules);
router.get('/upcoming', auth, scheduleController.getUpcomingSchedules);
router.get('/missed', auth, scheduleController.getMissedSchedules);
router.get('/completed', auth, scheduleController.getCompletedSchedules);
router.get('/progress', auth, scheduleController.getProgress);
router.get('/playlist/:playlistId', auth, scheduleController.getPlaylistSchedules);

// Analytics route
router.get('/analytics', auth, scheduleController.getAnalytics);

// Schedule management routes
router.post('/', auth, scheduleController.createSchedule);
router.put('/:id', auth, scheduleController.updateStatus);
router.delete('/video/:videoId', auth, scheduleController.deleteSchedule);

// Smart scheduling routes
router.post('/auto/:playlistId', auth, scheduleController.autoSchedulePlaylist);
router.post('/goal/:playlistId', auth, scheduleController.setPlaylistGoal);
router.post('/auto/:playlistId/preview', auth, scheduleController.previewAutoSchedule);
router.post('/goal/:playlistId/preview', auth, scheduleController.previewGoal);

module.exports = router;
