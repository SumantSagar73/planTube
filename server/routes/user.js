const express = require('express');
const router = express.Router();
const { getPreferences, updatePreferences, updateProfile, changePassword, deleteAccount } = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.get('/preferences', auth, getPreferences);
router.put('/preferences', auth, updatePreferences);
router.put('/profile', auth, updateProfile);
router.put('/password', auth, changePassword);
router.delete('/account', auth, deleteAccount);

module.exports = router;

