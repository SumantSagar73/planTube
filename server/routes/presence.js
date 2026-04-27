const express = require('express');
const router = express.Router();
const presenceController = require('../controllers/presenceController');
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');

router.post('/heartbeat', auth, presenceController.heartbeat);
router.post('/playlist/total', presenceController.getPlaylistPresence);
router.get('/admin/live-users', auth, admin, presenceController.getLiveUsers);
router.get('/:videoId', presenceController.getPresence);

module.exports = router;
