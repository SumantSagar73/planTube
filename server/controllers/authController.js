const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { name, username, email, password } = req.body;
    try {
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ msg: 'User with this email or username already exists' });
        }

        user = new User({ name, username, email, password });
        await user.save();

        const payload = {
            user: { id: user.id }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) {
                console.error('JWT Sign Error:', err.message);
                return res.status(500).json({ msg: 'JWT Error: ' + err.message });
            }
            res.json({ 
                token, 
                user: { 
                    id: user.id, 
                    name: user.name, 
                    username: user.username, 
                    email: user.email,
                    role: user.role 
                } 
            });
        });
    } catch (err) {
        console.error('Register Error:', err);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
};

exports.login = async (req, res) => {
    const { identifier, password } = req.body; // identifier can be email or username
    try {
        let user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: { id: user.id }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) {
                console.error('JWT Sign Error:', err.message);
                return res.status(500).json({ msg: 'JWT Error: ' + err.message });
            }
            res.json({ 
                token, 
                user: { 
                    id: user.id, 
                    name: user.name, 
                    username: user.username, 
                    email: user.email,
                    role: user.role 
                } 
            });
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error('GetMe Error:', err);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
};
