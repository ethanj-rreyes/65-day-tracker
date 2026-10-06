import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_SETTINGS } from '../constants';

/**
 * Firestore layout:
 *   users/{uid}                  -> { startDate: 'YYYY-MM-DD', settings: {...targets} }
 *   users/{uid}/days/{dayNum}    -> { day, metrics, focus, top3, planDone, tasks, percent, completed, updatedAt }
 *   users/{uid}/reviews/{week}   -> { worked, blocked, change, updatedAt }
 *   users/{uid}/expenses/{id}    -> { amount, item, category, impulse, trigger, at, dayNum, regret }
 *   users/{uid}/wishlist/{id}    -> { item, price, addedAt, unlockAt, status: 'waiting'|'bought'|'skipped', decidedAt }
 */
export function useChallenge(uid) {
  const [userDoc, setUserDoc] = useState(null);
  const [days, setDays] = useState({});
  const [reviews, setReviews] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loaded, setLoaded] = useState({ user: false, days: false, reviews: false, expenses: false, wishlist: false });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) return;
    setLoaded({ user: false, days: false, reviews: false, expenses: false, wishlist: false });
    const onErr = (e) => setError(e.message);
    const mark = (k) => setLoaded((l) => (l[k] ? l : { ...l, [k]: true }));
    const toMap = (snap) => {
      const map = {};
      snap.forEach((d) => (map[Number(d.id)] = d.data()));
      return map;
    };
    const toList = (snap) => {
      const out = [];
      snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
      return out;
    };

    const unsubs = [
      onSnapshot(doc(db, 'users', uid), (s) => { setUserDoc(s.exists() ? s.data() : {}); mark('user'); }, onErr),
      onSnapshot(collection(db, 'users', uid, 'days'), (s) => { setDays(toMap(s)); mark('days'); }, onErr),
      onSnapshot(collection(db, 'users', uid, 'reviews'), (s) => { setReviews(toMap(s)); mark('reviews'); }, onErr),
      onSnapshot(collection(db, 'users', uid, 'expenses'), (s) => { setExpenses(toList(s).sort((a, b) => b.at - a.at)); mark('expenses'); }, onErr),
      onSnapshot(collection(db, 'users', uid, 'wishlist'), (s) => { setWishlist(toList(s).sort((a, b) => b.addedAt - a.addedAt)); mark('wishlist'); }, onErr),
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

  const expensesCol = useCallback(() => collection(db, 'users', uid, 'expenses'), [uid]);
  const addExpense = useCallback((e) => addDoc(expensesCol(), e), [expensesCol]);
  const updateExpense = useCallback((id, f) => updateDoc(doc(db, 'users', uid, 'expenses', id), f), [uid]);
  const deleteExpense = useCallback((id) => deleteDoc(doc(db, 'users', uid, 'expenses', id)), [uid]);
  const addWish = useCallback((w) => addDoc(collection(db, 'users', uid, 'wishlist'), w), [uid]);
  const updateWish = useCallback((id, f) => updateDoc(doc(db, 'users', uid, 'wishlist', id), f), [uid]);
  const deleteWish = useCallback((id) => deleteDoc(doc(db, 'users', uid, 'wishlist', id)), [uid]);

  return {
    expenses,
    wishlist,
    addExpense,
    updateExpense,
    deleteExpense,
    addWish,
    updateWish,
    deleteWish,
    startDate: userDoc?.startDate ?? null,
    settings,
    days,
    reviews,
    ready: Object.values(loaded).every(Boolean),
    error,
    setStartDate,
    saveSettings,
    saveDay,
    saveReview,
  };
}
