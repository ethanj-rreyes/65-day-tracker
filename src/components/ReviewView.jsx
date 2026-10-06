import { useEffect, useState } from 'react';
import { TOTAL_WEEKS } from '../constants';
import { dateForDay, daysInWeek, weekOf, weekStats } from '../utils';

const QUESTIONS = [
  ['worked', 'What made the good days work?'],
  ['blocked', 'What got in the way on the hard days?'],
  ['change', 'One specific change for next week'],
];

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}

function WeekCard({ w, startDate, days, todayNum, now, review, onSave, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const [form, setForm] = useState({ worked: '', blocked: '', change: '' });
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setForm({ worked: review?.worked || '', blocked: review?.blocked || '', change: review?.change || '' });
  }, [review]);

  const s = weekStats(w, days, todayNum, now);
  const dIdx = daysInWeek(w);
  const fmt = (n) => dateForDay(startDate, n).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const save = async () => {
    await onSave(w, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-4 text-left">
        <div>
          <p className="font-bold">
            Week {w} {!s.complete && <span className="text-xs font-medium text-amber-300">in progress</span>}
            {s.complete && review && <span className="text-xs font-medium text-emerald-300">reviewed</span>}
          </p>
          <p className="text-xs text-slate-400">
            Days {dIdx[0]}–{dIdx[dIdx.length - 1]} · {fmt(dIdx[0])} – {fmt(dIdx[dIdx.length - 1])}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold tabular-nums">
            {s.passed}/{dIdx.length}
          </p>
          <p className={`text-xs ${s.missed ? 'text-rose-300' : 'text-slate-500'}`}>{s.missed} missed</p>
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-white/10 p-4">
          {s.weakest ? (
            <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              Weakest habit: <span className="font-semibold">{s.weakest.label}</span> ({s.weakest.hits}/{s.weakest.of} days)
            </p>
          ) : (
            s.counted > 0 && <p className="rounded-xl bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">Every task hit on every closed day.</p>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="Avg sleep" value={s.avgSleep ? `${s.avgSleep.toFixed(1)} h` : '–'} />
            <Stat label="Avg water" value={s.avgWaterL ? `${s.avgWaterL.toFixed(1)} L` : '–'} />
            <Stat label="Avg protein" value={s.avgProtein ? `${Math.round(s.avgProtein)} g` : '–'} />
            <Stat label="Exercise" value={`${s.exerciseMin} min`} />
            <Stat label="Focus blocks" value={s.focusBlocks} />
            <Stat label="Days passed" value={`${s.passed}/${s.elapsed}`} />
          </div>

          <div className="space-y-1.5">
            {s.taskRates.map((t) => (
              <div key={t.id} className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3 text-sm">
                <span className="truncate text-slate-300">{t.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${t.rate === 1 ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${t.rate * 100}%` }} />
                </div>
                <span className="text-right tabular-nums text-slate-400">
                  {t.hits}/{t.of}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {QUESTIONS.map(([k, q]) => (
              <label key={k} className="block text-sm text-slate-300">
                {q}
                <textarea
                  rows={2}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-base focus:border-emerald-400 focus:outline-none"
                />
              </label>
            ))}
            <button onClick={save} className="h-12 w-full rounded-xl bg-emerald-500 font-bold text-[#04110a]">
              {saved ? 'Saved' : 'Save review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewView({ startDate, days, reviews, todayNum, now, onSave }) {
  const current = Math.min(weekOf(Math.max(todayNum, 1)), TOTAL_WEEKS);
  const weeks = Array.from({ length: current }, (_, i) => current - i);
  const lastChange = [...weeks].map((w) => reviews[w]?.change).find((c) => c && c.trim());

  return (
    <div className="space-y-3">
      {lastChange && (
        <div className="rounded-2xl border border-sky-400/30 bg-sky-400/10 p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">Your current change</p>
          <p className="mt-1 text-sky-50">{lastChange}</p>
        </div>
      )}
      {weeks.map((w) => (
        <WeekCard
          key={w}
          w={w}
          startDate={startDate}
          days={days}
          todayNum={todayNum}
          now={now}
          review={reviews[w]}
          onSave={onSave}
          defaultOpen={w === current - 1 || (current === 1 && w === 1)}
        />
      ))}
    </div>
  );
}
