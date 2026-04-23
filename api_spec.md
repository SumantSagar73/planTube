# Fluke Game Studio — API Specification & JSON Formats

This document covers **every data source** currently hardcoded as dummy data on the website. Hand this to the team lead so the backend team can build REST endpoints that the frontend will consume.

---

## Overview of All Data Sources

| # | Domain | Current State | Needs API? |
|---|--------|--------------|------------|
| 1 | **Games** | Hardcoded in `src/lib/data/games.ts` | ✅ Yes |
| 2 | **Team Members** | Hardcoded in `src/lib/data/content.ts` | ✅ Yes |
| 3 | **Devlogs / Blog Posts** | Hardcoded in `src/lib/data/content.ts` | ✅ Yes |
| 4 | **Portfolio Items** | Hardcoded in `src/lib/data/content.ts` | ✅ Yes |
| 5 | **Services** | Hardcoded in `src/lib/data/services.ts` | ✅ Yes (or CMS) |
| 6 | **Studio Milestones** | Hardcoded in `StudioStory.tsx` | ✅ Yes |
| 7 | **Job Listings (Careers)** | Already calling AWS Lambda API | ⚠️ Already wired — see notes |
| 8 | **Job Application Submission** | Already calling AWS Lambda API | ⚠️ Already wired — see notes |
| 9 | **Contact Form Submission** | Currently no API (just sets UI state) | ✅ Yes |

---

## 1. Games API

### Endpoint
```
GET /api/games
GET /api/games/:slug        ← for individual game detail page
```

### JSON Shape (Array Response)
```json
{
  "items": [
    {
      "id": "string",               // Unique identifier, e.g. "1" or UUID
      "slug": "string",             // URL-safe name used in route: /games/:slug
      "title": "string",            // Display name of the game
      "genre": "string",            // e.g. "Racing / Arcade", "Action RPG"
      "platforms": ["string"],      // Allowed values: "PC", "Mobile", "Console", "Web"
      "status": "string",           // Allowed values: "Released", "In Development", "Coming Soon"
      "releaseYear": 2024,          // Number (4-digit year)
      "description": "string",      // Short one-liner shown on card hover (~120 chars)
      "longDescription": "string",  // Full paragraph shown on game detail page
      "coverImage": "string",       // URL to cover image, e.g. "/games/neon-drift.jpg"
      "screenshots": ["string"],    // Array of image URLs for the detail page gallery
      "features": ["string"],       // 3–6 key features shown as bullet list
      "tags": ["string"]            // Searchable tags, e.g. ["Racing", "Neon", "Arcade"]
    }
  ]
}
```

### Sample Data
```json
{
  "items": [
    {
      "id": "1",
      "slug": "neon-drift",
      "title": "Neon Drift",
      "genre": "Racing / Arcade",
      "platforms": ["PC", "Mobile"],
      "status": "Released",
      "releaseYear": 2024,
      "description": "A high-octane neon racing experience through cyberpunk cityscapes.",
      "longDescription": "Neon Drift is a fast-paced arcade racing game set in a sprawling cyberpunk metropolis. Drift through neon-lit streets, dodge obstacles, and race to the top of the leaderboard.",
      "coverImage": "/games/neon-drift.jpg",
      "screenshots": [
        "/games/neon-drift-ss1.jpg",
        "/games/neon-drift-ss2.jpg",
        "/games/neon-drift-ss3.jpg",
        "/games/neon-drift-ss4.jpg"
      ],
      "features": ["40+ tracks", "Online leaderboards", "Procedural city generation", "Custom car skins"],
      "tags": ["Racing", "Neon", "Arcade", "Cyberpunk"]
    }
  ]
}
```

---

## 2. Team Members API

### Endpoint
```
GET /api/team
```

### JSON Shape
```json
{
  "items": [
    {
      "id": "string",               // Unique identifier
      "name": "string",             // Full name, e.g. "Alex Rivera"
      "role": "string",             // Job title, e.g. "Founder & Game Director"
      "bio": "string",              // Short biography (~150 chars)
      "avatar": "string",           // URL to profile photo, e.g. "/team/alex.jpg"
      "skills": ["string"],         // Array of skill tags, e.g. ["Unity", "Game Design"]
      "socials": [
        {
          "platform": "string",     // Allowed values: "twitter", "github", "instagram", "youtube", "linkedin"
          "url": "string"           // Full URL to their profile
        }
      ]
    }
  ]
}
```

