import { ALL_TASKS, TOTAL_DAYS } from '../constants';
import { dayStatus, sleepHours } from '../utils';
import DayGrid, { GridLegend } from './DayGrid';
import TrendChart from './TrendChart';

export default function ProgressView({ days, todayNum, now, settings, onOpen }) {
  const lastDay = Math.min(Math.max(todayNum, 0), TOTAL_DAYS);
  const range = Array.from({ length: lastDay }, (_, i) => i + 1);
  const series = (fn) => range.map((n) => ({ n, v: fn(days[n]?.metrics || {}) }));
  const closed = range.filter((n) => dayStatus(n, days[n], todayNum, now) !== 'pending');

  const rates = ALL_TASKS.map((t) => {
    const hits = closed.filter((n) => days[n]?.tasks?.[t.id]).length;
    return { ...t, hits, rate: closed.length ? hits / closed.length : 0 };
  });

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <GridLegend />
        <DayGrid days={days} todayNum={todayNum} now={now} onOpen={onOpen} />
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Task hit rate (closed days)</h3>
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          {closed.length === 0 && <p className="text-sm text-slate-400">Shows up after your first full day.</p>}
          {closed.length > 0 &&
            rates.map((r) => (
              <div key={r.id} className="grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3 text-sm">
                <span className="truncate text-slate-300">{r.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${r.rate * 100}%` }} />
                </div>
                <span className="text-right tabular-nums text-slate-300">
                  {r.hits}/{closed.length}
                </span>
              </div>
            ))}
        </div>
      </section>

      {range.length > 0 && (
        <section className="grid gap-3 md:grid-cols-2">
          <TrendChart title="Sleep" unit="h" target={settings.sleepMinHours} format={(v) => v.toFixed(1)} data={series((m) => sleepHours(m.bed, m.wake))} />
          <TrendChart title="Water" unit="L" target={settings.waterTargetMl / 1000} format={(v) => v.toFixed(1)} data={series((m) => (Number(m.waterMl) || 0) / 1000)} />
          <TrendChart title="Protein" unit="g" target={settings.proteinTarget} format={(v) => Math.round(v)} data={series((m) => Number(m.protein) || 0)} />
          <TrendChart title="Exercise" unit="min" target={settings.exerciseMinutes} format={(v) => Math.round(v)} data={series((m) => Number(m.exerciseMin) || 0)} />
        </section>
      )}
    </div>
  );
}
