import { useEffect, useRef, useState } from 'react';
import { EXERCISE_TYPES, NO_LIQUID_CAL_ALLOWED, NO_LIQUID_CAL_BANNED } from '../constants';
import { useNow } from '../hooks/useNow';
import {
  focusAutoTransition,
  focusElapsed,
  focusPause,
  focusReset,
  focusResume,
  focusStart,
  formatDuration,
  sleepHours,
} from '../utils';
import ProgressRing from './ProgressRing';

const chip =
  'h-11 min-w-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold active:bg-white/15 disabled:opacity-40';
const field =
  'h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-base tabular-nums placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none disabled:opacity-50';

// ---------- shared card ----------
export function TaskCard({ label, rule, passed, children }) {
  return (
    <div className={`rounded-2xl border p-4 transition ${passed ? 'border-emerald-400/40 bg-emerald-400/[0.07]' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className="flex items-start gap-3">
        <span
          aria-label={passed ? 'Passed' : 'Not yet'}
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold ${
            passed ? 'border-emerald-400 bg-emerald-400 text-[#0b0f1a]' : 'border-white/25 text-transparent'
          }`}
        >
          {'✓'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-100">{label}</p>
          <p className="text-sm leading-snug text-slate-400">{rule}</p>
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

// Number field that only commits on valid input.
function NumberField({ value, onChange, disabled, placeholder, suffix }) {
  return (
    <div className="relative">
      <input
        type="number"
        inputMode="numeric"
        min={0}
        className={`${field} pr-14`}
        value={value || ''}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
      {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{suffix}</span>}
    </div>
  );
}

// ---------- protein / calories ----------
export function ProteinInput({ metrics, settings, update, disabled }) {
  const protein = Number(metrics.protein) || 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <NumberField value={protein} suffix="g" placeholder="Protein" disabled={disabled} onChange={(v) => update({ protein: v })} />
        </div>
        {[10, 25, 40].map((n) => (
          <button key={n} className={chip} disabled={disabled} onClick={() => update({ protein: protein + n })}>
            +{n}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        {protein} / {settings.proteinTarget} g
      </p>
      {settings.calorieTarget > 0 && (
        <NumberField
          value={metrics.calories}
          suffix="kcal"
          placeholder={`Calories (target ${settings.calorieTarget})`}
          disabled={disabled}
          onChange={(v) => update({ calories: v })}
        />
      )}
    </div>
  );
}

// ---------- exercise ----------
export function ExerciseInput({ metrics, settings, update, disabled }) {
  const mins = Number(metrics.exerciseMin) || 0;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {EXERCISE_TYPES.map((t) => (
          <button
            key={t}
            disabled={disabled}
            onClick={() => update({ exerciseType: metrics.exerciseType === t ? '' : t })}
            className={`${chip} ${metrics.exerciseType === t ? 'border-emerald-400 bg-emerald-400/20 text-emerald-200' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <NumberField value={mins} suffix="min" placeholder="Minutes" disabled={disabled} onChange={(v) => update({ exerciseMin: v })} />
        </div>
        {[15, 30].map((n) => (
          <button key={n} className={chip} disabled={disabled} onClick={() => update({ exerciseMin: mins + n })}>
            +{n}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        {mins} / {settings.exerciseMinutes} min
      </p>
    </div>
  );
}

// ---------- water ----------
export function WaterInput({ metrics, settings, update, disabled }) {
  const ml = Number(metrics.waterMl) || 0;
  const pct = Math.min(100, (ml / settings.waterTargetMl) * 100);
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-extrabold tabular-nums">{(ml / 1000).toFixed(2)} L</span>
        <span className="text-sm text-slate-400">of {(settings.waterTargetMl / 1000).toFixed(1)} L</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button className={chip} disabled={disabled || ml <= 0} onClick={() => update({ waterMl: Math.max(0, ml - 250) })}>
          −250 ml
        </button>
        <button className={`${chip} bg-sky-400/15 text-sky-200`} disabled={disabled} onClick={() => update({ waterMl: ml + 250 })}>
          +250 ml
        </button>
        <button className={`${chip} bg-sky-400/15 text-sky-200`} disabled={disabled} onClick={() => update({ waterMl: ml + 500 })}>
          +500 ml
        </button>
      </div>
    </div>
  );
}

// ---------- deep work focus timer ----------
export function FocusTimer({ focus, settings, onChange, disabled }) {
  const targetMs = settings.deepWorkMinutes * 60 * 1000;
  const status = focus?.status || 'idle';
  const now = useNow(status === 'running' || status === 'paused' ? 1000 : 0);
  const elapsed = Math.min(targetMs, focusElapsed(focus, now));
  const [notice, setNotice] = useState('');
  const announced = useRef(false);

  // Finish the block / expire a long pause, even if the app was closed in between.
  useEffect(() => {
    if (disabled) return;
    const next = focusAutoTransition(focus, Date.now(), targetMs);
    if (!next) return;
    if (next.status === 'done' && !announced.current) {
      announced.current = true;
      navigator.vibrate?.([200, 100, 200]);
      setNotice('Focus block complete.');
    }
    if (next.expired) setNotice(`Paused longer than the limit, so the block was reset.`);
    const { expired, ...clean } = next;
    onChange(clean);
  }, [focus, now, targetMs, disabled, onChange]);

  const act = (fn) => {
    setNotice('');
    const t = Date.now();
    const next = fn(focus, t);
    if (fn === focusResume && next.status === 'idle') setNotice('Paused longer than the limit, so the block was reset.');
    onChange(next);
  };

  const percent = (elapsed / targetMs) * 100;
  const remaining = targetMs - elapsed;

  return (
    <div className="space-y-3">
      <input
        className={field}
        placeholder="What are you working on?"
        value={focus?.topic || ''}
        disabled={disabled || status === 'done'}
        onChange={(e) => onChange({ ...focus, topic: e.target.value })}
      />
      <div className="flex items-center gap-4">
        <ProgressRing percent={status === 'done' ? 100 : percent} size={96} stroke={8}>
          <div className="text-center">
            <div className="text-lg font-bold tabular-nums">{status === 'done' ? 'Done' : formatDuration(remaining)}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">{status === 'done' ? '' : 'left'}</div>
          </div>
        </ProgressRing>
        <div className="flex flex-1 flex-col gap-2">
          {status === 'idle' && (
            <button className="h-12 rounded-xl bg-sky-500 font-bold text-[#04101a] disabled:opacity-40" disabled={disabled} onClick={() => act(focusStart)}>
              Start {settings.deepWorkMinutes}-min block
            </button>
          )}
          {status === 'running' && (
            <button className="h-12 rounded-xl bg-white/10 font-bold" disabled={disabled} onClick={() => act(focusPause)}>
              Pause
            </button>
          )}
          {status === 'paused' && (
            <>
              <button className="h-12 rounded-xl bg-sky-500 font-bold text-[#04101a]" disabled={disabled} onClick={() => act(focusResume)}>
                Resume
              </button>
              <p className="text-xs text-amber-300">
                Paused {formatDuration(now - focus.pausedAt)}. Resume within 5:00 or it resets.
              </p>
            </>
          )}
          {(status === 'running' || status === 'paused') && (
            <button className="h-10 rounded-xl text-sm text-slate-400" disabled={disabled} onClick={() => act(focusReset)}>
              Give up and reset
            </button>
          )}
          {status === 'done' && <p className="text-sm text-emerald-300">Block finished{focus.topic ? `: ${focus.topic}` : ''}.</p>}
        </div>
      </div>
      {notice && <p className="text-sm text-amber-200">{notice}</p>}
      {status === 'running' && <p className="text-xs text-slate-500">You can lock your phone; the timer keeps counting and syncs to your other devices.</p>}
    </div>
  );
}

// ---------- brain dump / top 3 for tomorrow ----------
export function Top3Input({ top3, onChange, disabled }) {
  const items = [0, 1, 2].map((i) => top3?.[i] || '');
  return (
    <div className="space-y-2">
      {items.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-5 text-right text-sm font-bold text-slate-500">{i + 1}.</span>
          <input
            className={field}
            value={v}
            disabled={disabled}
            placeholder={['Most important task', 'Second task', 'Third task'][i]}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
        </div>
      ))}
      <p className="text-xs text-slate-500">These show up on tomorrow's screen as your plan.</p>
    </div>
  );
}

// ---------- sleep ----------
export function SleepInput({ metrics, settings, update, disabled }) {
  const hrs = sleepHours(metrics.bed, metrics.wake);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-400">
          Bedtime (last night)
          <input type="time" className={`${field} mt-1 [color-scheme:dark]`} value={metrics.bed || ''} disabled={disabled} onChange={(e) => update({ bed: e.target.value })} />
        </label>
        <label className="text-xs text-slate-400">
          Wake-up
          <input type="time" className={`${field} mt-1 [color-scheme:dark]`} value={metrics.wake || ''} disabled={disabled} onChange={(e) => update({ wake: e.target.value })} />
        </label>
      </div>
      <p className="text-xs text-slate-500">
        {hrs > 0 ? `${Math.floor(hrs)} h ${Math.round((hrs % 1) * 60)} min` : 'Not logged'} / {settings.sleepMinHours} h
      </p>
    </div>
  );
}

// ---------- zero liquid calories ----------
export function NoLiquidCalInput({ metrics, update, disabled }) {
  const on = metrics.noLiquidCal === true;
  return (
    <div className="space-y-2">
      <div className="rounded-xl bg-white/[0.04] p-3 text-xs leading-relaxed text-slate-400">
        <p><span className="font-semibold text-emerald-300">Allowed:</span> {NO_LIQUID_CAL_ALLOWED}</p>
        <p className="mt-1"><span className="font-semibold text-rose-300">Not allowed:</span> {NO_LIQUID_CAL_BANNED}</p>
      </div>
      <button
        disabled={disabled}
        onClick={() => update({ noLiquidCal: !on })}
        className={`h-12 w-full rounded-xl border font-semibold disabled:opacity-40 ${
          on ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200' : 'border-white/15 bg-white/5'
        }`}
      >
        {on ? 'Confirmed: zero liquid calories today' : 'Confirm zero liquid calories today'}
      </button>
    </div>
  );
}
