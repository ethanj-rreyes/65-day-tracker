import { ALL_TASKS, CHECKIN_EARLY_MIN, CHECKIN_LATE_MIN, GRACE_HOUR, PASS_THRESHOLD, PAUSE_LIMIT_MIN, REGRET_AFTER_DAYS, TOTAL_DAYS } from './constants.js';

const pad = (n) => String(n).padStart(2, '0');

// ---------- dates ----------
export const toISODate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseISODate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

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

export const formatDate = (d) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export const formatDuration = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

// ---------- sleep ----------
// "23:30" -> "07:00" = 7.5 h. Crossing midnight is handled.
export const sleepHours = (bed, wake) => {
  if (!bed || !wake) return 0;
  const toMin = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  let diff = toMin(wake) - toMin(bed);
  if (diff <= 0) diff += 24 * 60;
  return Math.round((diff / 60) * 100) / 100;
};

// ---------- focus timer (pure state transitions) ----------
const PAUSE_LIMIT_MS = PAUSE_LIMIT_MIN * 60 * 1000;
export const IDLE_FOCUS = { status: 'idle', startedAt: null, accMs: 0, pausedAt: null };

export const focusElapsed = (f, now) => {
  if (!f) return 0;
  return (f.accMs || 0) + (f.status === 'running' && f.startedAt ? now - f.startedAt : 0);
};

// `starts` keeps every start time so calendar focus events can auto check-in.
export const focusStart = (f, now) => ({ ...IDLE_FOCUS, topic: f?.topic || '', starts: [...(f?.starts || []), now], status: 'running', startedAt: now });
export const focusPause = (f, now) => ({ ...f, status: 'paused', accMs: focusElapsed(f, now), startedAt: null, pausedAt: now });
export const focusResume = (f, now) =>
  now - f.pausedAt > PAUSE_LIMIT_MS
    ? { ...IDLE_FOCUS, topic: f.topic || '', starts: f.starts || [] }
    : { ...f, status: 'running', startedAt: now, pausedAt: null };
export const focusReset = (f) => ({ ...IDLE_FOCUS, topic: f?.topic || '', starts: f?.starts || [] });

// Returns the state the timer *should* be in right now (finished, or expired pause),
// or null if nothing needs to change.
export const focusAutoTransition = (f, now, targetMs) => {
  if (!f) return null;
  if (f.status === 'running' && focusElapsed(f, now) >= targetMs)
    return { ...f, status: 'done', accMs: targetMs, startedAt: null, completedAt: now };
  if (f.status === 'paused' && now - f.pausedAt > PAUSE_LIMIT_MS) return { ...IDLE_FOCUS, topic: f.topic || '', starts: f.starts || [], expired: true };
  return null;
};

// ---------- task evaluation (the exact rules) ----------
// ctx.budgetOk comes from the expenses collection (see budgetOkForDay).
export function evaluateTasks(day = {}, s, ctx = {}) {
  const m = day.metrics || {};
  const protein = Number(m.protein) || 0;
  const calories = Number(m.calories) || 0;
  const calOk = !s.calorieTarget || (calories > 0 && Math.abs(calories - s.calorieTarget) <= s.calorieTarget * 0.1);
  const top3 = day.top3 || [];
  return {
    macros: protein >= s.proteinTarget && calOk,
    training: (Number(m.exerciseMin) || 0) >= s.exerciseMinutes,
    water: (Number(m.waterMl) || 0) >= s.waterTargetMl,
    deepwork: day.focus?.status === 'done',
    braindump: top3.length === 3 && top3.every((t) => t && t.trim().length > 0),
    sleep: sleepHours(m.bed, m.wake) >= s.sleepMinHours,
    nosugar: m.noLiquidCal === true,
    budget: ctx.budgetOk !== false,
  };
}

export const calcPercent = (tasks = {}) => {
  const done = ALL_TASKS.filter((t) => tasks[t.id]).length;
  return Math.round((done / ALL_TASKS.length) * 100);
};

// Days logged before the budget task existed have no `budget` key; treat those as passed.
export const taskHit = (day, id) => (id === 'budget' ? Boolean(day?.tasks) && day.tasks.budget !== false : Boolean(day?.tasks?.[id]));

export const isPassed = (day) => Boolean(day && day.percent >= PASS_THRESHOLD);

// ---------- edit window & day status ----------
export const canEdit = (n, todayNum, now = new Date()) =>
  n >= 1 && n <= TOTAL_DAYS && (n === todayNum || (n === todayNum - 1 && now.getHours() < GRACE_HOUR));

// 'passed' | 'pending' (still loggable) | 'missed' | 'future'
export const dayStatus = (n, day, todayNum, now = new Date()) => {
  if (isPassed(day)) return 'passed';
  if (n > todayNum) return 'future';
  if (canEdit(n, todayNum, now)) return 'pending';
  return 'missed';
};

export function computeStats(days, todayNum, now = new Date()) {
  let total = 0;
  let missed = 0;
  let best = 0;
  let run = 0;
  for (let n = 1; n <= TOTAL_DAYS; n++) {
    const st = dayStatus(n, days[n], todayNum, now);
    if (st === 'passed') {
      total++;
      run++;
      best = Math.max(best, run);
    } else if (st === 'missed') {
      missed++;
      run = 0;
    }
  }
  // Current streak: walk back from today. Days still open (pending) don't break it; a missed day does.
  let streak = 0;
  for (let n = Math.min(todayNum, TOTAL_DAYS); n >= 1; n--) {
    const st = dayStatus(n, days[n], todayNum, now);
    if (st === 'passed') streak++;
    else if (st === 'pending') continue;
    else break;
  }
  return { total, missed, streak, best };
}

