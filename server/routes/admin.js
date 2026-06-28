const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');
const adminController = require('../controllers/adminController');
const notificationController = require('../controllers/notificationController');
const feedbackController = require('../controllers/feedbackController');
const presenceController = require('../controllers/presenceController');
const achievementController = require('../controllers/achievementController');

// All routes here are protected by both auth and admin middleware
router.use(auth, admin);

// @route   GET api/admin/stats
router.get('/stats', adminController.getStats);

// @route   GET api/admin/health
router.get('/health', adminController.getHealth);

// @route   GET api/admin/chart-data
router.get('/chart-data', adminController.getChartData);

// @route   GET api/admin/users
router.get('/users', adminController.getUsers);

// @route   GET api/admin/users/:id
router.get('/users/:id', adminController.getUserDetails);

// @route   GET api/admin/playlists
router.get('/playlists', adminController.getAllPlaylists);

// @route   GET api/admin/videos
router.get('/videos', adminController.getAllVideos);

// @route   GET api/admin/audit-logs
router.get('/audit-logs', adminController.getAuditLogs);

// @route   PUT api/admin/users/:id/role
router.put('/users/:id/role', adminController.updateUserRole);

// @route   DELETE api/admin/users/:id
router.delete('/users/:id', adminController.deleteUser);

// @route   PUT api/admin/users/:id/freeze
router.put('/users/:id/freeze', adminController.toggleFreeze);

// @route   POST api/admin/users/:id/approve-wipe
router.post('/users/:id/approve-wipe', adminController.approveWipe);

// @route   GET  api/admin/users/:id/features  — get per-user feature overrides
router.get('/users/:id/features', adminController.getUserFeatureOverrides);

// @route   PUT  api/admin/users/:id/features  — set/clear a per-user feature override
router.put('/users/:id/features', adminController.setUserFeatureOverride);

// @route   POST api/admin/impersonation/start
router.post('/impersonation/start', adminController.logImpersonationStart);

// @route   POST api/admin/impersonation/end
router.post('/impersonation/end', adminController.logImpersonationEnd);

// @route   POST api/admin/notifications/broadcast
router.post('/notifications/broadcast', notificationController.createAdminBroadcast);

// @route   GET api/admin/notifications/history
router.get('/notifications/history', notificationController.getAdminNotificationHistory);

// @route   GET api/admin/feedback
router.get('/feedback', feedbackController.getAdminFeedback);

// @route   PUT api/admin/feedback/:id
router.put('/feedback/:id', feedbackController.updateAdminFeedback);

// @route   DELETE api/admin/feedback/:id
router.delete('/feedback/:id', feedbackController.deleteAdminFeedback);

// @route   GET api/admin/live-presence
router.get('/live-presence', presenceController.getLiveUsers);

// @route   GET api/admin/achievements
router.get('/achievements', achievementController.listAdminAchievements);

// @route   POST api/admin/achievements/seed
router.post('/achievements/seed', achievementController.seedDefaultAchievements);

// @route   POST api/admin/achievements/:key/award
router.post('/achievements/:key/award', achievementController.awardAchievementToUser);

// Achievement CRUD
router.post('/achievements', achievementController.createAchievement);
router.put('/achievements/:id', achievementController.updateAchievement);
router.delete('/achievements/:id', achievementController.deleteAchievement);

// ─── Tier 1-4 routes ──────────────────────────────────────────────────────────

// Bulk user actions (must be before /:id routes)
router.post('/users/bulk', adminController.bulkUserAction);

// Content analytics
router.get('/content-analytics', adminController.getContentAnalytics);

// Security monitor
router.get('/security', adminController.getSecurityLog);

// Cache flush
router.post('/cache/flush', adminController.flushCache);

// Scheduled maintenance
router.get('/scheduled-maintenance', adminController.getScheduledMaintenance);
router.post('/scheduled-maintenance', adminController.setScheduledMaintenance);

// Cohort retention
router.get('/cohort-retention', adminController.getCohortRetention);

// Reported content
router.get('/reports', adminController.getReports);
router.put('/reports/:id', adminController.resolveReport);

// A/B tests
router.get('/ab-tests', adminController.getABTests);
router.post('/ab-tests', adminController.createABTest);
router.put('/ab-tests/:id', adminController.updateABTest);
router.delete('/ab-tests/:id', adminController.deleteABTest);

// Referrals
router.get('/referrals', adminController.getReferrals);

// Import queue
router.get('/import-queue', adminController.getImportQueue);

// Bulk export (CSV)
router.get('/export', adminController.bulkExport);

// AI model registry (for admin model picker)
router.get('/ai-models', adminController.getAIModels);
router.put('/ai-model', adminController.setAIModel);

// AI providers — admin-configured keys/providers
router.get('/ai-providers', adminController.getAIProviders);
router.put('/ai-providers', adminController.saveAIProvider);
router.delete('/ai-providers/:id', adminController.deleteAIProvider);
router.post('/ai-providers/test', adminController.testAIProvider);

module.exports = router;
