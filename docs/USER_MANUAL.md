# PlanTube — User Manual

**Version:** 1.0 · **Last updated:** June 2026  
**Live app:** https://plantube.vercel.app

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Importing YouTube Playlists](#2-importing-youtube-playlists)
3. [Focus Mode](#3-focus-mode)
4. [Scheduling Videos](#4-scheduling-videos)
5. [Dashboard](#5-dashboard)
6. [Gamification — XP, Streaks & Achievements](#6-gamification--xp-streaks--achievements)
7. [Leaderboard](#7-leaderboard)
8. [Study Groups](#8-study-groups)
9. [Watch Party](#9-watch-party)
10. [AI Features](#10-ai-features)
11. [Custom Playlists](#11-custom-playlists)
12. [Social & Friends](#12-social--friends)
13. [Notifications](#13-notifications)
14. [Profile & Settings](#14-profile--settings)
15. [Admin Panel](#15-admin-panel)
16. [Keyboard Shortcuts](#16-keyboard-shortcuts)
17. [Troubleshooting](#17-troubleshooting)

---

## 1. Getting Started

### Creating an Account

1. Go to **https://plantube.vercel.app** and click **Sign Up**.
2. Enter your name, a unique username, email, and password.
3. Click **Create Account**. You'll be taken straight to your Dashboard.

> **Note:** Usernames are permanent and used in your public profile URL (`/user/yourname`). Choose carefully.

### Logging In

1. Click **Login** on the home page.
2. Enter your email and password.
3. Your session persists in the browser — you won't need to log in again unless you clear your data.

### First-Time Setup

After signing up, you'll land on the Dashboard. The fastest way to get started:

1. Click **Import Playlist** in the sidebar or top navigation.
2. Paste a YouTube playlist URL.
3. Click **Import** — the platform pulls all video titles, durations, and thumbnails automatically.
4. Open any video to enter **Focus Mode** and start learning.

---

## 2. Importing YouTube Playlists

### How to Import

1. Find any YouTube playlist and copy its URL.  
   Accepted formats:
   - `https://www.youtube.com/playlist?list=PLxxxxxxx`
   - `https://youtube.com/watch?v=xxx&list=PLxxxxxxx`
   - Just the playlist ID: `PLxxxxxxx`

2. Go to **Import** in the sidebar.
3. Paste the URL into the input field and click **Import Playlist**.
4. Wait a few seconds — the system fetches all videos, titles, thumbnails, and durations from YouTube.

### What Gets Imported

| Data | Imported |
|------|---------|
| Playlist title & description | ✓ |
| Thumbnail | ✓ |
| All video titles | ✓ |
| Video durations | ✓ |
| Channel name | ✓ |
| Your watch progress | Not yet — starts fresh |

### Syncing an Updated Playlist

If the original YouTube playlist has new videos added:

1. Open the playlist from **My Playlists**.
2. Click the **Sync** button (refresh icon near the playlist header).
3. New videos are added; removed videos are soft-deleted (your notes on them are preserved).

> **Tip:** Sync only works if the feature flag `feat_playlist_sync` is enabled by the admin.

### Playlist Limits

There's no hard limit on how many playlists you can import. Very large playlists (500+ videos) may take 10–15 seconds to import due to YouTube API pagination.

---

## 3. Focus Mode

Focus Mode is the core study environment. It strips away all distractions and gives you a clean player with everything you need to learn effectively.

### Entering Focus Mode

- Click any video thumbnail in a playlist → opens Focus Mode for that video.
- From the Dashboard's **Continue Watching** widget → resumes where you left off.
- From the sidebar of an open playlist → click any video row.

### Layout Overview

```
┌─────────────────────────────────────────────────────┐
│  Top Bar — playlist title · progress · exit button  │
├────────────┬────────────────────────────────────────┤
│            │                                        │
│  Sidebar   │         Video Player (YouTube)         │
│  (tabs)    │                                        │
│            │                                        │
│            ├────────────────────────────────────────┤
│            │  Progress bar · playback controls      │
└────────────┴────────────────────────────────────────┘
```

### Sidebar Tabs

| Tab | What it does |
|-----|-------------|
| **Playlist** | Full video list with completion checkmarks. Click any video to jump to it. |
| **Chapters** | Video chapter markers (if the video has them). Click to jump to that section. |
| **Notes** | Timestamped note editor. Notes are saved per video. |
| **AI Chat** | Ask the AI anything about the current video (powered by the video's transcript). |
| **Brainstorm** | AI generates a learning roadmap / mind map for the topic. |
| **Flashcards** | AI creates study flashcards from the video content. |
| **Resources** | Links and references related to the video topic. |
| **About** | Video description from YouTube. |
| **Watch Party** | Synchronized co-watching with friends. |

You can hide the sidebar entirely by clicking the arrow toggle or pressing **B** on your keyboard.

### Playback Controls

**Desktop:**
- **Speed button** (e.g. `1x`) — cycles through 1×, 1.25×, 1.5×, 2×. Your speed preference is remembered across sessions.
- **Volume slider** — drag left/right. Volume is remembered across sessions.
- **⏮ / ⏭** — previous / next video in the playlist.
- **▶ / ⏸** — play / pause (or press `Space`).
- **Fullscreen** — expand player to fill the screen.
- **Lock** — locks all controls so you can't accidentally skip (useful on touchscreens).
- **Mark Complete** — marks the video as done and logs it to your progress.
- **⋯ More** — extra options: Hide UI, Watch on YouTube, Resources, About.

**Mobile / Tablet:**
- The same progress bar and ⏮ ▶ ⏭ navigation buttons are shown.
- **Mark** · **Fullscreen** · **Lock** · **⋯** are shown as a compact row.
- Tap **⋯** to open a **bottom sheet** with all other options (Notes, AI, Chapters, Playlist, Watch Party, etc.) organized as a grid — no horizontal scrolling.

### Taking Notes

1. Open the **Notes** tab in the sidebar.
2. Type your note. A timestamp is automatically attached showing the current playback position.
3. Notes auto-save as you type (debounced — no manual save needed).
4. Click any timestamp in your notes to jump back to that moment in the video.

### Marking Videos Complete

- Click **Mark Complete** (or **Done** if already marked) in the player controls.
- The video gets a green checkmark in the Playlist sidebar.
- Your XP increases, and the achievement system checks for any unlocks.
- You can un-mark a video by clicking **Done** again.

### Pomodoro Timer

1. Open the **Agenda** tab in the sidebar.
2. Start the Pomodoro timer (25-minute focus session).
3. When the timer ends, you get a notification and the option to start a 5-minute break.

### Focus Lock Mode

Tap the **Lock** icon to enable Focus Lock. While locked:
- Seeking, speed changes, and sidebar navigation are all disabled.
- Only Play/Pause and the unlock button remain active.
- Use this to prevent yourself from skipping ahead.

### Hiding the UI

- Press **H** or click **Hide UI** in the ⋯ menu.
- All controls disappear, leaving only the video.
- Move your mouse (desktop) or tap (mobile) to bring controls back.

---

## 4. Scheduling Videos

### What is Scheduling?

Scheduling lets you assign videos to specific dates so you study in a planned, structured way instead of binge-watching randomly.

### Scheduling a Video

1. Open a playlist and find the video you want to schedule.
2. Click the **calendar icon** next to the video.
3. Pick a date and optional time.
4. Click **Schedule**. The video will appear on your dashboard agenda for that day.

### Calendar View

- Go to a playlist and switch to **Calendar View** (calendar icon in the header).
- Dates with scheduled videos show colored dots.
- Click any date to see what's scheduled.

### Spaced Repetition (Auto-Review)

When you complete a video, PlanTube can automatically schedule a review:

1. After marking a video complete, you'll see a **Rate your recall** prompt (1–5 scale).
2. The system uses the **SM-2 algorithm** to calculate when you should review it:
   - Rated it easy (4–5)? Review pushed out by days or weeks.
   - Rated it hard (1–2)? Review scheduled for tomorrow.
3. Review sessions appear on your dashboard under **Due for Review**.

> **Tip:** If you skip a review, it stays in the queue. It doesn't disappear.

---

## 5. Dashboard

Your Dashboard is the home screen you see after logging in. It has several widgets:

| Widget | Purpose |
|--------|---------|
| **Daily Agenda** | Today's scheduled videos, in order. Click to open in Focus Mode. |
| **Continue Watching** | Your most recently played videos with % progress. |
| **Due for Review** | Spaced repetition videos that are due today. |
| **Weekly Goal** | Progress toward your weekly focus time or video-count goal. |
| **Active Library** | Your most recently active playlists. |
| **Activity Heatmap** | GitHub-style grid showing daily focus minutes over the past year. |

### Setting a Weekly Goal

1. Go to **Profile → Preferences**.
2. Set your goal type (hours or videos) and target number.
3. The weekly goal widget on your dashboard tracks progress toward it.

---

## 6. Gamification — XP, Streaks & Achievements

### XP (Experience Points)

You earn XP for everything you do on PlanTube:

| Action | XP Earned |
|--------|----------|
| Complete a video | +50 XP |
| Unlock an achievement | Varies (25–500 XP) |
| Maintain a daily streak | +25 XP/day |

Your total XP converts to a **Level**: every 500 XP = 1 level.

### Daily Streaks

- A streak counts for each day you complete at least one video or study session.
- If you miss a day, your streak resets to 0.
- Your **best-ever streak** is always preserved in your profile even after a reset.

> **Tip:** The streak resets at midnight UTC. If you're in a different timezone, plan accordingly.

### Achievements

Achievements are automatically unlocked when you hit certain milestones. You don't need to do anything manually.

| Achievement | How to unlock |
|-------------|--------------|
| First Watch | Complete your first video |
| Binge Watcher | Complete 10 videos |
| On Fire | Maintain a 7-day streak |
| Scholar | Accumulate 10 hours of focus time |
| Social Bee | Add 5 friends |
| Centurion | Complete 100 videos |
| Speed Runner | Complete a full playlist in one sitting |

When you unlock an achievement, you'll see a toast notification and a confetti animation. The achievement is added to your profile page.

### Levels

Your level is shown on your profile, the leaderboard, and in any group you're part of.

```
Level  1 →   0 – 499 XP
Level  2 → 500 – 999 XP
Level  3 → 1000 – 1499 XP
...and so on (every 500 XP = 1 level)
```

---

## 7. Leaderboard

The Leaderboard ranks all users whose profiles are set to **Public**.

### Viewing the Leaderboard

1. Click **Leaderboard** in the sidebar.
2. Switch between tabs: **XP** · **Streaks** · **Focus Time**.
3. Your own rank is highlighted in the list even if you're not in the top 10.

### Getting on the Leaderboard

1. Go to **Profile → Settings**.
2. Toggle **Public Profile** to ON.
3. You'll now appear in the leaderboard rankings.

---

## 8. Study Groups

Groups let you study with others — share playlists, track each other's progress, and stay motivated together.

### Creating a Group

1. Go to **Groups** in the sidebar.
2. Click **Create Group**.
3. Enter a group name, optional description, and choose Public or Private.
4. Your group is created with a unique **invite code** (e.g. `XK9M2P`).

### Joining a Group

1. Get an invite code from a group member.
2. Go to **Groups → Join Group**.
3. Enter the code and click **Join**.

### Sharing a Playlist with a Group

1. Open your group's page.
2. Click **Share Playlist**.
3. Select one of your imported playlists.
4. All group members receive a notification and can now see it under the group.

### Viewing Group Progress

1. Open the group → click on any shared playlist.
2. You'll see a progress bar for every member showing their completion percentage.
3. This updates in real time as members complete videos.

### Group Roles

| Role | Permissions |
|------|------------|
| **Owner** | Manage members, share/remove playlists, delete group |
| **Member** | View shared playlists, see progress, share playlists |

---

## 9. Watch Party

Watch Party lets multiple people watch the **exact same video** in sync. The host controls playback; guests follow automatically.

### Starting a Watch Party (Host)

1. Open a video in Focus Mode.
2. Open the **Watch Party** tab in the sidebar (or tap ⋯ → Party on mobile).
3. Click **Create Room (Host)**.
4. Share the 6-character **room code** with your friends.

### Joining a Watch Party (Guest)

1. Open the **same video** in Focus Mode. *(You must be on the matching video — joining is rejected if you're on a different one.)*
2. Open **Watch Party** and enter the room code in the **Enter room code** field.
3. Click **Join**. Your player instantly syncs to the host's current time.

### Host Controls

As host, you control everyone's playback:
- **Sync Play** — starts the video for everyone at your current timestamp.
- **Sync Pause** — pauses everyone at the same moment.
- Seeking the video automatically syncs guests.

### Reactions

While in a party, click any reaction button (👍 🎉 🔥 💡 😮 ❤️) to send a floating emoji to everyone in the room.

### Leaving a Watch Party

Click **Leave Party** in the Watch Party panel. The room continues for remaining members.

> **Important:** If the host leaves, the room is closed and all guests are removed.

---

## 10. AI Features

PlanTube has an AI tutor built into Focus Mode, powered by the video's YouTube transcript.

> **Note:** All AI features can be individually toggled by admins. If a tab is missing, the feature may be disabled on your account.

### AI Chat

1. Open any video in Focus Mode.
2. Click the **AI Chat** tab in the sidebar.
3. Type any question about the video content.
4. The AI answers using the video's transcript as context.

Example prompts:
- *"Explain dynamic programming in simple terms"*
- *"What's the difference between BFS and DFS?"*
- *"Summarize the key points from this video"*

### AI Quiz Questions

1. Open the **AI Chat** tab.
2. Type: *"Generate 5 quiz questions about this video"*
3. The AI returns multiple-choice or open-ended questions for active recall practice.

### AI Flashcards

1. Click the **Flashcards** tab in the sidebar.
2. Click **Generate Flashcards**.
3. The AI reads the transcript and creates front/back flashcard pairs.
4. Flip through cards in the built-in card viewer.

### AI Brainstorm / Roadmap

1. Click the **Brainstorm** tab.
2. The AI generates a structured learning roadmap for the video's topic — showing what to study before and after this content.

---

## 11. Custom Playlists

Custom Playlists let you curate your own collections by picking videos from any of your imported playlists.

### Creating a Custom Playlist

1. Go to **My Playlists → Create Custom Playlist**.
2. Give it a name and optional description.
3. Choose **Public** (shareable via link) or **Private**.

### Adding Videos

1. Open your custom playlist.
2. Click **Add Video**.
3. Search through your imported videos and select ones to add.

### Reordering Videos

- Drag and drop videos in the list to reorder them.
- Order is saved automatically.

### Sharing a Custom Playlist

If your playlist is set to **Public**:
1. Click the **Share** button on the playlist page.
2. Copy the link (format: `/playlist/public/xxxxxxxxxx`).
3. Anyone with the link can view the playlist — no login required.
4. They can also **Clone** it to their own account with one click.

---

## 12. Social & Friends

### Sending a Friend Request

1. Go to someone's **Public Profile** (search or find them on the Leaderboard).
2. Click **Add Friend**.
3. They receive a notification and can accept or decline.

### Accepting a Friend Request

1. Click the **bell icon** in the top navigation.
2. Find the friend request notification.
3. Click **Accept** or **Decline**.

Alternatively, go to **Social → Friend Requests** to see all pending requests.

### Blocking a User

1. Go to their Public Profile.
2. Click **⋯ → Block**.
3. They can no longer see your profile, send requests, or invite you to groups.

### Public Profiles

Any user with **Public Profile** enabled has a shareable profile page showing:
- Name, level, and XP
- Current streak and best streak
- Unlocked achievement badges
- Recently active playlists

To make your profile public: **Profile → Settings → Public Profile → ON**.

---

## 13. Notifications

### Notification Types

| Category | What triggers it |
|----------|-----------------|
| **Achievement** | You unlock an achievement or earn XP |
| **Social** | Friend request sent/accepted, group invite |
| **Reminder** | A scheduled video is due today |
| **Admin** | Platform announcement from an admin |
| **System** | Maintenance alerts, account updates |

### Viewing Notifications

Click the **bell icon** in the top navigation bar. The badge shows your unread count.

For the full inbox, click **View All** → opens the **Notification Center** page with:
- Tabs to filter by category
- Mark all as read
- Archive old notifications

### Real-time Delivery

Notifications arrive instantly via WebSocket — you don't need to refresh the page. The bell badge increments immediately when a new notification arrives.

---

## 14. Profile & Settings

### Editing Your Profile

1. Click your avatar (top-right) → **Profile**.
2. Click **Edit Profile**.
3. You can update: name, motto, theme color, study time preferences, timezone, weekly goal, and profile visibility.

### Study Preferences

In your profile settings, you can configure:

| Setting | What it does |
|---------|-------------|
| **Daily Study Time** | Your preferred study window (e.g. 6pm–8pm). Used for scheduling suggestions. |
| **Videos Per Day** | Target number of videos to watch daily. |
| **Max Watch Time** | Daily cap in minutes. Dashboard warns when you approach it. |
| **Timezone** | Used for streak calculation and scheduling. |
| **Weekly Goal** | Hours or videos per week. Tracked on the dashboard widget. |

### Changing Theme

1. Click the **Theme** icon in the navigation (sun/moon or palette icon).
2. Choose **Dark** or **Light**, or pick a color accent.
3. Theme is saved to your browser and persists across sessions.

### Deleting Your Account

1. Go to **Profile → Settings → Danger Zone**.
2. Click **Request Account Deletion**.
3. Your account is flagged for deletion. An admin reviews and completes the deletion, which removes all your data.

---

## 15. Admin Panel

> **This section is only relevant if you have the `admin` role.**

### Accessing the Admin Panel

Click **Admin** in the sidebar navigation (only visible to admins).

### Command Center — Feature Flags

The Command Center is where you control what features are available on the platform.

**Global Flags** — affect all users:
- Toggle any of the 18 feature flags ON or OFF.
- Changes take effect within 30 seconds for all active users (the client polls every 30s).

**Per-User Overrides** — override flags for one specific user:
1. Search for a user by name or email.
2. Each feature shows a **3-way toggle**: `ON` · `GLOBAL` · `OFF`
   - **ON** — force-enables this feature for the user regardless of the global setting.
   - **GLOBAL** — remove the override; user inherits the global flag.
   - **OFF** — force-disables the feature for the user even if globally enabled.

Use cases: give a beta tester early access to a feature, disable AI features for a specific user, grant a support agent access to a disabled feature for debugging.

### User Management

Go to **Admin → Users**:

| Action | How |
|--------|-----|
| Search users | Search by name, email, or username |
| Freeze account | Toggle Freeze — user can't log in or make progress |
| Change role | Set to user / moderator / support / admin |
| Delete account | Permanent cascade delete of all user data |
| Impersonate | Shadow mode — browse the app as that user |
| Bulk actions | Select multiple users → Freeze / Unfreeze / Delete / Set Role |

### Impersonation (Shadow Mode)

1. Find the user in Admin → Users.
2. Click **Impersonate**.
3. A banner appears: *"Viewing as [username] — Exit Shadow Mode"*.
4. All your actions are logged to the Audit Log with your admin ID.
5. Click **Exit Shadow Mode** to return to your own account.

### Broadcasting Notifications

1. Go to **Admin → Notifications → Broadcast**.
2. Write a title and message.
3. Choose priority (Low / Medium / High / Urgent).
4. Click **Send** — all users receive the notification instantly.

### Audit Log

Every admin action is recorded:
- Go to **Admin → Security → Audit Log**.
- Filter by action type, date range, or admin user.
- Each entry shows: who did it, what they did, which user/resource was affected, and the IP address.

### Maintenance Mode

1. Go to **Admin → Command Center → Danger Zone**.
2. Toggle **Global Maintenance Mode** ON (requires confirmation).
3. All non-admin users see a maintenance screen and cannot use the platform.
4. Toggle OFF when done.

To schedule maintenance in advance: use the **Scheduled Maintenance Window** section to set a date, duration, and message.

### A/B Tests

1. Go to **Admin → A/B Tests**.
2. Click **Create Test**.
3. Define variant names and traffic split (e.g. 50/50).
4. Users are deterministically assigned to a variant based on their user ID hash.
5. View results in **Analytics**.

---

## 16. Keyboard Shortcuts

These shortcuts work while in **Focus Mode**.

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `→` | Seek forward 5 seconds |
| `←` | Seek back 5 seconds |
| `Shift + →` | Next video |
| `Shift + ←` | Previous video |
| `↑` | Volume up 10% |
| `↓` | Volume down 10% |
| `M` | Mute / Unmute |
| `F` | Toggle Fullscreen |
| `H` | Hide / Show UI |
| `B` | Toggle sidebar |
| `N` | Open Notes tab |
| `C` | Mark video Complete / Undone |
| `L` | Toggle Focus Lock |
| `>` | Increase playback speed |
| `<` | Decrease playback speed |
| `?` | Show keyboard shortcuts overlay |

---

## 17. Troubleshooting

### Video won't play

- Make sure the video isn't restricted by YouTube (age-restricted or region-locked videos won't embed).
- Try opening the video directly on YouTube using the **Open on YouTube** button in the ⋯ menu.
- Refresh the page and try again.

### My progress isn't saving

- Check your internet connection — progress is synced every 10 seconds during playback.
- If your account is **frozen** by an admin, progress tracking is disabled.
- Ensure the `feat_achievements` flag is enabled (contact your admin if unsure).

### Watch Party join error: "Video mismatch"

You're on a different video than the host. Open the exact same video the host is watching, then re-enter the room code.

### My streak broke but I watched a video

Streaks reset at **midnight UTC**. If you're in a timezone behind UTC, a video watched on Monday evening (your time) may count as Sunday UTC. Set your timezone in **Profile → Settings** to get accurate local-time display.

### Volume / speed reset every time I open Focus Mode

This should no longer happen after the recent update — volume and speed are now saved to your browser's local storage. If you're still seeing resets, try clearing your browser cache once and setting your preferred values again.

### The AI isn't answering questions about the video

AI Chat uses the video's YouTube transcript. If the video has no captions, the AI falls back to the title and description only — answers may be less specific. You can still ask general topic questions.

### I can't see a feature (Notes, AI, Watch Party, etc.)

The feature may be disabled globally by an admin, or disabled specifically for your account. Contact your platform admin to check your feature flags.

### I forgot my password

Currently, PlanTube does not have a self-serve password reset flow. Contact your platform admin to reset your password.

---

*PlanTube User Manual — built by Sumant Sagar*  
*For bugs or feedback, use the **Feedback** button in the sidebar.*
