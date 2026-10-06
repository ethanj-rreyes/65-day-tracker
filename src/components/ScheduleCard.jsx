import { CHECKIN_LATE_MIN } from '../constants';
import { adherence, eventStatus } from '../utils';

const fmtTime = (ms) => new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const PILL = {
  upcoming: ['Upcoming', 'bg-white/5 text-slate-400'],
  open: ['Now', 'bg-sky-400/15 text-sky-200'],
  ontime: ['On time', 'bg-emerald-400/15 text-emerald-200'],
  late: ['Late', 'bg-amber-400/15 text-amber-200'],
  missed: ['Missed', 'bg-rose-500/15 text-rose-200'],
};
const TYPE = { focus: 'Focus', exercise: 'Exercise' };

export default function ScheduleCard({ day, settings, now, connected, refreshing, error, onSetup, onRefresh, onCheckIn }) {
  if (!connected) {
    return (
      <section className="rounded-2xl border border-dashed border-white/15 p-4">
        <h3 className="font-semibold">Schedule check-ins</h3>
        <p className="mt-1 text-sm text-slate-400">
          Connect Google Calendar to see today's events and check in when each one starts.
        </p>
        <button onClick={onSetup} className="mt-3 h-12 w-full rounded-xl bg-white font-semibold text-slate-900">
          Connect Google Calendar
        </button>
      </section>
    );
  }

  const events = day?.calendar?.events || [];
  const score = adherence(day, settings, now);
  const fetched = day?.calendar?.fetchedAt;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today's schedule</h3>
          <p className="text-sm text-slate-300">
            {score.total ? `Followed ${score.followed}/${score.total} so far` : events.length ? 'Nothing started yet' : fetched ? 'No timed events today' : 'Not loaded yet'}
          </p>
        </div>
        <button onClick={() => onRefresh(true)} disabled={refreshing} className="h-10 rounded-xl bg-white/5 px-3 text-sm font-semibold disabled:opacity-40">
          {refreshing ? 'Loading...' : fetched ? 'Refresh' : 'Load'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}

      <div className="mt-3 space-y-2">
        {events.map((ev) => {
          const st = eventStatus(ev, day, settings, now);
          const [label, cls] = PILL[st.status];
          return (
            <div key={ev.id} className={`rounded-xl border p-3 ${st.status === 'open' ? 'border-sky-400/40 bg-sky-400/[0.06]' : 'border-white/10'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{ev.title}</p>
                  <p className="text-xs text-slate-400">
                    {fmtTime(ev.start)} – {fmtTime(ev.end)}
                    {TYPE[st.type] && <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">{TYPE[st.type]}</span>}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>
              </div>
              {st.at && <p className="mt-1 text-xs text-slate-500">Checked in {fmtTime(st.at)}</p>}
              {st.type === 'exercise' && st.short && st.status !== 'upcoming' && (
                <p className="mt-1 text-xs text-amber-300">Log at least {Math.ceil(st.mins * 0.8)} min of exercise to count it.</p>
              )}
              {st.canCheckIn && (
                <>
                  {st.type === 'focus' && <p className="mt-1 text-xs text-slate-400">Starting the focus timer also checks you in.</p>}
                  <button onClick={() => onCheckIn(ev.id)} className="mt-2 h-11 w-full rounded-xl bg-sky-500 font-bold text-[#04101a]">
                    {now > ev.start + CHECKIN_LATE_MIN * 60000 ? "I'm here (late)" : "I'm here, check in"}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
