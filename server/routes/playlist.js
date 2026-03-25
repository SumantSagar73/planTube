const express = require('express');
const router = express.Router();
const { importPlaylist, getUserPlaylists, deletePlaylist,
    syncPlaylist,
    getLibraryStats,
    getPlaylistById,
    getPlaylistVideos
} = require('../controllers/playlistController');
const {
    createPlaylist, getMyPlaylists, getPublicPlaylist,
    updateVisibility, addVideoToPlaylist, reorderVideos,
    removeVideo, syncCustomVideo, importYoutubePlaylistToCustom,
    addPlanTubePlaylistToCustom
} = require('../controllers/customPlaylistController');
const { auth, optionalAuth } = require('../middleware/auth');

// Unified Library Stats
router.get('/library', auth, getLibraryStats);

router.post('/import', optionalAuth, importPlaylist);
router.get('/fetch-metadata', auth, require('../controllers/playlistController').fetchMetadata);

// Custom Playlists Routes
router.post('/', auth, createPlaylist);
router.get('/my', auth, getMyPlaylists);
router.get('/:id/public', getPublicPlaylist);
router.put('/:id/visibility', auth, updateVisibility);
router.post('/:id/videos', auth, addVideoToPlaylist);
router.put('/:id/videos/reorder', auth, reorderVideos);
router.delete('/:playlistId/videos/:videoId', auth, removeVideo);
router.post('/:id/import-youtube', auth, importYoutubePlaylistToCustom);
router.post('/:id/import-library', auth, addPlanTubePlaylistToCustom);

// Existing Routes
router.put('/:id/pin', auth, require('../controllers/playlistController').togglePin);
router.put('/:id/sync', auth, require('../controllers/playlistController').syncPlaylist);
router.put('/:id/videos/:videoId/sync', auth, require('../controllers/playlistController').syncVideo);
router.delete('/:id', auth, require('../controllers/playlistController').deletePlaylist);
router.get('/', auth, getUserPlaylists);
router.get('/:id', optionalAuth, getPlaylistById);
router.get('/:id/videos', optionalAuth, getPlaylistVideos);

module.exports = router;
