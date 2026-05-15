# UAV Detection System — Dashboard Frontend

A React dashboard for the UAV Detection System. Displays real-time drone detection events received from Jetson edge devices, with image previews, confidence scores, AI-generated reports, base station management, and a live WebRTC camera stream with YOLO bounding boxes.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 (Vite, plain JS/JSX) |
| Routing | React Router DOM v6 |
| Server State | TanStack React Query v5 |
| Auth State | Zustand |
| HTTP Client | Axios |
| Forms | React Hook Form |
| Date Formatting | date-fns |
| Real-Time Feed | WebSocket (`/ws/feed`) |
| Live Video Stream | WebRTC (`RTCPeerConnection`) via signaling WebSocket (`/ws/webrtc/viewer`) |
| Styling | Inline styles (iOS-inspired design system) |
| Deployment | Vercel (SPA routing fixed via `vercel.json`) |

---

## Project Structure

```
src/
├── api/
│   └── client.js                  # Axios instance — base URL, JWT interceptor, 401 redirect
├── components/
│   ├── Navbar.jsx                  # Sticky frosted-glass navbar with nav links, Live View button, logout
│   ├── LiveViewModal.jsx           # WebRTC live stream modal — connects to Jetson camera feed
│   └── ProtectedRoute.jsx          # Wraps authenticated pages, redirects to /login if no token
├── hooks/
│   └── useDetectionFeed.js        # WebSocket hook — connects to /ws/feed, triggers refetch on new detection
├── pages/
│   ├── LoginPage.jsx               # Login form with JWT auth
│   ├── DetectionsPage.jsx          # Detection card grid with filters, pagination, real-time updates
│   ├── DetectionDetailPage.jsx     # Full detection report: image, confidence bars, AI description, delete
│   └── BaseStationsPage.jsx        # Base station list with add, inline edit, and delete
├── store/
│   └── auth.js                     # Zustand store — token persisted in localStorage
├── App.jsx                         # Router setup with protected route wrapper
├── main.jsx                        # React entry point with QueryClientProvider
└── index.css                       # Global reset and iOS-style base styles
vercel.json                         # Rewrites all paths to index.html for SPA routing
```

---

## Pages

### `/login`
- Username and password form
- Calls `POST /auth/login` on the backend
- Stores the returned JWT token in Zustand + localStorage
- Redirects to `/detections` on success

### `/detections`
- Grid of detection cards (3 columns → 2 → 1 on smaller screens)
- Each card shows: detection image, date, and a DETECTED / CLEAR badge
- Filter pills: All / Detected / Clear
- Pagination (50 per page)
- **Real-time:** new detections appear automatically via WebSocket — no page refresh needed
- Clicking a card navigates to the detail page

### `/detections/:id`
- Large image at the top
- Full report card with:
  - Detection status badge
  - Detected At and Record Created timestamps
  - Base Station ID
  - YOLO Vision and Acoustic confidence bars (color-coded by severity)
  - AI-generated description (LLM report from Jetson)
- Delete button with confirmation

### `/base-stations`
- List of all registered base stations
- Add new station form (name, latitude, longitude)
- Each station has an **Edit** button — expands inline with pre-filled inputs for name, latitude, longitude — and a **Delete** button
- Edit calls `PATCH /base_stations/{id}` (partial update — only changed fields are sent)

---

## Live View (WebRTC)

A **Live View** button in the navbar opens a fullscreen modal that streams the Jetson camera feed with YOLO bounding boxes in real time using WebRTC.

### How it works

1. Clicking **Live View** opens `LiveViewModal`, which creates a `WebSocket` and an `RTCPeerConnection`
2. The signaling WebSocket connects to `wss://se496-capstone-dashboard-backend.onrender.com/ws/webrtc/viewer`
3. The backend notifies the Jetson, which sends an SDP offer: `{ type: "offer", sdp: ..., sdpType: ... }`
4. The browser sets the remote description, creates an SDP answer, sets its local description, and sends the answer back
5. Both sides exchange ICE candidates via the same WebSocket
6. Once the peer connection is established, `pc.ontrack` fires and sets `video.srcObject = event.streams[0]`
7. Closing the modal calls `pc.close()` and `ws.close()` — this signals the backend to stop the Jetson stream

### ICE / STUN configuration

```js
iceServers: [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" }
]
```

### Status indicators

