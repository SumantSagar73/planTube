const express = require('express');
const router = express.Router();
const { getPreferences, updatePreferences, updateProfile } = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.get('/preferences', auth, getPreferences);
router.put('/preferences', auth, updatePreferences);
router.put('/profile', auth, updateProfile);

module.exports = router;
