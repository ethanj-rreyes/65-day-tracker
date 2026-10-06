import { useState } from 'react';
import { CURRENCY, EXPENSE_CATEGORIES, IMPULSE_TRIGGERS } from '../constants';
import { impulseSpentInWeek, peso, weekOf } from '../utils';

const chip = 'h-10 rounded-xl border px-3 text-sm font-semibold';
const on = 'border-emerald-400 bg-emerald-400/20 text-emerald-100';
const off = 'border-white/10 bg-white/5 text-slate-300';

export default function ExpenseForm({ settings, expenses, todayNum, yesterdayOpen, initial, onSave, onClose }) {
  const [amount, setAmount] = useState(initial?.amount || '');
  const [item, setItem] = useState(initial?.item || '');
  const [category, setCategory] = useState(initial?.category || '');
  const [impulse, setImpulse] = useState(null); // force a deliberate choice
  const [trigger, setTrigger] = useState('');
  const [when, setWhen] = useState('today');
  const [saving, setSaving] = useState(false);

  const dayNum = when === 'yesterday' ? todayNum - 1 : todayNum;
  const value = Number(amount) || 0;
  const weekSpent = impulseSpentInWeek(expenses, weekOf(Math.max(dayNum, 1)));
  const after = weekSpent + (impulse ? value : 0);
  const over = impulse && after > settings.weeklyImpulseBudget;
  const valid = value > 0 && item.trim() && category && impulse !== null && (!impulse || trigger);

  const save = async () => {
    setSaving(true);
    try {
      await onSave({
        amount: value,
        item: item.trim(),
        category,
        impulse,
        trigger: impulse ? trigger : '',
        at: when === 'yesterday' ? Date.now() - 86400000 : Date.now(),
        dayNum,
        regret: null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/80 md:items-center">
      <div className="animate-sheet-up max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-[#111729] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Log a purchase</h2>
          <button onClick={onClose} aria-label="Close" className="h-11 w-11 rounded-full bg-white/5 text-lg">&#10005;</button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative w-36">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{CURRENCY}</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-8 pr-3 text-lg font-bold tabular-nums focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <input
              placeholder="What did you buy?"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-base focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">Category</p>
            <div className="flex flex-wrap gap-2">
              {EXPENSE_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={`${chip} ${category === c ? on : off}`}>{c}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">Was it planned?</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setImpulse(false)} className={`h-12 rounded-xl border font-semibold ${impulse === false ? on : off}`}>
                Planned / needed
              </button>
              <button
                onClick={() => setImpulse(true)}
                className={`h-12 rounded-xl border font-semibold ${impulse === true ? 'border-amber-400 bg-amber-400/20 text-amber-100' : off}`}
              >
                Impulse
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Impulse = you didn't plan it before you saw it or felt like it.</p>
          </div>

          {impulse && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">What triggered it?</p>
              <div className="flex flex-wrap gap-2">
                {IMPULSE_TRIGGERS.map((t) => (
                  <button key={t} onClick={() => setTrigger(t)} className={`${chip} ${trigger === t ? 'border-amber-400 bg-amber-400/20 text-amber-100' : off}`}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {yesterdayOpen && (
            <div className="grid grid-cols-2 gap-2">
              {['today', 'yesterday'].map((w) => (
                <button key={w} onClick={() => setWhen(w)} className={`h-10 rounded-xl border text-sm font-semibold capitalize ${when === w ? on : off}`}>{w}</button>
              ))}
            </div>
          )}

          {impulse && value > 0 && (
            <p className={`rounded-xl px-3 py-2 text-sm ${over ? 'bg-rose-500/15 text-rose-200' : 'bg-white/5 text-slate-300'}`}>
              This week's impulse spending becomes {peso(after)} of {peso(settings.weeklyImpulseBudget)}.
              {over && ' That is over your cap, so this fails the day’s Impulse budget task.'}
            </p>
          )}

          <button onClick={save} disabled={!valid || saving} className="h-14 w-full rounded-2xl bg-emerald-500 font-bold text-[#04110a] disabled:opacity-40">
            {saving ? 'Saving...' : 'Save purchase'}
          </button>
        </div>
      </div>
    </div>
  );
}
