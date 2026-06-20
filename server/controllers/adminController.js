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

// @desc    Chart data with configurable range
// @route   GET /api/admin/chart-data?range=7d|14d|30d|3m|6m|1y|custom&from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getChartData = async (req, res) => {
    try {
        const { range = '7d', from, to } = req.query;
        const now = new Date();
        const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        // Resolve date range + grouping strategy
        let startDate, endDate, groupBy, totalDays;
        if (range === 'custom' && from && to) {
            startDate = new Date(from); startDate.setHours(0, 0, 0, 0);
            endDate   = new Date(to);   endDate.setHours(23, 59, 59, 999);
            totalDays = Math.ceil((endDate - startDate) / 86400000) + 1;
            groupBy   = totalDays <= 31 ? 'day' : totalDays <= 90 ? 'week' : 'month';
        } else {
            const cfg = { '7d':[7,'day'], '14d':[14,'day'], '30d':[30,'day'], '3m':[90,'week'], '6m':[180,'week'], '1y':[365,'month'] };
            [totalDays, groupBy] = cfg[range] || cfg['7d'];
            endDate   = new Date(now); endDate.setHours(23, 59, 59, 999);
            startDate = new Date(now); startDate.setDate(now.getDate() - totalDays + 1); startDate.setHours(0, 0, 0, 0);
        }

        const startStr = getLocalDateString(startDate);
        const endStr   = getLocalDateString(endDate);

        // Build MongoDB group key for Activity (date is a string YYYY-MM-DD)
        let actGroupId;
        if (groupBy === 'day') {
            actGroupId = '$date';
        } else if (groupBy === 'week') {
            actGroupId = {
                year: { $isoWeekYear: { $dateFromString: { dateString: '$date' } } },
                week: { $isoWeek:     { $dateFromString: { dateString: '$date' } } }
            };
        } else {
            actGroupId = { $substr: ['$date', 0, 7] }; // YYYY-MM
        }

        // Build MongoDB group key for User.createdAt (proper Date)
        let userGroupId;
        if (groupBy === 'day') {
            userGroupId = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        } else if (groupBy === 'week') {
            userGroupId = { year: { $isoWeekYear: '$createdAt' }, week: { $isoWeek: '$createdAt' } };
        } else {
            userGroupId = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        }

        const [activityAgg, signupAgg] = await Promise.all([
            Activity.aggregate([
                { $match: { date: { $gte: startStr, $lte: endStr } } },
                { $group: { _id: actGroupId, totalSeconds: { $sum: '$seconds' }, uniqueUsers: { $addToSet: '$userId' } } },
                { $sort: { _id: 1 } }
            ]),
            User.aggregate([
                { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: userGroupId, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ])
        ]);

        // Build signup lookup map
        const signupMap = {};
        signupAgg.forEach(s => {
            const key = typeof s._id === 'string' ? s._id : `${s._id.year}-W${String(s._id.week).padStart(2,'0')}`;
            signupMap[key] = s.count;
        });

        // Format result with human-readable labels
        const result = activityAgg.map(a => {
            let name, key;
            if (groupBy === 'day') {
                const d = new Date(a._id + 'T00:00:00');
                name = totalDays <= 14 ? DAY_NAMES[d.getDay()] : `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
                key  = a._id;
            } else if (groupBy === 'week') {
                name = `W${a._id.week}`;
                key  = `${a._id.year}-W${String(a._id.week).padStart(2,'0')}`;
            } else {
                const [yr, mo] = a._id.split('-');
                name = `${MONTH_NAMES[parseInt(mo, 10) - 1]} '${yr.slice(2)}`;
                key  = a._id;
            }
            return {
                name,
                studyMins:   Math.round(a.totalSeconds / 60),
                activeUsers: a.uniqueUsers.length,
                newUsers:    signupMap[key] || 0
            };
        });

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

// ─── Tier 1-4 Admin Features ──────────────────────────────────────────────────

const Report = require('../models/Report');
const ABTest = require('../models/ABTest');
const SystemSettings = require('../models/SystemSettings');

// @desc    Bulk action on multiple users
// @route   POST /api/admin/users/bulk
exports.bulkUserAction = async (req, res) => {
    const { userIds, action } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) return res.status(400).json({ msg: 'No users selected' });
    const allowed = ['freeze', 'unfreeze', 'delete', 'set_moderator', 'set_support', 'set_user'];
    if (!allowed.includes(action)) return res.status(400).json({ msg: 'Invalid action' });

    const requesterId = String(req.user.id || req.user._id);
    const safeIds = userIds.filter(id => String(id) !== requesterId);

    try {
        let affected = 0;
        if (action === 'freeze') {
            const r = await User.updateMany({ _id: { $in: safeIds } }, { isFrozen: true });
            affected = r.modifiedCount;
        } else if (action === 'unfreeze') {
            const r = await User.updateMany({ _id: { $in: safeIds } }, { isFrozen: false });
            affected = r.modifiedCount;
        } else if (action === 'set_moderator') {
            const r = await User.updateMany({ _id: { $in: safeIds } }, { role: 'moderator' });
            affected = r.modifiedCount;
        } else if (action === 'set_support') {
            const r = await User.updateMany({ _id: { $in: safeIds } }, { role: 'support' });
            affected = r.modifiedCount;
        } else if (action === 'set_user') {
            const r = await User.updateMany({ _id: { $in: safeIds } }, { role: 'user' });
            affected = r.modifiedCount;
        } else if (action === 'delete') {
            for (const id of safeIds) {
                await Schedule.deleteMany({ userId: id });
                await Activity.deleteMany({ userId: id });
                const pls = await Playlist.find({ userId: id });
                for (const pl of pls) await Video.deleteMany({ playlistId: pl._id });
                await Playlist.deleteMany({ userId: id });
                await User.findByIdAndDelete(id);
                affected++;
            }
        }
        await createAuditLog({ req, action: `bulk_${action}`, targetType: 'user', metadata: { count: safeIds.length, affected } });
        res.json({ msg: `${action} applied to ${affected} users`, affected });
    } catch (err) {
        console.error('BulkAction Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Content analytics
// @route   GET /api/admin/content-analytics
exports.getContentAnalytics = async (req, res) => {
    try {
        const [topPlaylists, completionAgg, recentImports, totalUserPlaylists] = await Promise.all([
            UserPlaylist.aggregate([
                { $group: { _id: '$playlistId', userCount: { $sum: 1 }, avgProgress: { $avg: '$completionPct' } } },
                { $sort: { userCount: -1 } },
                { $limit: 10 },
                { $lookup: { from: 'playlists', localField: '_id', foreignField: '_id', as: 'playlist' } },
                { $unwind: { path: '$playlist', preserveNullAndEmptyArrays: true } },
                { $project: { userCount: 1, avgProgress: { $round: ['$avgProgress', 1] }, title: '$playlist.playlistTitle', thumbnail: '$playlist.thumbnail' } }
            ]),
            UserPlaylist.aggregate([{ $group: { _id: null, avg: { $avg: '$completionPct' } } }]),
            Playlist.aggregate([
                { $match: { createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            UserPlaylist.countDocuments()
        ]);
        res.json({
            topPlaylists,
            avgCompletionRate: Math.round(completionAgg[0]?.avg || 0),
            recentImports,
            totalUserPlaylists
        });
    } catch (err) {
        console.error('ContentAnalytics Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Security monitor
// @route   GET /api/admin/security
exports.getSecurityLog = async (req, res) => {
    try {
        const securityActions = ['user_frozen', 'user_unfrozen', 'user_deleted', 'user_wipe_approved',
            'impersonation_start', 'user_role_changed', 'bulk_delete', 'bulk_freeze',
            'bulk_set_moderator', 'cache_flushed', 'maintenance_scheduled', 'ab_test_created'];
        const [events, frozenCount, wipeCount, recentAdmins] = await Promise.all([
            AdminAuditLog.find({ action: { $in: securityActions } })
                .populate('actorAdminId', 'name email')
                .populate('targetUserId', 'name email')
                .sort({ createdAt: -1 }).limit(100),
            User.countDocuments({ isFrozen: true }),
            User.countDocuments({ wipeRequested: true }),
            AdminAuditLog.distinct('actorAdminId', { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
        ]);
        res.json({ events, stats: { frozenUsers: frozenCount, pendingWipes: wipeCount, activeAdmins: recentAdmins.length } });
    } catch (err) {
        console.error('SecurityLog Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Flush server-side cache
// @route   POST /api/admin/cache/flush
exports.flushCache = async (req, res) => {
    try {
        if (global.__adminCache) global.__adminCache = {};
        await createAuditLog({ req, action: 'cache_flushed', targetType: 'system', metadata: {} });
        res.json({ msg: 'Cache flushed', flushedAt: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get scheduled maintenance window
// @route   GET /api/admin/scheduled-maintenance
exports.getScheduledMaintenance = async (req, res) => {
    try {
        const setting = await SystemSettings.findOne({ key: 'scheduled_maintenance' });
        res.json(setting?.value || null);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Set scheduled maintenance window
// @route   POST /api/admin/scheduled-maintenance
exports.setScheduledMaintenance = async (req, res) => {
    try {
        const { scheduledAt, durationMinutes, message } = req.body;
        const value = scheduledAt ? { scheduledAt, durationMinutes: durationMinutes || 60, message: message || 'Scheduled maintenance' } : null;
        await SystemSettings.findOneAndUpdate(
            { key: 'scheduled_maintenance' },
            { key: 'scheduled_maintenance', value, category: 'maintenance', description: 'Upcoming maintenance window' },
            { upsert: true, new: true }
        );
        await createAuditLog({ req, action: 'maintenance_scheduled', targetType: 'system', metadata: { scheduledAt, durationMinutes } });
        res.json({ msg: scheduledAt ? 'Maintenance scheduled' : 'Maintenance cancelled', value });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Cohort retention analysis
// @route   GET /api/admin/cohort-retention
exports.getCohortRetention = async (req, res) => {
    try {
        const months = 6;
        const now = new Date();
        const cohorts = [];

        for (let i = months - 1; i >= 0; i--) {
            const cohortStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const cohortEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            const cohortUsers = await User.find({ createdAt: { $gte: cohortStart, $lte: cohortEnd } }).select('_id');
            const ids = cohortUsers.map(u => u._id);
            const size = ids.length;

            const retention = [];
            for (let j = 0; j <= i; j++) {
                const m = new Date(now.getFullYear(), now.getMonth() - i + j, 1);
                const prefix = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
                const active = size > 0
                    ? await Activity.distinct('userId', { userId: { $in: ids }, date: { $regex: `^${prefix}` } })
                    : [];
                retention.push({ month: j, pct: size > 0 ? Math.round((active.length / size) * 100) : 0 });
            }

            cohorts.push({
                month: cohortStart.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
                size,
                retention
            });
        }
        res.json({ cohorts });
    } catch (err) {
        console.error('CohortRetention Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get reported content
// @route   GET /api/admin/reports
exports.getReports = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const filter = req.query.status ? { status: req.query.status } : {};
        const [items, total] = await Promise.all([
            Report.find(filter).populate('reportedBy', 'name email').populate('resolvedBy', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
            Report.countDocuments(filter)
        ]);
        res.json({ items, pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) } });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Resolve a report
// @route   PUT /api/admin/reports/:id
exports.resolveReport = async (req, res) => {
    try {
        const { status, resolution } = req.body;
        const report = await Report.findByIdAndUpdate(req.params.id, { status, resolution, resolvedBy: req.user.id, resolvedAt: new Date() }, { new: true });
        if (!report) return res.status(404).json({ msg: 'Report not found' });
        res.json(report);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    List A/B tests
// @route   GET /api/admin/ab-tests
exports.getABTests = async (req, res) => {
    try {
        const tests = await ABTest.find().populate('createdBy', 'name').sort({ createdAt: -1 });
        res.json(tests);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Create A/B test
// @route   POST /api/admin/ab-tests
exports.createABTest = async (req, res) => {
    try {
        const test = await ABTest.create({ ...req.body, createdBy: req.user.id });
        await createAuditLog({ req, action: 'ab_test_created', targetType: 'system', metadata: { key: test.key } });
        res.status(201).json(test);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ msg: 'Test key already exists' });
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Update A/B test
// @route   PUT /api/admin/ab-tests/:id
exports.updateABTest = async (req, res) => {
    try {
        const test = await ABTest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!test) return res.status(404).json({ msg: 'Test not found' });
        await createAuditLog({ req, action: 'ab_test_updated', targetType: 'system', metadata: { key: test.key, status: test.status } });
        res.json(test);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Delete A/B test
// @route   DELETE /api/admin/ab-tests/:id
exports.deleteABTest = async (req, res) => {
    try {
        await ABTest.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Deleted' });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Referral tracker
// @route   GET /api/admin/referrals
exports.getReferrals = async (req, res) => {
    try {
        const referrers = await User.aggregate([
            { $match: { referralCode: { $exists: true, $ne: null } } },
            { $lookup: { from: 'users', localField: 'referralCode', foreignField: 'referredBy', as: 'referred' } },
            { $project: { name: 1, email: 1, referralCode: 1, referredCount: { $size: '$referred' }, createdAt: 1 } },
            { $sort: { referredCount: -1 } },
            { $limit: 100 }
        ]);
        const totalReferred = await User.countDocuments({ referredBy: { $exists: true, $ne: null } });
        res.json({ referrers, totalReferred });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Import queue monitor
// @route   GET /api/admin/import-queue
exports.getImportQueue = async (req, res) => {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [recent, staleCount, totalCount] = await Promise.all([
            Playlist.find({ lastSyncedAt: { $exists: true } })
                .sort({ lastSyncedAt: -1 })
                .limit(50)
                .select('playlistTitle playlistId lastSyncedAt syncError thumbnail')
                .populate('userId', 'name'),
            Playlist.countDocuments({ lastSyncedAt: { $lt: sevenDaysAgo } }),
            Playlist.countDocuments({ lastSyncedAt: { $exists: true } })
        ]);
        res.json({ recent, stats: { staleCount, totalSynced: totalCount } });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Bulk export any dataset as CSV
// @route   GET /api/admin/export
exports.bulkExport = async (req, res) => {
    try {
        const { type, dateFrom, dateTo } = req.query;
        const dateFilter = {};
        if (dateFrom) dateFilter.$gte = new Date(dateFrom);
        if (dateTo) dateFilter.$lte = new Date(dateTo);
        const hasDate = Object.keys(dateFilter).length > 0;
        let rows = [], filename = `export-${Date.now()}.csv`;

        if (type === 'users') {
            const users = await User.find(hasDate ? { createdAt: dateFilter } : {}).select('-password').limit(10000);
            rows = users.map(u => ({ id: u._id, name: u.name, email: u.email, username: u.username, role: u.role, isFrozen: u.isFrozen, streak: u.currentStreak, focusMinutes: u.totalFocusMinutes, xp: u.xp, createdAt: u.createdAt }));
            filename = `users-${Date.now()}.csv`;
        } else if (type === 'playlists') {
            const pls = await Playlist.find(hasDate ? { createdAt: dateFilter } : {}).populate('userId', 'name email').limit(10000);
            rows = pls.map(p => ({ id: p._id, title: p.playlistTitle, youtubeId: p.playlistId, creator: p.userId?.name || '', email: p.userId?.email || '', createdAt: p.createdAt }));
            filename = `playlists-${Date.now()}.csv`;
        } else if (type === 'activity') {
            const acts = await Activity.find(hasDate ? { createdAt: dateFilter } : {}).populate('userId', 'name email').limit(10000);
            rows = acts.map(a => ({ userId: a.userId?._id, user: a.userId?.name || '', email: a.userId?.email || '', date: a.date, seconds: a.seconds }));
            filename = `activity-${Date.now()}.csv`;
        } else if (type === 'audit') {
            const logs = await AdminAuditLog.find(hasDate ? { createdAt: dateFilter } : {}).populate('actorAdminId', 'name').populate('targetUserId', 'name').limit(10000);
            rows = logs.map(l => ({ action: l.action, actor: l.actorAdminId?.name || '', target: l.targetUserId?.name || '', ip: l.ip, createdAt: l.createdAt }));
            filename = `audit-${Date.now()}.csv`;
        } else {
            return res.status(400).json({ msg: 'Invalid type. Use: users, playlists, activity, audit' });
        }
        return writeCsvResponse(res, filename, rows);
    } catch (err) {
        console.error('BulkExport Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get AI model registry + current active model
// @route   GET /api/admin/ai-models
exports.getAIModels = async (req, res) => {
    try {
        const { MODEL_REGISTRY, DEFAULT_MODEL } = require('../utils/aiService');
        const setting = await SystemSettings.findOne({ key: 'ai_model' });
        res.json({
            models: MODEL_REGISTRY,
            activeModel: setting?.value || DEFAULT_MODEL
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Set the active AI model for all users
// @route   PUT /api/admin/ai-model
exports.setAIModel = async (req, res) => {
    try {
        const { modelId } = req.body;
        const { MODEL_REGISTRY } = require('../utils/aiService');
        if (!MODEL_REGISTRY.some(m => m.id === modelId)) {
            return res.status(400).json({ msg: 'Invalid model ID' });
        }
        await SystemSettings.findOneAndUpdate(
            { key: 'ai_model' },
            { key: 'ai_model', value: modelId, category: 'ai', description: 'Active AI model for brainstorm and flashcards' },
            { upsert: true }
        );
        res.json({ activeModel: modelId });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};
