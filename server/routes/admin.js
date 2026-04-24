const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');
const adminController = require('../controllers/adminController');
const notificationController = require('../controllers/notificationController');

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

// @route   POST api/admin/impersonation/start
router.post('/impersonation/start', adminController.logImpersonationStart);

// @route   POST api/admin/impersonation/end
router.post('/impersonation/end', adminController.logImpersonationEnd);

// @route   POST api/admin/notifications/broadcast
router.post('/notifications/broadcast', notificationController.createAdminBroadcast);

module.exports = router;
