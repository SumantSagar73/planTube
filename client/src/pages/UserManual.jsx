import { useState } from 'react';
import { BookOpen, Play, Users, Brain, Zap, Trophy, BarChart2, Settings, HelpCircle, ChevronDown, ChevronRight, Keyboard, Bell, Star, Calendar, Lock } from 'lucide-react';

const SECTIONS = [
    {
        id: 'getting-started',
        icon: <Play size={18} />,
        title: 'Getting Started',
        content: `
**Sign Up / Log In**
Create a free account at the Sign Up page. Your data is tied to your account — progress, notes, and settings sync across devices.

**Import a Playlist**
1. Go to **Import** in the top navigation
2. Paste any YouTube playlist URL (public or unlisted)
3. PlanTube fetches all video metadata via YouTube Data API
4. Your playlist appears on the Dashboard

**Start Watching**
Click any video thumbnail to open **Focus Mode** — a distraction-free player with all study tools in one place.
        `,
    },
    {
        id: 'focus-mode',
        icon: <Zap size={18} />,
        title: 'Focus Mode',
        content: `
**Overview**
Focus Mode is the core of PlanTube. It strips away all distractions and puts every study tool within reach.

**Layout**
- **Left rail** — chapter list, playlist queue, AI tools, resources
- **Player** — YouTube embed with custom controls below
- **Right sidebar** — notes, flashcards, watch party

**Playback Controls**
- Space — play / pause
- ← / → — seek 5 seconds
- [ / ] — skip to previous / next video
- M — mute / unmute
- F — fullscreen
- S — cycle speed (1× → 1.25× → 1.5× → 2×)

**Mobile Controls**
On phones and tablets, the bottom bar shows 4 quick actions. Tap ⋯ to open a sheet with all remaining tools — no scrolling through tiny icons.

**Volume & Speed Persistence**
Your last volume level and playback speed are remembered across sessions. Set it once, forget it.

**Zen / Hide UI**
Press H or click "Hide UI" in the ⋯ sheet to remove all overlays and watch in pure fullscreen. Move the mouse to bring controls back.
        `,
    },
    {
        id: 'scheduling',
        icon: <Calendar size={18} />,
        title: 'Scheduling & Spaced Repetition',
        content: `
**How Scheduling Works**
PlanTube uses the **SM-2 algorithm** (the same one used by Anki) to calculate optimal review intervals for videos.

When you finish a video:
1. Rate it: Easy / Medium / Hard
2. SM-2 calculates the next review date based on your rating and how many times you've reviewed it
3. The video appears in your schedule on the correct day

**Calendar View**
The calendar on your Dashboard shows all scheduled videos. Overdue items appear in red. Completed items are crossed out.

**Mark as Complete**
Click the checkmark button in Focus Mode (or press C) to mark the current video complete. This triggers the next-review calculation.

**Manual Scheduling**
You can drag videos to different days or right-click to set a custom date.
        `,
    },
    {
        id: 'ai-tools',
        icon: <Brain size={18} />,
        title: 'AI Tools',
        content: `
PlanTube's AI tools use the current video's transcript as context, so answers are specific to what you're watching.

**AI Chat**
Ask anything about the video. Examples:
- "Explain the concept at 5:32 in simpler terms"
- "Give me 3 real-world examples of what was just explained"
- "What are the key takeaways from this section?"

**AI Flashcards**
Generates a deck of Q&A flashcards from the video content. Review them in the sidebar with a flip-card animation.

**AI Quiz**
Creates multiple-choice questions. Each wrong answer shows an explanation pulled from the transcript.

**Brainstorm**
Open-ended idea generation based on the video topic — useful for project ideas, essay outlines, or study questions.

*Note: AI tools require an active transcript. Videos without auto-generated captions may not support AI features.*
        `,
    },
    {
        id: 'notes',
        icon: <BookOpen size={18} />,
        title: 'Notes',
        content: `
**Timestamped Notes**
Click the timestamp badge before typing to pin a note to the current video position. Click any timestamp later to jump to that moment.

**Note Types**
- Regular text notes
- Code blocks (triple backtick)
- Bullet lists

**Saving**
Notes auto-save as you type. They're stored per-video on the server and available on any device.

**Export**
You can copy all notes for a video as Markdown — useful for Obsidian, Notion, or any note-taking app.
        `,
    },
    {
        id: 'watch-party',
        icon: <Users size={18} />,
        title: 'Watch Party',
        content: `
**Host a Party**
1. Open any video in Focus Mode
2. Click the Watch Party button (Users icon) in the sidebar or controls
3. Click **Create Room** — you get a 6-character room code
4. Share the **invite link** (copy link button) or the code with friends

**Join a Party**
1. Open the Watch Party panel (no need to find the video first)
2. Type the room code — a **preview card** appears showing the video thumbnail, title, and how many people are watching
3. Click **Go & Join** — you're automatically taken to the right video and joined to the party

**Host Controls**
Only the host can control playback. Use **Sync Play** and **Sync Pause** to broadcast your position to all guests. Guests' players follow automatically.

**Reactions**
Send emoji reactions (👍 🔥 💡 😮 ❤️ 🎉) — they float up on everyone's screen in real time.

**Note:** Watch party requires a stable internet connection. Socket reconnects happen automatically.
        `,
    },
    {
        id: 'gamification',
        icon: <Trophy size={18} />,
        title: 'XP, Streaks & Achievements',
        content: `
**XP & Levels**
You earn XP for:
- Completing a video
- Maintaining a daily streak
- Unlocking achievements
- Participating in watch parties

Your level badge appears on your profile and the leaderboard.

**Daily Streaks**
Watch at least one video per day to keep your streak alive. Streaks reset at midnight (your local time). A freeze item can save a missed day (coming soon).

**Achievements**
PlanTube evaluates 15+ achievement types automatically, including:
- First video watched
- 7-day streak
- 100 videos completed
- First watch party hosted
- AI power user (100 AI queries)

Achievements show on your public profile.

**Leaderboard**
The leaderboard at **/leaderboard** ranks all users by XP. Filter by weekly or all-time. Click any user to view their public profile.
        `,
    },
    {
        id: 'groups',
        icon: <Users size={18} />,
        title: 'Study Groups',
        content: `
**Create a Group**
Go to **Groups** in the nav. Click "Create Group", set a name and description. You become the group admin.

**Invite Members**
Share the group invite code or link. Members can join from the Groups page.

**Group Playlists**
Add any of your playlists to a group. Members can see each other's progress on every video in the playlist.

**Group Progress View**
Click a group playlist to see a grid: rows are videos, columns are members. Green = complete, partial = in progress, grey = not started.
        `,
    },
    {
        id: 'library',
        icon: <BookOpen size={18} />,
        title: 'Library',
        content: `
**Your Library**
The Library page shows every video you've interacted with — watched, scheduled, bookmarked, or completed.

**Filters**
- Status: all / in progress / completed / scheduled
- Playlist: filter to a specific playlist
- Date range

**Heatmap**
The activity heatmap (GitHub-style) shows your daily watch activity for the past year. Darker = more videos watched that day.

**Continue Watching**
The Dashboard surface "Continue Watching" section pulls from Library — videos you've started but not finished, sorted by recency.
        `,
    },
    {
        id: 'notifications',
        icon: <Bell size={18} />,
        title: 'Notifications',
        content: `
**Types**
- **Achievement** — when you unlock a badge
- **Social** — group invites, watch party invitations
- **Reminder** — scheduled video due today
- **Admin** — system announcements
- **System** — account events (password changed, etc.)

**Real-Time**
Notifications arrive via Socket.io — no page refresh needed.

**Notification Center**
Click the bell icon to open the full Notification Center. Mark individual items read or clear all at once.
        `,
    },
    {
        id: 'settings',
        icon: <Settings size={18} />,
        title: 'Profile & Settings',
        content: `
**Profile**
Your profile at **/profile** shows:
- Level badge and XP bar
- Achievement showcase
- Watch stats (total hours, videos completed)
- Study streak

**Public Profile**
If enabled by an admin, your profile is publicly accessible at **/profile/:username**. You can link it in your portfolio.

**Theme**
Toggle between dark and light mode using the sun/moon icon in the navbar. Your preference is saved to your account.

**Password**
Change your password from the Profile page. PlanTube uses bcrypt hashing — passwords are never stored in plain text.
        `,
    },
    {
        id: 'admin',
        icon: <Lock size={18} />,
        title: 'Admin Panel',
        content: `
*This section is for users with the admin role.*

**Feature Flags**
The Admin Command Center at **/admin** gives you global on/off control over 18 features grouped into:
- AI (chat, brainstorm, quiz, flashcards)
- Study (notes, heatmap, lock mode, spaced repetition, pomodoro)
- Social (watch party, groups, social features, public profiles)
- Gamification (achievements, leaderboard, streaks)
- Content (custom playlists, playlist sync)
- Maintenance mode (blocks all non-admin access)

**Per-User Overrides**
Search any user from the Admin panel. For each feature flag you can set:
- **FORCED ON** — always enabled for that user regardless of global setting
- **GLOBAL** — follows the global flag
- **FORCED OFF** — always disabled for that user

Useful for beta access, support debugging, and A/B testing.

**Impersonation (Shadow Mode)**
Click "Impersonate" on any user to browse the site as that user. A banner shows you're in shadow mode. All actions are logged. Click "Exit Shadow" to return.

**Audit Log**
All admin actions (flag changes, impersonation, announcements) are written to the audit log.
        `,
    },
    {
        id: 'keyboard-shortcuts',
        icon: <Keyboard size={18} />,
        title: 'Keyboard Shortcuts',
        content: null,
        shortcuts: [
            { key: 'Space', action: 'Play / Pause' },
            { key: '←', action: 'Seek back 5 seconds' },
            { key: '→', action: 'Seek forward 5 seconds' },
            { key: '[', action: 'Previous video in playlist' },
            { key: ']', action: 'Next video in playlist' },
            { key: 'M', action: 'Toggle mute' },
            { key: 'F', action: 'Toggle fullscreen' },
            { key: 'S', action: 'Cycle playback speed' },
            { key: 'C', action: 'Mark current video complete' },
            { key: 'N', action: 'Focus notes input' },
            { key: 'H', action: 'Hide / show UI (Zen mode)' },
            { key: 'L', action: 'Toggle Focus Lock (prevents accidental navigation)' },
            { key: '?', action: 'Open keyboard shortcuts help' },
        ],
    },
    {
        id: 'troubleshooting',
        icon: <HelpCircle size={18} />,
        title: 'Troubleshooting',
        content: `
**Video won't load**
- Check your internet connection
- Try refreshing — YouTube embeds occasionally time out on the first load
- If a playlist is private, it can't be imported. Use public or unlisted playlists.

**AI tools return no response**
- The video may not have auto-generated captions. Manually-uploaded caption files are not supported yet.
- Verify the AI feature is enabled in your account (ask an admin if you can't see it).

**Watch party guests can't join**
- Make sure the host created the room first (the room only exists while the host is in Focus Mode)
- Codes are case-insensitive — both ABC123 and abc123 work
- If the room preview shows a different video, clicking "Go & Join" takes you to the right one automatically

**Progress not saving**
- Progress syncs every 10 seconds while playing. If you close the tab immediately, the last few seconds may not save.
- Check that you're logged in — guest sessions don't sync to the server.

**Notifications not appearing**
- If you've been on the same page for a long time, try refreshing to re-establish the socket connection.

**Contact / Feedback**
Use the **Feedback** page (in the navbar) to report a bug or suggest a feature. We read every submission.
        `,
    },
];

