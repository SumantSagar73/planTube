const mongoose = require('mongoose');

const abTestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    key: { type: String, required: true, unique: true },
    status: { type: String, enum: ['draft', 'running', 'paused', 'completed'], default: 'draft' },
    variants: [{
        name: String,
        description: String,
        trafficPct: { type: Number, default: 50 },
        isControl: { type: Boolean, default: false },
    }],
    targetAudience: { type: String, enum: ['all', 'new_users', 'active_users'], default: 'all' },
    startDate: Date,
    endDate: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metrics: {
        impressions: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
    }
}, { timestamps: true });

module.exports = mongoose.model('ABTest', abTestSchema);
