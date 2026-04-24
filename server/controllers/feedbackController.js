const Feedback = require('../models/Feedback');

const getAdminId = (req) => req.user?.originalAdminId || req.user?.id || req.user?._id || null;

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

        const [items, total, counts] = await Promise.all([
            Feedback.find(filter)
                .populate('userId', 'name username email')
                .populate('resolvedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Feedback.countDocuments(filter),
            Feedback.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ])
        ]);

        const statusCounts = counts.reduce((acc, cur) => {
            acc[cur._id] = cur.count;
            return acc;
        }, {});

        res.json({
            items,
            statusCounts,
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
            .populate('resolvedBy', 'name email');

        if (!item) return res.status(404).json({ msg: 'Feedback not found' });

        res.json({ msg: 'Feedback updated', item });
    } catch (err) {
        console.error('UpdateAdminFeedback Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};