// ---------- weeks ----------
export const weekOf = (n) => Math.ceil(n / 7);
export const daysInWeek = (w) => {
  const out = [];
  for (let n = 7 * w - 6; n <= Math.min(7 * w, TOTAL_DAYS); n++) out.push(n);
  return out;
};

export function weekStats(w, days, todayNum, now = new Date()) {
  const elapsed = daysInWeek(w).filter((n) => n <= todayNum);
  const counted = elapsed.filter((n) => dayStatus(n, days[n], todayNum, now) !== 'pending');
  const taskRates = ALL_TASKS.map((t) => {
    const hits = counted.filter((n) => taskHit(days[n], t.id)).length;
    return { id: t.id, label: t.label, hits, of: counted.length, rate: counted.length ? hits / counted.length : 0 };
  });
  const avg = (fn) => {
    const vals = elapsed.map((n) => fn(days[n])).filter((v) => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const weakest = counted.length ? [...taskRates].sort((a, b) => a.rate - b.rate)[0] : null;
  return {
    elapsed: elapsed.length,
    counted: counted.length,
    passed: elapsed.filter((n) => isPassed(days[n])).length,
    missed: counted.filter((n) => !isPassed(days[n])).length,
    taskRates,
    weakest: weakest && weakest.rate < 1 ? weakest : null,
    avgSleep: avg((d) => sleepHours(d?.metrics?.bed, d?.metrics?.wake)),
    avgWaterL: avg((d) => (Number(d?.metrics?.waterMl) || 0) / 1000),
    avgProtein: avg((d) => Number(d?.metrics?.protein) || 0),
    exerciseMin: elapsed.reduce((a, n) => a + (Number(days[n]?.metrics?.exerciseMin) || 0), 0),
    focusBlocks: elapsed.filter((n) => days[n]?.focus?.status === 'done').length,
    complete: elapsed.length === daysInWeek(w).length && counted.length === elapsed.length,
  };
}

// ---------- money ----------
// Impulse spending in challenge week `w`, counting only days up to and including `uptoDay`.
export const impulseSpentInWeek = (expenses, w, uptoDay = Infinity) =>
  expenses
    .filter((e) => e.impulse && e.dayNum >= 1 && weekOf(e.dayNum) === w && e.dayNum <= uptoDay)
    .reduce((a, e) => a + (Number(e.amount) || 0), 0);

// A day fails the budget task only if you made an impulse buy that day
// while the week's impulse total (through that day) is over the cap.
export const budgetOkForDay = (expenses, n, budget) => {
  const boughtToday = expenses.some((e) => e.impulse && e.dayNum === n);
  if (!boughtToday) return true;
  return impulseSpentInWeek(expenses, weekOf(n), n) <= budget;
};

export const needsRegretCheck = (e, now) =>
  e.impulse && !e.regret && now - e.at >= REGRET_AFTER_DAYS * 86400000;

export const peso = (n, cur = '\u20b1') => `${cur}${Math.round(Number(n) || 0).toLocaleString()}`;

export const timeOfDay = (ms) => {
  const h = new Date(ms).getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  if (h < 21) return 'Evening';
  return 'Late night';
};

// Sum `amount` grouped by key(e), largest first.
export const groupSum = (items, key) => {
  const m = new Map();
  items.forEach((e) => {
    const k = key(e) || 'Unspecified';
    m.set(k, (m.get(k) || 0) + (Number(e.amount) || 0));
  });
  return [...m.entries()].map(([label, total]) => ({ label, total })).sort((a, b) => b.total - a.total);
};

// ---------- calendar ----------
const kwList = (str) => (str || '').split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);

export const classifyEvent = (title, s) => {
  const t = (title || '').toLowerCase();
  if (kwList(s.focusKeywords).some((k) => t.includes(k))) return 'focus';
  if (kwList(s.exerciseKeywords).some((k) => t.includes(k))) return 'exercise';
  return 'other';
};

/**
 * Status of one calendar event:
 *   'upcoming' | 'open' (check-in available) | 'ontime' | 'late' | 'missed'
 * Focus events auto check-in when the focus timer is started inside the window.
 * Exercise events also need logged exercise minutes >= 80% of the event length (`short` flag).
 */
export function eventStatus(ev, day, s, now) {
  const early = ev.start - CHECKIN_EARLY_MIN * 60000;
  const lateAfter = ev.start + CHECKIN_LATE_MIN * 60000;
  const type = classifyEvent(ev.title, s);
  let at = day?.checkins?.[ev.id] ?? null;
  if (!at && type === 'focus') at = (day?.focus?.starts || []).find((t) => t >= early && t <= ev.end) ?? null;
  const mins = (ev.end - ev.start) / 60000;
  const short = type === 'exercise' && (Number(day?.metrics?.exerciseMin) || 0) < mins * 0.8;
  let status;
  if (at) status = at <= lateAfter ? 'ontime' : 'late';
  else if (now < early) status = 'upcoming';
  else if (now <= ev.end) status = 'open';
  else status = 'missed';
  const followed = status === 'ontime' && !short;
  return { type, status, at, short, followed, mins, canCheckIn: !at && now >= early && now <= ev.end };
}

// Followed / total for events that have started (upcoming ones don't count yet).
export function adherence(day, s, now) {
  const evs = day?.calendar?.events || [];
  let total = 0;
  let followed = 0;
  evs.forEach((ev) => {
    const st = eventStatus(ev, day, s, now);
    if (st.status === 'upcoming' || (st.status === 'open' && now < ev.start)) return;
    total++;
    if (st.followed) followed++;
  });
  return { followed, total };
}
