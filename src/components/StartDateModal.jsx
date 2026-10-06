import { useState } from 'react';
import { toISODate } from '../utils';

export default function StartDateModal({ initial, onSave, onCancel }) {
  const [value, setValue] = useState(initial || toISODate());
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!value) return;
    setSaving(true);
    try {
      await onSave(value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#111729] p-6">
        <h2 className="text-xl font-extrabold">{initial ? 'Change start date' : 'Start your 65 days'}</h2>
        <p className="mt-1 text-sm text-slate-400">
          Day 1 is the date you pick. Saved progress is keyed by day number, so changing this later re-maps dates but keeps your checkmarks.
        </p>
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-4 h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-lg [color-scheme:dark]"
        />
        <div className="mt-4 flex gap-3">
          {onCancel && (
            <button onClick={onCancel} className="h-14 flex-1 rounded-2xl bg-white/5 font-semibold active:bg-white/10">
              Cancel
            </button>
          )}
          <button
            onClick={save}
            disabled={saving || !value}
            className="h-14 flex-1 rounded-2xl bg-emerald-500 font-bold text-[#04110a] disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
