const { YoutubeTranscript } = require('youtube-transcript');

// Cache the Innertube instance — creation is expensive (~300ms)
let _innertube = null;
const getInnertube = async () => {
    if (_innertube) return _innertube;
    const { Innertube } = await import('youtubei.js');
    _innertube = await Innertube.create({ retrieve_player: false });
    return _innertube;
};

// ── Method 1: youtubei.js (Innertube API) — most reliable on cloud servers ────
const fetchViaInnertube = async (videoId) => {
    const yt = await getInnertube();
    const info = await yt.getInfo(videoId);
    const transcriptData = await info.getTranscript();

    const segments = [];
    const body = transcriptData?.transcript?.content?.body;
    const initialSegments = body?.initial_segments || body?.content?.body?.initial_segments || [];

    for (const seg of initialSegments) {
        const text = seg?.snippet?.text || seg?.snippet?.runs?.map(r => r.text).join('') || '';
        const startMs = seg?.start_ms ?? seg?.startMs ?? 0;
        const endMs = seg?.end_ms ?? seg?.endMs ?? 0;
        if (text.trim()) {
            segments.push({
                text: text.replace(/\n/g, ' ').trim(),
                offset: Number(startMs) / 1000,
                duration: (Number(endMs) - Number(startMs)) / 1000,
            });
        }
    }

    if (segments.length === 0) throw new Error('Innertube returned empty transcript');
    return segments;
};

// ── Method 2: youtube-transcript npm package ──────────────────────────────────
const fetchViaPackage = async (videoId, lang) => {
    const opts = lang ? { lang } : {};
    try {
        const result = await YoutubeTranscript.fetchTranscript(videoId, opts);
        if (result && result.length > 0) return result;
        throw new Error('Empty result');
    } catch {
        if (lang) {
            const result = await YoutubeTranscript.fetchTranscript(videoId);
            if (result && result.length > 0) return result;
        }
        throw new Error('Package fetch failed');
    }
};

// ── Public function: try Innertube first, fall back to npm package ─────────────
const fetchTranscriptFromYouTube = async (videoId, lang) => {
    // 1. Try Innertube (works on cloud servers — uses YouTube's own app API)
    try {
        const result = await fetchViaInnertube(videoId);
        console.log(`[Transcript] Innertube succeeded for ${videoId} (${result.length} segments)`);
        return result;
    } catch (e) {
        console.warn(`[Transcript] Innertube failed for ${videoId}: ${e.message}`);
    }

    // 2. Fall back to npm package
    try {
        const result = await fetchViaPackage(videoId, lang);
        console.log(`[Transcript] npm package succeeded for ${videoId}`);
        return result;
    } catch (e) {
        console.warn(`[Transcript] npm package failed for ${videoId}: ${e.message}`);
    }

    throw new Error('Transcript not available for this video. The video may not have captions enabled.');
};

module.exports = { fetchTranscriptFromYouTube };
