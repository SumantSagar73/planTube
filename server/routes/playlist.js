const express = require('express');
const router = express.Router();
const { importPlaylist, getUserPlaylists, getPlaylistVideos } = require('../controllers/playlistController');
const auth = require('../middleware/auth');



router.post('/import', auth, importPlaylist);
router.put('/:id/pin', auth, require('../controllers/playlistController').togglePin);
router.put('/:id/sync', auth, require('../controllers/playlistController').syncPlaylist);
router.delete('/:id', auth, require('../controllers/playlistController').deletePlaylist);
router.get('/', auth, getUserPlaylists);
router.get('/:id/videos', auth, getPlaylistVideos);

module.exports = router;
