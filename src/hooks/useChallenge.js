import { useCallback, useEffect, useState } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { calcPercent } from '../utils';

/**
 * Firestore layout:
 *   users/{uid}                 -> { startDate: 'YYYY-MM-DD' }
 *   users/{uid}/days/{dayNum}   -> { day, tasks: {taskId: bool}, percent, completed, updatedAt }
 */
export function useChallenge(uid) {
  const [startDate, setStartDateState] = useState(null);
  const [days, setDays] = useState({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) return;
    setReady(false);
    let settingsLoaded = false;
    let daysLoaded = false;
    const check = () => settingsLoaded && daysLoaded && setReady(true);
    const onErr = (e) => setError(e.message);

    const unsubSettings = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        setStartDateState(snap.exists() ? snap.data().startDate ?? null : null);
        settingsLoaded = true;
        check();
      },
      onErr
    );

    const unsubDays = onSnapshot(
      collection(db, 'users', uid, 'days'),
      (snap) => {
        const map = {};
        snap.forEach((d) => {
          map[Number(d.id)] = d.data();
        });
        setDays(map);
        daysLoaded = true;
        check();
      },
      onErr
    );

    return () => {
      unsubSettings();
      unsubDays();
    };
  }, [uid]);

  const setStartDate = useCallback(
    (iso) => setDoc(doc(db, 'users', uid), { startDate: iso }, { merge: true }),
    [uid]
  );

  // Writes tasks + recomputed percent. `completed` is only changed when passed.
  const saveDay = useCallback(
    (dayNum, tasks, completed) => {
      const payload = {
        day: dayNum,
        tasks,
        percent: calcPercent(tasks),
        updatedAt: serverTimestamp(),
      };
      if (typeof completed === 'boolean') payload.completed = completed;
      return setDoc(doc(db, 'users', uid, 'days', String(dayNum)), payload, { merge: true });
    },
    [uid]
  );

  return { startDate, days, ready, error, setStartDate, saveDay };
}
