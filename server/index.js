require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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
