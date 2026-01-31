const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const {
    createPlaylist,
    getMyPlaylists,
    getPlaylistById,
    updateVisibility,
    addVideoToPlaylist,
    reorderVideos,
    removeVideo,
    getPublicPlaylist,
    syncCustomVideo
} = require('../controllers/customPlaylistController');

// Helper to decide which controller to use based on playlist ID format
// But wait, user requested specific routes.
// The new routes are:
// POST /api/playlists
// GET /api/playlists/my
// GET /api/playlists/:id
// ...

// Since we are mounting this router at /api/playlists (likely replacing or merging with existing),
// we need to be careful. The existing router handles /api/playlists.
// Integration strategy:
// Use specific paths for new features to avoid collision if possible, OR
// Rewrite the main index.js to route to different files.

// Plan: 
// 1. POST / -> createPlaylist (New)
// 2. GET /my -> getMyPlaylists (New)
// 3. GET /:id -> getPlaylistById (Needs to handle legacy vs new) -> ACTUALLY, I'll use a specific route for custom logic OR update the existing controller to delegate.
//    However, for simplicity and conflict avoidance, I will check if the ID requires a different route.
//    But 'GET /:id' captures everything.

// Let's implement the routes as requested.
// NOTE: This file receives requests from /api/playlists if we mount it there.

router.post('/', auth, createPlaylist);
router.get('/my', auth, getMyPlaylists);

// Public/Shared link
router.get('/:id/public', getPublicPlaylist);

// Video management
router.post('/:id/videos', auth, addVideoToPlaylist);
router.put('/:id/videos/reorder', auth, reorderVideos);
router.delete('/:playlistId/videos/:videoId', auth, removeVideo);
router.put('/:id/videos/:videoId/sync', auth, syncCustomVideo);

// Visibility
router.put('/:id/visibility', auth, updateVisibility);

// General GET by ID (Must come last to not shadow specifics)
router.get('/:id', optionalAuth, getPlaylistById);


module.exports = router;
