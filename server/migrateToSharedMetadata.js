const mongoose = require('mongoose');
const Playlist = require('./models/Playlist');
const UserPlaylist = require('./models/UserPlaylist');
require('dotenv').config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const playlists = await Playlist.find({});
        console.log(`Found ${playlists.length} playlists to migrate.`);

        for (const playlist of playlists) {
            if (playlist.userId) {
                // Check if UserPlaylist already exists to avoid duplicates
                const existing = await UserPlaylist.findOne({
                    userId: playlist.userId,
                    playlistId: playlist._id
                });

                if (!existing) {
                    await UserPlaylist.create({
                        userId: playlist.userId,
                        playlistId: playlist._id,
                        isPinned: playlist.isPinned || false,
                        goal: playlist.goal
                    });
                    console.log(`Migrated playlist ${playlist._id} for user ${playlist.userId}`);
                }
            }
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
