const express = require('express');
const router = express.Router();
const { getVideoById } = require('../controllers/videoController');
const { auth, optionalAuth } = require('../middleware/auth');

router.get('/:id', optionalAuth, getVideoById);

module.exports = router;
