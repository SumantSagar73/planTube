const Video = require('../models/Video');
const SharedVideo = require('../models/SharedVideo');
const axios = require('axios');
const mongoose = require('mongoose');
const { parseDuration, formatDuration, parseChapters } = require('../utils/videoUtils');
const { fetchTranscriptFromYouTube } = require('../utils/youtubeTranscript');
const { generateBrainstormNotes, chatWithVideo, callAI } = require('../utils/aiService');

// Helper to fetch single video data from YouTube
const fetchYouTubeData = async (videoId) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error('YouTube API Key is missing');

    const res = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
        params: {
            part: 'snippet,contentDetails',
            id: videoId,
            key: apiKey
        }
    });

    if (!res.data.items.length) throw new Error('Video not found on YouTube');

    const item = res.data.items[0];
    const description = item.snippet.description || '';
    const durationSecs = parseDuration(item.contentDetails.duration);

    return {
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
        duration: formatDuration(item.contentDetails.duration),
        description,
        chapters: parseChapters(description, durationSecs)
    };
};

exports.getTranscript = async (req, res) => {
    try {
        const { id } = req.params;
        const { lang } = req.query;

        let youtubeId = id;
        
        // If it's a MongoDB ID, find the video and get its YouTube ID from SharedVideo
        if (mongoose.Types.ObjectId.isValid(id)) {
            const video = await Video.findById(id).populate('sharedVideoId');
            if (video) {
                // Try to get from SharedVideo first, then fallback to deprecated videoId field
                youtubeId = video.sharedVideoId?.youtubeId || video.videoId;
            }
        }

        if (!youtubeId) {
            return res.status(404).json({ msg: 'Video not found' });
        }

        console.log(`Fetching transcript for YouTube ID: ${youtubeId} (requested lang: ${lang || 'default'})`);
        const transcript = await fetchTranscriptFromYouTube(youtubeId, lang);
        res.json(transcript);
    } catch (err) {
        console.error('Fetch Transcript Error:', err.message);
        res.status(500).json({ 
            msg: 'Failed to fetch transcript. It might be disabled or unavailable for this video.',
            error: err.message 
        });
    }
};

