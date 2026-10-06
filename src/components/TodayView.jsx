import { GRACE_HOUR, TOTAL_DAYS } from '../constants';
import { dateForDay, dayStatus, formatDate, weekOf } from '../utils';
import DayEditor from './DayEditor';
import ProgressRing from './ProgressRing';

function timeLeftToday(now) {
  const d = new Date(now);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  const mins = Math.max(0, Math.floor((end - d) / 60000));
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function TodayView({ todayNum, startDate, days, reviews, settings, now, onSave, onComplete, onOpenDay, onGoReview }) {
  const today = days[todayNum];
  const yesterday = days[todayNum - 1];
  const percent = today?.percent ?? 0;
  const plan = (yesterday?.top3 || []).filter((t) => t && t.trim());
  const planDone = today?.planDone || [false, false, false];
  const yStatus = todayNum > 1 ? dayStatus(todayNum - 1, yesterday, todayNum, new Date(now)) : null;
  const lastWeek = weekOf(todayNum) - 1;
  const reviewDue = lastWeek >= 1 && !reviews[lastWeek];

  const togglePlan = (i) => {
    const next = [0, 1, 2].map((k) => Boolean(planDone[k]));
    next[i] = !next[i];
    onSave(todayNum, { planDone: next });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-sky-500/5 p-5">
        <ProgressRing percent={percent} size={84} stroke={8}>
          <span className="text-lg font-extrabold tabular-nums">{percent}%</span>
        </ProgressRing>
        <div className="min-w-0">
          <p className="text-sm text-slate-400">{formatDate(dateForDay(startDate, todayNum))}</p>
          <h2 className="text-2xl font-extrabold">
            Day {todayNum} <span className="text-base font-medium text-slate-500">/ {TOTAL_DAYS}</span>
          </h2>
          <p className={`text-sm ${percent === 100 ? 'text-emerald-300' : 'text-amber-200'}`}>
            {percent === 100 ? 'All 7 done. Day secured.' : `${timeLeftToday(now)} left to hit 100%`}
          </p>
        </div>
      </div>

      {yStatus === 'pending' && (
        <button onClick={() => onOpenDay(todayNum - 1)} className="w-full rounded-2xl bg-amber-400/15 px-4 py-3 text-left text-sm text-amber-100">
          <span className="font-semibold">Yesterday is at {yesterday?.percent ?? 0}%.</span> You have until {GRACE_HOUR}:00 to finish logging it,
          or it counts as missed. Tap to open.
        </button>
      )}

      {reviewDue && (
        <button onClick={onGoReview} className="w-full rounded-2xl bg-sky-400/15 px-4 py-3 text-left text-sm text-sky-100">
          <span className="font-semibold">Week {lastWeek} review is ready.</span> Five minutes: see your weakest habit and set one change.
        </button>
      )}

      {plan.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Today's top 3 (from last night)</h3>
          <div className="space-y-1">
            {(yesterday.top3 || []).map((t, i) =>
              t && t.trim() ? (
                <button key={i} onClick={() => togglePlan(i)} className="flex min-h-11 w-full items-center gap-3 text-left">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold ${
                      planDone[i] ? 'border-sky-400 bg-sky-400 text-[#04101a]' : 'border-white/25 text-transparent'
                    }`}
                  >
                    {'✓'}
                  </span>
                  <span className={planDone[i] ? 'text-slate-500 line-through' : 'text-slate-200'}>{t}</span>
                </button>
              ) : null
            )}
          </div>
        </section>
      )}

      <DayEditor dayNum={todayNum} day={today} settings={settings} editable onSave={onSave} onComplete={onComplete} />
    </div>
  );
}
