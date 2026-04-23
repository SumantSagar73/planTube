const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

const socialController = require('../controllers/socialController');

router.get('/search', auth, socialController.searchUsers);
router.post('/request/:userId', auth, socialController.sendFriendRequest);
router.put('/respond/:requestId', auth, socialController.respondToRequest);
router.get('/stats', auth, socialController.getSocialStats);
router.get('/profile/:username', auth, socialController.getPublicProfile);

module.exports = router;
