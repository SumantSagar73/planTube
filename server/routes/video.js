const express = require('express');
const router = express.Router();
const {
    getVideoById, togglePin, syncVideo, deleteVideo,
    updateChapters, updateVideo, getTranscript,
    getBrainstorm, chatWithVideo,
    getFlashcards, generateFlashcards, updateFlashcards
} = require('../controllers/videoController');
const { auth, optionalAuth } = require('../middleware/auth');

// Quick AI connectivity test — uses user-provided key from headers
router.post('/test-ai', optionalAuth, async (req, res) => {
    try {
        const { callAI } = require('../utils/aiService');
        const apiKey = req.headers['x-ai-key'];
        if (!apiKey) return res.status(400).json({ msg: 'No API key provided in x-ai-key header' });
        const userConfig = {
            provider: req.headers['x-ai-provider'] || 'groq',
            apiKey,
            model:    req.headers['x-ai-model'] || '',
            baseUrl:  req.headers['x-ai-url'] || '',
        };
        const content = await callAI(
            [{ role: 'user', content: 'Reply with exactly: OK' }],
            { temperature: 0, max_tokens: 10 },
            userConfig
        );
        res.json({ content });
    } catch (err) {
        res.status(500).json({ msg: err.message || 'AI test failed' });
    }
});

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
