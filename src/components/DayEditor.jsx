import { useCallback, useEffect, useRef, useState } from 'react';
import { PILLARS } from '../constants';
import { IDLE_FOCUS, calcPercent, evaluateTasks } from '../utils';
import {
  BudgetInput,
  ExerciseInput,
  FocusTimer,
  NoLiquidCalInput,
  ProteinInput,
  SleepInput,
  TaskCard,
  Top3Input,
  WaterInput,
} from './TaskInputs';

const toDraft = (day) => ({
  metrics: { ...(day?.metrics || {}) },
  top3: day?.top3 || ['', '', ''],
  focus: day?.focus || IDLE_FOCUS,
});

/**
 * Logs a single day. Every change is auto-saved (debounced) together with the
 * auto-evaluated task results, so the grid and streak update live everywhere.
 */
export default function DayEditor({ dayNum, day, settings, editable, onSave, onComplete, ctx = {} }) {
  const [draft, setDraft] = useState(() => toDraft(day));
  const latest = useRef(draft);
  const dirty = useRef(false);
  const timer = useRef(null);
  const settingsRef = useRef(settings);
  const saveRef = useRef(onSave);
  const ctxRef = useRef(ctx);
  settingsRef.current = settings;
  saveRef.current = onSave;
  ctxRef.current = ctx;

  // Take remote updates (e.g. from your other device) when we have no unsaved edits.
  useEffect(() => {
    if (!dirty.current) {
      const d = toDraft(day);
      latest.current = d;
      setDraft(d);
    }
  }, [day]);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    const d = latest.current;
    const tasks = evaluateTasks(d, settingsRef.current, { budgetOk: ctxRef.current.budgetOk });
    saveRef.current(dayNum, { metrics: d.metrics, top3: d.top3, focus: d.focus, tasks, percent: calcPercent(tasks) });
  }, [dayNum]);

  // Save anything pending when this view closes.
  useEffect(() => () => flush(), [flush]);

  // Re-score an open day when a target actually changes in Settings.
  const settingsKey = JSON.stringify(settings);
  const lastSettingsKey = useRef(settingsKey);
  useEffect(() => {
    if (settingsKey === lastSettingsKey.current) return;
    lastSettingsKey.current = settingsKey;
    if (editable) {
      dirty.current = true;
      flush();
    }
  }, [settingsKey, editable, flush]);

  const change = useCallback(
    (patch, delay = 600) => {
      if (!editable) return;
      const prev = latest.current;
      const next = { ...prev, ...patch, metrics: { ...prev.metrics, ...(patch.metrics || {}) } };
      latest.current = next;
      setDraft(next);
      dirty.current = true;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [editable, flush]
  );

  const update = useCallback((m) => change({ metrics: m }), [change]);
  const setFocus = useCallback((f) => change({ focus: f }, 0), [change]);
  const setTop3 = useCallback((t) => change({ top3: t }), [change]);

  // Open days are scored live; locked days show the result that was saved at the time.
  const tasks = editable ? evaluateTasks(draft, settings, { budgetOk: ctx.budgetOk }) : day?.tasks || {};
  const percent = editable ? calcPercent(tasks) : day?.percent ?? 0;
  const disabled = !editable;

  const inputFor = (id) => {
    const props = { metrics: draft.metrics, settings, update, disabled };
    switch (id) {
      case 'macros': return <ProteinInput {...props} />;
      case 'training': return <ExerciseInput {...props} />;
      case 'water': return <WaterInput {...props} />;
      case 'deepwork': return <FocusTimer focus={draft.focus} settings={settings} onChange={setFocus} disabled={disabled} />;
      case 'braindump': return <Top3Input top3={draft.top3} onChange={setTop3} disabled={disabled} />;
      case 'sleep': return <SleepInput {...props} />;
      case 'nosugar': return <NoLiquidCalInput {...props} />;
      case 'budget': return <BudgetInput settings={settings} ctx={ctx} disabled={disabled} />;
      default: return null;
    }
  };

  const complete = async () => {
    flush();
    await onComplete(dayNum, percent);
  };

  return (
    <div className="space-y-6">
      {PILLARS.map((p) => (
        <section key={p.id}>
          <h3 className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${p.text}`}>
            <span className={`h-2 w-2 rounded-full ${p.dot}`} />
            {p.title}
          </h3>
          <div className="space-y-2.5">
            {p.tasks.map((t) => (
              <TaskCard key={t.id} label={t.label} rule={t.rule(settings)} passed={t.id === 'budget' && !editable ? day?.tasks?.budget !== false : tasks[t.id]}>
                {inputFor(t.id)}
              </TaskCard>
            ))}
          </div>
        </section>
      ))}

      {editable && onComplete && (
        <button
          onClick={complete}
          className={`h-14 w-full rounded-2xl text-base font-bold transition active:scale-[0.98] ${
            percent === 100 ? 'bg-emerald-500 text-[#04110a]' : 'bg-white/10 text-slate-200'
          }`}
        >
          {day?.completed ? `Update Day (${percent}%)` : `Complete Day (${percent}%)`}
        </button>
      )}
    </div>
  );
}
