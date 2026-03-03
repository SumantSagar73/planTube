const Activity = require('../models/Activity');
const Schedule = require('../models/Schedule');

// Memory store for simple presence (cleared on restart, fine for this scale)
// In production, use Redis
const activeUsers = new Map(); // videoId -> Set of userId

exports.heartbeat = async (req, res) => {
    try {
        const { videoId } = req.body;
        const userId = req.user.id;

        if (!activeUsers.has(videoId)) {
            activeUsers.set(videoId, new Map());
        }

        const videoMap = activeUsers.get(videoId);
        videoMap.set(userId, Date.now());

        // Cleanup old heartbeats (older than 60s)
        const now = Date.now();
        for (const [vid, uMap] of activeUsers.entries()) {
            for (const [uid, lastSeen] of uMap.entries()) {
                if (now - lastSeen > 60000) {
                    uMap.delete(uid);
                }
            }
            if (uMap.size === 0) activeUsers.delete(vid);
        }

        const count = activeUsers.get(videoId)?.size || 0;
        res.json({ count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getPresence = (req, res) => {
    const { videoId } = req.params;
    const count = activeUsers.get(videoId)?.size || 0;
    res.json({ count });
};
