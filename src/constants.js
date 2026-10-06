export const TOTAL_DAYS = 65;
export const TOTAL_WEEKS = Math.ceil(TOTAL_DAYS / 7);

// No-miss rule: a day only counts if ALL tasks pass (100%).
export const PASS_THRESHOLD = 100;

// You can finish logging yesterday until this hour (24h clock) the next morning.
// After that the day locks: if it wasn't 100%, it's recorded as MISSED and the streak resets.
export const GRACE_HOUR = 12;

// Focus timer: pausing for longer than this resets the block to zero.
export const PAUSE_LIMIT_MIN = 5;

// Editable in the app under Settings. These are just the starting values.
export const DEFAULT_SETTINGS = {
  proteinTarget: 120, // grams
  calorieTarget: 0, // kcal, 0 = don't track calories
  waterTargetMl: 3000,
  exerciseMinutes: 30,
  deepWorkMinutes: 90,
  sleepMinHours: 7,
  // Money
  weeklyImpulseBudget: 500, // pesos per challenge week
  coolOffHours: 24,
  // Calendar
  calendarIds: [], // Google Calendar IDs to read (set in the app)
  focusKeywords: 'deep work, study, focus, code, coding, review, biobytes',
  exerciseKeywords: 'gym, run, workout, lift, exercise, training, swim, basketball',
};

export const CURRENCY = '\u20b1';

// Calendar check-in window: you can check in from 10 min before an event starts;
// checking in more than 15 min after the start counts as late.
export const CHECKIN_EARLY_MIN = 10;
export const CHECKIN_LATE_MIN = 15;

export const EXPENSE_CATEGORIES = ['Food', 'Drinks', 'Transport', 'School', 'Shopping', 'Gaming', 'Subscriptions', 'Going out', 'Other'];
export const IMPULSE_TRIGGERS = ['Bored', 'Stressed', 'Sale / promo', 'Social media', 'Hungry', 'With friends', 'Reward', 'Tired'];
export const REGRET_AFTER_DAYS = 3;

export const EXERCISE_TYPES = ['Lift', 'Run', 'Sport', 'Cardio', 'Walk', 'Mobility', 'Other'];

export const NO_LIQUID_CAL_ALLOWED =
  'Water, black coffee, plain tea, zero-calorie drinks, a splash of milk (max 30 ml) in coffee or tea.';
export const NO_LIQUID_CAL_BANNED =
  'Alcohol of any kind, soda, juice, milk tea, sugar-sweetened coffee, sweetened energy/sports drinks, smoothies, shakes other than a protein shake counted toward protein.';

// Each task has an exact pass rule. `rule(settings)` is the text shown in the app;
// the actual check lives in evaluateTasks() in utils.js.
export const PILLARS = [
  {
    id: 'physical',
    title: 'Physical Optimization',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
    tasks: [
      {
        id: 'macros',
        label: 'Protein target',
        rule: (s) =>
          `Log at least ${s.proteinTarget} g protein` +
          (s.calorieTarget > 0 ? ` and ${s.calorieTarget} kcal (within ±10%)` : ''),
      },
      {
        id: 'training',
        label: 'Exercise',
        rule: (s) => `At least ${s.exerciseMinutes} min of intentional exercise (any activity you choose)`,
      },
      {
        id: 'water',
        label: 'Water',
        rule: (s) => `Drink at least ${(s.waterTargetMl / 1000).toFixed(1)} L of water`,
      },
    ],
  },
  {
    id: 'cognitive',
    title: 'Cognitive & Mental Peak',
    dot: 'bg-sky-400',
    text: 'text-sky-300',
    tasks: [
      {
        id: 'deepwork',
        label: 'Deep work',
        rule: (s) => `Finish one ${s.deepWorkMinutes}-min focus block on the timer (a pause over ${PAUSE_LIMIT_MIN} min resets it)`,
      },
      {
        id: 'braindump',
        label: 'Brain dump',
        rule: () => "Write tomorrow's top 3 tasks (all three filled in)",
      },
    ],
  },
  {
    id: 'recovery',
    title: 'Recovery & Lifestyle',
    dot: 'bg-violet-400',
    text: 'text-violet-300',
    tasks: [
      {
        id: 'sleep',
        label: 'Sleep',
        rule: (s) => `At least ${s.sleepMinHours} h last night (bedtime to wake-up)`,
      },
      {
        id: 'nosugar',
        label: 'Zero liquid calories',
        rule: () => 'No alcohol and no calorie-containing drinks all day (confirm before bed)',
      },
    ],
  },
  {
    id: 'money',
    title: 'Money Discipline',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
    tasks: [
      {
        id: 'budget',
        label: 'Impulse budget',
        rule: (s) => `No impulse buy today while this week's impulse spending is over ${CURRENCY}${s.weeklyImpulseBudget}`,
      },
    ],
  },
];

export const ALL_TASKS = PILLARS.flatMap((p) => p.tasks);
