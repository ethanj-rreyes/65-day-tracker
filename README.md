# 65-Day Peak Performance Tracker

Vite + React + Tailwind CSS v4 + Firebase (Auth + Firestore). Mobile-first, dark mode, syncs across devices.

## 1. Firebase setup (about 5 minutes)

1. Go to https://console.firebase.google.com and click **Add project** (Analytics not needed).
2. **Add a web app**: Project overview > the `</>` icon > give it a nickname > Register. Copy the `firebaseConfig` values it shows you.
3. **Authentication** > Get started > Sign-in method: enable **Google** (pick a support email) and **Email/Password**.
4. **Firestore Database** > Create database > choose a region near you (e.g. `asia-southeast1`) > start in **production mode**.
5. Firestore > **Rules** tab > paste the contents of `firestore.rules` > Publish. (This locks each user's data to their own account.)

## 2. Run locally

```bash
npm install
cp .env.example .env.local     # Windows: copy .env.example .env.local
# fill in .env.local with the keys from step 1.2
npm run dev
```

Map of config keys to `.env.local`:

| firebaseConfig field | Variable |
| --- | --- |
| apiKey | VITE_FIREBASE_API_KEY |
| authDomain | VITE_FIREBASE_AUTH_DOMAIN |
| projectId | VITE_FIREBASE_PROJECT_ID |
| storageBucket | VITE_FIREBASE_STORAGE_BUCKET |
| messagingSenderId | VITE_FIREBASE_MESSAGING_SENDER_ID |
| appId | VITE_FIREBASE_APP_ID |

`localhost` is authorized for Google sign-in by default.

## 3. Deploy to Vercel

1. Push this folder to a GitHub repo (`.env.local` is git-ignored).
2. Vercel > Add New Project > import the repo. Framework preset: **Vite** (auto-detected).
3. Add the six `VITE_FIREBASE_*` variables under **Environment Variables**, then Deploy.
4. **Important:** copy your Vercel domain (e.g. `my-tracker.vercel.app`) into Firebase > Authentication > Settings > **Authorized domains**, or Google sign-in will fail on the live site.

## How it works

- Day 1 = the start date you pick on first login (change it anytime from the ... menu).
- Tapping a checkbox autosaves that day's progress. **Complete Day** marks the day finished.
- A day counts toward your total and streak when it is marked complete **and** hits `PASS_THRESHOLD` (default 100%, set in `src/constants.js`).
- Today can be edited, past days can be backfilled, future days are locked.
- Today not being done yet does not break your streak until the day ends.

## Data model

```
users/{uid}                -> { startDate: "YYYY-MM-DD" }
users/{uid}/days/{dayNum}  -> { day, tasks: { macros: true, ... }, percent, completed, updatedAt }
```

To change the checklist, edit `PILLARS` in `src/constants.js`. Percentages adapt automatically.
