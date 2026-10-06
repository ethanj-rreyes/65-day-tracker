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

Three tabs: **Today** (log the day), **Progress** (65-day grid, hit rates, trend charts), **Review** (weekly review).

### Exact daily rules (all 7 = day passed)

| Task | Pass rule | How it's checked |
| --- | --- | --- |
| Protein | Logged protein >= target (default 120 g); optional calories within ±10% | Number entry + quick-add buttons |
| Exercise | >= 30 min of intentional exercise, any activity | Activity type + minutes |
| Water | >= 3.0 L | +250 / +500 ml taps |
| Deep work | One uninterrupted 90-min block on the in-app timer; a pause over 5 min resets it | Timer auto-checks when it finishes |
| Brain dump | Tomorrow's top 3 tasks all filled in | Shown on tomorrow's Today screen |
| Sleep | >= 7 h last night | Bedtime + wake-up time |
| Zero liquid calories | No alcohol or calorie-containing drinks (allowed/banned list shown in-app) | Confirm before bed |

All targets are editable under ⋯ > Settings & targets.

### No-miss rule

- A day only counts if it hits **100%**. There is no partial credit.
- You can log today, plus yesterday until **12:00 noon** (`GRACE_HOUR` in `src/constants.js`), for late-night logging.
- After that the day locks. Anything under 100% is recorded as **Missed** (red on the grid, shown in the header) and resets the streak.
- Locked days keep the result they had, even if you change targets later.

## Data model

```
users/{uid}                -> { startDate, settings: { proteinTarget, calorieTarget, waterTargetMl, exerciseMinutes, deepWorkMinutes, sleepMinHours } }
users/{uid}/days/{dayNum}  -> { metrics: { protein, calories, waterMl, exerciseMin, exerciseType, bed, wake, noLiquidCal },
                                focus: { status, startedAt, accMs, pausedAt, topic }, top3: [..3], planDone: [..3],
                                tasks: { macros, training, water, deepwork, braindump, sleep, nosugar }, percent, completed, updatedAt }
users/{uid}/reviews/{week} -> { worked, blocked, change, updatedAt }
```

The existing `firestore.rules` already covers the new `reviews` collection, so you don't need to change the rules.