### Sample Data
```json
{
  "items": [
    {
      "id": "1",
      "name": "Alex Rivera",
      "role": "Founder & Game Director",
      "bio": "Visionary behind Fluke Game Studio. 8+ years in indie game development with a passion for immersive worlds.",
      "avatar": "/team/alex.jpg",
      "skills": ["Game Design", "Unity", "Unreal", "Team Leadership"],
      "socials": [
        { "platform": "twitter", "url": "https://twitter.com/alexrivera" },
        { "platform": "github", "url": "https://github.com/alexrivera" }
      ]
    },
    {
      "id": "2",
      "name": "Maya Chen",
      "role": "Lead Artist & 3D Designer",
      "bio": "Creates the stunning visuals and 3D assets that define Fluke's visual identity.",
      "avatar": "/team/maya.jpg",
      "skills": ["3D Modeling", "Blender", "Substance Painter", "Concept Art"],
      "socials": [
        { "platform": "instagram", "url": "https://instagram.com/mayachen" },
        { "platform": "twitter", "url": "https://twitter.com/mayachen" }
      ]
    }
  ]
}
```

---

## 3. Devlogs / Blog Posts API

### Endpoint
```
GET /api/devlogs                    ← list all posts
GET /api/devlogs/:slug              ← single post (for individual reader page)
GET /api/devlogs?category=Unity     ← optional filter by category
```

### JSON Shape
```json
{
  "items": [
    {
      "id": "string",               // Unique identifier
      "slug": "string",             // URL-safe slug, e.g. "building-procedural-worlds"
      "title": "string",            // Post title
      "excerpt": "string",          // 1–2 sentence summary shown on listing cards
      "content": "string",          // Full post content — can be HTML or Markdown
      "author": "string",           // Author name (should match a team member name)
      "date": "YYYY-MM-DD",        // Publication date in ISO 8601 format
      "category": "string",         // Allowed values: "Unity", "Unreal", "Design", "Studio Updates", "Art"
      "readTime": 8,                // Estimated read time in minutes (number)
      "coverImage": "string",       // URL to cover/hero image
      "tags": ["string"]            // Searchable tags
    }
  ]
}
```

### Sample Data
```json
{
  "items": [
    {
      "id": "1",
      "slug": "building-procedural-worlds",
      "title": "Building Procedural Worlds in Unity",
      "excerpt": "How we created infinitely varied environments for Star Forge using Unity's Job System and Burst Compiler.",
      "content": "<h2>Introduction</h2><p>Full article content goes here...</p>",
      "author": "Jordan Blake",
      "date": "2025-02-15",
      "category": "Unity",
      "readTime": 8,
      "coverImage": "/devlogs/procedural.jpg",
      "tags": ["Unity", "Procedural", "Performance"]
    }
  ]
}
```

---

## 4. Portfolio Items API

### Endpoint
```
GET /api/portfolio
GET /api/portfolio?category=Games   ← optional filter by category
```

### JSON Shape
```json
{
  "items": [
    {
      "id": "string",                // Unique identifier
      "title": "string",             // Portfolio item name, e.g. "Neon Drift — Full Game"
      "category": "string",          // Allowed values: "Games", "Assets", "Trailers", "Websites", "Art"
      "description": "string",       // Short description shown on card (~80 chars)
      "tools": ["string"],           // Tech/tools used, e.g. ["Unity", "Blender", "FMOD"]
      "image": "string",             // URL to thumbnail/preview image
      "year": 2024,                  // Release/completion year (number)
      "link": "string"               // Optional: external link (e.g. Steam page, live site)
    }
  ]
}
```

