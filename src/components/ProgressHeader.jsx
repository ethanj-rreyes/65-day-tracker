import { useState } from 'react';
import { TOTAL_DAYS } from '../constants';

export default function ProgressHeader({ stats, user, onChangeStart, onSignOut }) {
  const [menu, setMenu] = useState(false);
  const pct = Math.round((stats.total / TOTAL_DAYS) * 100);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b0f1a]/90 backdrop-blur">
      <div className="mx-auto max-w-4xl px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">
            65-Day <span className="text-emerald-400">Peak</span>
          </h1>
          <div className="relative">
            <button
              onClick={() => setMenu((m) => !m)}
              aria-label="Menu"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-xl active:bg-white/10"
            >
              &#8943;
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#141a2b] shadow-xl">
                  <p className="truncate px-4 pt-3 text-xs text-slate-400">{user.email}</p>
                  <button
                    onClick={() => { setMenu(false); onChangeStart(); }}
                    className="block w-full px-4 py-3 text-left text-sm active:bg-white/10"
                  >
                    Change start date
                  </button>
                  <button
                    onClick={onSignOut}
                    className="block w-full px-4 py-3 text-left text-sm text-rose-300 active:bg-white/10"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between text-sm">
          <div>
            <span className="text-3xl font-extrabold tabular-nums">{stats.total}</span>
            <span className="text-slate-400"> / {TOTAL_DAYS} days</span>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-slate-400">Streak</div>
            <div className="text-xl font-bold tabular-nums text-amber-300">
              {stats.streak}
              <span className="ml-1 text-xs font-medium text-slate-400">best {stats.best}</span>
            </div>
          </div>
        </div>

        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </header>
  );
}
