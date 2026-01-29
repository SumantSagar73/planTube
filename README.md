# PlanTube

PlanTube helps users turn YouTube playlists into scheduled learning plans.

## Features
- Secure Authentication
- Import YouTube Playlists
- Schedule Videos (Date & Time)
- Track Progress
- Premium Glassmorphic UI

## High-Level Architecture
- **Frontend**: React, Vite, Axios, Lucide React
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Auth**: JWT (JSON Web Tokens)

## Getting Started

### 1. Prerequisites
- Node.js installed
- MongoDB URI (already configured in `.env`)
- YouTube Data API v3 Key (needed for playlist imports)

### 2. Setup
1. Clone the repository.
2. In the `server` directory, create a `.env` file (if not present) and add your `YOUTUBE_API_KEY`.
3. Install dependencies:
   ```bash
   # Server
   cd server
   npm install

   # Client
   cd client
   npm install
   ```

### 3. Run the Application
You can now start both the backend and frontend with a single command from the root directory:
```bash
npm run dev
```
This will start:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

Alternatively, to run them individually:
```bash
# Start Server
npm run server

# Start Client
npm run client
```

## Environment Variables (Server)
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT
- `YOUTUBE_API_KEY`: Your YouTube Data API v3 Key
