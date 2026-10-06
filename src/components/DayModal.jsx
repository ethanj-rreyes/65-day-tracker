import { useEffect, useState } from 'react';
import { PILLARS } from '../constants';
import { calcPercent, dateForDay, formatDate } from '../utils';
import ProgressRing from './ProgressRing';

export default function DayModal({ dayNum, startDate, day, locked, onToggleSave, onComplete, onClose }) {
  const [tasks, setTasks] = useState(day?.tasks ?? {});
  const [saving, setSaving] = useState(false);
  const percent = calcPercent(tasks);
  const date = dateForDay(startDate, dayNum);

  // Close on Escape + lock background scroll while open.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const toggle = (id) => {
    if (locked) return;
    const next = { ...tasks, [id]: !tasks[id] };
    setTasks(next);
    onToggleSave(dayNum, next); // autosave progress (does not mark the day complete)
  };

  const complete = async () => {
    setSaving(true);
    try {
      await onComplete(dayNum, tasks);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center md:items-center">
      <div className="absolute inset-0 animate-fade-in bg-black/70" onClick={onClose} />
      <div className="animate-sheet-up relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl border border-white/10 bg-[#111729] md:rounded-3xl">
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-white/20 md:hidden" />

        <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-4">
          <div>
            <h2 className="text-2xl font-extrabold">Day {dayNum}</h2>
            <p className="text-sm text-slate-400">{formatDate(date)}</p>
          </div>
          <div className="flex items-center gap-3">
            <ProgressRing percent={percent} size={64} stroke={6}>
              <span className="text-sm font-bold tabular-nums">{percent}%</span>
            </ProgressRing>
            <button onClick={onClose} aria-label="Close" className="h-11 w-11 rounded-full bg-white/5 text-lg active:bg-white/10">
              &#10005;
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-4">
          {locked && (
            <p className="rounded-xl bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
              This day unlocks on {formatDate(date)}.
            </p>
          )}
          {PILLARS.map((p) => (
            <section key={p.id}>
              <h3 className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${p.text}`}>
                <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                {p.title}
              </h3>
              <div className="space-y-2">
                {p.tasks.map((t) => {
                  const checked = Boolean(tasks[t.id]);
                  return (
                    <button
                      key={t.id}
                      role="checkbox"
                      aria-checked={checked}
                      disabled={locked}
                      onClick={() => toggle(t.id)}
                      className={[
                        'flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99]',
                        checked ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-white/10 bg-white/[0.03]',
                        locked ? 'cursor-not-allowed opacity-50' : '',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold',
                          checked ? 'border-emerald-400 bg-emerald-400 text-[#0b0f1a]' : 'border-white/30',
                        ].join(' ')}
                      >
                        {checked && '✓'}
                      </span>
                      <span className={`text-[15px] leading-snug ${checked ? 'text-slate-100' : 'text-slate-300'}`}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="border-t border-white/10 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <button
            onClick={complete}
            disabled={locked || saving}
            className="h-14 w-full rounded-2xl bg-emerald-500 text-base font-bold text-[#04110a] transition active:scale-[0.98] disabled:opacity-40"
          >
            {saving ? 'Saving...' : day?.completed ? `Update Day (${percent}%)` : `Complete Day (${percent}%)`}
          </button>
        </div>
      </div>
    </div>
  );
}
