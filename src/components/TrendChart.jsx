import { useState } from 'react';

/**
 * Single-series daily bar chart with a dashed target line.
 * Tap/hover a bar to read its value. Bars at/above target are green, below are gray,
 * and the readout always states hit/below in words (not color alone).
 */
export default function TrendChart({ title, unit, data, target, format = (v) => v }) {
  const [sel, setSel] = useState(null);
  const H = 96;
  const slot = 10;
  const W = Math.max(data.length, 7) * slot;
  const max = Math.max(target * 1.25, ...data.map((d) => d.v), 1);
  const y = (v) => H - (v / max) * H;
  const logged = data.filter((d) => d.v > 0);
  const avg = logged.length ? logged.reduce((a, d) => a + d.v, 0) / logged.length : 0;
  const hitCount = data.filter((d) => d.v >= target).length;
  const active = sel != null ? data[sel] : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="font-semibold">{title}</h4>
        <span className="text-xs text-slate-400">target {format(target)} {unit}</span>
      </div>
      <p className="mt-0.5 h-5 text-sm tabular-nums text-slate-300">
        {active
          ? `Day ${active.n}: ${active.v ? `${format(active.v)} ${unit}` : 'not logged'}${active.v ? (active.v >= target ? ' (hit)' : ' (below)') : ''}`
          : data.length
          ? `Avg ${format(avg)} ${unit} · hit ${hitCount}/${data.length} days`
          : 'No days yet'}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-2 h-24 w-full" onPointerLeave={() => setSel(null)} role="img" aria-label={`${title} by day`}>
        {data.map((d, i) => {
          const h = Math.max(d.v > 0 ? 2 : 0, H - y(d.v));
          return (
            <g key={d.n} onPointerEnter={() => setSel(i)} onClick={() => setSel(i)}>
              <rect x={i * slot} y={0} width={slot} height={H} fill="transparent" />
              <rect
                x={i * slot + 1}
                y={H - h}
                width={slot - 2}
                height={h}
                rx={1.5}
                className={`${d.v >= target ? 'fill-emerald-400' : 'fill-slate-500'} ${sel === i ? 'opacity-100' : sel != null ? 'opacity-50' : ''}`}
              />
            </g>
          );
        })}
        <line x1={0} x2={W} y1={y(target)} y2={y(target)} className="stroke-slate-300" strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>Day {data[0]?.n ?? 1}</span>
        <span>Day {data[data.length - 1]?.n ?? 1}</span>
      </div>
    </div>
  );
}
