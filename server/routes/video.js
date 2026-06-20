const express = require('express');
const router = express.Router();
const {
    getVideoById, togglePin, syncVideo, deleteVideo,
    updateChapters, updateVideo, getTranscript,
    getBrainstorm, chatWithVideo,
    getFlashcards, generateFlashcards, updateFlashcards
} = require('../controllers/videoController');
const { auth, optionalAuth } = require('../middleware/auth');

router.get('/:id', optionalAuth, getVideoById);
router.get('/:id/transcript', optionalAuth, getTranscript);
router.get('/:id/brainstorm', optionalAuth, getBrainstorm);
router.post('/:id/chat', optionalAuth, chatWithVideo);
router.put('/:id', auth, updateVideo);
router.put('/:id/pin', auth, togglePin);
router.put('/:id/sync', auth, syncVideo);
router.put('/:id/chapters', auth, updateChapters);
router.delete('/:id', auth, deleteVideo);

// Flashcard routes
router.get('/:videoId/flashcards', auth, getFlashcards);
router.post('/:videoId/generate-flashcards', auth, generateFlashcards);
router.put('/:videoId/flashcards', auth, updateFlashcards);

module.exports = router;
