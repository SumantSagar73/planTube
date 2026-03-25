# Fixing Live Viewer Count - Complete Guide

## The Root Problem
Each user was getting a **separate Video document** for the same YouTube video, so they joined different Socket.io rooms. Now we use **SharedVideo** to store video metadata once per YouTube video, allowing all users watching the same video to see each other.

## Changes Made

### 1. Database Schema Changes
- **Created `SharedVideo` model**: Stores video metadata once per YouTube video
- **Updated `Video` model**: Now references `SharedVideo` via `sharedVideoId`
- **Added `sharedVideo` virtual**: Automatically populates SharedVideo data

### 2. Server-Side Updates
- **playlistController.js**: Import playlists/videos now create or reuse SharedVideo
- **videoController.js**: Populates SharedVideo when fetching videos
- **All Video queries**: Now use `.populate('sharedVideoId')`

### 3. Client-Side Updates
- **FocusMode.jsx**: Uses `video.sharedVideo.youtubeId` for presence tracking
- **Environment**: Updated to use `localhost:5000` for development
- **Better UI**: Improved viewer count display with green highlights

### 4. Migration Script
- **migrateToSharedVideo.js**: Converts existing data to use SharedVideo

## Setup Instructions

### Step 1: Run the Migration
Convert your existing videos to use SharedVideo:

```bash
cd server
node migrateToSharedVideo.js
```

Expected output:
```
✅ Connected to MongoDB
📦 Found X videos to process
✅ Created SharedVideo for YouTube ID: abc123
♻️  Reusing existing SharedVideo for YouTube ID: xyz789
...
📊 Migration Summary:
   ✅ SharedVideos created: X
   ♻️  Video documents updated: Y
✨ Migration completed successfully!
```

### Step 2: Start Your Server
```bash
cd server
npm start
```

You should see:
```
Server running on port 5000
MongoDB Connected
```

### Step 3: Start Your Client
In a new terminal:

```bash
cd client
npm run dev
```

### Step 4: Test Live Viewer Count

1. **Open browser 1**: Navigate to any video in Focus Mode
2. **Check console**: Should see:
   ```
   🔌 Socket.io connecting to: http://localhost:5000
   ✅ Socket.io connected successfully
   🔗 Socket connected: [socket-id]
   👥 Joining video room: [youtube-id] User: [user-id]
   📡 Broadcasting presence for video [youtube-id]: 1 users
   📊 Presence update received: {videoId: "...", count: 1}
   ✅ Updating presence count to: 1
   ```

3. **Check UI**: Should show "1 viewer" with green highlight

4. **Open browser 2 (different window/incognito)**: 
   - Navigate to the **SAME video**
   - Viewer count should increase to 2 in **BOTH windows**

5. **Close one window**: Count should decrease to 1

6. **Test with different users**: Sign in with different accounts and watch the same video

## Verification Checklist

### Server Console Should Show:
- ✅ `🔗 Socket connected: [socket-id]`
- ✅ `👥 User joining video room - videoId: [youtube-id], id: [user-id]`
- ✅ `✅ User [id] added to video [youtube-id]. Total viewers: X`
- ✅ `📡 Broadcasting presence for video [youtube-id]: X users`

### Client Console Should Show:
- ✅ `🔌 Socket.io connecting to: http://localhost:5000`
- ✅ `✅ Socket.io connected successfully`
- ✅ `👥 Joining video room: [youtube-id] User: [user-id]`
- ✅ `📊 Presence update received: {videoId: "...", count: X}`
- ✅ `✅ Updating presence count to: X`

### UI Should Show:
- ✅ Viewer count badge in top-left of Focus Mode
- ✅ Green highlight when count > 0
- ✅ Pulsing green dot indicator
- ✅ Text showing "X viewers" (or "X viewer" for 1)

## Troubleshooting

### Issue: "Socket connection error"
**Solution**: Make sure your server is running on port 5000
```bash
cd server
npm start
```

### Issue: Viewer count stuck at 0
**Solutions**:
1. Check if migration ran successfully: `node migrateToSharedVideo.js`
2. Verify `.env` has `VITE_API_URL=http://localhost:5000/api`
3. Restart both client and server
4. Clear browser cache and reload

### Issue: Count shows 1 in all windows
**Problem**: Videos are using different YouTube IDs
**Solution**: 
1. Check console for "youtubeId" being used
2. Ensure videos were imported via import feature (not manually created)
3. Run migration again if needed

### Issue: Count different in different windows
**Solution**: This is expected during connection delays. Wait 2-3 seconds for sync.

## How It Works Now

### Before (Broken):
```
User A imports video abc123 → Creates Video doc 1 → Joins room "video_1"
User B imports video abc123 → Creates Video doc 2 → Joins room "video_2"
Result: They're in different rooms, can't see each other ❌
```

### After (Fixed):
```
User A imports video abc123 → Finds/Creates SharedVideo → Creates Video doc 1 (references SharedVideo)
User B imports video abc123 → Reuses SharedVideo → Creates Video doc 2 (references SharedVideo)
Both join room using youtubeId "abc123"
Result: They're in the same room, see each other! ✅
```

## Production Deployment

When deploying to production:

1. **Update client/.env**:
   ```
   VITE_API_URL=https://your-production-api.com/api
   ```

2. **Run migration on production database**:
   ```bash
   node migrateToSharedVideo.js
   ```

3. **Verify CORS settings** in `server/index.js` include your production URL

## Need Help?

Check the console logs - all socket events and presence updates are now logged for debugging!