exports.getBrainstorm = async (req, res) => {
    try {
        const { id } = req.params;
        let youtubeId = id;
        let videoTitle = 'this video';
        let sharedVideo = null;

        // Resolve YouTube ID and fetch SharedVideo
        if (mongoose.Types.ObjectId.isValid(id)) {
            const video = await Video.findById(id).populate('sharedVideoId');
            if (video) {
                youtubeId = video.sharedVideoId?.youtubeId || video.videoId;
                videoTitle = video.sharedVideoId?.title || video.title;
                sharedVideo = video.sharedVideoId;
            } else {
                // Try as SharedVideo directly
                sharedVideo = await SharedVideo.findById(id);
                if (sharedVideo) {
                    youtubeId = sharedVideo.youtubeId;
                    videoTitle = sharedVideo.title;
                }
            }
        } else {
            // It's a YouTube ID string
            sharedVideo = await SharedVideo.findOne({ youtubeId: id });
            if (sharedVideo) videoTitle = sharedVideo.title;
        }

        if (!youtubeId || youtubeId.length > 20) { // Simple sanity check for YouTube ID
             // If it's a 24-char hex string that wasn't found in DB, it's definitely not a YouTube ID
             if (id.length === 24) return res.status(404).json({ msg: 'Video record not found.' });
        }

        // 1. Check if we already have a cached plan in SharedVideo
        if (sharedVideo && sharedVideo.brainstormPlan) {
            console.log(`Serving cached brainstorm plan for: ${youtubeId}`);
            return res.json({ content: sharedVideo.brainstormPlan });
        }

        // 2. If not cached, fetch transcript
        let transcript;
        try {
            transcript = await fetchTranscriptFromYouTube(youtubeId);
        } catch (tErr) {
            return res.status(400).json({ msg: 'Transcript not available for this video.', error: tErr.message });
        }
        
        // 3. Generate with AI
        const brainstormData = await generateBrainstormNotes(transcript, videoTitle);
        
        // 4. Cache it in SharedVideo for next time
        if (sharedVideo) {
            sharedVideo.brainstormPlan = brainstormData;
            await sharedVideo.save();
        } else {
            // Create SharedVideo if missing
            await SharedVideo.findOneAndUpdate(
                { youtubeId },
                { brainstormPlan: brainstormData, title: videoTitle },
                { upsert: true }
            );
        }
        
        res.json({ content: brainstormData });
    } catch (err) {
        console.error('Brainstorm Error:', err.message);
        const isAuthErr = err.message?.includes('authentication failed') || err.message?.includes('API key');
        res.status(isAuthErr ? 503 : 500).json({ msg: err.message || 'Failed to generate brainstorm plan.' });
    }
};
exports.chatWithVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const { message, chatHistory } = req.body;
        
        let youtubeId = id;
        let videoTitle = 'this video';
        let brainstormPlan = '';

        // Resolve YouTube ID and fetch Plan
        if (mongoose.Types.ObjectId.isValid(id)) {
            const video = await Video.findById(id).populate('sharedVideoId');
            if (video) {
                youtubeId = video.sharedVideoId?.youtubeId || video.videoId;
                videoTitle = video.sharedVideoId?.title || video.title;
                brainstormPlan = video.sharedVideoId?.brainstormPlan || '';
            } else {
                const shared = await SharedVideo.findById(id);
                if (shared) {
                    youtubeId = shared.youtubeId;
                    videoTitle = shared.title;
                    brainstormPlan = shared.brainstormPlan || '';
                }
            }
        } else {
            const shared = await SharedVideo.findOne({ youtubeId: id });
            if (shared) {
                videoTitle = shared.title;
                brainstormPlan = shared.brainstormPlan || '';
            }
        }

        if (!youtubeId || youtubeId.length > 20) {
            if (id.length === 24) return res.status(404).json({ msg: 'Video not found.' });
        }

        // 1. Fetch transcript
        let transcript;
        try {
            transcript = await fetchTranscriptFromYouTube(youtubeId);
        } catch (tErr) {
            return res.status(400).json({ msg: 'Transcript not available for chat.' });
        }

        // 2. Chat with AI using the Roadmap as context to save tokens
        const aiResponse = await chatWithVideo(videoTitle, transcript, message, chatHistory, brainstormPlan);
        
        res.json({ content: aiResponse });
    } catch (err) {
        console.error('Chat Error:', err.message);
        res.status(500).json({ msg: 'Failed to get response from AI.', error: err.message });
    }
};

exports.getVideoById = async (req, res) => {
    try {
        const { id } = req.params;
        let query = {};

        // Check if id is a valid MongoDB ObjectId
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(id)) {
            query = { _id: id };
        } else {
            // Assume it's a YouTube ID
            query = { videoId: id };
        }

        const video = await Video.findOne(query).populate('sharedVideoId');
        if (!video) return res.status(404).json({ msg: 'Video not found' });
        res.json(video);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.togglePin = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ msg: 'Video not found' });

        const isPinned = !video.isPinned;

        // Use findOneAndUpdate to avoid triggering validation for all fields
        const updatedVideo = await Video.findOneAndUpdate(
            { _id: req.params.id },
            { $set: { isPinned } },
            { new: true }
        );

        res.json(updatedVideo);
    } catch (err) {
        console.error('Toggle Pin Error:', err.message);
        res.status(500).send('Server error: ' + err.message);
    }
};

