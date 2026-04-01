# UAV Detection System — Dashboard Frontend

A React dashboard for the UAV Detection System. Displays real-time drone detection events received from Jetson edge devices, with image previews, confidence scores, AI-generated reports, and base station management.

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
| Real-Time | WebSocket (`/ws/feed`) |
| Styling | Inline styles (iOS-inspired design system) |

---

## Project Structure

```
src/
├── api/
│   └── client.js              # Axios instance — base URL, JWT interceptor, 401 redirect
├── components/
│   ├── Navbar.jsx             # Sticky frosted-glass navbar with nav links and logout
│   └── ProtectedRoute.jsx     # Wraps authenticated pages, redirects to /login if no token
├── hooks/
│   └── useDetectionFeed.js    # WebSocket hook — connects to /ws/feed, triggers refetch on new detection
├── pages/
│   ├── LoginPage.jsx          # Login form with JWT auth
│   ├── DetectionsPage.jsx     # Detection card grid with filters, pagination, real-time updates
│   ├── DetectionDetailPage.jsx# Full detection report: image, confidence bars, AI description, delete
│   └── BaseStationsPage.jsx   # Base station list with add, inline edit, and delete
├── store/
│   └── auth.js                # Zustand store — token persisted in localStorage
├── App.jsx                    # Router setup with protected route wrapper
├── main.jsx                   # React entry point with QueryClientProvider
└── index.css                  # Global reset and iOS-style base styles
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

## Real-Time Detection Feed

New detections appear on the dashboard instantly without polling. Here is how it works:

1. The Jetson sends a detection to the backend via `POST /ws/detections`
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

## Design System

The UI follows an iOS-inspired design language:

| Token | Value |
|---|---|
| Background | `#f2f2f7` (Apple system gray) |
| Cards | `#ffffff` with `box-shadow: 0 2px 12px rgba(0,0,0,0.07)` |
| Card radius | `20px` |
| Navbar | Frosted glass — `backdrop-filter: blur(20px)` |
| Primary (iOS blue) | `#007aff` |
| Detected (iOS red) | `#ff3b30` |
| Clear (iOS green) | `#34c759` |
| Warning (iOS orange) | `#ff9500` |
| Primary text | `#1c1c1e` |
| Secondary text | `#8e8e93` |
| Font | `-apple-system, BlinkMacSystemFont, 'SF Pro Display', ...` |

---

## Environment Variables

Create a `.env` file in the project root:

```
VITE_API_URL=http://localhost:8000
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the FastAPI backend |

> **Important:** Vite bakes environment variables into the JS bundle **at build time**, not at runtime. When using Docker, this must be passed as a build argument — not a runtime `-e` env var. See the Docker section below.

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
# Create a .env file in the project root
echo "VITE_API_URL=http://localhost:8000" > .env
```

**4. Start the development server:**
```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

> Make sure the backend is running at the URL set in `VITE_API_URL` before using the app.

---

## Building for Production

```bash
npm run build
```

Output is in the `dist/` folder. Serve it with any static file server (nginx, etc.).

---

## Docker

Docker setup is handled by a separate team member. The frontend is Docker-ready:

- `package.json` and `package-lock.json` are committed (equivalent of `requirements.txt`)
- `.dockerignore` excludes `node_modules/`, `dist/`, and `.env`
- No hardcoded config — all configuration is via the `VITE_API_URL` environment variable

### Critical note for the Dockerfile author

Because Vite bakes env vars at build time, `VITE_API_URL` **must** be passed as a Docker build argument:

```dockerfile
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build
```

Built with:
```bash
docker build --build-arg VITE_API_URL=http://your-backend-host:8000 .
```

Passing it as a runtime `-e VITE_API_URL=...` will **not** work — the built bundle won't pick it up.

---

## Backend Repository

The FastAPI backend that this dashboard connects to:
[SE496-Capstone-Dashboard-Backend](https://github.com/yunusdemirboga/SE496-Capstone-Dashboard-Backend)
