import { TOTAL_DAYS } from '../constants';
import { isCounted } from '../utils';
import ProgressRing from './ProgressRing';

function DayCell({ n, day, isToday, locked, onOpen }) {
  const percent = day?.percent ?? 0;
  const done = isCounted(day);

  return (
    <button
      onClick={() => onOpen(n)}
      aria-label={`Day ${n}, ${percent}% complete`}
      className={[
        'relative flex aspect-square flex-col items-center justify-center rounded-2xl border transition active:scale-95',
        done ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-white/10 bg-white/[0.03]',
        isToday ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#0b0f1a]' : '',
        locked ? 'opacity-40' : '',
      ].join(' ')}
    >
      <ProgressRing percent={percent} size={52} stroke={5}>
        <span className={`text-sm font-bold tabular-nums ${done ? 'text-emerald-300' : 'text-slate-200'}`}>{n}</span>
      </ProgressRing>
      {day?.completed && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
      )}
    </button>
  );
}

export default function DayGrid({ days, todayNum, onOpen }) {
  return (
    <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-10">
      {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((n) => (
        <DayCell key={n} n={n} day={days[n]} isToday={n === todayNum} locked={n > todayNum} onOpen={onOpen} />
      ))}
    </div>
  );
}
