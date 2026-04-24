const activeUsers = new Map(); // videoId -> Set of socketId/userId

module.exports = (io) => {
    io.on('connection', (socket) => {
        // console.log('🔗 Socket connected:', socket.id);

        const broadcastPresence = (videoId) => {
            const videoMap = activeUsers.get(videoId);
            const count = videoMap ? videoMap.size : 0;

            // console.log(`📡 Broadcasting presence for video ${videoId}: ${count} users`);

            // Notify video room
            io.to(`video_${videoId}`).emit('presence_update', { videoId, count });

            // Trigger aggregate updates for playlist pages
            io.sockets.sockets.forEach(s => {
                s.rooms.forEach(room => {
                    if (room.startsWith('playlist_')) {
                        s.emit('trigger_playlist_update');
                    }
                });
            });
        };

        socket.on('join_user', ({ userId }) => {
            if (!userId) return;
            socket.join(`user_${userId}`);
        });

        socket.on('leave_user', ({ userId }) => {
            if (!userId) return;
            socket.leave(`user_${userId}`);
        });

        socket.on('join_video', ({ videoId, userId, visitorId }) => {
            const id = userId || visitorId || socket.id;
            // console.log(`👥 User joining video room - videoId: ${videoId}, id: ${id}`);

            // Leave any existing video rooms
            socket.rooms.forEach(room => {
                if (room.startsWith('video_') && room !== `video_${videoId}`) {
                    socket.leave(room);
                    const oldId = room.replace('video_', '');
                    const oldMap = activeUsers.get(oldId);
                    if (oldMap) {
                        oldMap.delete(socket.id);
                        if (oldMap.size === 0) activeUsers.delete(oldId);
                        broadcastPresence(oldId);
                    }
                }
            });

            socket.join(`video_${videoId}`);

            if (!activeUsers.has(videoId)) {
                activeUsers.set(videoId, new Map());
            }

            const videoMap = activeUsers.get(videoId);
            videoMap.set(socket.id, { id, timestamp: Date.now() });

            // console.log(`✅ User ${id} added to video ${videoId}. Total viewers: ${videoMap.size}`);
            broadcastPresence(videoId);
        });

        socket.on('leave_video', ({ videoId }) => {
            socket.leave(`video_${videoId}`);
            const videoMap = activeUsers.get(videoId);
            if (videoMap) {
                videoMap.delete(socket.id);
                if (videoMap.size === 0) activeUsers.delete(videoId);
                broadcastPresence(videoId);
            }
        });

        socket.on('join_playlist', ({ playlistId, videoIds }) => {
            socket.join(`playlist_${playlistId}`);

            const sendAggregateCount = () => {
                const uniqueUsers = new Set();
                videoIds.forEach(vid => {
                    const vMap = activeUsers.get(vid);
                    if (vMap) {
                        vMap.forEach(u => uniqueUsers.add(u.id));
                    }
                });
                socket.emit('playlist_presence_update', {
                    playlistId,
                    count: uniqueUsers.size
                });
            };

            socket.on('request_playlist_update', sendAggregateCount);
            sendAggregateCount();
        });

        socket.on('disconnecting', () => {
            socket.rooms.forEach(room => {
                if (room.startsWith('video_')) {
                    const videoId = room.replace('video_', '');
                    const videoMap = activeUsers.get(videoId);
                    if (videoMap) {
                        videoMap.delete(socket.id);
                        if (videoMap.size === 0) activeUsers.delete(videoId);
                        broadcastPresence(videoId);
                    }
                }
            });
        });
    });
};
