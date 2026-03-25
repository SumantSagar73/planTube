# Live Viewer Count Debugging Guide

## Issue Identified
Your live viewer count feature is implemented but may not be displaying correctly due to configuration or connection issues.

## Changes Made

### 1. Enhanced Debugging (Client Side)
- Added console logs to track socket connection status
- Added logs when joining/leaving video rooms
- Added logs when presence updates are received
- Improved viewer count display with:
  - Green highlight when viewers > 0
  - Pulsing indicator for active viewers
  - Clear "X viewers" text instead of just a number
  - Tooltip showing viewer count

### 2. Enhanced Debugging (Server Side)
- Added logs when sockets connect
- Added logs when users join/leave video rooms
- Added logs when broadcasting presence updates

### 3. Socket Service Improvements
- Added connection status logging
- Added error logging for failed connections

## How to Test

### Step 1: Check Environment Configuration
Your client `.env` file is currently set to:
```
VITE_API_URL=https://plantube-api.onrender.com/api
```

**For local development:**
1. Change it to:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```
2. Or create a `.env.local` file with the local URL (which overrides `.env`)

### Step 2: Start Your Server
```bash
cd server
npm start
```

### Step 3: Start Your Client
```bash
cd client
npm run dev
```

### Step 4: Open Browser Console
1. Open your app in a browser
2. Press F12 to open Developer Tools
3. Go to the "Console" tab
4. Navigate to a video in Focus Mode

### Step 5: Check Console Logs
You should see logs like:
```
🔌 Socket.io connecting to: http://localhost:5000
✅ Socket.io connected successfully to http://localhost:5000
🔗 Socket connected: abc123
👥 Joining video room: [videoId] User: [userId or visitorId]
📡 Broadcasting presence for video [videoId]: 1 users
📊 Presence update received: {videoId: "...", count: 1}
✅ Updating presence count to: 1
```

### Step 6: Test with Multiple Windows
1. Open the same video in multiple browser windows/tabs
2. Watch the viewer count increase
3. Close a window and watch it decrease

## Troubleshooting

### Issue: "Socket connection error" in console
- **Solution**: Make sure your server is running on the correct port
- Check if `http://localhost:5000` is accessible
- Verify your `.env` file has the correct API URL

### Issue: Viewer count stuck at 0
- **Solution**: Check browser console for socket connection errors
- Verify the `videoId` is being passed correctly
- Check server logs to see if `join_video` events are received

### Issue: Viewer count not updating in real-time
- **Solution**: Check if `presence_update` events are being received
- Verify socket connection is maintained (not disconnecting)
- Check if multiple video rooms are being joined

### Issue: Different count in different windows
- **Solution**: This is expected! Each window shows the live count
- Wait a few seconds for synchronization
- Check server logs to see the actual count

## Production Deployment

When deploying to production (Vercel, Render, etc.):

1. **Client `.env`**: Should point to your production server
   ```
   VITE_API_URL=https://your-api-domain.com/api
   ```

2. **Server CORS**: Verify your production URL is in the allowed origins
   - Check `server/index.js` line ~10 for CORS configuration
   - Add your production client URL if missing

3. **Socket.io Transports**: Both websocket and polling are enabled for reliability

## API Endpoints

The following endpoints are related to presence tracking:

- `POST /api/presence/heartbeat` - Manual heartbeat (backup method)
- `GET /api/presence/:videoId` - Get current viewer count
- `Socket Event: join_video` - Join a video room
- `Socket Event: leave_video` - Leave a video room  
- `Socket Event: presence_update` - Receive viewer count updates

## Need More Help?

Check the browser console and server terminal for detailed logs. All socket events and presence updates are now logged for debugging.
