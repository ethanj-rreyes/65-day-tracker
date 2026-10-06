import { useCallback, useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import { useAuth } from './hooks/useAuth';
import { useChallenge } from './hooks/useChallenge';
import { useNow } from './hooks/useNow';
import { TOTAL_DAYS } from './constants';
import { canEdit, computeStats, dayNumberFor, dayStatus, weekOf } from './utils';
import LoginScreen from './components/LoginScreen';
import ProgressHeader from './components/ProgressHeader';
import TodayView from './components/TodayView';
import ProgressView from './components/ProgressView';
import ReviewView from './components/ReviewView';
import DayModal from './components/DayModal';
import StartDateModal from './components/StartDateModal';
import SettingsModal from './components/SettingsModal';
import BottomNav from './components/BottomNav';

const Center = ({ children }) => <div className="flex min-h-dvh items-center justify-center p-6 text-center text-slate-400">{children}</div>;

function Tracker({ user }) {
  const { startDate, settings, days, reviews, ready, error, setStartDate, saveSettings, saveDay, saveReview } = useChallenge(user.uid);
  const [tab, setTab] = useState('today');
  const [openDay, setOpenDay] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState('');

  const now = useNow(30_000); // re-evaluates "today", grace window and countdown
  const nowDate = useMemo(() => new Date(now), [now]);
  const todayNum = startDate ? dayNumberFor(startDate, nowDate) : 0;
  const stats = useMemo(() => computeStats(days, todayNum, nowDate), [days, todayNum, nowDate]);

  const closeModal = useCallback(() => setOpenDay(null), []);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const handleComplete = async (n, percent) => {
    await saveDay(n, { completed: true });
    setOpenDay(null);
    showToast(percent === 100 ? `Day ${n} secured: 100%` : `Day ${n} saved at ${percent}%. Only 100% counts.`);
  };

  if (error) return <Center>Couldn't load your data: {error}</Center>;
  if (!ready) return <Center>Loading your progress...</Center>;
  if (!startDate) return <StartDateModal onSave={setStartDate} />;

  const started = todayNum >= 1;
  const finished = todayNum > TOTAL_DAYS;
  const lastWeek = weekOf(Math.min(todayNum, TOTAL_DAYS + 7)) - 1;
  const reviewDue = started && lastWeek >= 1 && !reviews[lastWeek];

  return (
    <div className="min-h-dvh pb-28">
      <ProgressHeader stats={stats} user={user} onSettings={() => setShowSettings(true)} onSignOut={() => signOut(auth)} />

      <main className="mx-auto max-w-4xl px-4 pt-5">
        {tab === 'today' && (
          <>
            {!started && (
              <p className="rounded-2xl bg-sky-400/10 px-4 py-3 text-sm text-sky-200">
                Your challenge starts in {1 - todayNum} day{1 - todayNum === 1 ? '' : 's'}. Set your targets in Settings before then.
              </p>
            )}
            {finished && (
              <p className="rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                Challenge complete: {stats.total} of {TOTAL_DAYS} days passed, {stats.missed} missed. Best streak: {stats.best}.
              </p>
            )}
            {started && !finished && (
              <TodayView
                todayNum={todayNum}
                startDate={startDate}
                days={days}
                reviews={reviews}
                settings={settings}
                now={now}
                onSave={saveDay}
                onComplete={handleComplete}
                onOpenDay={setOpenDay}
                onGoReview={() => setTab('review')}
              />
            )}
          </>
        )}

        {tab === 'progress' && <ProgressView days={days} todayNum={todayNum} now={nowDate} settings={settings} onOpen={setOpenDay} />}

        {tab === 'review' &&
          (started ? (
            <ReviewView startDate={startDate} days={days} reviews={reviews} todayNum={Math.min(todayNum, TOTAL_DAYS)} now={nowDate} onSave={saveReview} />
          ) : (
            <p className="text-sm text-slate-400">Reviews unlock once the challenge starts.</p>
          ))}
      </main>

      <BottomNav tab={tab} setTab={setTab} reviewDue={reviewDue} />

      {openDay && (
        <DayModal
          key={openDay}
          dayNum={openDay}
          todayNum={todayNum}
          startDate={startDate}
          day={days[openDay]}
          settings={settings}
          status={dayStatus(openDay, days[openDay], todayNum, nowDate)}
          editable={canEdit(openDay, todayNum, nowDate)}
          onSave={saveDay}
          onComplete={handleComplete}
          onClose={closeModal}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          startDate={startDate}
          onClose={() => setShowSettings(false)}
          onSave={async (next, newStart) => {
            await saveSettings(next);
            if (newStart) await setStartDate(newStart);
            showToast('Settings saved');
          }}
        />
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
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
