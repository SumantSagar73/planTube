const Feedback = require('../models/Feedback');

const getAdminId = (req) => req.user?.originalAdminId || req.user?.id || req.user?._id || null;

const categoryWeights = {
    bug: 28,
    performance: 22,
    feature: 16,
    ux: 12,
    other: 6
};

const impactWeights = {
    blocking: 35,
    annoying: 18,
    nice_to_have: 4
};

const statusWeights = {
    new: 18,
    in_review: 10,
    planned: 4,
    resolved: -30,
    rejected: -30
};

const getPriorityDetails = (feedback) => {
    const createdAt = feedback.createdAt ? new Date(feedback.createdAt) : new Date();
    const ageDays = Math.max(0, (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const score = Math.round(
        (categoryWeights[feedback.category] || 0) +
        (impactWeights[feedback.impact] || 0) +
        (statusWeights[feedback.status] || 0) +
        Math.min(ageDays * 2, 20)
    );

    const label = score >= 70 ? 'Critical' : score >= 45 ? 'High' : score >= 25 ? 'Medium' : 'Low';

    return { priorityScore: score, priorityLabel: label };
};

const buildQueryPagination = (query) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

exports.submitFeedback = async (req, res) => {
    try {
        const {
            category = 'other',
            impact = 'annoying',
            subject = '',
            message = '',
            pagePath = '',
            contactAllowed = true,
            contactEmail = '',
            metadata = {}
        } = req.body || {};

        if (!subject.trim() || !message.trim()) {
            return res.status(400).json({ msg: 'Subject and message are required' });
        }

        const doc = await Feedback.create({
            userId: req.user.id,
            category,
            impact,
            subject: subject.trim(),
            message: message.trim(),
            pagePath: String(pagePath || ''),
            contactAllowed: Boolean(contactAllowed),
            contactEmail: String(contactEmail || ''),
            metadata: metadata && typeof metadata === 'object' ? metadata : {}
        });

        res.status(201).json({
            msg: 'Feedback submitted',
            item: doc
        });
    } catch (err) {
        console.error('SubmitFeedback Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getMyFeedback = async (req, res) => {
    try {
        const { page, limit, skip } = buildQueryPagination(req.query);

        const filter = { userId: req.user.id };
        if (req.query.status) filter.status = req.query.status;

        const [items, total] = await Promise.all([
            Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Feedback.countDocuments(filter)
        ]);

        res.json({
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(Math.ceil(total / limit), 1)
            }
        });
    } catch (err) {
        console.error('GetMyFeedback Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getAdminFeedback = async (req, res) => {
    try {
        const { page, limit, skip } = buildQueryPagination(req.query);
        const { status = '', category = '', q = '' } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (q) {
            filter.$or = [
                { subject: { $regex: q, $options: 'i' } },
                { message: { $regex: q, $options: 'i' } },
                { pagePath: { $regex: q, $options: 'i' } }
            ];
        }

        const [items, counts] = await Promise.all([
            Feedback.find(filter)
                .populate('userId', 'name username email')
                .populate('resolvedBy', 'name email')
                .lean(),
            Feedback.aggregate([
                { $match: filter },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ])
        ]);

        const enrichedItems = items.map((item) => ({
            ...item,
            ...getPriorityDetails(item)
        }));

        const sortedItems = enrichedItems.sort((a, b) => {
            if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        const total = sortedItems.length;
        const pagedItems = sortedItems.slice(skip, skip + limit);

        const statusCounts = counts.reduce((acc, cur) => {
            acc[cur._id] = cur.count;
            return acc;
        }, {});

        const priorityCounts = sortedItems.reduce((acc, item) => {
            const bucket = item.priorityLabel.toLowerCase();
            acc[bucket] = (acc[bucket] || 0) + 1;
            return acc;
        }, {});

        res.json({
            items: pagedItems,
            statusCounts,
            priorityCounts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(Math.ceil(total / limit), 1)
            }
        });
    } catch (err) {
        console.error('GetAdminFeedback Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.updateAdminFeedback = async (req, res) => {
    try {
        const { status, adminNotes } = req.body || {};
        const set = {};

        if (typeof status === 'string' && status) {
            set.status = status;
            if (status === 'resolved') {
                set.resolvedAt = new Date();
                set.resolvedBy = getAdminId(req);
            }
        }

        if (typeof adminNotes === 'string') {
            set.adminNotes = adminNotes;
        }

        if (Object.keys(set).length === 0) {
            return res.status(400).json({ msg: 'No valid updates provided' });
        }

        const item = await Feedback.findByIdAndUpdate(
            req.params.id,
            { $set: set },
            { new: true }
        )
            .populate('userId', 'name username email')
            .populate('resolvedBy', 'name email')
            .lean();

        if (!item) return res.status(404).json({ msg: 'Feedback not found' });

        res.json({ msg: 'Feedback updated', item: { ...item, ...getPriorityDetails(item) } });
    } catch (err) {
        console.error('UpdateAdminFeedback Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.deleteAdminFeedback = async (req, res) => {
    try {
        const item = await Feedback.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ msg: 'Feedback not found' });
        res.json({ msg: 'Feedback deleted permanently' });
    } catch (err) {
        console.error('DeleteAdminFeedback Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};