const renderContent = (text) => {
    if (!text) return null;
    return text.trim().split('\n').map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
            return <h4 key={i} style={{ color: 'white', fontWeight: 800, margin: '1.1rem 0 0.3rem', fontSize: '0.92rem' }}>{line.replace(/\*\*/g, '')}</h4>;
        }
        if (line.startsWith('- ')) {
            return <li key={i} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.7, marginLeft: '1rem' }}>{line.slice(2).replace(/\*\*([^*]+)\*\*/g, (_, t) => `<strong style="color:white">${t}</strong>`)}</li>;
        }
        if (/^\d+\./.test(line)) {
            return <li key={i} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.7, marginLeft: '1.2rem', listStyle: 'decimal' }}>{line.replace(/^\d+\.\s/, '').replace(/\*\*([^*]+)\*\*/g, (_, t) => `<strong>${t}</strong>`)}</li>;
        }
        if (line.startsWith('*Note:')) {
            return <p key={i} style={{ color: 'rgba(165,180,252,0.8)', fontSize: '0.78rem', fontStyle: 'italic', margin: '0.5rem 0' }}>{line.replace(/^\*Note:/, 'Note:').replace(/\*$/, '')}</p>;
        }
        if (line === '') return <div key={i} style={{ height: '0.35rem' }} />;
        return <p key={i} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.7, margin: '0.2rem 0' }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:white">$1</strong>') }} />;
    });
};

