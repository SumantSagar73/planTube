const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    const impersonateId = req.header('x-impersonate-user');

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const originalUser = decoded.user;

        // Standard Path (No Impersonation)
        if (!impersonateId) {
            req.user = { ...originalUser, _id: originalUser.id };
            return next();
        }

        // Admin Impersonation Path
        const User = require('../models/User');
        const AdminAuditLog = require('../models/AdminAuditLog');
        User.findById(originalUser.id)
            .then(user => {
                if (user && user.role === 'admin') {
                    req.user = {
                        id: impersonateId,
                        _id: impersonateId,
                        originalAdminId: originalUser.id,
                        isAdmin: true
                    };
                    // Audit every impersonation attempt
                    AdminAuditLog.create({
                        actorAdminId: originalUser.id,
                        action: 'impersonation_request',
                        targetUserId: impersonateId,
                        targetType: 'user',
                        metadata: { path: req.path, method: req.method },
                        ip: req.ip,
                        userAgent: req.headers['user-agent'] || null
                    }).catch(e => console.error('Audit log error:', e.message));
                } else {
                    req.user = { ...originalUser, _id: originalUser.id };
                }
                next();
            })
            .catch(err => {
                console.error('Shadow Auth Error:', err.message);
                req.user = { ...originalUser, _id: originalUser.id };
                next();
            });

    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

const optionalAuth = (req, res, next) => {
    const token = req.header('x-auth-token');
    const impersonateId = req.header('x-impersonate-user');
    
    if (!token) return next();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const originalUser = decoded.user;
        
        if (!impersonateId) {
            req.user = { ...originalUser, _id: originalUser.id };
            return next();
        }

        const User = require('../models/User');
        User.findById(originalUser.id).then(user => {
            if (user && user.role === 'admin') {
                req.user = { 
                    id: impersonateId, 
                    _id: impersonateId,
                    originalAdminId: originalUser.id,
                    isAdmin: true
                };
            } else {
                req.user = { ...originalUser, _id: originalUser.id };
            }
            next();
        }).catch(() => {
            req.user = { ...originalUser, _id: originalUser.id };
            next();
        });
    } catch (err) {
        next();
    }
};

module.exports = { auth, optionalAuth };
