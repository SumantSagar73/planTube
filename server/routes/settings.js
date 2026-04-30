const express = require('express');
const router = express.Router();
const { getFeatureFlags, getAllSettings, updateSetting } = require('../controllers/settingsController');
const { auth } = require('../middleware/auth');

// Public: Get active features
router.get('/features', getFeatureFlags);

// Admin Only: Manage all settings
// Note: Assuming your auth middleware adds user to req. Only allow if isAdmin is true.
const adminAuth = async (req, res, next) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.user.id);
        if (user && user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ msg: 'Access denied. Admin only.' });
        }
    } catch (err) {
        console.error('Admin Auth Error:', err.message);
        res.status(500).send('Server error');
    }
};

router.get('/all', auth, adminAuth, getAllSettings);
router.put('/update', auth, adminAuth, updateSetting);

module.exports = router;
