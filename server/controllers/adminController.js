const User = require('../models/User');
const Playlist = require('../models/Playlist');
const Group = require('../models/Group');
const Activity = require('../models/Activity');
const Video = require('../models/Video');
const SharedVideo = require('../models/SharedVideo');
const UserPlaylist = require('../models/UserPlaylist');
const Schedule = require('../models/Schedule');
const AdminAuditLog = require('../models/AdminAuditLog');

const parsePagination = (query) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

const parseSort = (query, defaults = { createdAt: -1 }) => {
    const allowed = ['createdAt', 'updatedAt', 'name', 'email', 'playlistTitle', 'title', 'lastSyncedAt'];
    const sortBy = allowed.includes(query.sortBy) ? query.sortBy : Object.keys(defaults)[0];
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    return { [sortBy]: sortOrder };
};

const getRequesterAdminId = (req) => req.user?.originalAdminId || req.user?.id || req.user?._id || null;

const buildCsv = (rows) => {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const escapeCsv = (value) => {
        if (value === null || value === undefined) return '';
        const str = String(value).replace(/"/g, '""');
        return /[",\n]/.test(str) ? `"${str}"` : str;
    };
    const lines = [headers.join(',')];
    for (const row of rows) {
        lines.push(headers.map((h) => escapeCsv(row[h])).join(','));
    }
    return `${lines.join('\n')}\n`;
};

const writeCsvResponse = (res, filename, rows) => {
    const csv = buildCsv(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.send(csv);
};

const createAuditLog = async ({ req, action, targetUserId = null, targetType = 'other', metadata = {} }) => {
    try {
        await AdminAuditLog.create({
            actorAdminId: getRequesterAdminId(req),
            action,
            targetUserId,
            targetType,
            metadata,
            ip: req.ip,
            userAgent: req.headers['user-agent'] || null
        });
    } catch (err) {
        console.error('AuditLog Error:', err.message);
    }
};

const percentDelta = (current, previous) => {
    if (!previous) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
};

const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// @desc    Get platform-wide statistics
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
    try {
        const [totalUsers, totalPlaylists, totalGroups, totalVideos] = await Promise.all([
            User.countDocuments(),
            Playlist.countDocuments(),
            Group.countDocuments(),
            SharedVideo.countDocuments()
        ]);

        const studyAgg = await Activity.aggregate([
            { $group: { _id: null, totalSeconds: { $sum: '$seconds' } } }
        ]);
        const totalStudyHours = studyAgg.length > 0 ? Math.round(studyAgg[0].totalSeconds / 3600) : 0;

        const now = new Date();
        const currentStart = new Date(now);
        currentStart.setDate(now.getDate() - 7);
        const previousStart = new Date(now);
        previousStart.setDate(now.getDate() - 14);
        const currentStartDate = getLocalDateString(currentStart);
        const currentEndDate = getLocalDateString(now);
        const previousStartDate = getLocalDateString(previousStart);
        const previousEndDate = getLocalDateString(currentStart);

        const [newUsersCurrent, newUsersPrevious, studyCurrentAgg, studyPreviousAgg] = await Promise.all([
            User.countDocuments({ createdAt: { $gte: currentStart, $lte: now } }),
            User.countDocuments({ createdAt: { $gte: previousStart, $lt: currentStart } }),
            Activity.aggregate([{ $match: { date: { $gte: currentStartDate, $lte: currentEndDate } } }, { $group: { _id: null, totalSeconds: { $sum: '$seconds' } } }]),
            Activity.aggregate([{ $match: { date: { $gte: previousStartDate, $lt: previousEndDate } } }, { $group: { _id: null, totalSeconds: { $sum: '$seconds' } } }])
        ]);

        const studyCurrent = studyCurrentAgg[0]?.totalSeconds || 0;
        const studyPrevious = studyPreviousAgg[0]?.totalSeconds || 0;

        const frozenUsers = await User.countDocuments({ isFrozen: true });
        const pendingWipes = await User.countDocuments({ wipeRequested: true });

        const trends = {
            usersDeltaPct: percentDelta(newUsersCurrent, newUsersPrevious),
            studyDeltaPct: percentDelta(studyCurrent, studyPrevious)
        };

        res.json({
            totalUsers,
            totalPlaylists,
            totalGroups,
            totalVideos,
            totalStudyHours,
            frozenUsers,
            pendingWipes,
            trends,
            lastUpdatedAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};

// @desc    Get lightweight system health metrics
// @route   GET /api/admin/health
exports.getHealth = async (req, res) => {
    try {
        const started = Date.now();
        await User.countDocuments().limit(1);
        const dbLatencyMs = Date.now() - started;

        const memoryUsedMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
        const uptimeHours = Math.round(process.uptime() / 3600);

        res.json({
            status: 'ok',
            dbState: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
            dbLatencyMs,
            uptimeHours,
            memoryUsedMb,
            lastUpdatedAt: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({
            status: 'degraded',
            msg: 'Health check failed',
            error: err.message,
            lastUpdatedAt: new Date().toISOString()
        });
    }
};

// @desc    Get all users with basic stats
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const sort = parseSort(req.query, { createdAt: -1 });

        const q = (req.query.q || '').trim();
        const role = (req.query.role || '').trim();
        const frozen = (req.query.frozen || '').trim();
        const wipeRequested = (req.query.wipeRequested || '').trim();

        const filter = {};
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { username: { $regex: q, $options: 'i' } }
            ];
        }
        if (role && ['admin', 'user'].includes(role)) filter.role = role;
        if (frozen === 'true' || frozen === 'false') filter.isFrozen = frozen === 'true';
        if (wipeRequested === 'true' || wipeRequested === 'false') filter.wipeRequested = wipeRequested === 'true';

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password')
                .sort(sort)
                .skip(skip)
                .limit(limit),
            User.countDocuments(filter)
        ]);

        const enrichedUsers = await Promise.all(users.map(async (u) => {
            const playlistCount = await UserPlaylist.countDocuments({ userId: u._id });
            const groupCount = await Group.countDocuments({ members: u._id });
            return {
                ...u.toObject(),
                playlistCount,
                groupCount
            };
        }));

        if (req.query.format === 'csv') {
            const rows = enrichedUsers.map((u) => ({
                id: u._id,
                name: u.name,
                email: u.email,
                username: u.username,
                role: u.role,
                isFrozen: u.isFrozen,
                wipeRequested: u.wipeRequested,
                playlistCount: u.playlistCount,
                groupCount: u.groupCount,
                createdAt: u.createdAt
            }));
            return writeCsvResponse(res, `admin-users-${Date.now()}.csv`, rows);
        }

        res.json({
            items: enrichedUsers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(Math.ceil(total / limit), 1)
            }
        });
    } catch (err) {
        console.error('GetUsers Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get detailed user info
// @route   GET /api/admin/users/:id
exports.getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const playlists = await UserPlaylist.find({ userId: user._id }).populate('playlistId');
        const groups = await Group.find({ members: user._id });
        const activity = await Activity.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10);

        res.json({
            user,
            playlists,
            groups,
            activity
        });
    } catch (err) {
        console.error('GetUserDetails Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get all global playlists
// @route   GET /api/admin/playlists
exports.getAllPlaylists = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const sort = parseSort(req.query, { createdAt: -1 });
        const q = (req.query.q || '').trim();

        const filter = {
            // Standalone single-video imports are stored as pseudo playlists (VIDEO_<youtubeId>).
            // Exclude them from the Playlists admin tab.
            playlistId: { $not: /^VIDEO_/ }
        };
        if (q) {
            filter.$or = [
                { playlistTitle: { $regex: q, $options: 'i' } },
                { playlistId: { $regex: q, $options: 'i' } }
            ];
        }

        const [playlists, total] = await Promise.all([
            Playlist.find(filter)
                .populate('userId', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(limit),
            Playlist.countDocuments(filter)
        ]);
        
        const enriched = await Promise.all(playlists.map(async (p) => {
            const videoCount = await Video.countDocuments({ playlistId: p._id });
            const userCount = await UserPlaylist.countDocuments({ playlistId: p._id });
            return {
                ...p.toObject(),
                videoCount,
                userCount
            };
        }));

        if (req.query.format === 'csv') {
            const rows = enriched.map((p) => ({
                id: p._id,
                playlistTitle: p.playlistTitle,
                playlistId: p.playlistId,
                creatorName: p.userId?.name || 'Public System',
                creatorEmail: p.userId?.email || '',
                videoCount: p.videoCount,
                userCount: p.userCount,
                createdAt: p.createdAt
            }));
            return writeCsvResponse(res, `admin-playlists-${Date.now()}.csv`, rows);
        }

        res.json({
            items: enriched,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(Math.ceil(total / limit), 1)
            }
        });
    } catch (err) {
        console.error('GetAllPlaylists Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get all unique videos (SharedVideo)
// @route   GET /api/admin/videos
exports.getAllVideos = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const q = (req.query.q || '').trim();
        const sort = parseSort(req.query, { lastSyncedAt: -1 });

        const queryPipeline = [
            {
                $lookup: {
                    from: 'playlists',
                    localField: 'playlistId',
                    foreignField: '_id',
                    as: 'playlist'
                }
            },
            { $unwind: '$playlist' },
            {
                // Keep only standalone single-video pseudo playlists (VIDEO_<youtubeId>).
                $match: {
                    'playlist.playlistId': { $regex: /^VIDEO_/ }
                }
            },
            {
                $lookup: {
                    from: 'sharedvideos',
                    localField: 'sharedVideoId',
                    foreignField: '_id',
                    as: 'sharedVideo'
                }
            },
            { $unwind: '$sharedVideo' }
        ];

        if (q) {
            queryPipeline.push({
                $match: {
                    $or: [
                        { 'sharedVideo.title': { $regex: q, $options: 'i' } },
                        { 'sharedVideo.youtubeId': { $regex: q, $options: 'i' } }
                    ]
                }
            });
        }

        const aggregation = await Video.aggregate([
            ...queryPipeline,
            {
                // De-duplicate in case multiple rows point at the same shared video.
                $group: {
                    _id: '$sharedVideo._id',
                    title: { $first: '$sharedVideo.title' },
                    thumbnail: { $first: '$sharedVideo.thumbnail' },
                    duration: { $first: '$sharedVideo.duration' },
                    youtubeId: { $first: '$sharedVideo.youtubeId' },
                    lastSyncedAt: { $first: '$sharedVideo.lastSyncedAt' },
                    createdAt: { $first: '$sharedVideo.createdAt' },
                    updatedAt: { $first: '$sharedVideo.updatedAt' }
                }
            },
            { $sort: sort },
            {
                $facet: {
                    items: [{ $skip: skip }, { $limit: limit }],
                    total: [{ $count: 'count' }]
                }
            }
        ]);

        const payload = aggregation[0]?.items || [];
        const total = aggregation[0]?.total?.[0]?.count || 0;

        if (req.query.format === 'csv') {
            const rows = payload.map((v) => ({
                id: v._id,
                title: v.title,
                youtubeId: v.youtubeId,
                duration: v.duration,
                lastSyncedAt: v.lastSyncedAt,
                createdAt: v.createdAt
            }));
            return writeCsvResponse(res, `admin-videos-${Date.now()}.csv`, rows);
        }

        res.json({
            items: payload,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(Math.ceil(total / limit), 1)
            }
        });
    } catch (err) {
        console.error('GetAllVideos Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get admin audit logs
// @route   GET /api/admin/audit-logs
exports.getAuditLogs = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const q = (req.query.q || '').trim();

        const filter = {};
        if (q) {
            filter.$or = [
                { action: { $regex: q, $options: 'i' } },
                { 'metadata.reason': { $regex: q, $options: 'i' } }
            ];
        }

        const [logs, total] = await Promise.all([
            AdminAuditLog.find(filter)
                .populate('actorAdminId', 'name email')
                .populate('targetUserId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            AdminAuditLog.countDocuments(filter)
        ]);

        res.json({
            items: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(Math.ceil(total / limit), 1)
            }
        });
    } catch (err) {
        console.error('GetAuditLogs Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Log impersonation start
// @route   POST /api/admin/impersonation/start
exports.logImpersonationStart = async (req, res) => {
    try {
        const { targetUserId, targetUserName } = req.body || {};
        await createAuditLog({
            req,
            action: 'impersonation_start',
            targetUserId,
            targetType: 'session',
            metadata: { targetUserName }
        });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Log impersonation end
// @route   POST /api/admin/impersonation/end
exports.logImpersonationEnd = async (req, res) => {
    try {
        const { targetUserId, targetUserName } = req.body || {};
        await createAuditLog({
            req,
            action: 'impersonation_end',
            targetUserId,
            targetType: 'session',
            metadata: { targetUserName }
        });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res) => {
    const { role } = req.body;
    try {
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ msg: 'Invalid role' });
        }
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const requesterId = req.user.id || req.user._id;
        if (user._id.toString() === requesterId.toString() && role !== 'admin') {
            return res.status(400).json({ msg: 'You cannot demote your own admin account.' });
        }

        user.role = role;
        await user.save();

        await createAuditLog({
            req,
            action: 'user_role_changed',
            targetUserId: user._id,
            targetType: 'user',
            metadata: { newRole: role }
        });

        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Delete a user completely
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const isWipeApproval = req.path.includes('approve-wipe');
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const requesterId = req.user.id || req.user._id;
        if (user._id.toString() === requesterId.toString()) {
            return res.status(400).json({ msg: 'You cannot delete your own admin account.' });
        }

        // Drop related collections
        await Schedule.deleteMany({ userId: user._id });
        await Activity.deleteMany({ userId: user._id });

        const playlists = await Playlist.find({ userId: user._id });
        for (const pl of playlists) {
            await Video.deleteMany({ playlistId: pl._id });
        }
        await Playlist.deleteMany({ userId: user._id });

        await User.findByIdAndDelete(user._id);

        await createAuditLog({
            req,
            action: isWipeApproval ? 'user_wipe_approved' : 'user_deleted',
            targetUserId: user._id,
            targetType: 'user',
            metadata: {
                deletedUserEmail: user.email,
                deletedUserName: user.name
            }
        });

        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error('DeleteUser Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Toggle freeze status of a user
// @route   PUT /api/admin/users/:id/freeze
exports.toggleFreeze = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const requesterId = req.user.id || req.user._id;
        if (user._id.toString() === requesterId.toString()) {
            return res.status(400).json({ msg: 'You cannot freeze your own admin account.' });
        }

        user.isFrozen = !user.isFrozen;
        await user.save();

        await createAuditLog({
            req,
            action: user.isFrozen ? 'user_frozen' : 'user_unfrozen',
            targetUserId: user._id,
            targetType: 'user',
            metadata: {
                isFrozen: user.isFrozen
            }
        });

        res.json({ msg: user.isFrozen ? 'Account frozen' : 'Account unfrozen', isFrozen: user.isFrozen });
    } catch (err) {
        console.error('ToggleFreeze Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get 7-day chart data — real study activity + new signups
// @route   GET /api/admin/chart-data
exports.getChartData = async (req, res) => {
    try {
        const days = 7;
        const now = new Date();
        const result = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = days - 1; i >= 0; i--) {
            const start = new Date(now);
            start.setDate(now.getDate() - i);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);
            const dayKey = getLocalDateString(start);

            const [activityAgg, newUsers] = await Promise.all([
                Activity.aggregate([
                    { $match: { date: dayKey } },
                    { $group: { _id: null, totalSeconds: { $sum: '$seconds' }, uniqueUsers: { $addToSet: '$userId' } } }
                ]),
                User.countDocuments({ createdAt: { $gte: start, $lte: end } })
            ]);

            const studyMins = activityAgg.length > 0 ? Math.round(activityAgg[0].totalSeconds / 60) : 0;
            const activeUsers = activityAgg.length > 0 ? activityAgg[0].uniqueUsers.length : 0;

            result.push({
                name: dayNames[start.getDay()],
                studyMins,
                activeUsers,
                newUsers
            });
        }

        // Top playlist categories based on title keywords
        const playlists = await Playlist.find().select('playlistTitle');
        const categories = { 'Development': 0, 'Math': 0, 'Design': 0, 'Science': 0, 'Business': 0, 'Language': 0, 'Other': 0 };
        const keywords = {
            'Development': ['javascript', 'python', 'react', 'node', 'coding', 'programming', 'dev', 'web', 'api', 'code', 'html', 'css', 'java', 'flutter', 'angular', 'vue', 'backend', 'frontend'],
            'Math': ['math', 'calculus', 'algebra', 'statistics', 'linear', 'discrete', 'geometry'],
            'Design': ['design', 'ui', 'ux', 'figma', 'sketch', 'photoshop', 'illustrator', 'canva', 'graphic'],
            'Science': ['physics', 'chemistry', 'biology', 'science', 'machine learning', 'ai', 'data', 'ml', 'deep learning'],
            'Business': ['business', 'marketing', 'finance', 'startup', 'entrepreneur', 'management', 'economics'],
            'Language': ['english', 'spanish', 'hindi', 'french', 'german', 'japanese', 'chinese', 'language', 'grammar'],
        };

        playlists.forEach(p => {
            const title = (p.playlistTitle || '').toLowerCase();
            let matched = false;
            for (const [cat, words] of Object.entries(keywords)) {
                if (words.some(w => title.includes(w))) {
                    categories[cat]++;
                    matched = true;
                    break;
                }
            }
            if (!matched) categories['Other']++;
        });

        const topTopics = Object.entries(categories)
            .map(([name, value]) => ({ name, value }))
            .filter(t => t.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        res.json({ weeklyActivity: result, topTopics });
    } catch (err) {
        console.error('ChartData Error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};

// @desc    Approve wipe request
// @route   POST /api/admin/users/:id/approve-wipe
exports.approveWipe = exports.deleteUser; // Reuses delete flow and writes specific audit action.
