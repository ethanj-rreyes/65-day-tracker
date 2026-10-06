import { useEffect, useState } from 'react';
import { listCalendars } from '../calendar';

export default function CalendarSetupModal({ settings, onSave, onClose }) {
  const [cals, setCals] = useState(null);
  const [picked, setPicked] = useState(new Set(settings.calendarIds));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const connect = async () => {
    setBusy(true);
    setError('');
    try {
      const list = await listCalendars(true);
      setCals(list);
      if (picked.size === 0) setPicked(new Set(list.filter((c) => c.primary).map((c) => c.id)));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  // If we already have access this session, list calendars straight away.
  useEffect(() => {
    listCalendars(false).then((l) => l && setCals(l)).catch(() => {});
  }, []);

  const toggle = (id) => {
    const next = new Set(picked);
    next.has(id) ? next.delete(id) : next.add(id);
    setPicked(next);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/80 md:items-center">
      <div className="animate-sheet-up max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-[#111729] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Google Calendar</h2>
          <button onClick={onClose} aria-label="Close" className="h-11 w-11 rounded-full bg-white/5 text-lg">&#10005;</button>
        </div>
        <p className="text-sm text-slate-400">
          Read-only. The app loads today's events from the calendars you pick. Share your school calendar to this Google account first so it shows up here.
        </p>

        {!cals && (
          <button onClick={connect} disabled={busy} className="mt-4 h-14 w-full rounded-2xl bg-white font-semibold text-slate-900 disabled:opacity-50">
            {busy ? 'Waiting for Google...' : 'Connect with Google'}
          </button>
        )}
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

        {cals && (
          <>
            <div className="mt-4 space-y-2">
              {cals.map((c) => (
                <button key={c.id} onClick={() => toggle(c.id)} className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-white/10 px-3 text-left">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold ${picked.has(c.id) ? 'border-emerald-400 bg-emerald-400 text-[#0b0f1a]' : 'border-white/25 text-transparent'}`}>
                    {'✓'}
                  </span>
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} />
                  <span className="truncate">{c.name}{c.primary ? ' (main)' : ''}</span>
                </button>
              ))}
            </div>
            <button
              disabled={picked.size === 0}
              onClick={() => onSave([...picked])}
              className="mt-4 h-14 w-full rounded-2xl bg-emerald-500 font-bold text-[#04110a] disabled:opacity-40"
            >
              Use {picked.size} calendar{picked.size === 1 ? '' : 's'}
            </button>
          </>
        )}
        {settings.calendarIds.length > 0 && (
          <button onClick={() => onSave([])} className="mt-2 h-11 w-full text-sm text-rose-300">
            Disconnect calendar
          </button>
        )}
      </div>
    </div>
  );
}
