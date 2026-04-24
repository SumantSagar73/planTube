const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const feedbackController = require('../controllers/feedbackController');

router.post('/', auth, feedbackController.submitFeedback);
router.get('/mine', auth, feedbackController.getMyFeedback);

module.exports = router;
