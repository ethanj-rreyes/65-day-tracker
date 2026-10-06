const TABS = [
  ['today', 'Today'],
  ['progress', 'Progress'],
  ['money', 'Money'],
  ['review', 'Review'],
];

export default function BottomNav({ tab, setTab, reviewDue }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#0b0f1a]/95 backdrop-blur">
      <div className="mx-auto grid max-w-4xl grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              window.scrollTo({ top: 0 });
            }}
            className={`relative h-16 text-sm font-semibold ${tab === id ? 'text-emerald-300' : 'text-slate-400'}`}
          >
            {label}
            {tab === id && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-emerald-400" />}
            {id === 'review' && reviewDue && <span className="absolute right-[22%] top-4 h-2 w-2 rounded-full bg-sky-400" aria-label="Review due" />}
          </button>
        ))}
      </div>
    </nav>
  );
}
