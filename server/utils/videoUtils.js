const parseDuration = (isoDuration) => {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    return (hours * 3600) + (minutes * 60) + seconds;
};

const parseChapters = (description) => {
    if (!description) return [];

    // Regex to match timestamps like 0:00, 05:30, 1:05:30
    // It looks for time patterns at the start of a line or surrounded by whitespace
    const timeRegex = /(?:^|\s)(\d{1,2}:)?(\d{1,2}):(\d{2})(?:\s|$)/g;

    // We'll iterate line by line for better context matching
    const lines = description.split('\n');
    const chapters = [];

    lines.forEach(line => {
        // Simple match: Look for time at start or very early in the line
        // E.g. "0:00 Intro" or "Intro - 0:00"

        // Strategy: Find the first timestamp in the line
        const match = line.match(/(\d{1,2}:)?(\d{1,2}):(\d{2})/);

        if (match) {
            const timeString = match[0];
            const hours = parseInt(match[1] ? match[1].replace(':', '') : 0);
            const minutes = parseInt(match[2]);
            const seconds = parseInt(match[3]);

            const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

            // Extract title: Remove the timestamp and any separator
            let title = line.replace(timeString, '').trim();
            // Clean up leading/trailing dashes/parens
            title = title.replace(/^[-–—|()[\]]+|[-–—|()[\]]+$/g, '').trim();

            if (title) {
                chapters.push({
                    title,
                    timestamp: timeString,
                    seconds: totalSeconds
                });
            }
        }
    });

    return chapters;
};

module.exports = { parseDuration, parseChapters };
