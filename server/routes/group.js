const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const groupController = require('../controllers/groupController');
const groupPlaylistController = require('../controllers/groupPlaylistController');

// --- Specific/Sub-resource Routes First ---

// Group Playlist Routes
router.post('/:groupId/playlists', auth, groupPlaylistController.sharePlaylist);
router.get('/:groupId/playlists', optionalAuth, groupPlaylistController.getGroupPlaylists);
router.delete('/:groupId/playlists/:playlistId', auth, groupPlaylistController.unsharePlaylist);
router.get('/:groupId/playlists/:playlistId/progress', optionalAuth, groupPlaylistController.getGroupPlaylistProgress);
router.get('/:groupId/playlists/:playlistId/schedules', optionalAuth, groupPlaylistController.getGroupPlaylistSchedules);
router.put('/:groupId/playlists/:playlistId/priority', auth, groupPlaylistController.updatePlaylistPriority);

// Member Routes
router.post('/:id/members', optionalAuth, groupController.addMember);
router.delete('/:id/members/:userId', auth, groupController.removeMember);
router.post('/:id/join', optionalAuth, groupController.joinGroup);
router.post('/:id/leave', auth, groupController.leaveGroup);

// --- Generic/ID Routes Last ---

router.post('/', auth, groupController.createGroup);
router.get('/', auth, groupController.getMyGroups);
router.post('/join-code', optionalAuth, groupController.joinGroupByCode);

router.get('/:id', optionalAuth, groupController.getGroupById);
router.put('/:id', auth, groupController.updateGroup);
router.delete('/:id', auth, groupController.deleteGroup);

module.exports = router;
