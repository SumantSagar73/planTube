const { YoutubeTranscript } = require('youtube-transcript');

async function test(id) {
    console.log(`Testing video ID: ${id}`);
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(id);
        console.log(`Successfully fetched ${transcript.length} lines`);
        // console.log(transcript.slice(0, 2));
    } catch (e) {
        console.error(`Error for ${id}:`, e.message);
    }
}

async function run() {
    await test('dQw4w9WgXcQ'); // Rick Astley - Never Gonna Give You Up
    await test('M7lc1UVf-VE'); // YouTube Developers
}

run();