### Sample Data
```json
{
  "items": [
    {
      "id": "1",
      "title": "Neon Drift — Full Game",
      "category": "Games",
      "description": "A neon racing arcade game shipped on Steam.",
      "tools": ["Unity", "Blender", "FMOD"],
      "image": "/portfolio/neon-drift.jpg",
      "year": 2024,
      "link": "https://store.steampowered.com/neon-drift"
    },
    {
      "id": "2",
      "title": "Sci-Fi Asset Pack Vol.1",
      "category": "Assets",
      "description": "100+ sci-fi props for Unity Asset Store.",
      "tools": ["Blender", "Substance", "Unity"],
      "image": "/portfolio/scifi-pack.jpg",
      "year": 2024,
      "link": "https://assetstore.unity.com/scifi-pack"
    }
  ]
}
```

---

## 5. Services API

### Endpoint
```
GET /api/services
GET /api/services/:slug             ← single service detail
```

> **Note:** Services change rarely; this could also be managed as a static JSON file or CMS. But if the team wants to manage it from an admin panel, expose it as an API.

### JSON Shape
```json
{
  "items": [
    {
      "id": "string",               // Unique identifier
      "slug": "string",             // URL-safe slug, e.g. "indie-game-development"
      "title": "string",            // Service name displayed on card
      "description": "string",      // Short subtitle shown on card (~80 chars)
      "longDescription": "string",  // Full description shown on service detail page
      "icon": "string",             // Icon name from Lucide icon library (string key)
      "category": "string",         // Allowed values: "Development", "Consulting", "Art", "Audio", "Publishing", "Video", "Assets", "Web"
      "features": ["string"]        // 3–5 bullet features for the service
    }
  ]
}
```

### Sample Data
```json
{
  "items": [
    {
      "id": "1",
      "slug": "indie-game-development",
      "title": "Indie Game Development",
      "description": "Full-cycle game development from concept to launch.",
      "longDescription": "We handle every stage of game development — from initial concept and game design to programming, art, audio, and QA. We ship polished, fun experiences.",
      "icon": "Gamepad2",
      "category": "Development",
      "features": ["Concept Design", "Gameplay Programming", "Multiplayer Systems", "QA & Optimization"]
    }
  ]
}
```

---

## 6. Studio Milestones API

### Endpoint
```
GET /api/milestones
```

### JSON Shape
```json
{
  "items": [
    {
      "id": "string",               // Unique identifier
      "year": "string",             // Display year, e.g. "2023"
      "title": "string",            // Milestone headline, e.g. "Studio Founded"
      "description": "string",      // 1–2 sentence description
      "icon": "string"              // Emoji icon shown on the timeline node
    }
  ]
}
```

### Sample Data
```json
{
  "items": [
    {
      "id": "1",
      "year": "2023",
      "title": "Studio Founded",
      "description": "Fluke Game Studio was born with a single passion: build games that matter. Started as a solo project and quickly grew.",
      "icon": "🌱"
    },
    {
      "id": "2",
      "year": "2024",
      "title": "First Game Released",
      "description": "Neon Drift launched on Steam and mobile — our first full commercial release.",
      "icon": "🚀"
    },
    {
      "id": "3",
      "year": "2024",
      "title": "Asset Store Launch",
      "description": "Launched our first asset pack on Unity Asset Store. The Sci-Fi Props vol.1 hit over 200 downloads in the first month.",
      "icon": "📦"
    },
    {
      "id": "4",
      "year": "2025",
      "title": "Studio Expansion",
      "description": "Grew to a team of 4 full-time creators. Took on our first contract development clients.",
      "icon": "⚡"
    },
    {
      "id": "5",
      "year": "2025",
      "title": "Shadow Realm in Development",
      "description": "Our most ambitious project yet — an open-world dark fantasy action RPG built in Unreal Engine 5.",
      "icon": "⚔️"
    }
  ]
}
```

---

## 7. Job Listings API *(Already Wired — Verify Shape)*

> This endpoint already exists on AWS Lambda. The frontend currently calls it at:
> - **DEV:** `/api/jobs` (proxied via Vite)
> - **PROD:** `https://xtipeal88c.execute-api.us-east-1.amazonaws.com/jobs`

### Endpoint
```
GET /api/jobs
```

