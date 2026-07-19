# TechPulse

A Hacker News dashboard that integrates an open-source API through a Node.js backend, caches responses in Firebase Firestore via the REST API, and serves a vanilla HTML/CSS/JS frontend.

**GitHub:** https://github.com/Scientistlucy/techpulse  
**Live demo:** https://techpulse-gbfk.onrender.com/

## What this project demonstrates

- External API integration (public Hacker News API)
- Server-side data handling with a cache-aside pattern
- Firebase Firestore access through the REST API (not only the Admin SDK)
- A clean, working UI with loading and error states

## Features

- Browse **Top**, **New**, and **Best** stories
- Search by title or author
- View story details in a modal
- Firestore caching with TTL (5 minutes for lists, 15 minutes for items)
- Works even without Firebase credentials (cache disabled, API still works)

## Architecture

```
Browser (HTML/JS)
        |
        v
Node.js / Express
   |-- cache hit  --> Firestore REST API
   |-- cache miss --> Hacker News API --> write to Firestore
```

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express |
| External API | [Hacker News API](https://github.com/HackerNews/API) |
| Cache | Firebase Firestore REST API |
| Frontend | HTML, CSS, JavaScript (ES modules) |
| Hosting | Render (recommended) |

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check and cache status |
| `GET` | `/api/stories?type=top\|new\|best&limit=30` | Story list |
| `GET` | `/api/stories/:id` | Single story details |

## Local setup

### Prerequisites

- Node.js 18 or newer
- A Firebase project with Cloud Firestore enabled (optional but recommended)

### 1. Clone and install

```bash
git clone https://github.com/Scientistlucy/techpulse.git
cd techpulse
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...paste full JSON on one line...}
CACHE_TTL_LIST_MS=300000
CACHE_TTL_ITEM_MS=900000
```

**Firebase setup**

1. Create a project in the [Firebase Console](https://console.firebase.google.com)
2. Enable **Cloud Firestore**
3. Go to **Project settings → Service accounts → Generate new private key**
4. Paste the entire JSON as one line into `FIREBASE_SERVICE_ACCOUNT`

**Recommended Firestore rules** (server-only access via service account):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /hn_cache/{doc} {
      allow read, write: if false;
    }
  }
}
```

> Without Firebase credentials, the app still runs. Caching is skipped and every request goes to Hacker News.

### 3. Run the app

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000)

- First load → data from Hacker News API  
- Refresh within TTL → data from Firestore cache  

## Deploy to Render

1. Create a new **Web Service** on [Render](https://render.com) and connect this GitHub repo
2. Settings:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
3. Add environment variables from your local `.env`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_SERVICE_ACCOUNT`
   - `CACHE_TTL_LIST_MS`
   - `CACHE_TTL_ITEM_MS`
4. Deploy and update the **Live demo** link at the top of this README

> Free Render services may sleep after inactivity. The first request after sleep can take about 30 seconds.

## Project structure

```
techpulse/
├── public/                 # Frontend
│   ├── index.html
│   ├── css/styles.css
│   └── js/                 # api.js, ui.js, app.js
├── server/
│   ├── index.js            # Express entry point
│   ├── routes/stories.js   # API routes
│   ├── services/
│   │   ├── hackerNews.js   # External API client
│   │   └── firestore.js    # Firestore REST client
│   └── utils/cache.js      # TTL helpers
├── firestore.rules
├── .env.example
├── package.json
└── README.md
```

## Design decisions

- **Backend proxy** keeps service account credentials off the client and avoids CORS issues
- **Firestore REST API** shows direct REST integration and typed field encoding/decoding
- **TTL cache** reduces repeated external API calls (relevant to scaling)
- **Batched fetches** hydrate story IDs with limited concurrency (10 at a time)
