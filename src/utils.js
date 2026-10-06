import { ALL_TASKS, PASS_THRESHOLD, TOTAL_DAYS } from './constants';

const pad = (n) => String(n).padStart(2, '0');

// Local-time YYYY-MM-DD (avoids the UTC off-by-one you get from toISOString()).
export const toISODate = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseISODate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Which challenge day is "today"? (1-based; can be <1 before start or >65 after the end)
export const dayNumberFor = (startISO, now = new Date()) => {
  const start = parseISODate(startISO);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - start) / 86400000) + 1;
};

export const dateForDay = (startISO, n) => {
  const d = parseISODate(startISO);
  d.setDate(d.getDate() + n - 1);
  return d;
};

export const formatDate = (d) =>
  d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export const calcPercent = (tasks = {}) => {
  const done = ALL_TASKS.filter((t) => tasks[t.id]).length;
  return Math.round((done / ALL_TASKS.length) * 100);
};

export const isCounted = (day) => Boolean(day && day.completed && day.percent >= PASS_THRESHOLD);

export function computeStats(days, todayNum) {
  let total = 0;
  let best = 0;
  let run = 0;
  for (let n = 1; n <= TOTAL_DAYS; n++) {
    if (isCounted(days[n])) {
      total++;
      run++;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }

  // Current streak: walk back from today. If today isn't done yet (and the
  // challenge is still running), don't break the streak - start from yesterday.
  let streak = 0;
  let cursor = Math.min(todayNum, TOTAL_DAYS);
  if (cursor >= 1 && !isCounted(days[cursor]) && todayNum <= TOTAL_DAYS) cursor--;
  while (cursor >= 1 && isCounted(days[cursor])) {
    streak++;
    cursor--;
  }
  return { total, streak, best };
}
