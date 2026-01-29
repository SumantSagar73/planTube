const express = require('express');
const router = express.Router();
const { importPlaylist, getUserPlaylists, getPlaylistVideos, getPlaylistById } = require('../controllers/playlistController');
const { auth, optionalAuth } = require('../middleware/auth');



router.post('/import', optionalAuth, importPlaylist);
router.put('/:id/pin', auth, require('../controllers/playlistController').togglePin);
router.put('/:id/sync', auth, require('../controllers/playlistController').syncPlaylist);
router.delete('/:id', auth, require('../controllers/playlistController').deletePlaylist);
router.get('/', auth, getUserPlaylists);
router.get('/:id', optionalAuth, getPlaylistById);
router.get('/:id/videos', optionalAuth, getPlaylistVideos);

module.exports = router;
