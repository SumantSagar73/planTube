const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');

// Public: list active achievements
router.get('/', achievementController.listPublicAchievements);

module.exports = router;
