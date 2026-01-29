require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
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
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB Connection Error:', err));

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
app.use('/api/videos', require('./routes/video'));

// Group Routes
app.use('/api/groups', require('./routes/group'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
