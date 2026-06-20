const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Group = require('../models/Group');

/**
 * Returns an array of YYYY-MM-DD strings for the current ISO week (Mon–Sun).
 */
const getCurrentWeekDates = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
    }
    return dates;
};

/**
 * GET /api/leaderboard/global
 * Auth optional — public list shows only public profiles.
 * If authenticated, the requesting user's overall rank is included in myRank regardless of privacy.
 */
exports.getGlobalLeaderboard = async (req, res) => {
    try {
        const weekDates = getCurrentWeekDates();

        const aggregation = await Activity.aggregate([
            { $match: { date: { $in: weekDates } } },
            { $group: { _id: '$userId', weeklySeconds: { $sum: '$seconds' } } },
            { $sort: { weeklySeconds: -1 } }
        ]);

        if (aggregation.length === 0) {
            return res.json({ leaderboard: [], myRank: null });
        }

        const userIds = aggregation.map(a => a._id);
        const users = await User.find({ _id: { $in: userIds } })
            .select('name username themeColor level xp bestStreak isPublic')
            .lean();

        const userMap = {};
        users.forEach(u => { userMap[String(u._id)] = u; });

        // Full ranked list (all users, for computing myRank overall position)
        const allRanked = aggregation.map((entry, idx) => {
            const user = userMap[String(entry._id)];
            if (!user) return null;
            return {
                overallRank: idx + 1,
                userId: entry._id,
                name: user.name,
                username: user.username,
                themeColor: user.themeColor,
                level: user.level,
                xp: user.xp,
                bestStreak: user.bestStreak,
                weeklySeconds: entry.weeklySeconds,
                isPublic: user.isPublic
            };
        }).filter(Boolean);

        // Public list re-ranked 1, 2, 3...
        const publicRanked = allRanked
            .filter(r => r.isPublic)
            .map((r, idx) => ({ ...r, rank: idx + 1 }));

        const top50 = publicRanked.slice(0, 50);

        let myRank = null;
        if (req.user) {
            const myEntry = allRanked.find(r => String(r.userId) === String(req.user.id));
            if (myEntry) {
                myRank = {
                    rank: myEntry.overallRank,
                    weeklySeconds: myEntry.weeklySeconds,
                    isPublic: myEntry.isPublic
                };
                // If the user is public and outside top 50, append their entry
                if (myEntry.isPublic) {
                    const myPublicEntry = publicRanked.find(r => String(r.userId) === String(req.user.id));
                    if (myPublicEntry && myPublicEntry.rank > 50) {
                        top50.push(myPublicEntry);
                    }
                }
            }
        }

        res.json({ leaderboard: top50, myRank });
    } catch (err) {
        console.error('getGlobalLeaderboard Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * GET /api/leaderboard/my-rank
 * Auth required. Returns the requesting user's overall rank this week (ignores isPublic).
 */
exports.getMyRank = async (req, res) => {
    try {
        const weekDates = getCurrentWeekDates();

        const aggregation = await Activity.aggregate([
            { $match: { date: { $in: weekDates } } },
            { $group: { _id: '$userId', weeklySeconds: { $sum: '$seconds' } } },
            { $sort: { weeklySeconds: -1 } }
        ]);

        const idx = aggregation.findIndex(a => String(a._id) === String(req.user.id));
        if (idx === -1) return res.json({ rank: null, weeklySeconds: 0 });

        const user = await User.findById(req.user.id).select('isPublic').lean();
        res.json({
            rank: idx + 1,
            weeklySeconds: aggregation[idx].weeklySeconds,
            isPublic: user?.isPublic ?? false
        });
    } catch (err) {
        console.error('getMyRank Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * GET /api/leaderboard/group/:groupId
 * Auth required.
 */
exports.getGroupLeaderboard = async (req, res) => {
    try {
        const { groupId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ msg: 'Invalid group ID' });
        }

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        // Verify requesting user is a member or owner
        const requestingId = String(req.user.id);
        const isMember =
            String(group.ownerId) === requestingId ||
            group.members.some(m => String(m) === requestingId);

        if (!isMember) {
            return res.status(403).json({ msg: 'Not a member of this group' });
        }

        // All member ids including owner
        const memberIds = [group.ownerId, ...group.members].map(id =>
            mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null
        ).filter(Boolean);

        const weekDates = getCurrentWeekDates();

        const aggregation = await Activity.aggregate([
            {
                $match: {
                    date: { $in: weekDates },
                    userId: { $in: memberIds }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    weeklySeconds: { $sum: '$seconds' }
                }
            },
            { $sort: { weeklySeconds: -1 } }
        ]);

        // Include members with 0 seconds as well
        const activeMemberIds = aggregation.map(a => String(a._id));
        const inactiveIds = memberIds.filter(id => !activeMemberIds.includes(String(id)));

        const allEntries = [
            ...aggregation,
            ...inactiveIds.map(id => ({ _id: id, weeklySeconds: 0 }))
        ];

        const userIds = allEntries.map(a => a._id);
        const users = await User.find({ _id: { $in: userIds } })
            .select('name username themeColor level xp bestStreak')
            .lean();

        const userMap = {};
        users.forEach(u => { userMap[String(u._id)] = u; });

        const ranked = allEntries.map((entry, idx) => {
            const user = userMap[String(entry._id)];
            if (!user) return null;
            return {
                rank: idx + 1,
                userId: entry._id,
                name: user.name,
                username: user.username,
                themeColor: user.themeColor,
                level: user.level,
                xp: user.xp,
                bestStreak: user.bestStreak,
                weeklySeconds: entry.weeklySeconds
            };
        }).filter(Boolean);

        res.json({ leaderboard: ranked, groupName: group.groupName });
    } catch (err) {
        console.error('getGroupLeaderboard Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};