### Expected Response Shape (what the frontend normalizes)
```json
{
  "items": [
    {
      "jobId": "string",            // Optional unique ID
      "title": "string",            // Job title, e.g. "3D Artist"
      "employmentType": "string",   // e.g. "Volunteer (Remote)", "Part-time"
      "tags": ["string"],           // Department/skill tags
      "description": "string",      // HTML or plain text job description
      "questions": ["string"],       // ← Legacy: simple array of question strings

      // Structured questions for multi-step application form:
      "generalQuestions": [...],     // See Application API below
      "generalQuestionIds": [...],   // Ordered IDs for general questions
      "personalQuestions": [...],    // Personal info fields
      "personalQuestionIds": [...],  // Ordered IDs
      "roleQuestions": [...],        // Role-specific questions
      "roleQuestionIds": [...]       // Ordered IDs
    }
  ]
}
```

> **Note to team lead:** Confirm whether the response wraps the array in `items`, `Items`, or `data` — the frontend handles all three variants automatically.

---

## 8. Job Application Submission API *(Already Wired)*

> **PROD:** `POST https://xtipeal88c.execute-api.us-east-1.amazonaws.com/apply`

### Request Body (what the frontend sends)
```json
{
  "roleId": "string",              // Slug of the job, e.g. "3d-artist"
  "roleTitle": "string",           // Human-readable title
  "answers": {
    "fieldKey1": "User's answer",
    "fieldKey2": "Another answer"
  }
}
```

### Question Object Shape (for structured application form)
Each question in `generalQuestions`, `personalQuestions`, `roleQuestions` arrays should look like:
```json
{
  "id": "string",                  // Unique field key, e.g. "portfolioLink"
  "label": "string",               // Display label, e.g. "Portfolio Link"
  "type": "string",                // Allowed values: "text", "email", "tel", "url", "textarea", "radio", "checkbox"
  "required": true,                // Boolean
  "options": ["string"],           // Only for "radio" or "checkbox" types
  "placeholder": "string",         // Optional input placeholder text
  "helpText": "string"             // Optional helper text shown below field
}
```

---

## 9. Contact Form Submission API *(Needs to be Built)*

> Currently the contact form only shows a success message in the UI — no data is actually sent anywhere. The team needs to build this endpoint.

### Endpoint
```
POST /api/contact
```

### Request Body
```json
{
  "name": "string",                // Required — sender's full name
  "email": "string",               // Required — sender's email address
  "company": "string",             // Optional — studio or company name
  "budget": "string",              // Optional — selected budget range
  "type": "string",                // Optional — selected project type
  "message": "string"              // Required — message body
}
```

### Success Response
```json
{
  "success": true,
  "message": "Your message has been received. We'll get back to you within 24 hours."
}
```

### Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "details": "Email is required"
}
```

---

## Quick Reference — All Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/games` | All games list |
| `GET` | `/api/games/:slug` | Single game detail |
| `GET` | `/api/team` | All team members |
| `GET` | `/api/devlogs` | All devlog posts |
| `GET` | `/api/devlogs/:slug` | Single devlog post |
| `GET` | `/api/devlogs?category=Unity` | Filter devlogs |
| `GET` | `/api/portfolio` | All portfolio items |
| `GET` | `/api/portfolio?category=Games` | Filter portfolio |
| `GET` | `/api/services` | All services |
| `GET` | `/api/milestones` | Studio timeline |
| `GET` | `/api/jobs` | Open job listings *(existing)* |
| `POST` | `/api/apply` | Job application *(existing)* |
| `POST` | `/api/contact` | Contact form submission *(new)* |

---

## Notes for Backend Team

1. **Consistent envelope** — All GET list responses should return `{ "items": [...] }` so the frontend can be updated uniformly.
2. **Image hosting** — Image URLs can be relative paths (e.g. `/games/neon-drift.jpg` served from the same CDN) or absolute URLs (e.g. S3 / Cloudfront).
3. **Ordering** — All lists should be ordered by the backend (e.g. Games by `releaseYear` desc, Devlogs by `date` desc, Portfolio by `year` desc).
4. **CORS** — Ensure `Access-Control-Allow-Origin` is set for the frontend domain.
5. **Caching** — Games, Team, Services, Portfolio, and Milestones are mostly static. A `Cache-Control: max-age=3600` header is recommended.
6. **Devlog content field** — The `content` field for devlogs is currently empty in dummy data (`""`). The backend should return either HTML or Markdown — the frontend needs a small update to render it.
