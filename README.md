# PlanTube — YouTube Learning Platform

> Turn YouTube playlists into structured, gamified, collaborative learning journeys.

<!-- BANNER IMAGE -->
<!-- 
  IMAGE PROMPT: "A sleek dark-mode web app dashboard showing a YouTube learning platform called PlanTube.
  Left sidebar with playlist navigation. Center panel with a YouTube video player in focus mode.
  Right sidebar showing notes and AI chat. Glassmorphic cards with purple-blue gradient accents.
  Shows stats like streak count, XP, progress bars. Modern UI, 2024 design aesthetic."
  
  PASTE YOUR BANNER IMAGE HERE:
  ![PlanTube Banner](./docs/images/banner.png)
-->

---

## Table of Contents

1. [What is PlanTube?](#what-is-plantube)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Feature System Designs](#feature-system-designs)
   - [Authentication System](#1-authentication-system)
   - [YouTube Playlist Import](#2-youtube-playlist-import)
   - [Focus Mode](#3-focus-mode)
   - [Video Scheduling & Spaced Repetition](#4-video-scheduling--spaced-repetition)
   - [Gamification — XP, Levels, Streaks, Achievements](#5-gamification--xp-levels-streaks-achievements)
   - [Leaderboard](#6-leaderboard)
   - [Study Groups & Collaboration](#7-study-groups--collaboration)
   - [Watch Party](#8-watch-party)
   - [Real-time Presence Tracking](#9-real-time-presence-tracking)
   - [AI Integration](#10-ai-integration)
   - [Custom Playlists](#11-custom-playlists)
   - [Social System (Friendship & Public Profiles)](#12-social-system-friendship--public-profiles)
   - [Notification System](#13-notification-system)
   - [Admin Command Center](#14-admin-command-center)
   - [Analytics Dashboard](#15-analytics-dashboard)
5. [Database Schema](#database-schema)
6. [API Reference Summary](#api-reference-summary)
7. [Real-time Architecture (Socket.io)](#real-time-architecture-socketio)
8. [Getting Started](#getting-started)
9. [Environment Variables](#environment-variables)
10. [50+ Q&A — Technical Deep Dive](#50-qa--technical-deep-dive)

---

## What is PlanTube?

PlanTube is a full-stack web application that transforms passive YouTube watching into an active, structured learning experience. Users import YouTube playlists, schedule videos on a calendar, study in a distraction-free Focus Mode, track their progress, earn XP and achievements, and collaborate with friends in real time.

**Core pillars:**
- **Plan** — Schedule YouTube videos like calendar events, powered by spaced repetition
- **Focus** — Dedicated player mode with notes, AI chat, and Pomodoro timer
- **Track** — Progress metrics, streaks, XP, and achievement badges
- **Collaborate** — Study groups, watch parties, leaderboards, friend system

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, React Router 7 |
| Styling | Custom CSS, Glassmorphic Design System |
| State Management | React Context (Auth, Theme, Settings) |
| Real-time | Socket.io (client + server) |
| HTTP Client | Axios with interceptors |
| Video Playback | react-player, react-youtube |
| Charts | Recharts |
| Icons | Lucide React |
| Animations | dotlottie-react, react-confetti |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose 9 |
| Authentication | JWT + bcryptjs |
| AI | External LLM API (aichixia.xyz) |
| Rate Limiting | express-rate-limit |
| Deployment | Vercel (frontend + serverless) |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (React + Vite)                     │
│                                                                  │
│  Pages: Dashboard, FocusMode, PlaylistDetails, Profile,          │
│         Groups, Leaderboard, Social, AdminDashboard, ...         │
│                                                                  │
│  Context: AuthContext  ThemeContext  SettingsContext             │
│                                                                  │
│  Hooks: useFocusModeData  useFocusModePlayer  useFocusModeSocket │
│         useFeatureFlags   useKeyboardShortcuts  useIsMobile      │
│                                                                  │
│  Services: api.js (Axios)   socket.js (Socket.io-client)         │
└───────────────────┬─────────────────────────────┬────────────────┘
                    │ REST (HTTP/JSON)            │ WebSocket
                    ▼                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SERVER (Express 5 + Node.js)                  │
│                                                                  │
│  Routes → Controllers → Services → Models                        │
│                                                                  │
│  Middleware: auth.js (JWT verify)   admin.js (role check)        │
│                                                                  │
│  Socket.io: presence, watch-party, notifications                 │
│                                                                  │
│  External: YouTube Data API v3   LLM API (AI features)           │
└───────────────────┬──────────────────────────────────────────────┘
                    │ Mongoose ODM
                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                     MongoDB Atlas                                  │
│  Collections: users, playlists, sharedvideos, videos,            │
│  schedules, groups, groupplaylists, customplaylists,             │
│  achievements, notifications, activities, friendships,           │
│  feedbacks, reports, adminauditlogs, systemsettings, abtests     │
└──────────────────────────────────────────────────────────────────┘
```

<!-- ARCHITECTURE DIAGRAM IMAGE -->
<!--
  IMAGE PROMPT: "Clean system architecture diagram for a web app. Three horizontal tiers:
  Top tier labeled 'React Client' with boxes for Pages, Context, Hooks, Services.
  Middle tier labeled 'Express Server' with boxes for Routes, Controllers, Socket.io, Middleware.
  Bottom tier labeled 'MongoDB Atlas' with database cylinder icon and collection names.
  Arrows showing REST API calls (dashed) and WebSocket connection (solid) between client and server.
  Arrow from server to MongoDB. Professional tech diagram style, dark background, blue/purple accents."
  
  PASTE ARCHITECTURE DIAGRAM HERE:
  ![Architecture Diagram](./docs/images/architecture.png)
-->

---

## Feature System Designs

---

### 1. Authentication System

**What it does:** Secure user registration, login, and session management using JWT tokens. Supports multiple roles: `user`, `moderator`, `support`, `admin`.

**System Design:**

```
REGISTRATION FLOW
─────────────────
Client                     Server                      MongoDB
  │                           │                            │
  │── POST /api/auth/register ─►                           │
  │   { name, email, password }│                           │
  │                           │── bcrypt.hash(password) ──►│
  │                           │── User.create({...}) ──────►│
  │                           │◄── user document ───────────│
  │                           │── jwt.sign(userId, secret) │
  │◄── { token, user } ───────│                            │
  │                           │                            │

LOGIN FLOW
──────────
  │── POST /api/auth/login ───►│                           │
  │   { email, password }      │── User.findOne(email) ───►│
  │                           │◄── user document ───────────│
  │                           │── bcrypt.compare() ────────│
  │                           │── jwt.sign(userId) ────────│
  │◄── { token, user } ───────│                            │

REQUEST AUTH (Middleware)
──────────────────────────
  │── Any protected request ──►│                           │
  │   Authorization: Bearer    │── jwt.verify(token) ─────│
  │   <token>                  │── User.findById(id) ──────►│
  │                           │◄── req.user attached ───────│
  │                           │── next() ──────────────────│
```

**Key files:**
- `server/routes/auth.js` — endpoints
- `server/controllers/authController.js` — logic
- `server/middleware/auth.js` — JWT middleware
- `server/models/User.js` — user schema (roles, XP, streak, achievements)
- `client/context/AuthContext.jsx` — client-side auth state

**Security measures:**
- Passwords hashed with bcryptjs (rounds: 10)
- JWT expiry configured via `JWT_SECRET`
- Rate limiting: 20 requests / 15 min on auth routes
- Admin impersonation logged to `AdminAuditLog`

<!-- IMAGE PROMPT: "Authentication flow diagram showing client browser on left, Express server in middle,
MongoDB on right. Arrows showing register/login POST requests, bcrypt hashing step, JWT generation,
and token storage in browser localStorage. Clean flowchart with decision diamond for password match." -->

---

### 2. YouTube Playlist Import

**What it does:** Users paste a YouTube playlist URL or ID. The server fetches full metadata from YouTube Data API v3 — title, description, thumbnail, all video titles, durations, and thumbnails — and stores them in MongoDB. A `SharedVideo` model deduplicates video metadata across multiple users.

**System Design:**

```
IMPORT FLOW
───────────
Client                     Server                   YouTube API v3         MongoDB
  │                           │                            │                  │
  │── POST /api/playlist ─────►                           │                  │
  │   { youtubeUrl }          │── Extract playlist ID ───►│                  │
  │                           │── GET playlistItems ───────►                  │
  │                           │   (paginated, all pages)  │                  │
  │                           │◄── video metadata ─────────│                  │
  │                           │── GET videos (durations) ─►│                  │
  │                           │◄── duration data ───────────│                  │
  │                           │                            │                  │
  │                           │── For each video:          │                  │
  │                           │   SharedVideo.findOrCreate ──────────────────►│
  │                           │── Playlist.create() ───────────────────────── ►│
  │                           │── Video.create() (junction)────────────────── ►│
  │◄── { playlist, videos } ──│                            │                  │

DATA MODEL
──────────
Playlist { userId, youtubePlaylistId, title, thumbnail, videoCount, syncedAt }
    │
    └── Video (junction) { playlistId, sharedVideoId, position, isCompleted, tags }
              │
              └── SharedVideo { youtubeVideoId, title, thumbnail, duration, channelTitle }

SYNC FLOW (keep playlist up to date)
──────────────────────────────────────
  │── POST /api/playlist/:id/sync ──►│
  │                           │── Fetch latest from YouTube API ───────────── ►│
  │                           │── Diff old vs new videos                        │
  │                           │── Add new, mark removed, update metadata ──── ►│
  │◄── { updated: true } ─────│
```

**Key files:**
- `server/controllers/playlistController.js`
- `server/utils/youtubeUtils.js`
- `server/utils/videoUtils.js`
- `server/models/Playlist.js`, `SharedVideo.js`, `Video.js`
- `client/pages/ImportPage.jsx`
- `client/pages/PlaylistDetails.jsx`

<!-- IMAGE PROMPT: "Data flow diagram for YouTube playlist import. User interface showing a text input
for YouTube URL. Arrow to Express server box. Arrow from server to YouTube logo (API call).
Response arrow back showing video metadata. Arrow from server to MongoDB showing nested data
structure: Playlist → Video (junction) → SharedVideo. Show pagination symbol for multiple API pages." -->

---

### 3. Focus Mode

**What it does:** A full-screen, distraction-free learning environment. Embeds the YouTube player, shows a sidebar with playlist navigation and notes, provides AI chat about the video, a Pomodoro timer, keyboard shortcuts, and real-time watch party support.

**Component Architecture:**

```
FocusMode.jsx (main page, 1328 lines)
│
├── FocusTopBar.jsx         — playlist title, progress %, exit button
├── FocusPlayerSlot.jsx     — YouTube embed (react-youtube / react-player)
├── FocusControls.jsx       — playback controls, settings panel, Pomodoro timer
├── FocusSidebar.jsx        — tabbed panel:
│   ├── Tab: Playlist       — video list with completion checkboxes
│   ├── Tab: Notes          — timestamped note editor
│   ├── Tab: Agenda         — day's scheduled videos
│   └── Tab: AI Chat        — LLM chat about current video
├── WatchPartyPanel.jsx     — synchronized playback with other users
└── KeyboardShortcutsHelp.jsx — shortcut reference overlay

CUSTOM HOOKS
────────────
useFocusModeData.js     — fetches playlist, videos, schedule from API
useFocusModePlayer.js   — player ref, seek, play/pause, completion tracking
useFocusModeSocket.js   — socket events: presence, watch party sync

STATE FLOWS
───────────
Video completion:
  User marks video done ──► PATCH /api/video/:id/complete
                        ──► Schedule.updateOne (mark reviewed)
                        ──► Achievement check triggered
                        ──► Streak update
                        ──► Confetti animation

Note saved:
  User types note ──► debounced save ──► PATCH /api/video/:id/notes
                 ──► stored per video with timestamp

Pomodoro:
  Timer counts down ──► on 0: notification sound + toast
                    ──► auto-start break or next session
```

<!-- IMAGE PROMPT: "Screenshot mockup of a focus mode video player interface. Dark glassmorphic design.
Left sidebar with video list thumbnails and checkmarks. Center: YouTube video embed taking 70% width.
Right: tabbed panel showing AI chat conversation about video content. Top bar shows progress bar
25/40 videos. Bottom: Pomodoro timer showing 18:32. Keyboard shortcut hints at bottom corners." -->

---

### 4. Video Scheduling & Spaced Repetition

**What it does:** Users schedule individual videos to specific dates and times. A spaced repetition engine (SM-2 algorithm) automatically calculates optimal review intervals after each watch.

**System Design:**

```
MANUAL SCHEDULING
──────────────────
User picks date/time ──► POST /api/schedule
                     ──► Schedule { userId, videoId, scheduledDate, status: 'pending' }

SPACED REPETITION (SM-2 Algorithm)
───────────────────────────────────
After video completion:
  1. User rates difficulty (1-5)
  2. SM-2 calculates next review date:

     IF quality < 3:
       interval = 1 day (reset)
     ELSE:
       IF first review:  interval = 1 day
       IF second review: interval = 6 days
       ELSE:             interval = prev_interval × easiness_factor

     easiness_factor = max(1.3, prev_ef + 0.1 - (5-q)×(0.08 + (5-q)×0.02))
     next_review_date = today + interval

  3. New Schedule record created for review date

CALENDAR VIEW
──────────────
  GET /api/schedule?month=6&year=2026
  ──► Returns all Schedule docs for month
  ──► Client renders CalendarPanel.jsx with color-coded days

DATA MODEL
──────────
Schedule {
  userId, videoId, playlistId,
  scheduledDate, completedAt,
  status: 'pending' | 'completed' | 'skipped',
  isReview: Boolean,
  interval: Number (days),
  easinessFactor: Number,
  repetitions: Number
}
```

**Key files:**
- `server/controllers/scheduleController.js`
- `server/models/Schedule.js`
- `client/components/Playlist/CalendarPanel.jsx`
- `client/components/Playlist/AgendaPanel.jsx`
- `client/components/Dashboard/DailyAgenda.jsx`

<!-- IMAGE PROMPT: "Split diagram showing two concepts. Left: a calendar grid UI with colored dots on dates
representing scheduled videos (green=completed, blue=scheduled, orange=overdue). Right: a flowchart
of the SM-2 spaced repetition algorithm showing: watch video → rate difficulty 1-5 → calculate
easiness factor formula → set next review date. Arrows connecting both sides." -->

---

### 5. Gamification — XP, Levels, Streaks, Achievements

**What it does:** Users earn XP for completing videos, maintaining streaks, and unlocking achievements. XP converts to levels. Achievements have criteria and are automatically checked and unlocked server-side.

**System Design:**

```
XP AWARD FLOW
──────────────
Video completed ──► achievementService.checkAndAward(userId)
                ──► Award XP based on action type:
                    - Video watched: +50 XP
                    - Achievement unlocked: varies (e.g., +100 XP)
                    - Daily streak maintained: +25 XP
                ──► User.findByIdAndUpdate({ $inc: { xp: amount } })
                ──► Recalculate level: level = Math.floor(xp / 500) + 1
                ──► Create Notification (achievement/XP toast)

STREAK TRACKING
───────────────
Daily: Activity.upsert({ userId, date: today, focusMinutes })

On each login / video complete:
  lastActiveDate = yesterday?
    YES ──► streak += 1, update longestStreak if needed
    NO  ──► streak = 1 (reset)

ACHIEVEMENT SYSTEM
───────────────────
Achievement Schema:
  { name, description, category, criteria: { type, threshold }, xpReward, icon }

Example criteria:
  "First Watch"   : { type: 'videos_completed', threshold: 1 }
  "Binge Watcher" : { type: 'videos_completed', threshold: 10 }
  "On Fire"       : { type: 'streak_days',      threshold: 7 }
  "Scholar"       : { type: 'focus_minutes',    threshold: 600 }
  "Social Bee"    : { type: 'friends_count',    threshold: 5 }

achievementService.checkAndAward():
  1. Fetch all non-unlocked achievements for user
  2. For each: evaluate criteria against user stats
  3. If met: Achievement.unlock(), award XP, create notification
  4. Notifications trigger toast + confetti on client

LEVELS
──────
level = Math.floor(totalXP / 500) + 1
xpToNextLevel = 500 - (totalXP % 500)
```

**Key files:**
- `server/services/achievementService.js`
- `server/controllers/achievementController.js`
- `server/models/Achievement.js`, `User.js`, `Activity.js`
- `client/pages/Profile.jsx` (stats display)

<!-- IMAGE PROMPT: "Gamification dashboard UI mockup. Top row showing: flame icon with streak count '14 days',
star icon with XP '3,450', trophy icon with level 'Level 8'. Middle: circular progress ring showing
XP to next level. Bottom: grid of achievement badges, some golden (unlocked), some grayed out (locked).
Each badge has an icon and name like 'Binge Watcher', 'On Fire', 'Scholar'. Dark purple theme." -->

---

### 6. Leaderboard

**What it does:** Ranks all users by XP, streak days, or total focus time. Shows public profiles inline. Updates dynamically.

**System Design:**

```
LEADERBOARD QUERY
──────────────────
GET /api/leaderboard?sort=xp&limit=50

Server:
  User.find({ isPublic: true })
      .select('name avatar xp currentStreak totalFocusMinutes level')
      .sort({ xp: -1 })
      .limit(50)

Client renders:
  ┌─────────────────────────────────┐
  │ # │ Avatar │ Name    │ XP   │ 🔥 │
  │ 1 │  👤   │ Alice   │ 9200 │ 45 │
  │ 2 │  👤   │ Bob     │ 7800 │ 30 │
  │ 3 │  👤   │ You ←   │ 3450 │ 14 │ ← highlighted
  └─────────────────────────────────┘

Tabs: XP | Streaks | Focus Time
```

---

### 7. Study Groups & Collaboration

**What it does:** Users create or join study groups using invite codes. Groups have owners, members, and shared playlists. Members can see group playlist progress together.

**System Design:**

```
GROUP CREATION
───────────────
POST /api/group { name, description, isPublic }
  ──► Group.create({ owner: userId, inviteCode: nanoid(8) })
  ──► Add creator as first member

JOIN GROUP
──────────
POST /api/group/join { inviteCode }
  ──► Group.findOne({ inviteCode })
  ──► Check not already member, not banned
  ──► Group.members.push(userId)
  ──► Notify owner

SHARE PLAYLIST WITH GROUP
──────────────────────────
POST /api/group/:id/playlist { playlistId }
  ──► GroupPlaylist.create({ groupId, playlistId, sharedBy })
  ──► Notify all group members

GROUP PROGRESS VIEW
────────────────────
GET /api/group/:id/playlist/:playlistId/progress
  ──► For each member: count completed videos
  ──► Return per-member completion percentages
  ──► Client renders GroupPlaylistProgress.jsx (progress bars per user)

DATA MODEL
──────────
Group { name, owner, members[], inviteCode, isPublic, avatar }
GroupPlaylist { groupId, playlistId, sharedBy, createdAt }
```

**Key files:**
- `server/controllers/groupController.js`, `groupPlaylistController.js`
- `client/pages/Groups.jsx`, `GroupDetails.jsx`, `GroupPlaylistProgress.jsx`

<!-- IMAGE PROMPT: "Study group UI mockup showing a group page called 'CS50 Study Club' with 8 members.
Left panel: member list with avatars and online indicators (green dots). Right panel: shared playlist
cards with progress bars showing each member's completion percentage. Invite code shown at top right.
Modern card-based layout, dark theme with indigo accents." -->

---

### 8. Watch Party

**What it does:** Multiple users watch the **same YouTube video** in synchronized playback. One user becomes host, their play/pause/seek events broadcast to all party members via Socket.io. Includes live reactions.

**Video match enforcement (bug fix):** When a user tries to join a room, both the client and server validate that the guest's current `videoId` matches the host's `videoId`. Mismatches are rejected with a clear error before any sync happens.

**System Design:**

```
WATCH PARTY FLOW
─────────────────
Host                       Server (Socket.io)             Guests
  │                              │                           │
  │── watch_party:create ───────►│                           │
  │   { roomCode, videoId }      │── store room:             │
  │                              │   { hostId, videoId,      │
  │                              │     isPlaying, currentTime│
  │                              │     members: Set }        │
  │                              │                           │
  │                              │◄── watch_party:join ──────│
  │                              │    { roomCode, videoId }  │
  │                              │                           │
  │                              │── VALIDATE videoId match ─│
  │                              │   IF mismatch:            │
  │                              │   emit watch_party:error  │
  │                              │   "Video mismatch —       │
  │                              │    open the correct video"│
  │                              │   IF match:               │
  │                              │   add to room members     │
  │                              │   emit watch_party:joined │
  │                              │   { currentTime, isPlaying│
  │                              │     videoId }             │
  │                              │                           │
  │── PLAY { currentTime } ─────►│── broadcast to room ──────►│
  │── PAUSE { currentTime } ────►│── broadcast ──────────────►│
  │── SEEK { currentTime } ─────►│── broadcast ──────────────►│
  │── REACTION { emoji } ───────►│── broadcast ──────────────►│

VIDEO MISMATCH ERROR (client-side display)
───────────────────────────────────────────
Guest on Video B tries to join host's room (Video A):
  Server ──► watch_party:error {
    msg: "Video mismatch — this party is watching a different video.",
    requiredVideoId: "abc123"
  }
  Client ──► Show red error banner in WatchPartyPanel
             "Open the correct video first, then join."

Socket Events:
  watch_party:create   — host creates room with videoId
  watch_party:join     — guest joins (sends videoId for validation)
  watch_party:joined   — confirmation with sync state
  watch_party:error    — room not found or video mismatch
  watch_party:play     — host plays (broadcast to guests)
  watch_party:pause    — host pauses (broadcast to guests)
  watch_party:seek     — host seeks (broadcast to guests)
  watch_party:react    — emoji reaction (broadcast to all)
  watch_party:leave    — user leaves room
  watch_party:member_count — updated headcount after join/leave

Client: WatchPartyPanel.jsx
  - Host creates room, shares 6-char code
  - Guest enters code + must be on same video
  - Emoji reaction bar (allowlisted: 👍 🎉 🔥 💡 😮 ❤️)
  - Sync status indicator (LIVE badge when in room)
```

---

### 9. Real-time Presence Tracking

**What it does:** Shows how many users are currently watching a specific video. Uses Socket.io rooms keyed by `video:{videoId}`.

**System Design:**

```
IN-MEMORY PRESENCE STORE (server/utils/presenceStore.js)
──────────────────────────────────────────────────────────
Map: { "video:abc123" → Set<socketId> }
Map: { socketId → { userId, videoId, joinedAt } }

FLOW
─────
User opens FocusMode for video ──► socket.emit('presence:join', { videoId })
                                ──► Server: presenceStore.add(videoId, socketId)
                                ──► broadcast to room: { count: N }

User leaves / disconnects ──► socket.on('disconnect')
                          ──► presenceStore.remove(socketId)
                          ──► broadcast updated count to room

Client FocusTopBar shows: "👁 12 watching"

REST fallback:
GET /api/presence/:videoId/count ──► presenceStore.getCount(videoId)
```

---

### 10. AI Integration

**What it does:** In Focus Mode, users can chat with an AI about the current video, generate questions, create flashcards, and get brainstorm/note suggestions. Uses YouTube transcript as context.

**System Design:**

```
AI CHAT FLOW
─────────────
User types question ──► POST /api/video/:id/ai-chat
                    ──► { message, conversationHistory }

Server:
  1. Fetch YouTube transcript (youtube-transcript npm package)
  2. Build system prompt:
     "You are a learning assistant. Context: [transcript excerpt]
      Video: [title]. Help the user understand this content."
  3. POST to LLM API (aichixia.xyz):
     { model, messages: [...history, { role: 'user', content: message }] }
  4. Stream or return response

Client: AI Chat tab in FocusSidebar
  - Conversation thread UI
  - Loading skeleton while streaming
  - Message history maintained in component state

AI FEATURES
────────────
- "Explain this concept" — comprehension help
- "Generate 5 quiz questions" — active recall
- "Create flashcards for this video" — spaced repetition cards
- "Brainstorm related topics" — knowledge expansion
- "Summarize key points" — revision notes

TRANSCRIPT FETCH
──────────────────
server/utils/youtubeTranscript.js:
  youtube-transcript package ──► GET transcript from YouTube
  If unavailable ──► use video title + description as context
```

**Key files:**
- `server/utils/aiService.js`
- `server/utils/youtubeTranscript.js`
- `client/components/Focus/FocusSidebar.jsx` (AI Chat tab)

<!-- IMAGE PROMPT: "AI chat interface embedded in a video player sidebar. Left: YouTube video playing.
Right panel: Chat conversation showing user asking 'Explain dynamic programming simply' and AI
responding with a clear explanation using bullet points. Below: quick action buttons labeled
'Quiz Me', 'Flashcards', 'Summarize', 'Brainstorm'. Clean dark UI with blue AI message bubbles." -->

---

### 11. Custom Playlists

**What it does:** Users create their own playlists by curating videos from any imported YouTube playlists. Custom playlists can be shared publicly via unique slug links.

**System Design:**

```
CUSTOM PLAYLIST
────────────────
POST /api/custom-playlists { title, description, isPublic }
  ──► CustomPlaylist.create({ userId, title, slug: nanoid(10), isPublic })

ADD VIDEO
──────────
POST /api/custom-playlists/:id/videos { sharedVideoId, position }
  ──► CustomPlaylistVideo.create({ customPlaylistId, sharedVideoId, position })

REORDER
────────
PATCH /api/custom-playlists/:id/reorder { videoIds: [...] }
  ──► Update positions in bulk

SHARE
──────
Public link: /playlist/public/:slug
  GET /api/custom-playlists/public/:slug ──► no auth required
  Anyone with link can view + clone to their account

CLONE
──────
POST /api/custom-playlists/:id/clone
  ──► Deep copy: new CustomPlaylist + all CustomPlaylistVideo docs
  ──► Owned by requesting user
```

---

### 12. Social System (Friendship & Public Profiles)

**What it does:** Users can send/accept friend requests, view each other's public learning stats, and browse public profiles.

**System Design:**

```
FRIENDSHIP FLOW
───────────────
POST /api/social/friend-request { toUserId }
  ──► Friendship.create({ from, to, status: 'pending' })
  ──► Notification to recipient

Accept:
PATCH /api/social/friend-request/:id/accept
  ──► Friendship.status = 'accepted'
  ──► Both users' friends list updated
  ──► Mutual notification

Block:
PATCH /api/social/friend-request/:id/block
  ──► Friendship.status = 'blocked'
  ──► Blocked user cannot see profile

PUBLIC PROFILE
───────────────
GET /api/users/:username/public
  ──► User.isPublic = true
  ──► Returns: name, avatar, level, xp, currentStreak, achievements[]
              recentActivity[], publicPlaylists[]

DATA MODEL
──────────
Friendship { from, to, status: 'pending'|'accepted'|'blocked', createdAt }
User { isPublic: Boolean, username: String }
```

---

### 13. Notification System

**What it does:** Rich in-app notification system with categories (achievement, social, admin, reminder, system), priority levels, deduplication keys, and real-time delivery via Socket.io.

**System Design:**

```
NOTIFICATION SCHEMA
───────────────────
Notification {
  userId, title, message,
  category: 'achievement' | 'social' | 'admin' | 'reminder' | 'system',
  priority: 'low' | 'medium' | 'high' | 'urgent',
  isRead: Boolean,
  isArchived: Boolean,
  dedupeKey: String,  ← prevents duplicate notifications
  link: String,       ← optional navigation target
  metadata: Object    ← extra data (XP amount, badge icon, etc.)
}

CREATION FLOW
──────────────
Server-side triggers:
  Achievement unlocked ──► notificationController.create({ category: 'achievement' })
  Friend request ──────────► notificationController.create({ category: 'social' })
  Admin message ──────────► notificationController.create({ category: 'admin', priority: 'high' })
  Scheduled video due ────► notificationController.create({ category: 'reminder' })

Real-time delivery:
  After Notification.create() ──► socket.to(userId).emit('notification:new', notif)

Client:
  NotificationBell.jsx ──► shows unread count badge
  NotificationCenter.jsx ──► full inbox with filters by category
  Toast popup for high-priority notifications
```

---

### 14. Admin Command Center

**What it does:** Full admin panel for platform management. Features: user management, user impersonation (shadow mode), audit logging, 18 global feature flags grouped by category, **per-user feature overrides**, A/B test configuration, content analytics, feedback management, and security monitoring.

**System Design:**

```
ADMIN DASHBOARD COMPONENTS
───────────────────────────
AdminDashboard.jsx
├── AdminUsers.jsx          — list, search, freeze, delete, bulk actions
├── AdminAnalytics.jsx      — platform metrics, cohort retention charts
├── AdminPlaylists.jsx      — all playlists, content moderation
├── AdminAchievements.jsx   — manage achievement catalog, award badges
├── AdminNotifications.jsx  — broadcast system notifications
├── AdminFeedback.jsx       — view/triage/resolve user feedback
├── AdminSecurity.jsx       — audit logs, security event timeline
├── AdminABTests.jsx        — A/B experiment configuration
├── AdminCommandCenter.jsx  — feature flags + per-user overrides + maintenance
└── AdminAuditLog.jsx       — all admin actions timeline with actor/target

GLOBAL FEATURE FLAGS (18 flags across 5 groups)
─────────────────────────────────────────────────
SystemSettings { key, value, description, category }

Groups:
  AI          → feat_ai_brainstorm, feat_ai_chat, feat_ai_questions, feat_ai_flashcards
  Study       → feat_notes, feat_heatmap, feat_lock_mode, feat_spaced_repetition, feat_pomodoro
  Social      → feat_watch_party, feat_groups, feat_social, feat_public_profiles
  Gamification→ feat_achievements, feat_leaderboard, feat_streaks
  Content     → feat_custom_playlists, feat_playlist_sync

GET /api/settings/features
  ──► Returns all flags as { key: boolean }
  ──► If request has valid JWT, merges user's featureOverrides on top

PER-USER FEATURE OVERRIDES
────────────────────────────
Admin searches for a user in CommandCenter → selects them
Each feature shows a 3-way toggle:
  [ON] [GLOBAL] [OFF]

  ON     → force-enables this feature for the user regardless of global flag
  GLOBAL → remove override, user inherits the global setting
  OFF    → force-disables this feature for the user regardless of global flag

GET  /api/admin/users/:id/features   ──► returns user's featureOverrides map
PUT  /api/admin/users/:id/features   ──► body: { key, value: true|false|null }
     null = remove override (revert to global)

User.featureOverrides: Map<String, Boolean>
  (stored in MongoDB as a BSON Map)

Override resolution at runtime (getFeatureFlags):
  globalFlags = SystemSettings.find({ category: 'features' })
  IF req.headers has valid JWT:
    user = User.findById(decoded.id, 'featureOverrides')
    user.featureOverrides.forEach((val, key) → globalFlags[key] = val)
  RETURN merged flags

IMPERSONATION (Shadow Mode)
────────────────────────────
POST /api/admin/impersonation/start
  ──► AdminAuditLog.create({ action: 'impersonate', targetUser })
  ──► Generate JWT with { userId: targetId, impersonatedBy: adminId }
  ──► Client banner: "Viewing as [username] — Exit Shadow Mode"

AUDIT LOG
──────────
AdminAuditLog {
  adminId, action, targetId, targetModel,
  details: { key, value } | { before, after },
  ip, createdAt
}
Logged for: role changes, freeze, delete, impersonation, feature overrides
```

<!-- IMAGE PROMPT: "Admin dashboard UI mockup with dark sidebar navigation showing icons for Users,
Analytics, Security, Settings, Feedback. Main content area showing a data table of users with
columns: Avatar, Name, Email, Role, Status, Actions (Edit/Freeze/Delete buttons). Top stats row
showing: Total Users 1,247 | Active Today 89 | New This Week 23 | Reports 4. Clean admin UI." -->

---

### 15. Analytics Dashboard

**What it does:** Tracks user learning activity over time. Shows daily focus minutes, weekly progress toward goals, video completion rates, and streak history.

**System Design:**

```
ACTIVITY TRACKING
──────────────────
Every minute in FocusMode:
  socket or interval ──► POST /api/analytics/activity
                     ──► Activity.upsert({ userId, date: today },
                                        { $inc: { focusMinutes: 1 } })

ANALYTICS API
──────────────
GET /api/analytics/me?period=30
  ──► Activity.find({ userId, date: { $gte: 30 days ago } })
  ──► Calculate: total focus time, avg daily, best day, streak
  ──► Video.aggregate: completion rates per playlist

DASHBOARD WIDGETS
──────────────────
DailyAgenda.jsx       — today's scheduled videos
ContinueWatching.jsx  — in-progress videos (last watched)
WeeklyGoalWidget.jsx  — weekly focus time vs goal
DueForReviewWidget.jsx — spaced repetition due today
ActiveLibrary.jsx     — recently active playlists

Chart: Recharts AreaChart showing 30-day focus minutes timeline
```

---

## Database Schema

```
USERS
─────
{ _id, name, email, passwordHash, role, avatar, bio, username,
  xp, level, currentStreak, longestStreak, lastActiveDate,
  achievements[], isPublic, totalFocusMinutes, preferences{},
  isFrozen, createdAt }

PLAYLISTS
─────────
{ _id, userId, youtubePlaylistId, title, description, thumbnail,
  videoCount, syncedAt, lastSyncedAt, isArchived, createdAt }

SHARED_VIDEOS (deduplicated YouTube metadata)
─────────────
{ _id, youtubeVideoId, title, thumbnail, duration,
  channelTitle, channelId, publishedAt, lastFetched }

VIDEOS (playlist ↔ sharedVideo junction)
──────
{ _id, playlistId, sharedVideoId, position, isCompleted,
  completedAt, notes, tags[], watchedDuration, createdAt }

SCHEDULES
─────────
{ _id, userId, videoId, playlistId, scheduledDate, completedAt,
  status, isReview, interval, easinessFactor, repetitions }

GROUPS
──────
{ _id, name, description, owner, members[], inviteCode,
  isPublic, avatar, maxMembers, createdAt }

GROUP_PLAYLISTS
───────────────
{ _id, groupId, playlistId, sharedBy, createdAt }

CUSTOM_PLAYLISTS
────────────────
{ _id, userId, title, description, slug, isPublic, videoCount, createdAt }

CUSTOM_PLAYLIST_VIDEOS
──────────────────────
{ _id, customPlaylistId, sharedVideoId, position, addedAt }

ACHIEVEMENTS
────────────
{ _id, name, description, category, icon, criteria{ type, threshold },
  xpReward, rarity: 'common'|'rare'|'epic'|'legendary' }

NOTIFICATIONS
─────────────
{ _id, userId, title, message, category, priority, isRead,
  isArchived, dedupeKey, link, metadata{}, createdAt }

ACTIVITIES
──────────
{ _id, userId, date, focusMinutes, videosCompleted, xpEarned }

FRIENDSHIPS
───────────
{ _id, from, to, status: 'pending'|'accepted'|'blocked', createdAt }

FEEDBACK
────────
{ _id, userId, type, subject, message, status, adminNote, createdAt }

SYSTEM_SETTINGS
───────────────
{ _id, key, value, description, updatedBy, updatedAt }

ADMIN_AUDIT_LOGS
────────────────
{ _id, adminId, action, targetId, targetModel, details, ip, createdAt }

AB_TESTS
────────
{ _id, name, variants[], trafficSplit, isActive, createdAt }
```

---

## API Reference Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/playlist` | Get user's playlists |
| POST | `/api/playlist` | Import YouTube playlist |
| GET | `/api/playlist/:id` | Get playlist + videos |
| POST | `/api/playlist/:id/sync` | Re-sync from YouTube |
| GET | `/api/schedule` | Get scheduled videos |
| POST | `/api/schedule` | Schedule a video |
| PATCH | `/api/schedule/:id/complete` | Mark schedule complete |
| GET | `/api/video/:id` | Get video details |
| PATCH | `/api/video/:id/complete` | Mark video complete |
| GET | `/api/group` | Get user's groups |
| POST | `/api/group` | Create group |
| POST | `/api/group/join` | Join by invite code |
| GET | `/api/leaderboard` | Get leaderboard |
| GET | `/api/analytics/me` | Get personal analytics |
| GET | `/api/achievements` | Get achievement catalog |
| GET | `/api/notifications` | Get notifications |
| PATCH | `/api/notifications/:id/read` | Mark read |
| POST | `/api/social/friend-request` | Send friend request |
| GET | `/api/users/:username/public` | Get public profile |
| POST | `/api/admin/impersonate/:id` | Impersonate user (admin) |
| GET | `/api/admin/users` | List all users (admin) |
| GET | `/api/settings` | Get feature flags |

---

## Real-time Architecture (Socket.io)

```
SERVER: index.js — Socket.io initialization
────────────────────────────────────────────
io.on('connection', (socket) => {

  // Presence
  socket.on('presence:join', ({ videoId }) => { ... })
  socket.on('presence:leave', ({ videoId }) => { ... })
  socket.on('disconnect', () => { ... cleanup ... })

  // Watch Party
  socket.on('watchParty:join',     handler)
  socket.on('watchParty:play',     handler → broadcast to room)
  socket.on('watchParty:pause',    handler → broadcast to room)
  socket.on('watchParty:seek',     handler → broadcast to room)
  socket.on('watchParty:reaction', handler → broadcast to room)

  // Notifications
  socket.on('authenticate', ({ token }) => {
    // join personal room keyed by userId
    socket.join(`user:${userId}`)
  })
})

// Server-side notification push:
io.to(`user:${userId}`).emit('notification:new', notification)

CLIENT: hooks/useFocusModeSocket.js
─────────────────────────────────────
useEffect(() => {
  socket.emit('presence:join', { videoId })
  socket.on('presence:count', setViewerCount)
  socket.on('watchParty:play',  syncPlayerPlay)
  socket.on('watchParty:seek',  syncPlayerSeek)
  return () => socket.emit('presence:leave', { videoId })
}, [videoId])
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- YouTube Data API v3 key ([Google Cloud Console](https://console.cloud.google.com))

### Installation

```bash
# Clone
git clone <your-repo-url>
cd planTube

# Install all dependencies
npm install          # root (concurrently)
cd server && npm install
cd ../client && npm install
```

### Run in Development

```bash
# From root — starts both server (5000) and client (5173)
npm run dev
```

### Build for Production

```bash
cd client
npm run build       # outputs to client/dist/
```

---

## Environment Variables

### Server (`server/.env`)

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/plantube

# Auth
JWT_SECRET=replace_with_a_long_random_string_min_32_chars

# YouTube Data API v3
YOUTUBE_API_KEY=AIzaSy...

# AI Integration
AICHIXIA_API_KEY=acv-...

# CORS
CLIENT_URL=https://plantube.vercel.app
```

### Client (`client/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 50+ Q&A — Technical Deep Dive

> These questions cover architecture, design decisions, trade-offs, and implementation details for every feature in PlanTube.

---

### Authentication & Security

**Q1. Why did you use JWT instead of session-based auth?**
JWTs are stateless — the server doesn't need to store session state in memory or a database, making horizontal scaling trivial. For a deployed app on Vercel (serverless), session storage isn't available between function invocations. The JWT payload carries `userId` and `role`, so every request is self-contained.

**Q2. How are passwords stored securely?**
Using `bcryptjs` with 10 salt rounds. Plain passwords are never stored or logged. The `User` model stores only `passwordHash`. Even if the database is leaked, bcrypt hashes are computationally expensive to brute-force.

**Q3. What prevents brute-force login attacks?**
`express-rate-limit` restricts auth endpoints to 20 requests per 15 minutes per IP. A failed login increments the counter. On the admin routes, stricter limits apply (10 requests/hour).

**Q4. How does admin impersonation work without knowing the target's password?**
The admin endpoint `POST /api/admin/impersonate/:userId` generates a new JWT signed with the target user's `_id` but includes an `impersonatedBy: adminId` field. The client uses this token for subsequent requests. The server middleware reads both fields and attaches them to `req.user`. Every action taken during impersonation is logged to `AdminAuditLog`.

**Q5. How is role-based access enforced?**
Two middleware layers: `auth.js` verifies JWT and attaches `req.user`. `admin.js` checks `req.user.role === 'admin'` before allowing access to admin routes. Moderator/support roles have a subset of permissions.

---

### YouTube Playlist Import

**Q6. Why is there a `SharedVideo` model separate from `Video`?**
If 100 users import the same YouTube video (e.g., a popular tutorial), without `SharedVideo` you'd store 100 copies of the same metadata (title, thumbnail, duration). `SharedVideo` stores it once, keyed by `youtubeVideoId`. The `Video` model is a junction table linking a `Playlist` to a `SharedVideo`, storing user-specific data like completion status, notes, and position.

**Q7. How do you handle YouTube API pagination for large playlists?**
YouTube's `playlistItems` endpoint returns max 50 items per page. `youtubeUtils.js` iterates through pages using `nextPageToken` until there's no token left, collecting all items. Playlists with 200+ videos require 4+ API calls.

**Q8. What happens if a video is removed from YouTube after import?**
During sync (`POST /api/playlist/:id/sync`), the server re-fetches the playlist from YouTube. It diffs the old video list against the new one. Videos missing from YouTube are marked as `isRemoved: true` (not deleted, to preserve user notes and completion status).

**Q9. Why does the import also fetch video durations separately?**
YouTube's `playlistItems` endpoint doesn't include video durations. A second API call to `videos?part=contentDetails` fetches durations in ISO 8601 format (`PT4M23S`). `videoUtils.js` parses these into seconds.

---

### Focus Mode

**Q10. Why split FocusMode into multiple custom hooks?**
`FocusMode.jsx` is 1328 lines with three distinct concerns: data fetching, player control, and socket events. Splitting into `useFocusModeData`, `useFocusModePlayer`, and `useFocusModeSocket` keeps each hook focused and testable, and prevents a single giant component with dozens of unrelated state variables.

**Q11. How are timestamped notes implemented?**
When a user types a note in FocusSidebar, the current video playback time (in seconds) is captured from the player ref. The note is saved as `{ text, timestamp }`. On display, timestamps render as clickable links that seek the video to that time via the player ref.

**Q12. How does the Pomodoro timer work in FocusMode?**
It's a pure client-side countdown using `setInterval`. On start: set `timeLeft = 25 * 60`. Each tick: `timeLeft -= 1`. On zero: play a notification sound, show a toast, and optionally auto-start a break timer. State is local to the component — no server interaction required.

**Q13. What happens to the player state when the user switches sidebar tabs?**
The YouTube player (`react-youtube`) is always mounted — only the sidebar content changes via tab state. This prevents the video from pausing or reloading when the user switches between Playlist, Notes, and AI Chat tabs.

---

### Video Scheduling & Spaced Repetition

**Q14. Why implement SM-2 instead of a simpler scheduling system?**
Simple scheduling ("watch this tomorrow") doesn't account for how well the user understood the material. SM-2 is the same algorithm used by Anki and is empirically proven to optimize long-term retention. Difficult videos get reviewed sooner; easy ones are pushed further out, reducing unnecessary review time.

**Q15. How does the calendar view load efficiently?**
`GET /api/schedule?month=6&year=2026` filters by a date range (`$gte: startOfMonth, $lte: endOfMonth`). The result is a flat array of schedule objects. The client groups them by date using `Array.reduce()` into a `Map<dateString, Schedule[]>`, then renders the calendar in a single pass.

**Q16. Can a user schedule the same video multiple times?**
Yes — this is the spaced repetition review mechanism. Each review creates a new `Schedule` document with `isReview: true`. The completion of one review triggers calculation of the next. Multiple schedule entries for the same video are normal and expected.

---

### Gamification

**Q17. How is the level calculated from XP?**
`level = Math.floor(totalXP / 500) + 1`. This means Level 1 = 0–499 XP, Level 2 = 500–999 XP, etc. The formula is linear for simplicity, but the constant (500) can be tweaked via system settings for balancing.

**Q18. How do achievements auto-unlock without polling?**
`achievementService.checkAndAward()` is called server-side after every relevant action (video complete, friend added, etc.). It queries all un-unlocked achievements, evaluates each criterion against the user's current stats, and unlocks matching ones immediately. No polling needed — it's event-driven.

**Q19. How are streaks tracked accurately across timezones?**
The `Activity` model stores dates as `Date` objects (UTC midnight). Streak logic compares `lastActiveDate` to `yesterday` (today - 1 day in UTC). This can cause timezone edge cases — a user who watches a video at 11pm UTC-5 (4am UTC next day) would count it as the next day. A future improvement would use user-local timezone stored in preferences.

**Q20. What prevents users from gaming XP by rapidly completing videos?**
XP is awarded per unique video completion. The `Video.isCompleted` flag is set to `true` on first completion. Subsequent `complete` calls check `if (video.isCompleted) return` and don't award XP again.

---

### Real-time Features

**Q21. Why use Socket.io instead of WebSockets directly?**
Socket.io adds automatic reconnection, room management, namespace support, and fallback to long-polling for environments that block WebSockets. For a learning app where stable connection is important, these features are worth the overhead.

**Q22. How is presence data stored — in MongoDB or memory?**
In memory (`presenceStore.js` uses JavaScript `Map` and `Set`). Presence is ephemeral — it doesn't need to persist across server restarts. In-memory storage is O(1) for add/remove/count operations, far faster than a database query per connection event.

**Q23. What happens to watch party sync if a guest's network lags?**
The host's seek/play events include a `timestamp` (current video time). Guests set their player to that exact timestamp on receiving the event. This is a "last write wins" sync — not perfectly real-time, but simple and effective for educational content where sub-second sync isn't critical.

**Q24. How does the server push notifications in real-time?**
When `Notification.create()` is called server-side, the controller immediately calls `io.to('user:${userId}').emit('notification:new', notification)`. Each authenticated socket joins a personal room `user:{userId}` on connection. The client's notification bell increments its unread count on receiving this event.

---

### AI Integration

**Q25. How is the video transcript used as AI context?**
`youtubeTranscript.js` fetches the full transcript from YouTube (if available). For the AI prompt, a truncated excerpt (first ~2000 characters) is injected as system context: `"You are a learning assistant. Here is the video transcript: [excerpt]. Answer questions about this video."` This grounds the AI's responses in actual video content.

**Q26. What if a video has no transcript?**
Graceful degradation: if `youtube-transcript` throws (video has no captions), the server falls back to using the video's title, description, and channel name as context. The AI can still answer general questions but won't have specific content awareness.

**Q27. How is conversation history managed in AI chat?**
The client maintains a `conversationHistory` array in component state: `[{ role: 'user', content }, { role: 'assistant', content }]`. Each request sends the full history to the server, which forwards it to the LLM API. This gives the AI context of earlier messages in the session. History is cleared when the user navigates away.

---

### Custom Playlists

**Q28. How are public custom playlists shared via URL?**
On creation, a `slug` is generated using `nanoid(10)` — a 10-character random URL-safe string. Public playlists are accessible at `/playlist/public/:slug`. The server endpoint `GET /api/custom-playlists/public/:slug` requires no authentication, making sharing frictionless.

**Q29. How is video reordering handled efficiently?**
`PATCH /api/custom-playlists/:id/reorder` accepts an ordered array of `sharedVideoId`s. The server uses `Promise.all()` to update all `CustomPlaylistVideo` documents' `position` fields in parallel, assigning each the index from the received array.

---

### Social System

**Q30. How do you prevent duplicate friend requests?**
`Friendship.create()` is wrapped in a check: `Friendship.findOne({ $or: [{ from, to }, { from: to, to: from }] })`. If any friendship document exists between the two users (in either direction), the request is rejected with a 409 Conflict response.

**Q31. What does "blocking" a user do technically?**
`Friendship.status = 'blocked'`. API endpoints for friend requests, public profiles, and group invitations all check for a blocking relationship before proceeding. The blocked user's requests return generic "user not found" responses (no indication they're blocked).

---

### Notification System

**Q32. What is the `dedupeKey` field for in notifications?**
Prevents duplicate notifications for the same event. For example, if an achievement check runs twice in quick succession, the second `Notification.create()` with the same `dedupeKey` is rejected via a unique index. The key is composed like `achievement:${achievementId}:${userId}`.

**Q33. How does the notification bell know the unread count without polling?**
On page load, `GET /api/notifications?unread=true&limit=1` returns the count. Subsequent real-time updates come via the `notification:new` Socket.io event, which increments the local count. The bell rerenders with the new badge number.

---

### Admin Dashboard

**Q34. How are feature flags implemented?**
`SystemSettings` documents in MongoDB store key-value pairs. The client fetches all settings on load via `GET /api/settings` (cached in `SettingsContext`). The `useFeatureFlags()` hook reads from context. Components conditionally render based on flag values: `if (!flags.watch_party_enabled) return null`.

**Q35. What's logged in the AdminAuditLog?**
Every mutation in admin routes is logged: `{ adminId, action, targetId, targetModel, details: { before, after }, ip, createdAt }`. This enables forensic review of who changed what and when. Impersonation events are marked with special `action: 'impersonate'` type.

**Q36. How is A/B testing implemented?**
`ABTest` documents define experiments with variant names and traffic splits. Users are assigned to a variant by hashing their `userId` modulo 100 against the traffic split. The same user always gets the same variant (deterministic). Results are tracked via `Activity` analytics.

---

### Performance & Scalability

**Q37. How does the `SharedVideo` model improve performance?**
Without it: importing a playlist used by 1000 users = 1000 × N MongoDB write operations (N = video count). With it: N writes for first import, then only junction table writes for subsequent imports. Metadata queries for video title/thumbnail hit the small `SharedVideo` collection rather than scanning per-user data.

**Q38. What caching is implemented client-side?**
`client/utils/cache.js` implements a simple in-memory TTL cache for API responses. Frequently-read, rarely-changed data (playlist metadata, achievement definitions, feature flags) are cached for 5 minutes. This reduces redundant API calls when navigating between pages.

**Q39. Why are MongoDB indexes critical for this app's performance?**
Common query patterns: `Schedule.find({ userId, scheduledDate: { $gte: today } })` — index on `{ userId: 1, scheduledDate: 1 }`. `Activity.find({ userId, date })` — index on `{ userId: 1, date: 1 }`. Without indexes, these scan the entire collection. With 100k users and millions of schedule docs, unindexed queries would timeout.

**Q40. How does the playlist sync avoid hitting YouTube API quota limits?**
YouTube API grants 10,000 units/day. A `playlistItems` list call costs 1 unit per page. Auto-sync is rate-limited per user (once per 24 hours). Manual sync is available on demand but counts against user quotas. For large playlists (10 pages), one sync costs 10 units.

---

### Architecture Decisions

**Q41. Why React Context instead of Redux or Zustand?**
The app has three global state domains: auth (rarely changes), theme (user preference), and settings (feature flags). Context is sufficient — no time-travel debugging, complex middleware, or action dispatching needed. Redux would add boilerplate for minimal benefit. Zustand would be a good next step if state complexity grows.

**Q42. Why Express 5 (not 4)?**
Express 5 adds native async/await error handling — if an async route handler throws, Express 5 catches it and passes it to the error middleware automatically. In Express 4, every async function needed `try/catch` with `next(err)` or a wrapper utility. This reduces boilerplate significantly.

**Q43. Why is the `FocusMode.jsx` file 1328 lines? Is that a problem?**
Focus Mode is the product's core feature — it orchestrates video playback, notes, scheduling, presence, watch party, AI chat, and Pomodoro. The complexity is managed by extracting logic into three custom hooks (`useFocusModeData`, `useFocusModePlayer`, `useFocusModeSocket`). The JSX itself composes sub-components (`FocusTopBar`, `FocusSidebar`, etc.). Future refactoring could extract more sub-components.

**Q44. Why MongoDB over a relational database like PostgreSQL?**
The data model has several flexible schema requirements: `User.achievements` is a variable-length embedded array, `Notification.metadata` is a free-form object, and `SystemSettings` is a key-value store. MongoDB's document model handles these naturally. The relational data (playlist → video → sharedvideo) is modest enough that MongoDB's `$lookup` or multiple queries work fine.

**Q45. How does Vercel deployment work for a full-stack app?**
`vercel.json` configures routing: API requests (`/api/**`) are proxied to the Express server (deployed as a Vercel serverless function or a separate backend). The React frontend is deployed as a static site on Vercel's CDN. Socket.io connections go to the dedicated backend server (not serverless, since WebSockets require persistent connections).

---

### User Experience

**Q46. How does the mobile responsiveness work?**
`useIsMobile.js` hook uses `window.matchMedia('(max-width: 768px)')` to detect mobile. Components use this hook to conditionally render compact layouts (collapsed sidebar, bottom navigation, single-column cards). Focus Mode on mobile hides the sidebar by default and shows a drawer-based panel.

**Q47. How does the PWA install prompt work?**
The Vite build generates a `manifest.webmanifest` and `sw.js` (service worker). When a user visits on mobile Chrome/Safari and meets PWA installability criteria (HTTPS, manifest, service worker), the browser fires `beforeinstallprompt`. The app captures this event and shows a custom "Install App" button that calls `event.prompt()`.

**Q48. How are keyboard shortcuts implemented without conflicting with input fields?**
`useKeyboardShortcuts.js` attaches a `keydown` listener to `window`. Before processing shortcuts, it checks `if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return` — this prevents shortcuts firing while typing notes or searching.

**Q49. How does the theme system work across page reloads?**
`ThemeContext.jsx` stores the selected theme (`dark`, `light`, or named color themes) in `localStorage`. On init, it reads `localStorage.getItem('theme')` and applies the theme class to `document.body`. CSS variables (`--bg-primary`, `--accent-color`, etc.) are defined per theme class, so all components automatically pick up the correct colors.

**Q50. How does the HelperBot assistant work?**
`HelperBot` is a client-side component that displays contextual tips based on the current route. On Dashboard → "Try scheduling videos for this week." On FocusMode → "Press Space to play/pause. Press N to open notes." Tips are a static array keyed by route pattern, shown in a floating card. No AI or backend involved.

---

### Edge Cases & Error Handling

**Q51. What happens if the YouTube API key runs out of quota?**
The server returns a 503 with `{ error: 'YouTube API quota exceeded. Try again tomorrow.' }`. The client displays this in the import UI. Existing imported playlists continue to work normally since they're stored in MongoDB.

**Q52. How is concurrent video completion handled (e.g., two tabs)?**
`Video.isCompleted` is set with a MongoDB `findOneAndUpdate` with `{ isCompleted: false }` in the filter — it only updates if not already completed. This is an atomic operation preventing double XP awards even with concurrent requests.

**Q53. What if a user deletes their account? Is data cleaned up?**
`DELETE /api/user/me` triggers a cascade: `Playlist.deleteMany({ userId })`, `Schedule.deleteMany({ userId })`, `Notification.deleteMany({ userId })`, `Activity.deleteMany({ userId })`, `Friendship.deleteMany({ $or: [{ from }, { to }] })`. Group memberships are removed. Groups owned by the user are transferred to another member or deleted if empty.

**Q54. How are group invite codes kept unique?**
`nanoid(8)` generates 8-character alphanumeric codes. MongoDB has a unique index on `Group.inviteCode`. In the rare collision case, the server catches the duplicate key error and retries with a new code (up to 3 attempts).

**Q55. What's the deduplication strategy for the leaderboard when XP ties occur?**
Ties are broken by `currentStreak` descending, then by `createdAt` ascending (longer-standing users rank higher). The MongoDB sort: `.sort({ xp: -1, currentStreak: -1, createdAt: 1 })`.

---

### Diagram Prompts (for generating system visuals)

**Diagram 1 — Full Architecture:**
> "Three-tier web architecture diagram: React SPA client tier communicating via REST arrows to Express.js server tier, server tier communicating via Mongoose arrow to MongoDB Atlas tier. Socket.io bidirectional arrows between client and server for real-time. External arrows from server to YouTube API and LLM API. Dark professional style, labeled boxes with technology icons."

**Diagram 2 — SM-2 Spaced Repetition Flowchart:**
> "Flowchart: Start → User watches video → Rate difficulty 1-5 → Diamond: Quality >= 3? → YES: Calculate new interval (prev_interval × easiness_factor) → Schedule next review → End. NO path → Reset interval to 1 day → Schedule tomorrow → End. Show formula box: EF = max(1.3, EF + 0.1 - (5-q)×(0.08 + (5-q)×0.02))."

**Diagram 3 — Achievement Unlock Flow:**
> "Event-driven flow diagram: Video Completed event → achievementService.checkAndAward() → Loop through un-unlocked achievements → For each: evaluate criteria → Diamond: Criteria met? → YES: Unlock achievement, Award XP, Create Notification → Socket.io push to client → Confetti + Toast animation. NO: Skip. Clean dark background."

**Diagram 4 — Watch Party Socket Flow:**
> "Sequence diagram with three columns: Host Browser, Socket.io Server, Guest Browsers. Arrows: Host sends play event → Server broadcasts to room → Guests receive and sync player time. Host sends seek to 2:30 → Server broadcasts → Guests seek to 2:30. Show emoji reaction flying across all three columns."

**Diagram 5 — Database Entity Relationship:**
> "ER diagram showing: User (center) connected to Playlist (1:many), Schedule (1:many), Activity (1:many), Achievement (many:many), Notification (1:many), Friendship (self-referential many:many), Group (many:many via membership). Playlist connected to Video (1:many), Video connected to SharedVideo (many:1). Clean crow's foot notation, dark background."

---

*Built by Sumant Sagar — PlanTube is an open-source YouTube learning platform.*
