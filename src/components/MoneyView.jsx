import { useState } from 'react';
import { CURRENCY, REGRET_AFTER_DAYS } from '../constants';
import { daysInWeek, groupSum, impulseSpentInWeek, needsRegretCheck, peso, timeOfDay, weekOf } from '../utils';

const card = 'rounded-2xl border border-white/10 bg-white/[0.03] p-4';
const h3 = 'mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400';

function Bars({ rows, color = 'bg-amber-400', empty }) {
  if (!rows.length) return <p className="text-sm text-slate-400">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.total), 1);
  return (
    <div className="space-y-2">
      {rows.slice(0, 6).map((r) => (
        <div key={r.label} className="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-3 text-sm">
          <span className="truncate text-slate-300">{r.label}</span>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${(r.total / max) * 100}%` }} />
          </div>
          <span className="text-right tabular-nums text-slate-300">{peso(r.total)}</span>
        </div>
      ))}
    </div>
  );
}

const left = (ms) => {
  const m = Math.max(0, Math.ceil(ms / 60000));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

export default function MoneyView({ expenses, wishlist, settings, todayNum, now, onLogPurchase, addExpense, updateExpense, deleteExpense, addWish, updateWish }) {
  const [wishItem, setWishItem] = useState('');
  const [wishPrice, setWishPrice] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const w = weekOf(Math.max(todayNum, 1));
  const spent = impulseSpentInWeek(expenses, w);
  const budget = settings.weeklyImpulseBudget;
  const pct = Math.min(100, (spent / Math.max(budget, 1)) * 100);
  const lastDayOfWeek = daysInWeek(w).slice(-1)[0];
  const daysLeft = Math.max(0, lastDayOfWeek - todayNum + 1);

  const inChallenge = expenses.filter((e) => e.dayNum >= 1);
  const impulses = inChallenge.filter((e) => e.impulse);
  const total = inChallenge.reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const impulseTotal = impulses.reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const saved = wishlist.filter((x) => x.status === 'skipped').reduce((a, x) => a + (Number(x.price) || 0), 0);
  const rated = impulses.filter((e) => e.regret);
  const regrets = rated.filter((e) => e.regret === 'regret').length;
  const regretChecks = expenses.filter((e) => needsRegretCheck(e, now));
  const waiting = wishlist.filter((x) => x.status === 'waiting');
  const decided = wishlist.filter((x) => x.status !== 'waiting').slice(0, 5);

  const addToList = async () => {
    const price = Number(wishPrice) || 0;
    if (!wishItem.trim() || price <= 0) return;
    await addWish({ item: wishItem.trim(), price, addedAt: Date.now(), unlockAt: Date.now() + settings.coolOffHours * 3600000, status: 'waiting' });
    setWishItem('');
    setWishPrice('');
  };

  const buy = async (x) => {
    await updateWish(x.id, { status: 'bought', decidedAt: Date.now() });
    await addExpense({ amount: x.price, item: x.item, category: 'Shopping', impulse: false, trigger: '', at: Date.now(), dayNum: todayNum, regret: null, fromCoolOff: true });
  };

  return (
    <div className="space-y-5">
      <section className={card}>
        <div className="flex items-baseline justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Week {w} impulse spending</h3>
          <span className="text-xs text-slate-500">{daysLeft} day{daysLeft === 1 ? '' : 's'} left</span>
        </div>
        <p className="mt-1 text-3xl font-extrabold tabular-nums">
          {peso(spent)} <span className="text-base font-medium text-slate-500">/ {peso(budget)}</span>
        </p>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full ${spent > budget ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${pct}%` }} />
        </div>
        <p className={`mt-2 text-sm ${spent > budget ? 'text-rose-300' : pct >= 80 ? 'text-amber-200' : 'text-slate-400'}`}>
          {spent > budget
            ? 'Over the cap. Any impulse buy for the rest of this week fails that day.'
            : pct >= 80
            ? `Only ${peso(budget - spent)} left. Put wants on the cooling-off list instead.`
            : `${peso(budget - spent)} left for impulse buys this week.`}
        </p>
        <button onClick={onLogPurchase} className="mt-3 h-12 w-full rounded-xl bg-emerald-500 font-bold text-[#04110a]">
          Log a purchase
        </button>
      </section>

      {regretChecks.length > 0 && (
        <section className="space-y-2">
          <h3 className={h3}>Worth it? ({REGRET_AFTER_DAYS}+ days later)</h3>
          {regretChecks.map((e) => (
            <div key={e.id} className="rounded-2xl border border-sky-400/30 bg-sky-400/[0.06] p-4">
              <p className="font-semibold">
                {e.item} <span className="font-normal text-slate-400">· {peso(e.amount)} · {e.trigger}</span>
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => updateExpense(e.id, { regret: 'worth' })} className="h-11 rounded-xl bg-white/10 font-semibold">Worth it</button>
                <button onClick={() => updateExpense(e.id, { regret: 'regret' })} className="h-11 rounded-xl bg-rose-500/20 font-semibold text-rose-100">Regret it</button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className={card}>
        <h3 className={h3}>Cooling-off list</h3>
        <p className="mb-3 text-sm text-slate-400">
          Want something? Add it here instead of buying. It unlocks after {settings.coolOffHours} h, then you decide.
        </p>
        <div className="flex gap-2">
          <input value={wishItem} onChange={(e) => setWishItem(e.target.value)} placeholder="Item" className="h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-base focus:border-emerald-400 focus:outline-none" />
          <div className="relative w-28">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{CURRENCY}</span>
            <input type="number" inputMode="decimal" value={wishPrice} onChange={(e) => setWishPrice(e.target.value)} placeholder="Price" className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-7 pr-2 text-base tabular-nums focus:border-emerald-400 focus:outline-none" />
          </div>
          <button onClick={addToList} className="h-12 rounded-xl bg-white/10 px-4 font-bold">Add</button>
        </div>

        <div className="mt-3 space-y-2">
          {waiting.map((x) => {
            const unlocked = now >= x.unlockAt;
            return (
              <div key={x.id} className="rounded-xl border border-white/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate font-semibold">{x.item} <span className="font-normal text-slate-400">· {peso(x.price)}</span></p>
                  {!unlocked && <span className="shrink-0 text-xs text-slate-400">unlocks in {left(x.unlockAt - now)}</span>}
                </div>
                {unlocked && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button onClick={() => updateWish(x.id, { status: 'skipped', decidedAt: Date.now() })} className="h-11 rounded-xl bg-emerald-500 font-bold text-[#04110a]">
                      Skip it (+{peso(x.price)} saved)
                    </button>
                    <button onClick={() => buy(x)} className="h-11 rounded-xl bg-white/10 font-semibold">Still buy it</button>
                  </div>
                )}
              </div>
            );
          })}
          {decided.map((x) => (
            <p key={x.id} className="text-sm text-slate-500">
              {x.status === 'skipped' ? 'Skipped' : 'Bought'}: {x.item} ({peso(x.price)})
            </p>
          ))}
        </div>
      </section>

      <section className={card}>
        <h3 className={h3}>Since Day 1</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Total spent', peso(total)],
            ['Impulse', `${peso(impulseTotal)}${total ? ` (${Math.round((impulseTotal / total) * 100)}%)` : ''}`],
            ['Saved by skipping', peso(saved)],
            ['Regret rate', rated.length ? `${regrets}/${rated.length}` : '–'],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-white/[0.04] p-3">
              <div className="text-xs text-slate-400">{l}</div>
              <div className="text-lg font-bold tabular-nums">{v}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={card}>
        <h3 className={h3}>Impulse buys by trigger</h3>
        <Bars rows={groupSum(impulses, (e) => e.trigger)} empty="No impulse buys logged yet." />
      </section>
      <section className={card}>
        <h3 className={h3}>Impulse buys by category</h3>
        <Bars rows={groupSum(impulses, (e) => e.category)} empty="No impulse buys logged yet." />
      </section>
      <section className={card}>
        <h3 className={h3}>Impulse buys by time of day</h3>
        <Bars rows={groupSum(impulses, (e) => timeOfDay(e.at))} empty="No impulse buys logged yet." />
      </section>

      <section className={card}>
        <h3 className={h3}>Recent purchases</h3>
        {expenses.length === 0 && <p className="text-sm text-slate-400">Nothing logged yet.</p>}
        <div className="divide-y divide-white/5">
          {expenses.slice(0, 20).map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {e.item}
                  {e.impulse && <span className="ml-2 rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-amber-200">Impulse</span>}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(e.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {e.category}
                  {e.trigger ? ` · ${e.trigger}` : ''}
                  {e.regret ? ` · ${e.regret === 'regret' ? 'regretted' : 'worth it'}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="tabular-nums">{peso(e.amount)}</span>
                <button
                  onClick={() => (confirmDelete === e.id ? (deleteExpense(e.id), setConfirmDelete(null)) : setConfirmDelete(e.id))}
                  className={`h-9 rounded-lg px-2 text-xs ${confirmDelete === e.id ? 'bg-rose-500/30 text-rose-100' : 'text-slate-500'}`}
                >
                  {confirmDelete === e.id ? 'Delete?' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
