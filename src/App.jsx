import { useCallback, useEffect, useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import { useAuth } from './hooks/useAuth';
import { useChallenge } from './hooks/useChallenge';
import { useNow } from './hooks/useNow';
import { TOTAL_DAYS } from './constants';
import { fetchDayEvents, hasCalendarToken } from './calendar';
import {
  budgetOkForDay,
  calcPercent,
  canEdit,
  computeStats,
  dateForDay,
  dayNumberFor,
  dayStatus,
  evaluateTasks,
  impulseSpentInWeek,
  weekOf,
} from './utils';
import LoginScreen from './components/LoginScreen';
import ProgressHeader from './components/ProgressHeader';
import TodayView from './components/TodayView';
import ProgressView from './components/ProgressView';
import MoneyView from './components/MoneyView';
import ReviewView from './components/ReviewView';
import DayModal from './components/DayModal';
import StartDateModal from './components/StartDateModal';
import SettingsModal from './components/SettingsModal';
import CalendarSetupModal from './components/CalendarSetupModal';
import ExpenseForm from './components/ExpenseForm';
import BottomNav from './components/BottomNav';

const Center = ({ children }) => <div className="flex min-h-dvh items-center justify-center p-6 text-center text-slate-400">{children}</div>;

function Tracker({ user }) {
  const c = useChallenge(user.uid);
  const { startDate, settings, days, reviews, expenses, wishlist, ready, error, setStartDate, saveSettings, saveDay, saveReview } = c;
  const [tab, setTab] = useState('today');
  const [openDay, setOpenDay] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [toast, setToast] = useState('');
  const [calBusy, setCalBusy] = useState(false);
  const [calError, setCalError] = useState('');

  const now = useNow(30_000); // re-evaluates "today", grace window, countdowns, check-in windows
  const nowDate = useMemo(() => new Date(now), [now]);
  const todayNum = startDate ? dayNumberFor(startDate, nowDate) : 0;
  const stats = useMemo(() => computeStats(days, todayNum, nowDate), [days, todayNum, nowDate]);
  const budget = settings.weeklyImpulseBudget;

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  }, []);
  const closeModal = useCallback(() => setOpenDay(null), []);

  // Keep the "Impulse budget" task in sync with the expenses list for days that are still open.
  useEffect(() => {
    if (!ready || !startDate) return;
    [todayNum, todayNum - 1].forEach((n) => {
      if (!canEdit(n, todayNum, nowDate)) return;
      const ok = budgetOkForDay(expenses, n, budget);
      const d = days[n];
      if (d?.tasks?.budget === ok || (!d && ok)) return;
      const tasks = { ...(d?.tasks || evaluateTasks(d, settings, { budgetOk: ok })), budget: ok };
      saveDay(n, { tasks, percent: calcPercent(tasks) });
    });
  }, [ready, startDate, expenses, days, settings, budget, todayNum, nowDate, saveDay]);

  // ---- calendar ----
  const calendarIdsKey = settings.calendarIds.join(',');
  const refreshCalendar = useCallback(
    async (interactive = false) => {
      if (!settings.calendarIds.length || todayNum < 1 || todayNum > TOTAL_DAYS) return;
      setCalBusy(true);
      setCalError('');
      try {
        const events = await fetchDayEvents(settings.calendarIds, dateForDay(startDate, todayNum), interactive);
        if (events) await saveDay(todayNum, { calendar: { fetchedAt: Date.now(), events } });
      } catch (e) {
        setCalError(e.message);
      } finally {
        setCalBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [calendarIdsKey, startDate, todayNum, saveDay]
  );

  // Auto-refresh quietly (no popup) when we still have access and the cache is older than 30 min.
  const fetchedAt = days[todayNum]?.calendar?.fetchedAt || 0;
  useEffect(() => {
    if (ready && settings.calendarIds.length && hasCalendarToken() && now - fetchedAt > 30 * 60000) refreshCalendar(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, calendarIdsKey, todayNum, fetchedAt]);

  const checkIn = (eventId) => saveDay(todayNum, { checkins: { [eventId]: Date.now() } });

  // ---- completing a day ----
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
  const yesterdayOpen = canEdit(todayNum - 1, todayNum, nowDate);

  const ctxFor = (n) => ({
    budgetOk: budgetOkForDay(expenses, n, budget),
    weekImpulse: impulseSpentInWeek(expenses, weekOf(Math.max(n, 1)), n),
    todayImpulse: expenses.filter((e) => e.impulse && e.dayNum === n),
    onLogPurchase: () => setShowExpense(true),
  });

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
                ctx={ctxFor(todayNum)}
                calendar={{
                  connected: settings.calendarIds.length > 0,
                  refreshing: calBusy,
                  error: calError,
                  onSetup: () => setShowCalendar(true),
                  onRefresh: refreshCalendar,
                  onCheckIn: checkIn,
                }}
              />
            )}
          </>
        )}

        {tab === 'progress' && <ProgressView days={days} todayNum={todayNum} now={nowDate} settings={settings} onOpen={setOpenDay} />}

        {tab === 'money' && (
          <MoneyView
            expenses={expenses}
            wishlist={wishlist}
            settings={settings}
            todayNum={Math.min(Math.max(todayNum, 1), TOTAL_DAYS)}
            now={now}
            onLogPurchase={() => setShowExpense(true)}
            addExpense={c.addExpense}
            updateExpense={c.updateExpense}
            deleteExpense={c.deleteExpense}
            addWish={c.addWish}
            updateWish={c.updateWish}
          />
        )}

        {tab === 'review' &&
          (started ? (
            <ReviewView
              startDate={startDate}
              days={days}
              reviews={reviews}
              todayNum={Math.min(todayNum, TOTAL_DAYS)}
              now={nowDate}
              onSave={saveReview}
              expenses={expenses}
              wishlist={wishlist}
              settings={settings}
            />
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
          ctx={ctxFor(openDay)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          startDate={startDate}
          onClose={() => setShowSettings(false)}
          onOpenCalendar={() => {
            setShowSettings(false);
            setShowCalendar(true);
          }}
          onSave={async (next, newStart) => {
            await saveSettings(next);
            if (newStart) await setStartDate(newStart);
            showToast('Settings saved');
          }}
        />
      )}

      {showCalendar && (
        <CalendarSetupModal
          settings={settings}
          onClose={() => setShowCalendar(false)}
          onSave={async (ids) => {
            await saveSettings({ ...settings, calendarIds: ids });
            setShowCalendar(false);
            showToast(ids.length ? 'Calendar connected' : 'Calendar disconnected');
          }}
        />
      )}

      {showExpense && (
        <ExpenseForm
          settings={settings}
          expenses={expenses}
          todayNum={Math.max(todayNum, 1)}
          yesterdayOpen={yesterdayOpen}
          onClose={() => setShowExpense(false)}
          onSave={async (e) => {
            await c.addExpense(e);
            showToast(e.impulse ? 'Impulse buy logged. Honest logging is the point.' : 'Purchase logged');
          }}
        />
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <div className="animate-fade-in rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-slate-900 shadow-lg">{toast}</div>
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
