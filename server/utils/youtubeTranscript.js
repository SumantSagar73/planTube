const { YoutubeTranscript } = require('youtube-transcript');

/**
 * Fetches transcript for a YouTube video
 * @param {string} videoId - YouTube video ID
 * @param {string} [lang] - Optional language code (e.g. 'hi')
 * @returns {Promise<Array>} - Array of transcript segments
 */
const fetchTranscriptFromYouTube = async (videoId, lang) => {
    try {
        const options = lang ? { lang } : {};
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, options);
        return transcript;
    } catch (error) {
        // If specific language fails, try default
        if (lang) {
            try {
                console.warn(`Failed to fetch transcript in '${lang}', trying default...`);
                return await YoutubeTranscript.fetchTranscript(videoId);
            } catch (innerError) {
                throw new Error('Transcript not available for this video.');
            }
        }
        throw new Error('Transcript not available for this video.');
    }
};

module.exports = { fetchTranscriptFromYouTube };
