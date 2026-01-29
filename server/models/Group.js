const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    groupName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    joinCode: {
        type: String,
        unique: true,
        sparse: true // Only populated for groups that want to be joinable via code
    }
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
