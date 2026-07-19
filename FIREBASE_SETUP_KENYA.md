# Firebase Setup for Lucy (Kenya) — 3 steps only YOU can do

Everything else is already prepared in this project. Firebase requires **your Google login** — I cannot do these 3 steps for you.

## Your project

- **Console:** https://console.firebase.google.com/u/0/project/techpulse-eae22/overview
- **Project ID:** `techpulse-eae22`

## Step 1 — Enable Firestore (2 minutes)

1. Open the link above and sign in with Google
2. Left menu: **Build → Firestore Database**
3. Click **Create database**
4. **Location for Kenya:** choose **`europe-west1` (Belgium)** — closest low-latency region to East Africa
5. Start in **test mode** → **Enable**

## Step 2 — Download service account key (1 minute)

1. Gear icon → **Project settings**
2. Tab **Service accounts**
3. **Generate new private key** → **Generate key**
4. Save the file to `Downloads` (e.g. `techpulse-eae22-firebase-adminsdk-xxxxx.json`)

## Step 3 — Run the setup script (30 seconds)

In PowerShell:

```powershell
cd C:\Users\Admin\Documents\techpulse
.\scripts\setup-env.ps1 -JsonPath "C:\Users\Admin\Downloads\YOUR-DOWNLOADED-FILE.json"
npm start
```

Open http://localhost:3000 — refresh twice. Second load should say **Firestore cache**.

## Step 4 — Publish Firestore rules (1 minute)

1. **Firestore Database → Rules**
2. Copy contents from `firestore.rules` in this folder
3. Paste → **Publish**

---

After this, tell me your GitHub username and I can help push to GitHub and deploy to Render (free, works from Kenya).
