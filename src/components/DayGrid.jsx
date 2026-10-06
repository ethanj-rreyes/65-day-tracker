import { TOTAL_DAYS } from '../constants';
import { dayStatus } from '../utils';
import ProgressRing from './ProgressRing';

const STYLES = {
  passed: 'border-emerald-400/40 bg-emerald-400/10',
  pending: 'border-white/10 bg-white/[0.03]',
  missed: 'border-rose-400/50 bg-rose-500/10',
  future: 'border-white/5 bg-white/[0.02] opacity-40',
};

function DayCell({ n, day, status, isToday, onOpen }) {
  const percent = day?.percent ?? 0;
  return (
    <button
      onClick={() => onOpen(n)}
      aria-label={`Day ${n}: ${status}, ${percent}%`}
      className={`relative flex aspect-square items-center justify-center rounded-2xl border transition active:scale-95 ${STYLES[status]} ${
        isToday ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#0b0f1a]' : ''
      }`}
    >
      <ProgressRing percent={status === 'future' ? 0 : percent} size={50} stroke={5}>
        <span
          className={`text-sm font-bold tabular-nums ${
            status === 'passed' ? 'text-emerald-300' : status === 'missed' ? 'text-rose-300' : 'text-slate-200'
          }`}
        >
          {n}
        </span>
      </ProgressRing>
      {status === 'missed' && <span className="absolute right-1.5 top-1 text-xs font-bold text-rose-400" aria-hidden>{'✕'}</span>}
      {status === 'passed' && <span className="absolute right-1.5 top-1 text-xs font-bold text-emerald-400" aria-hidden>{'✓'}</span>}
    </button>
  );
}

export default function DayGrid({ days, todayNum, now, onOpen }) {
  return (
    <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-10">
      {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((n) => (
        <DayCell key={n} n={n} day={days[n]} status={dayStatus(n, days[n], todayNum, now)} isToday={n === todayNum} onOpen={onOpen} />
      ))}
    </div>
  );
}

export function GridLegend() {
  const items = [
    ['Passed (100%)', 'border-emerald-400/60 bg-emerald-400/20', '✓'],
    ['Open', 'border-white/20 bg-white/5', ''],
    ['Missed', 'border-rose-400/60 bg-rose-500/20', '✕'],
  ];
  return (
    <div className="flex flex-wrap gap-4 text-xs text-slate-400">
      {items.map(([label, cls, mark]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={`flex h-4 w-4 items-center justify-center rounded border text-[9px] ${cls}`}>{mark}</span>
          {label}
        </span>
      ))}
    </div>
  );
}
