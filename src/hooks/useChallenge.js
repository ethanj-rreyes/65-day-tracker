import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_SETTINGS } from '../constants';

/**
 * Firestore layout:
 *   users/{uid}                  -> { startDate: 'YYYY-MM-DD', settings: {...targets} }
 *   users/{uid}/days/{dayNum}    -> { day, metrics, focus, top3, planDone, tasks, percent, completed, updatedAt }
 *   users/{uid}/reviews/{week}   -> { worked, blocked, change, updatedAt }
 */
export function useChallenge(uid) {
  const [userDoc, setUserDoc] = useState(null);
  const [days, setDays] = useState({});
  const [reviews, setReviews] = useState({});
  const [loaded, setLoaded] = useState({ user: false, days: false, reviews: false });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) return;
    setLoaded({ user: false, days: false, reviews: false });
    const onErr = (e) => setError(e.message);
    const mark = (k) => setLoaded((l) => (l[k] ? l : { ...l, [k]: true }));
    const toMap = (snap) => {
      const map = {};
      snap.forEach((d) => (map[Number(d.id)] = d.data()));
      return map;
    };

    const unsubs = [
      onSnapshot(doc(db, 'users', uid), (s) => { setUserDoc(s.exists() ? s.data() : {}); mark('user'); }, onErr),
      onSnapshot(collection(db, 'users', uid, 'days'), (s) => { setDays(toMap(s)); mark('days'); }, onErr),
      onSnapshot(collection(db, 'users', uid, 'reviews'), (s) => { setReviews(toMap(s)); mark('reviews'); }, onErr),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...(userDoc?.settings || {}) }), [userDoc]);

  const setStartDate = useCallback((iso) => setDoc(doc(db, 'users', uid), { startDate: iso }, { merge: true }), [uid]);

  const saveSettings = useCallback(
    (next) => setDoc(doc(db, 'users', uid), { settings: next }, { merge: true }),
    [uid]
  );

  // Merges only the fields given, so different parts of the UI never overwrite each other.
  const saveDay = useCallback(
    (dayNum, fields) =>
      setDoc(doc(db, 'users', uid, 'days', String(dayNum)), { ...fields, day: dayNum, updatedAt: serverTimestamp() }, { merge: true }),
    [uid]
  );

  const saveReview = useCallback(
    (week, fields) =>
      setDoc(doc(db, 'users', uid, 'reviews', String(week)), { ...fields, updatedAt: serverTimestamp() }, { merge: true }),
    [uid]
  );

  return {
    startDate: userDoc?.startDate ?? null,
    settings,
    days,
    reviews,
    ready: loaded.user && loaded.days && loaded.reviews,
    error,
    setStartDate,
    saveSettings,
    saveDay,
    saveReview,
  };
}
