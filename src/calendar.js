import { GoogleAuthProvider, linkWithPopup, reauthenticateWithPopup } from 'firebase/auth';
import { auth } from './firebase';

const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const KEY = 'gcal-token';
const API = 'https://www.googleapis.com/calendar/v3';

const readToken = () => {
  try {
    const t = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    return t && t.exp > Date.now() + 60_000 ? t.token : null;
  } catch {
    return null;
  }
};

const writeToken = (token) => {
  try {
    // Google access tokens last about 1 hour.
    sessionStorage.setItem(KEY, JSON.stringify({ token, exp: Date.now() + 55 * 60_000 }));
  } catch {
    /* storage unavailable: token just lives for this call */
  }
};

export const hasCalendarToken = () => Boolean(readToken());

/**
 * Asks Google for read-only calendar access for the account you're signed in with.
 * Shows a Google popup (usually one tap once you've approved it before).
 */
export async function connectCalendar() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  const provider = new GoogleAuthProvider();
  provider.addScope(SCOPE);
  const googleLinked = user.providerData.some((p) => p.providerId === 'google.com');
  if (googleLinked) {
    const email = user.providerData.find((p) => p.providerId === 'google.com')?.email;
    if (email) provider.setCustomParameters({ login_hint: email });
  }
  try {
    const result = googleLinked ? await reauthenticateWithPopup(user, provider) : await linkWithPopup(user, provider);
    const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
    if (!token) throw new Error('Google did not return calendar access.');
    writeToken(token);
    return token;
  } catch (e) {
    const code = e?.code || '';
    if (code.includes('user-mismatch'))
      throw new Error('Pick the same Google account you log in with. Share your school calendar to that account first.');
    if (code.includes('credential-already-in-use'))
      throw new Error('That Google account is already used by another login. Sign in to the app with it instead.');
    if (code.includes('popup-closed') || code.includes('cancelled-popup')) throw new Error('Popup closed before finishing.');
    throw e;
  }
}

async function getToken(interactive) {
  return readToken() || (interactive ? connectCalendar() : null);
}

async function api(path, token) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) {
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
    throw new Error('Calendar access expired. Tap Reconnect.');
  }
  if (!res.ok) throw new Error(`Google Calendar error ${res.status}`);
  return res.json();
}

export async function listCalendars(interactive = true) {
  const token = await getToken(interactive);
  if (!token) return null;
  const data = await api('/users/me/calendarList?minAccessRole=reader&maxResults=100', token);
  return (data.items || []).map((c) => ({ id: c.id, name: c.summaryOverride || c.summary, primary: Boolean(c.primary), color: c.backgroundColor }));
}

/**
 * Today's timed events (all-day, cancelled and declined events skipped) across the chosen calendars.
 * Returns null if not connected and interactive is false.
 */
export async function fetchDayEvents(calendarIds, dayStart, interactive = false) {
  const token = await getToken(interactive);
  if (!token) return null;
  const end = new Date(dayStart);
  end.setDate(end.getDate() + 1);
  const qs = new URLSearchParams({
    timeMin: new Date(dayStart).toISOString(),
    timeMax: end.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  });
  const lists = await Promise.all(
    calendarIds.map((id) =>
      api(`/calendars/${encodeURIComponent(id)}/events?${qs}`, token).then((d) =>
        (d.items || [])
          .filter((ev) => ev.status !== 'cancelled' && ev.start?.dateTime && ev.end?.dateTime)
          .filter((ev) => !(ev.attendees || []).some((a) => a.self && a.responseStatus === 'declined'))
          .map((ev) => ({
            id: `${id}_${ev.id}`.replace(/[^A-Za-z0-9_-]/g, '_'), // safe as a Firestore map key
            title: ev.summary || '(no title)',
            start: new Date(ev.start.dateTime).getTime(),
            end: new Date(ev.end.dateTime).getTime(),
            cal: id,
          }))
      )
    )
  );
  return lists.flat().sort((a, b) => a.start - b.start);
}
