const User = require('../models/User');

const admin = async (req, res, next) => {
    try {
        // req.user is set by auth middleware
        // If we are in Shadow Mode (impersonating), req.user.originalAdminId will be present
        if (req.user && (req.user.isAdmin || req.user.originalAdminId)) {
            return next();
        }

        // Fallback to database check for non-shadowed requests
        const user = await User.findById(req.user.id);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admins only.' });
        }

        next();
    } catch (err) {
        console.error('Admin Middleware Error:', err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = admin;