exports.syncVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ msg: 'Video not found' });

        // Only sync if we have a valid YouTube video ID
        if (!video.videoId) return res.status(400).json({ msg: 'No YouTube ID found for this video' });

        const newData = await fetchYouTubeData(video.videoId);

        video.title = newData.title;
        video.thumbnail = newData.thumbnail;
        video.duration = newData.duration;
        video.description = newData.description;
        video.chapters = newData.chapters;

        await video.save();
        res.json({ msg: 'Synced', video });
    } catch (err) {
        console.error('Sync Error:', err.message);
        res.status(500).json({ msg: 'Sync Failed: ' + err.message });
    }
};
exports.deleteVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ msg: 'Video not found' });

        // Check if video belongs to user's SINGLES playlist or is allowed to be deleted
        // For now, allow deletion if it belongs to a SINGLES playlist owned by user
        const Playlist = require('../models/Playlist');
        const playlist = await Playlist.findById(video.playlistId);

        if (playlist && playlist.userId && playlist.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Delete associated schedules
        const Schedule = require('../models/Schedule');
        await Schedule.deleteMany({ videoId: video._id });

        await Video.findByIdAndDelete(video._id);
        res.json({ msg: 'Video deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.updateChapters = async (req, res) => {
    try {
        const { id } = req.params; // Video ID (junction table)
        const { chapters } = req.body;

        let video = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
            video = await Video.findById(id);
        }
        if (!video) {
            // Fallback for legacy routes that pass YouTube ID in URL
            video = await Video.findOne({ videoId: id });
        }
        if (!video) return res.status(404).json({ msg: 'Video not found' });

        const sharedVideo = await SharedVideo.findById(video.sharedVideoId);
        if (!sharedVideo) return res.status(404).json({ msg: 'Shared metadata not found' });

        const normalizedChapters = Array.isArray(chapters)
            ? chapters
                .filter(c => c && c.title && c.timestamp)
                .map(c => {
                    if (typeof c.seconds === 'number' && Number.isFinite(c.seconds)) {
                        return { title: c.title, timestamp: c.timestamp, seconds: Math.max(0, Math.floor(c.seconds)) };
                    }

                    const parts = String(c.timestamp).split(':').map(Number).reverse();
                    let seconds = 0;
                    if (Number.isFinite(parts[0])) seconds += parts[0];
                    if (Number.isFinite(parts[1])) seconds += parts[1] * 60;
                    if (Number.isFinite(parts[2])) seconds += parts[2] * 3600;
                    return { title: c.title, timestamp: c.timestamp, seconds: Math.max(0, Math.floor(seconds)) };
                })
                .sort((a, b) => a.seconds - b.seconds)
            : [];

        sharedVideo.chapters = normalizedChapters;
        await sharedVideo.save();

        res.json(sharedVideo);
    } catch (err) {
        console.error('Update Chapters Error:', err.message);
        res.status(500).json({ msg: 'Failed to update chapters' });
    }
};

exports.updateVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const { tags, customResources } = req.body;

        const updateData = {};
        if (tags) updateData.tags = tags;
        if (customResources) updateData.customResources = customResources;

        let query = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
            query = { _id: id };
        } else {
            // Fallback for legacy routes that pass YouTube ID in URL
            query = { videoId: id };
        }

        const updatedVideo = await Video.findOneAndUpdate(
            query,
            { $set: updateData },
            { new: true }
        ).populate('sharedVideoId');

        if (!updatedVideo) return res.status(404).json({ msg: 'Video not found' });

        res.json(updatedVideo);
    } catch (err) {
        console.error('Update Video Metadata Error:', err.message);
        res.status(500).json({ msg: 'Failed to update video metadata' });
    }
};

// ─── Flashcards ───────────────────────────────────────────────────────────────

/**
 * Resolves a videoId param (YouTube ID string or MongoDB ObjectId) to a SharedVideo document.
 */
const resolveSharedVideo = async (videoId) => {
    if (mongoose.Types.ObjectId.isValid(videoId)) {
        // Could be a Video junction ID or a SharedVideo ID
        const video = await Video.findById(videoId).populate('sharedVideoId');
        if (video && video.sharedVideoId) return video.sharedVideoId;
        // Try as direct SharedVideo ID
        const sv = await SharedVideo.findById(videoId);
        if (sv) return sv;
    }
    // Treat as YouTube ID
    return SharedVideo.findOne({ youtubeId: videoId });
};

/**
 * GET /api/videos/:videoId/flashcards
 */
