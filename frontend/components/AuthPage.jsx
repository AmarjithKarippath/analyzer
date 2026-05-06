import React, { useEffect, useState } from 'react';
import { Mail, Lock, User, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AuthPage() {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // ---- Google Sign-In debug -------------------------------------------------
  // Logs the exact origin + client ID the browser is sending to Google, and
  // probes GSI directly so unregistered-origin errors are visible in console.
  useEffect(() => {
    const masked = GOOGLE_CLIENT_ID
      ? `${GOOGLE_CLIENT_ID.slice(0, 12)}…${GOOGLE_CLIENT_ID.slice(-20)}`
      : '(empty)';
    // eslint-disable-next-line no-console
    console.log('[GSI debug] window.location.origin =', window.location.origin);
    // eslint-disable-next-line no-console
    console.log('[GSI debug] VITE_GOOGLE_CLIENT_ID  =', masked);
    // eslint-disable-next-line no-console
    console.log(
      '[GSI debug] Add the origin above (verbatim, no trailing slash) to ' +
        'GCP → Credentials → your OAuth Client → Authorized JavaScript origins.'
    );

    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;
    const probe = () => {
      if (cancelled) return;
      if (!window.google?.accounts?.id) {
        // GSI script hasn't loaded yet — try again shortly.
        setTimeout(probe, 300);
        return;
      }
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp) =>
            // eslint-disable-next-line no-console
            console.log('[GSI debug] credential received (length):', resp?.credential?.length),
        });
        window.google.accounts.id.prompt((notification) => {
          // eslint-disable-next-line no-console
          console.log('[GSI debug] prompt notification:', {
            isNotDisplayed: notification.isNotDisplayed?.(),
            notDisplayedReason: notification.getNotDisplayedReason?.(),
            isSkippedMoment: notification.isSkippedMoment?.(),
            skippedReason: notification.getSkippedReason?.(),
            isDismissedMoment: notification.isDismissedMoment?.(),
            dismissedReason: notification.getDismissedReason?.(),
          });
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[GSI debug] probe failed:', e);
      }
    };
    probe();
    return () => {
      cancelled = true;
    };
  }, []);
  // ---------------------------------------------------------------------------

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name || null);
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Something went wrong';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    // eslint-disable-next-line no-console
    console.log('[GSI debug] GoogleLogin onSuccess fired:', {
      hasCredential: !!credentialResponse?.credential,
      credentialLen: credentialResponse?.credential?.length || 0,
      select_by: credentialResponse?.select_by,
      clientId: credentialResponse?.clientId,
    });
    setError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const status = err?.response?.status;
      // eslint-disable-next-line no-console
      console.error('[GSI debug] handleGoogle caught:', { status, detail, err });
      setError(
        detail
          ? `${detail}${status ? ` (HTTP ${status})` : ''}`
          : `Google sign-in failed${status ? ` (HTTP ${status})` : ''}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>P&L Dashboard</h1>
          <p>{mode === 'login' ? 'Sign in to your account' : 'Create a new account'}</p>
        </div>

        {GOOGLE_CLIENT_ID ? (
          <div className="google-wrap">
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => setError('Google sign-in failed')}
              useOneTap={false}
              theme="outline"
              size="large"
              width="320"
              text={mode === 'login' ? 'signin_with' : 'signup_with'}
            />
          </div>
        ) : (
          <div className="google-disabled">
            Google sign-in not configured.{' '}
            <span>Set <code>VITE_GOOGLE_CLIENT_ID</code> at build time.</span>
          </div>
        )}

        <div className="divider">
          <span>or</span>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <div className="field">
              <User size={18} className="field-icon" />
              <input
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                autoComplete="name"
              />
            </div>
          )}

          <div className="field">
            <Mail size={18} className="field-icon" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              autoComplete="email"
            />
          </div>

          <div className="field">
            <Lock size={18} className="field-icon" />
            <input
              type="password"
              placeholder={mode === 'register' ? 'Password (min 6 chars)' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={submitting}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
            {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button type="button" onClick={switchMode}>
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={switchMode}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
