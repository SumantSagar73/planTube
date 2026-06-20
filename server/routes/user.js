const express = require('express');
const router = express.Router();
const {
    getPreferences, updatePreferences, updateProfile, changePassword,
    requestWipe, exportMyData, updateWeeklyGoal, getWeeklyProgress
} = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.get('/preferences', auth, getPreferences);
router.put('/preferences', auth, updatePreferences);
router.put('/profile', auth, updateProfile);
router.put('/password', auth, changePassword);
router.post('/wipe-request', auth, requestWipe);
router.get('/export', auth, exportMyData);

// Weekly Goal
router.put('/weekly-goal', auth, updateWeeklyGoal);
router.get('/weekly-progress', auth, getWeeklyProgress);

module.exports = router;

