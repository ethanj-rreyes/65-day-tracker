import { useState } from 'react';

const FIELDS = [
  ['proteinTarget', 'Daily protein', 'g', 1],
  ['calorieTarget', 'Daily calories (0 = off)', 'kcal', 50],
  ['waterTargetMl', 'Daily water', 'ml', 250],
  ['exerciseMinutes', 'Exercise minimum', 'min', 5],
  ['deepWorkMinutes', 'Focus block length', 'min', 5],
  ['sleepMinHours', 'Minimum sleep', 'h', 0.5],
  ['weeklyImpulseBudget', 'Weekly impulse cap', '\u20b1', 50],
  ['coolOffHours', 'Cooling-off time', 'h', 1],
];

const TEXT_FIELDS = [
  ['focusKeywords', 'Calendar events that count as focus'],
  ['exerciseKeywords', 'Calendar events that count as exercise'],
];

export default function SettingsModal({ settings, startDate, onSave, onClose, onOpenCalendar }) {
  const [form, setForm] = useState(settings);
  const [start, setStart] = useState(startDate);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(form, start !== startDate ? start : null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/80 md:items-center">
      <div className="animate-sheet-up max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-[#111729] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Settings</h2>
          <button onClick={onClose} aria-label="Close" className="h-11 w-11 rounded-full bg-white/5 text-lg">
            &#10005;
          </button>
        </div>

        <div className="space-y-3">
          {FIELDS.map(([key, label, unit, step]) => (
            <label key={key} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-300">{label}</span>
              <span className="relative w-36">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={step}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: Math.max(0, Number(e.target.value) || 0) })}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 pr-12 text-right text-base tabular-nums focus:border-emerald-400 focus:outline-none"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">{unit}</span>
              </span>
            </label>
          ))}

          {TEXT_FIELDS.map(([key, label]) => (
            <label key={key} className="block text-sm text-slate-300">
              {label}
              <input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="mt-1 h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-base focus:border-emerald-400 focus:outline-none"
              />
              <span className="text-xs text-slate-500">Comma-separated words matched in the event title.</span>
            </label>
          ))}

          <button onClick={onOpenCalendar} className="flex h-12 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 text-sm">
            <span className="text-slate-300">Google Calendar</span>
            <span className="text-slate-400">{settings.calendarIds.length ? `${settings.calendarIds.length} connected` : 'Not connected'} &rsaquo;</span>
          </button>

          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-300">Start date (Day 1)</span>
            <input
              type="date"
              value={start || ''}
              onChange={(e) => setStart(e.target.value)}
              className="h-12 w-44 rounded-xl border border-white/10 bg-white/5 px-3 text-base [color-scheme:dark]"
            />
          </label>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          New targets apply to days that are still open. Locked days keep the result they had. Changing the start date re-maps which
          calendar date each day number is; it does not move your logged data.
        </p>

        <button onClick={save} disabled={saving} className="mt-4 h-14 w-full rounded-2xl bg-emerald-500 font-bold text-[#04110a] disabled:opacity-40">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
