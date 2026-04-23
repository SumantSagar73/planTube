const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');
const adminController = require('../controllers/adminController');

// All routes here are protected by both auth and admin middleware
router.use(auth, admin);

// @route   GET api/admin/stats
router.get('/stats', adminController.getStats);

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

// @route   PUT api/admin/users/:id/role
router.put('/users/:id/role', adminController.updateUserRole);

// @route   DELETE api/admin/users/:id
router.delete('/users/:id', adminController.deleteUser);

// @route   PUT api/admin/users/:id/freeze
router.put('/users/:id/freeze', adminController.toggleFreeze);

// @route   POST api/admin/users/:id/approve-wipe
router.post('/users/:id/approve-wipe', adminController.approveWipe);

module.exports = router;
