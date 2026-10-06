import { useCallback, useEffect, useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import { useAuth } from './hooks/useAuth';
import { useChallenge } from './hooks/useChallenge';
import { TOTAL_DAYS } from './constants';
import { calcPercent, computeStats, dayNumberFor } from './utils';
import LoginScreen from './components/LoginScreen';
import ProgressHeader from './components/ProgressHeader';
import DayGrid from './components/DayGrid';
import DayModal from './components/DayModal';
import StartDateModal from './components/StartDateModal';

const Center = ({ children }) => (
  <div className="flex min-h-dvh items-center justify-center p-6 text-center text-slate-400">{children}</div>
);

function Tracker({ user }) {
  const { startDate, days, ready, error, setStartDate, saveDay } = useChallenge(user.uid);
  const [openDay, setOpenDay] = useState(null);
  const [editingStart, setEditingStart] = useState(false);
  const [toast, setToast] = useState('');

  // Re-evaluate "today" if the app stays open past midnight.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const todayNum = startDate ? dayNumberFor(startDate, now) : 0;
  const stats = useMemo(() => computeStats(days, todayNum), [days, todayNum]);

  const closeModal = useCallback(() => setOpenDay(null), []);

  const handleComplete = async (n, tasks) => {
    await saveDay(n, tasks, true);
    const pct = calcPercent(tasks);
    setOpenDay(null);
    setToast(`Day ${n} saved - ${pct}%`);
    setTimeout(() => setToast(''), 2500);
  };

  if (error) return <Center>Couldn't load your data: {error}</Center>;
  if (!ready) return <Center>Loading your progress...</Center>;
  if (!startDate) return <StartDateModal onSave={setStartDate} />;

  const started = todayNum >= 1;
  const finished = todayNum > TOTAL_DAYS;

  return (
    <div className="min-h-dvh pb-24">
      <ProgressHeader
        stats={stats}
        user={user}
        onChangeStart={() => setEditingStart(true)}
        onSignOut={() => signOut(auth)}
      />

      <main className="mx-auto max-w-4xl space-y-5 px-4 pt-5">
        {!started && (
          <p className="rounded-2xl bg-sky-400/10 px-4 py-3 text-sm text-sky-200">
            Your challenge starts in {1 - todayNum} day{1 - todayNum === 1 ? '' : 's'}.
          </p>
        )}
        {finished && (
          <p className="rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            Challenge complete: {stats.total} of {TOTAL_DAYS} days fully completed. Best streak: {stats.best}.
          </p>
        )}
        {started && !finished && (
          <button
            onClick={() => setOpenDay(todayNum)}
            className="flex h-16 w-full items-center justify-between rounded-2xl bg-emerald-500 px-5 font-bold text-[#04110a] active:scale-[0.99]"
          >
            <span>Today's check-in</span>
            <span className="tabular-nums">Day {todayNum}</span>
          </button>
        )}

        <DayGrid days={days} todayNum={todayNum} onOpen={setOpenDay} />
      </main>

      {openDay && (
        <DayModal
          key={openDay}
          dayNum={openDay}
          startDate={startDate}
          day={days[openDay]}
          locked={openDay > todayNum}
          onToggleSave={(n, tasks) => saveDay(n, tasks)}
          onComplete={handleComplete}
          onClose={closeModal}
        />
      )}

      {editingStart && (
        <StartDateModal
          initial={startDate}
          onCancel={() => setEditingStart(false)}
          onSave={async (iso) => {
            await setStartDate(iso);
            setEditingStart(false);
          }}
        />
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="animate-fade-in rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (!isFirebaseConfigured) {
    return (
      <Center>
        <div>
          <p className="font-semibold text-slate-200">Firebase isn't configured yet.</p>
          <p className="mt-2 text-sm">Copy .env.example to .env.local, fill in your Firebase keys, and restart the dev server.</p>
        </div>
      </Center>
    );
  }
  if (loading) return <Center>Loading...</Center>;
  if (!user) return <LoginScreen />;
  return <Tracker user={user} />;
}
