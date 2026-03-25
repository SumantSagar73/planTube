require('dotenv').config();
const mongoose = require('mongoose');
const Video = require('./models/Video');
const SharedVideo = require('./models/SharedVideo');

/**
 * Migration Script: Convert existing Video documents to use SharedVideo
 * This creates SharedVideo documents for all unique YouTube IDs and updates Video documents to reference them
 */

async function migrateToSharedVideo() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all videos with videoId (YouTube ID)
        const videos = await Video.find({ videoId: { $exists: true, $ne: null } });
        console.log(`📦 Found ${videos.length} videos to process`);

        const youtubeIdMap = new Map(); // youtubeId -> SharedVideo._id
        let created = 0;
        let updated = 0;
        let skipped = 0;

        // Step 1: Create SharedVideo documents for unique YouTube IDs
        for (const video of videos) {
            if (!video.videoId) {
                console.log(`⚠️  Video ${video._id} has no videoId, skipping`);
                skipped++;
                continue;
            }

            // Check if we already processed this YouTube ID
            if (youtubeIdMap.has(video.videoId)) {
                continue;
            }

            // Check if SharedVideo already exists
            let sharedVideo = await SharedVideo.findOne({ youtubeId: video.videoId });
            
            if (!sharedVideo) {
                // Create new SharedVideo
                sharedVideo = new SharedVideo({
                    youtubeId: video.videoId,
                    title: video.title,
                    thumbnail: video.thumbnail,
                    duration: video.duration,
                    description: video.description,
                    chapters: video.chapters
                });
                await sharedVideo.save();
                console.log(`✅ Created SharedVideo for YouTube ID: ${video.videoId}`);
                created++;
            } else {
                console.log(`♻️  Reusing existing SharedVideo for YouTube ID: ${video.videoId}`);
            }

            youtubeIdMap.set(video.videoId, sharedVideo._id);
        }

        // Step 2: Update Video documents to reference SharedVideo
        for (const video of videos) {
            if (!video.videoId) {
                continue;
            }

            const sharedVideoId = youtubeIdMap.get(video.videoId);
            if (!sharedVideoId) {
                console.log(`⚠️  No SharedVideo found for video ${video._id}, skipping`);
                skipped++;
                continue;
            }

            // Update the Video document
            await Video.updateOne(
                { _id: video._id },
                { $set: { sharedVideoId: sharedVideoId } }
            );
            updated++;
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   ✅ SharedVideos created: ${created}`);
        console.log(`   ♻️  Video documents updated: ${updated}`);
        console.log(`   ⚠️  Videos skipped: ${skipped}`);
        console.log('\n✨ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run migration
migrateToSharedVideo();
