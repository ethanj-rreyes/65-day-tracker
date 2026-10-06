import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const friendly = (code = '') => {
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return 'Incorrect email or password.';
  if (code.includes('email-already-in-use')) return 'That email already has an account. Try signing in.';
  if (code.includes('weak-password')) return 'Password must be at least 6 characters.';
  if (code.includes('invalid-email')) return 'Enter a valid email address.';
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) return '';
  if (code.includes('unauthorized-domain')) return 'This domain is not authorized in Firebase Auth settings.';
  return 'Something went wrong. Please try again.';
};

export default function LoginScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(friendly(e.code));
    } finally {
      setBusy(false);
    }
  };

  const google = () => run(() => signInWithPopup(auth, googleProvider));
  const submit = (e) => {
    e.preventDefault();
    run(() =>
      mode === 'signin'
        ? signInWithEmailAndPassword(auth, email, password)
        : createUserWithEmailAndPassword(auth, email, password)
    );
  };

  const input = 'h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none';

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-extrabold tracking-tight">
          65-Day <span className="text-emerald-400">Peak</span>
        </h1>
        <p className="mb-8 mt-2 text-slate-400">Physical. Cognitive. Recovery. Every day.</p>

        <button
          onClick={google}
          disabled={busy}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-white font-semibold text-slate-900 active:scale-[0.98] disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-500">
          <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input className={input} type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={input} type="password" placeholder="Password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <button disabled={busy} className="h-14 w-full rounded-2xl bg-emerald-500 font-bold text-[#04110a] active:scale-[0.98] disabled:opacity-50">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
          className="mt-4 w-full py-2 text-sm text-slate-400"
        >
          {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
