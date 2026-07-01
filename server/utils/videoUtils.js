const parseDuration = (isoDuration) => {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    return (hours * 3600) + (minutes * 60) + seconds;
};

const formatDuration = (isoDuration) => {
    if (!isoDuration) return '0:00';
    // If already formatted as MM:SS or H:MM:SS
    if (isoDuration.includes(':')) return isoDuration;

    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const generateAutoMilestones = (totalSeconds) => {
    if (!totalSeconds || totalSeconds < 60) return [];

    // 1 part per 15 minutes: 30min→2, 1hr→4, 2hr→8, etc.
    const INTERVAL = 15 * 60; // 15 minutes in seconds
    const numParts = Math.round(totalSeconds / INTERVAL);
    const intervalSecs = numParts > 0 ? Math.floor(totalSeconds / numParts) : INTERVAL;

    const milestones = [];
    let currentSecs = 0;
    let count = 1;

    while (currentSecs < totalSeconds) {
        const h = Math.floor(currentSecs / 3600);
        const m = Math.floor((currentSecs % 3600) / 60);
        const s = currentSecs % 60;

        const timestamp = h > 0
            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m}:${s.toString().padStart(2, '0')}`;

        milestones.push({
            title: `Part ${count}`,
            timestamp,
            seconds: currentSecs
        });

        currentSecs += intervalSecs;
        count++;
        if (count > 200) break;
    }
    return milestones;
};

const parseChapters = (description, durationInSeconds = 0) => {
    const chapters = [];
    if (description) {
        const lines = description.split('\n');
        lines.forEach(line => {
            const match = line.match(/(\d{1,2}:)?(\d{1,2}):(\d{2})/);
            if (match) {
                const timeString = match[0];
                const hours = parseInt(match[1] ? match[1].replace(':', '') : 0);
                const minutes = parseInt(match[2]);
                const seconds = parseInt(match[3]);
                const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

                let title = line.replace(timeString, '').trim();
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
    }

    // Fallback: If no chapters found and we have a duration, generate milestones
    if (chapters.length === 0 && durationInSeconds > 0) {
        return generateAutoMilestones(durationInSeconds);
    }

    return chapters;
};

module.exports = { parseDuration, formatDuration, parseChapters, generateAutoMilestones };
