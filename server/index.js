require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://plantube.vercel.app',
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Database Connection
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    console.error('MONGODB_URI is not set. The server will not start without a database connection.');
    process.exit(1);
}

// Prefer IPv4 and known public resolvers to avoid intermittent SRV lookup issues.
if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
}
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Routes
app.get('/', (req, res) => {
    res.send('PlanTube API is running...');
});

// Auth Routes
app.use('/api/auth', require('./routes/auth'));

// Playlist Routes
app.use('/api/playlists', require('./routes/playlist'));

// Schedule Routes
app.use('/api/schedules', require('./routes/schedule'));

// User Routes
app.use('/api/users', require('./routes/user'));

// Video Routes
const videoRoutes = require('./routes/video');
const settingsRoutes = require('./routes/settings');
const { initializeSettings } = require('./controllers/settingsController');

app.use('/api/videos', videoRoutes);
app.use('/api/settings', settingsRoutes);

// Group Routes
app.use('/api/groups', require('./routes/group'));

// Analytics Routes
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/presence', require('./routes/presence'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/social', require('./routes/socialRoutes'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/feedback', require('./routes/feedback'));
// Public achievements catalog
app.use('/api/achievements', require('./routes/achievements'));

// Image Proxy — fetches external images server-side to bypass CORS on image hosts like ibb.co, Google Drive, etc.
const https = require('https');
const http = require('http');

const fetchWithRedirects = (url, res, depth = 0) => {
    if (depth > 5) return res.status(500).json({ error: 'Too many redirects' });
    try {
        const parsed = new URL(url);
        const client = parsed.protocol === 'https:' ? https : http;
        client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (imgRes) => {
            if ([301, 302, 303, 307, 308].includes(imgRes.statusCode) && imgRes.headers.location) {
                return fetchWithRedirects(imgRes.headers.location, res, depth + 1);
            }
            res.set('Content-Type', imgRes.headers['content-type'] || 'image/jpeg');
            res.set('Cache-Control', 'public, max-age=86400');
            imgRes.pipe(res);
        }).on('error', () => res.status(500).json({ error: 'Failed to fetch image' }));
    } catch {
        res.status(400).json({ error: 'Invalid URL' });
    }
};

app.get('/api/proxy-image', (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'url query param required' });
    fetchWithRedirects(url, res);
});


const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});
const presenceStore = require('./utils/presenceStore');

app.set('io', io);

// Real-time Presence with Socket.io
const activeUsers = new Map(); // videoId -> Set of socketId/userId

io.on('connection', (socket) => {
    // console.log('\ud83d\udd17 Socket connected:', socket.id);

    const broadcastPresence = (videoId) => {
        const videoMap = activeUsers.get(videoId);
        const count = videoMap ? videoMap.size : 0;

//         console.log(`\ud83d\udce1 Broadcasting presence for video ${videoId}: ${count} users`);

        // Notify video room
        io.to(`video_${videoId}`).emit('presence_update', { videoId, count });

        // Potential Optimization: Keep track which playlists contain this video
        // For now, let's just broadcast to a global "presence_change" and let
        // playlist rooms handle it, OR better: the playlist page joins multiple video rooms?
        // Let's go with a simpler aggregate broadcast for any playlist watching this video.

        io.sockets.sockets.forEach(s => {
            s.rooms.forEach(room => {
                if (room.startsWith('playlist_')) {
                    // This socket is on a playlist page. Use a small throttle/debounce
                    // or just emit an update trigger.
                    s.emit('trigger_playlist_update');
                }
            });
        });
    };

    socket.on('join_user', ({ userId }) => {
        if (!userId) return;
        socket.join(`user_${userId}`);
        socket.data.userId = userId;
        presenceStore.markUserOnline(userId, socket.id);
    });

    socket.on('leave_user', ({ userId }) => {
        if (!userId) return;
        socket.leave(`user_${userId}`);
        presenceStore.markUserOffline(userId, socket.id);
        if (socket.data.userId === userId) {
            socket.data.userId = null;
        }
    });

    socket.on('join_video', ({ videoId, userId, visitorId }) => {
        const id = userId || visitorId || socket.id;
//         console.log(`\ud83d\udc65 User joining video room - videoId: ${videoId}, id: ${id}`);

        // Leave any existing video rooms first to ensure user is only in one video at a time per socket
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

//         console.log(`\u2705 User ${id} added to video ${videoId}. Total viewers: ${videoMap.size}`);

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
        if (socket.data.userId) {
            presenceStore.markUserOffline(socket.data.userId, socket.id);
        }
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

const startServer = async () => {
    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000
        });

        console.log('MongoDB Connected');

        // Initialize system settings
        await initializeSettings();

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

startServer();

