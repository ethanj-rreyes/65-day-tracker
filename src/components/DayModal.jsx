import { useEffect } from 'react';
import { GRACE_HOUR } from '../constants';
import { dateForDay, formatDate } from '../utils';
import DayEditor from './DayEditor';
import ProgressRing from './ProgressRing';

export default function DayModal({ dayNum, todayNum, startDate, day, settings, status, editable, onSave, onComplete, onClose, ctx }) {
  const date = dateForDay(startDate, dayNum);
  const percent = day?.percent ?? 0;

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

  const banner = {
    future: { cls: 'bg-white/5 text-slate-300', text: `Unlocks on ${formatDate(date)}.` },
    missed: { cls: 'bg-rose-500/15 text-rose-200', text: 'Missed. This day is locked and broke the streak.' },
    passed: editable ? null : { cls: 'bg-emerald-400/10 text-emerald-200', text: 'Passed. This day is locked.' },
    pending: dayNum < todayNum ? { cls: 'bg-amber-400/10 text-amber-200', text: `Still open until ${GRACE_HOUR}:00 today. After that it locks, and anything under 100% counts as missed.` } : null,
  }[status];

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
            <ProgressRing percent={percent} size={60} stroke={6}>
              <span className="text-sm font-bold tabular-nums">{percent}%</span>
            </ProgressRing>
            <button onClick={onClose} aria-label="Close" className="h-11 w-11 rounded-full bg-white/5 text-lg active:bg-white/10">
              &#10005;
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {banner && <p className={`mb-4 rounded-xl px-4 py-3 text-sm ${banner.cls}`}>{banner.text}</p>}
          <DayEditor dayNum={dayNum} day={day} settings={settings} editable={editable} onSave={onSave} onComplete={onComplete} ctx={ctx} />
        </div>
      </div>
    </div>
  );
}
