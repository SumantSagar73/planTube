const Achievement = require('../models/Achievement');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Service to handle automatic achievement tracking and awarding
 */
class AchievementService {
    /**
     * Check and award achievements based on user activity
     * @param {string} userId - ID of the user
     * @param {string} type - Type of criteria to check (xp, focus_minutes, streak_days, etc.)
     * @param {Object} context - Optional context data (e.g., current value)
     */
    static async checkAchievements(userId, type, context = {}) {
        try {
            const user = await User.findById(userId);
            if (!user) return;

            // Fetch all active achievements for this criteria type
            const achievements = await Achievement.find({ 
                isActive: true, 
                'criteria.type': type 
            });

            const unlockedKeys = new Set(user.achievements.map(a => a.key));
            let newlyUnlocked = [];

            for (const ach of achievements) {
                if (unlockedKeys.has(ach.key)) continue;

                let isMet = false;
                const requiredValue = ach.criteria.value;

                // Evaluate criteria based on type
                switch (type) {
                    case 'xp':
                        if (user.xp >= requiredValue) isMet = true;
                        break;
                    case 'focus_minutes':
                        if (user.totalFocusMinutes >= requiredValue) isMet = true;
                        break;
                    case 'streak_days':
                        if (user.bestStreak >= requiredValue || user.currentStreak >= requiredValue) isMet = true;
                        break;
                    case 'playlists_created':
                        // Check if context provides the value
                        if (context.value >= requiredValue) isMet = true;
                        break;
                    case 'ai_summary':
                    case 'ai_chat':
                    case 'ai_brainstorm':
                    case 'notes_taken':
                    case 'theme_customization':
                    case 'playlist_completion':
                        if (context.value >= requiredValue) isMet = true;
                        break;
                    default:
                        // Check if context provides the value
                        if (context.value >= requiredValue) isMet = true;
                }

                if (isMet) {
                    // Award Achievement
                    user.achievements.push({
                        key: ach.key,
                        name: ach.name,
                        icon: ach.icon,
                        description: ach.description,
                        unlockedAt: new Date()
                    });

                    // Award XP
                    if (ach.xpReward) {
                        user.xp += ach.xpReward;
                    }

                    newlyUnlocked.push(ach);

                    // Create Notification
                    await Notification.create({
                        user: userId,
                        type: 'achievement',
                        title: `Achievement Unlocked: ${ach.name}`,
                        message: `Congratulations! You've earned the ${ach.name} trophy and ${ach.xpReward} XP.`,
                        data: { achievementKey: ach.key, icon: ach.icon }
                    });
                }
            }

            if (newlyUnlocked.length > 0) {
                // Calculate level up
                const oldLevel = user.level || 1;
                const newLevel = Math.floor(Math.sqrt(user.xp / 100)) + 1;
                if (newLevel > oldLevel) {
                    user.level = newLevel;
                    await Notification.create({
                        user: userId,
                        type: 'level_up',
                        title: `Level Up!`,
                        message: `You've reached Level ${newLevel}! Keep up the great work.`,
                        data: { level: newLevel }
                    });
                }

                await user.save();
                return newlyUnlocked;
            }

            return [];
        } catch (err) {
            console.error('AchievementService Error:', err);
            return [];
        }
    }
}

module.exports = AchievementService;
