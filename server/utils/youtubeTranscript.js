const https = require('https');
const { YoutubeTranscript } = require('youtube-transcript');

// ── Direct HTTP fetch helper ──────────────────────────────────────────────────
const fetchUrl = (url, extraHeaders = {}) => new Promise((resolve, reject) => {
    const req = https.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            ...extraHeaders,
        },
        timeout: 15000,
    }, (res) => {
        // Follow redirects
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
            return fetchUrl(res.headers.location, extraHeaders).then(resolve).catch(reject);
        }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', c => body += c);
        res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
});

// ── Method 1: youtube-transcript npm package ──────────────────────────────────
const fetchViaPackage = async (videoId, lang) => {
    const opts = lang ? { lang } : {};
    try {
        return await YoutubeTranscript.fetchTranscript(videoId, opts);
    } catch {
        if (lang) return await YoutubeTranscript.fetchTranscript(videoId);
        throw new Error('Package failed');
    }
};

// ── Method 2: parse ytInitialPlayerResponse from the watch page ───────────────
const fetchViaWatchPage = async (videoId) => {
    const html = await fetchUrl(`https://www.youtube.com/watch?v=${videoId}`);

    // Extract the giant JSON blob
    const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\});\s*(?:var |const |let |\n|<)/);
    if (!match) throw new Error('Could not locate ytInitialPlayerResponse in page');

    let playerResponse;
    try {
        playerResponse = JSON.parse(match[1]);
    } catch {
        throw new Error('Failed to parse ytInitialPlayerResponse JSON');
    }

    const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks || tracks.length === 0) throw new Error('No captions available for this video');

    // Prefer English, then any auto-generated, then first available
    const track =
        tracks.find(t => t.languageCode === 'en' && t.kind !== 'asr') ||
        tracks.find(t => t.languageCode?.startsWith('en')) ||
        tracks.find(t => t.kind === 'asr') ||
        tracks[0];

    if (!track?.baseUrl) throw new Error('Caption track has no URL');

    // Request JSON3 format (easier to parse than XML)
    const captionUrl = track.baseUrl.includes('fmt=') ? track.baseUrl : `${track.baseUrl}&fmt=json3`;
    const captionBody = await fetchUrl(captionUrl);

    let captionData;
    try {
        captionData = JSON.parse(captionBody);
    } catch {
        throw new Error('Failed to parse caption data');
    }

    const events = captionData?.events || [];
    const segments = events
        .filter(e => e.segs && e.segs.some(s => s.utf8 && s.utf8.trim()))
        .map(e => ({
            text: e.segs.map(s => s.utf8 || '').join('').replace(/\n/g, ' ').trim(),
            offset: (e.tStartMs || 0) / 1000,
            duration: (e.dDurationMs || 0) / 1000,
        }))
        .filter(s => s.text && s.text !== '\n');

    if (segments.length === 0) throw new Error('Caption events parsed but no text content found');
    return segments;
};

// ── Method 3: timedtext API directly ─────────────────────────────────────────
const fetchViaTimedtextAPI = async (videoId) => {
    // YouTube's older timedtext endpoint — returns XML
    const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`;
    const body = await fetchUrl(url);
    if (!body || body.trim().startsWith('<')) throw new Error('Timedtext API returned XML or empty');

    const data = JSON.parse(body);
    const events = data?.events || [];
    const segments = events
        .filter(e => e.segs)
        .map(e => ({
            text: e.segs.map(s => s.utf8 || '').join('').replace(/\n/g, ' ').trim(),
            offset: (e.tStartMs || 0) / 1000,
            duration: (e.dDurationMs || 0) / 1000,
        }))
        .filter(s => s.text);

    if (segments.length === 0) throw new Error('Timedtext API returned no segments');
    return segments;
};

// ── Public function: try all methods in order ─────────────────────────────────
const fetchTranscriptFromYouTube = async (videoId, lang) => {
    const errors = [];

    // 1. Try npm package first (fastest when it works)
    try {
        const result = await fetchViaPackage(videoId, lang);
        if (result && result.length > 0) return result;
    } catch (e) {
        errors.push(`package: ${e.message}`);
        console.warn(`[Transcript] npm package failed for ${videoId}: ${e.message}`);
    }

    // 2. Try parsing the watch page directly
    try {
        const result = await fetchViaWatchPage(videoId);
        if (result && result.length > 0) {
            console.log(`[Transcript] watch-page method succeeded for ${videoId}`);
            return result;
        }
    } catch (e) {
        errors.push(`watch-page: ${e.message}`);
        console.warn(`[Transcript] watch-page method failed for ${videoId}: ${e.message}`);
    }

    // 3. Try the timedtext API
    try {
        const result = await fetchViaTimedtextAPI(videoId);
        if (result && result.length > 0) {
            console.log(`[Transcript] timedtext API succeeded for ${videoId}`);
            return result;
        }
    } catch (e) {
        errors.push(`timedtext: ${e.message}`);
        console.warn(`[Transcript] timedtext API failed for ${videoId}: ${e.message}`);
    }

    throw new Error(`Transcript not available for this video. (${errors.join(' | ')})`);
};

module.exports = { fetchTranscriptFromYouTube };
