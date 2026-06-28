# PlanTube — Resume Reference Sheet

> Full-stack YouTube learning platform with real-time collaboration, AI integration, and gamification.
> **Live:** https://plantube.vercel.app · **Repo:** https://github.com/SumantSagar73/planTube

---

## One-Line Summary (for resume headline)
Built a full-stack YouTube learning platform serving structured study plans, real-time watch parties, AI-powered tutoring, and a gamification engine — from scratch using React, Node.js, MongoDB, and Socket.io.

---

## Elevator Pitch (for "Tell me about your project")
PlanTube turns passive YouTube watching into active learning. Users import any YouTube playlist, schedule videos on a calendar using a spaced repetition algorithm (SM-2 — same as Anki), and study inside a distraction-free Focus Mode with AI chat, timestamped notes, and a Pomodoro timer. Progress is gamified with XP, levels, streaks, and achievement badges. Users can form study groups, host synchronized watch parties, and compete on a leaderboard. Admins get a full command center with per-user feature flag overrides, impersonation (shadow mode), and audit logging.

---

## Tech Stack (copy-paste for resume skills section)

**Frontend:** React 19, Vite 7, React Router 7, Socket.io-client, Axios, Recharts, Lucide React  
**Backend:** Node.js, Express 5, MongoDB, Mongoose 9, Socket.io, JWT, bcryptjs  
**APIs:** YouTube Data API v3, External LLM API (AI chat/flashcards), youtube-transcript  
**DevOps:** Vercel (frontend), Render (backend), GitHub Actions CI/CD, express-rate-limit  

---

## Bullet Points (pick 5–7 for your resume)

- Architected a **full-stack learning platform** with React 19 + Express 5 + MongoDB serving playlist import, video scheduling, and real-time collaboration for multiple concurrent users

- Implemented **SM-2 spaced repetition algorithm** for automatic review scheduling — calculates optimal next-review intervals based on difficulty ratings, matching the approach used by Anki

- Built a **real-time Watch Party** using Socket.io rooms with video-match validation — host play/pause/seek events broadcast to all guests; mismatched video IDs are rejected server-side before any sync occurs

- Designed a **gamification engine** that awards XP for video completions, evaluates 15+ achievement criteria event-driven (no polling), tracks daily streaks, and computes leaderboard rankings

- Created an **Admin Command Center** with 18 global feature flags grouped by category, per-user feature overrides (force on/off per flag per user), admin impersonation with full audit logging, and A/B test configuration

- Integrated **LLM-powered AI chat** in Focus Mode using YouTube transcripts as context — supports quiz generation, flashcard creation, summarization, and free-form Q&A about the current video

- Built a **deduplication system** for YouTube video metadata using a `SharedVideo` collection — prevents storing redundant title/thumbnail/duration data when multiple users import the same video

- Engineered a **notification system** with 5 categories (achievement, social, admin, reminder, system), priority levels, deduplication keys (prevents duplicate alerts), and real-time push via Socket.io

- Developed a **GitHub Actions health-check workflow** that pings the Render backend every 6 hours, retries 5× with backoff, and auto-creates a GitHub Issue on failure (deduplication prevents spam)

---

## Key Technical Decisions (for "Why did you use X?" questions)

| Decision | Why |
|----------|-----|
| JWT over sessions | Stateless — works on serverless Vercel without session storage between invocations |
| MongoDB over PostgreSQL | Flexible schema for embedded arrays (achievements, badges), free-form metadata (notifications), and key-value settings (feature flags) |
| Socket.io over raw WebSockets | Auto-reconnect, room management, and long-polling fallback for restricted networks |
| SM-2 spaced repetition | Empirically proven algorithm for long-term retention — same logic as Anki/SuperMemo |
| SharedVideo deduplication | 100 users importing the same playlist = 1 metadata write, not 100 |
| In-memory presence store | Presence is ephemeral — O(1) Map/Set ops, no DB overhead per socket event |
| Express 5 | Native async error handling — no try/catch wrappers needed in route handlers |
| Per-user feature flags | Allows A/B testing and support overrides without code deploys |

---

## Numbers to Mention

- **19 MongoDB collections** across the full data model
- **18 feature flags** controllable globally and per-user from the admin panel
- **16 REST route files**, **17 controllers** on the backend
- **15+ achievement types** evaluated event-driven on every relevant user action
- **6 real-time Socket.io event namespaces** — presence, watch party (5 events), notifications
- **5-retry health check** with 30s backoff, running on a 6-hour cron schedule

---

## Project Challenges (for behavioral interviews)

**Challenge 1 — Watch Party video mismatch bug**  
Users on different videos could join the same room and have their players synced to wrong timestamps. Fixed by adding `videoId` validation on the server-side join handler — guests send their current `videoId`, server rejects if it doesn't match the host's room `videoId`.

**Challenge 2 — GitHub Actions 403 on issue creation**  
Health-check workflow failed to list/create GitHub Issues because the default `GITHUB_TOKEN` only gets `contents: read`. Fixed by adding `permissions: issues: write` explicitly to the job — GitHub's restrictive default token requires opt-in for every API scope.

**Challenge 3 — Feature flags per user without code deploys**  
Needed a way for admins to turn features on/off for specific users (e.g., beta access, support debugging). Solved with a `featureOverrides: Map<String, Boolean>` field on the User model. The `getFeatureFlags` endpoint optionally decodes the JWT and merges user-specific overrides on top of global flags — zero client-side changes needed.

---

## GitHub / Portfolio Links

- **Live App:** https://plantube.vercel.app
- **Repository:** https://github.com/SumantSagar73/planTube
- **Contact:** sumantsagar6073@gmail.com