const Section = ({ section }) => {
    const [open, setOpen] = useState(true);

    return (
        <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.95rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
                <span style={{ color: '#818cf8' }}>{section.icon}</span>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '1rem', flex: 1 }}>{section.title}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
            </button>

            {open && (
                <div style={{ padding: '0 1.25rem 1.25rem' }}>
                    {section.shortcuts ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', fontWeight: 700, padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>KEY</th>
                                    <th style={{ textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', fontWeight: 700, padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {section.shortcuts.map(s => (
                                    <tr key={s.key}>
                                        <td style={{ padding: '0.5rem 0.5rem 0.5rem 0' }}>
                                            <kbd style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.78rem', color: '#a5b4fc', fontFamily: 'monospace', fontWeight: 700 }}>{s.key}</kbd>
                                        </td>
                                        <td style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', padding: '0.5rem 0' }}>{s.action}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div>{renderContent(section.content)}</div>
                    )}
                </div>
            )}
        </div>
    );
};

const UserManual = () => {
    const [search, setSearch] = useState('');

    const filtered = search
        ? SECTIONS.filter(s =>
            s.title.toLowerCase().includes(search.toLowerCase()) ||
            (s.content || '').toLowerCase().includes(search.toLowerCase())
        )
        : SECTIONS;

    return (
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '30px', padding: '0.4rem 1rem', marginBottom: '1rem' }}>
                    <BookOpen size={14} color="#818cf8" />
                    <span style={{ fontSize: '0.78rem', color: '#a5b4fc', fontWeight: 700 }}>User Manual</span>
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', margin: '0 0 0.5rem' }}>PlanTube Documentation</h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto' }}>
                    Everything you need to get the most out of PlanTube — from importing your first playlist to hosting a synchronized watch party.
                </p>
            </div>

            {/* Search */}
            <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search documentation..."
                style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', color: 'white', padding: '10px 16px',
                    fontSize: '0.9rem', marginBottom: '1.75rem',
                    outline: 'none',
                }}
            />

            {/* Sections */}
            {filtered.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '3rem 0' }}>No results for "{search}"</p>
            ) : (
                filtered.map(section => <Section key={section.id} section={section} />)
            )}

            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', marginTop: '2rem' }}>
                PlanTube User Manual · Last updated June 2025 · <a href="/feedback" style={{ color: '#818cf8' }}>Send feedback</a>
            </p>
        </div>
    );
};

export default UserManual;
