const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const Video = require('../server/models/Video');
const UserPlaylist = require('../server/models/UserPlaylist');
const Playlist = require('../server/models/Playlist');

async function verify() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // 1. Find a standalone video playlist
        const standalonePlaylist = await Playlist.findOne({ playlistId: /^VIDEO_/ });
        if (!standalonePlaylist) {
            console.error('No standalone video playlist found to test with.');
            process.exit(1);
        }
        console.log(`Found standalone playlist: ${standalonePlaylist.playlistId} (${standalonePlaylist._id})`);

        // 2. Find a user associated with it
        const userPlaylist = await UserPlaylist.findOne({ playlistId: standalonePlaylist._id });
        if (!userPlaylist) {
            console.error('No UserPlaylist found for this standalone playlist.');
            process.exit(1);
        }
        console.log(`Found UserPlaylist for user: ${userPlaylist.userId}`);

        // 3. Find the Video record
        const video = await Video.findOne({ playlistId: standalonePlaylist._id });
        if (!video) {
            console.error('No Video record found for this standalone playlist.');
            process.exit(1);
        }
        console.log(`Found Video record: ${video._id}`);

        const initialPinStatus = userPlaylist.isPinned;
        console.log(`Initial UserPlaylist isPinned: ${initialPinStatus}`);
        console.log(`Initial Video isPinned: ${video.isPinned}`);

        // --- SIMULATE CONTROLLER LOGIC ---
        console.log('\n--- Simulating togglePin logic ---');
        
        // Toggle UserPlaylist isPinned
        const updatedUP = await UserPlaylist.findOneAndUpdate(
            { _id: userPlaylist._id },
            { $set: { isPinned: !initialPinStatus } },
            { new: true }
        );

        // Toggle Video isPinned (secondary sync)
        const updatedVideo = await Video.findOneAndUpdate(
            { _id: video._id },
            { $set: { isPinned: updatedUP.isPinned } },
            { new: true }
        );
        // --- END SIMULATION ---

        console.log(`New UserPlaylist isPinned: ${updatedUP.isPinned}`);
        console.log(`New Video isPinned: ${updatedVideo.isPinned}`);

        if (updatedUP.isPinned !== initialPinStatus && updatedUP.isPinned === updatedVideo.isPinned) {
            console.log('\n✅ VERIFICATION SUCCESSFUL: Both records are in sync and toggled.');
        } else {
            console.error('\n❌ VERIFICATION FAILED: Synchronization or toggle failed.');
        }

        // Revert changes
        await UserPlaylist.updateOne({ _id: userPlaylist._id }, { $set: { isPinned: initialPinStatus } });
        await Video.updateOne({ _id: video._id }, { $set: { isPinned: video.isPinned } });
        console.log('Changes reverted.');

    } catch (err) {
        console.error('Error during verification:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

verify();