| Status | Meaning |
|---|---|
| Connecting... | WebSocket opening |
| Waiting for Jetson... | WebSocket open, waiting for SDP offer |
| Live | Track received, video playing |
| Jetson not connected | Backend returned `no_producer` message |
| Stream ended | ICE connection failed (`iceConnectionState === "failed"`) |

### Latency optimisations applied

- **H264 codec preference** — `RTCRtpReceiver.getCapabilities('video')` is used on `ontrack` to reorder codecs so H264 is negotiated first, reducing decode overhead vs VP8
- **Immediate play()** — `video.srcObject` is set and `video.play()` is called immediately in `ontrack` to prevent browser-side buffering delay

---

## Real-Time Detection Feed

New detections appear on the dashboard instantly without polling:

1. The Jetson sends a detection to the backend via `POST /detections`
2. The backend saves it to the database and broadcasts `{ type: "new_detection", detection_id: "..." }` to all connected frontend clients via `/ws/feed`
3. The `useDetectionFeed` hook (used inside `DetectionsPage`) receives the message and calls `queryClient.invalidateQueries({ queryKey: ['detections'] })`
4. React Query automatically re-fetches `GET /detections/` and the new card appears on screen

---

## Authentication

- JWT token is stored in `localStorage` via Zustand (`src/store/auth.js`)
- The Axios client (`src/api/client.js`) automatically attaches the token as a `Bearer` header on every request
- If the backend returns a `401`, the client clears the token and redirects to `/login`
- All pages except `/login` are wrapped in `ProtectedRoute` which redirects unauthenticated users

---

## Vercel SPA Routing

Refreshing a page such as `/detections` on Vercel would return a 404 by default because Vercel looks for a real file at that path. A `vercel.json` file at the project root rewrites all paths to `index.html` so React Router handles routing on the client:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Design System

The UI follows an iOS-inspired design language:

| Token | Value |
|---|---|
| Background | `#f2f2f7` (Apple system gray) |
| Cards | `#ffffff` with `box-shadow: 0 2px 12px rgba(0,0,0,0.07)` |
| Card radius | `20px` |
| Navbar | Frosted glass — `backdrop-filter: blur(20px)` |
| Primary (iOS blue) | `#007aff` |
| Detected / Live button (iOS red) | `#ff3b30` |
| Clear / Live indicator (iOS green) | `#34c759` |
| Warning (iOS orange) | `#ff9f0a` |
| Primary text | `#1c1c1e` |
| Secondary text | `#8e8e93` |
| Font | `-apple-system, BlinkMacSystemFont, 'SF Pro Display', ...` |

---

## Environment Variables

Create a `.env` file in the project root:

```
VITE_API_URL=https://se496-capstone-dashboard-backend-production.up.railway.app
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the FastAPI backend |

> **Important:** Vite bakes environment variables into the JS bundle **at build time**, not at runtime. When deploying to Vercel, add `VITE_API_URL` under **Project Settings → Environment Variables**. When using Docker, pass it as a build argument — not a runtime `-e` env var.

---

## Local Development Setup

**1. Clone the repository:**
```bash
git clone https://github.com/yunusdemirboga/SE496-Capstone-Dashboard-Frontend.git
cd SE496-Capstone-Dashboard-Frontend
```

**2. Install dependencies:**
```bash
npm install
```

**3. Set up environment variables:**
```bash
echo "VITE_API_URL=http://localhost:8000" > .env
```

**4. Start the development server:**
```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

---

## Building for Production

```bash
npm run build
```

Output is in the `dist/` folder. Serve it with any static file server (nginx, Vercel, etc.).

---

## Docker

The frontend is Docker-ready:

- `package.json` and `package-lock.json` are committed
- `.dockerignore` excludes `node_modules/`, `dist/`, and `.env`
- All configuration is via the `VITE_API_URL` environment variable

### Critical note for the Dockerfile author

Because Vite bakes env vars at build time, `VITE_API_URL` **must** be passed as a Docker build argument:

```dockerfile
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build
```

Built with:
```bash
docker build --build-arg VITE_API_URL=https://your-backend-host .
```

Passing it as a runtime `-e VITE_API_URL=...` will **not** work — the built bundle won't pick it up.

---

## Backend Repository

The FastAPI backend that this dashboard connects to:
[SE496-Capstone-Dashboard-Backend](https://github.com/yunusdemirboga/SE496-Capstone-Dashboard-Backend)
