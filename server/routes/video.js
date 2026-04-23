const express = require('express');
const router = express.Router();
const { getVideoById, togglePin, syncVideo, deleteVideo, updateChapters, updateVideo } = require('../controllers/videoController');
const { auth, optionalAuth } = require('../middleware/auth');

router.get('/:id', optionalAuth, getVideoById);
router.put('/:id', auth, updateVideo);
router.put('/:id/pin', auth, togglePin);
router.put('/:id/sync', auth, syncVideo);
router.put('/:id/chapters', auth, updateChapters);
router.delete('/:id', auth, deleteVideo);

module.exports = router;