exports.getFlashcards = async (req, res) => {
    try {
        const sharedVideo = await resolveSharedVideo(req.params.videoId);
        if (!sharedVideo) return res.status(404).json({ msg: 'Video not found' });
        res.json({ flashcards: sharedVideo.flashcards || [] });
    } catch (err) {
        console.error('getFlashcards Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * POST /api/videos/:videoId/generate-flashcards
 * Body: { notesText: String }
 */
exports.generateFlashcards = async (req, res) => {
    try {
        const { notesText } = req.body;

        const sharedVideo = await resolveSharedVideo(req.params.videoId);
        if (!sharedVideo) return res.status(404).json({ msg: 'Video not found' });

        // Use notes if provided, otherwise fall back to transcript
        let sourceText = (notesText || '').trim();
        if (!sourceText) {
            try {
                const youtubeId = sharedVideo.youtubeId;
                console.log(`[Flashcards] Fetching transcript for youtubeId=${youtubeId}`);
                const segments = await fetchTranscriptFromYouTube(youtubeId);
                sourceText = segments.map(s => s.text).join(' ').slice(0, 8000);
                console.log(`[Flashcards] Transcript fetched, length=${sourceText.length}`);
            } catch (transcriptErr) {
                console.error(`[Flashcards] Transcript fetch failed:`, transcriptErr.message);
                return res.status(400).json({ msg: 'No notes provided and transcript unavailable for this video.' });
            }
        }

        if (!sourceText) {
            return res.status(400).json({ msg: 'No content available to generate flashcards from.' });
        }

        const prompt = `Generate 5-8 flashcards from this content about "${sharedVideo.title || 'the video'}".
Return ONLY a valid JSON array of objects with exactly two fields: "question" and "answer".
Do not include any explanation, markdown, or extra text — just the JSON array.

Content:
${sourceText.slice(0, 8000)}`;

        let aiResponseText;
        try {
            aiResponseText = await callAI([
                { role: 'system', content: 'You are a flashcard generator. Always respond with a pure JSON array, no markdown, no explanation.' },
                { role: 'user', content: prompt }
            ], { temperature: 0.5, max_tokens: 1500 });
        } catch (aiErr) {
            const isAuthErr = aiErr.message?.includes('authentication failed') || aiErr.message?.includes('API key');
            return res.status(isAuthErr ? 503 : 500).json({ msg: aiErr.message || 'AI generation failed' });
        }

        // Parse the JSON array from AI response
        let flashcards;
        try {
            // Strip markdown code fences if present
            let jsonStr = aiResponseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            // If the response doesn't start with '[', extract the first JSON array found
            if (!jsonStr.startsWith('[')) {
                const match = jsonStr.match(/\[[\s\S]*\]/);
                if (match) jsonStr = match[0];
            }
            flashcards = JSON.parse(jsonStr);
            if (!Array.isArray(flashcards)) throw new Error('Not an array');
            // Sanitize — keep only question/answer string pairs
            flashcards = flashcards
                .filter(f => f && typeof f.question === 'string' && typeof f.answer === 'string')
                .map(f => ({ question: f.question.trim(), answer: f.answer.trim() }));
            if (flashcards.length === 0) throw new Error('No valid flashcard pairs in response');
        } catch (parseErr) {
            console.error('Failed to parse AI flashcard JSON:', parseErr.message, '| Raw:', aiResponseText?.slice(0, 300));
            return res.status(500).json({ msg: 'AI returned an invalid format. Please try again.' });
        }

        sharedVideo.flashcards = flashcards;
        await sharedVideo.save();

        res.json({ flashcards });
    } catch (err) {
        console.error('generateFlashcards Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * PUT /api/videos/:videoId/flashcards
 * Body: { flashcards: [{question, answer}] }
 */
exports.updateFlashcards = async (req, res) => {
    try {
        const { flashcards } = req.body;
        if (!Array.isArray(flashcards)) {
            return res.status(400).json({ msg: 'flashcards must be an array' });
        }

        const sanitized = flashcards
            .filter(f => f && typeof f.question === 'string' && typeof f.answer === 'string')
            .map(f => ({ question: f.question.trim(), answer: f.answer.trim() }));

        const sharedVideo = await resolveSharedVideo(req.params.videoId);
        if (!sharedVideo) return res.status(404).json({ msg: 'Video not found' });

        sharedVideo.flashcards = sanitized;
        await sharedVideo.save();

        res.json({ flashcards: sharedVideo.flashcards });
    } catch (err) {
        console.error('updateFlashcards Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};
