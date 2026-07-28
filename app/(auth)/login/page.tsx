'use client';
import { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import posthog from 'posthog-js';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      posthog.identify(credential.user.uid, { email });
      posthog.capture('user_logged_in', { email });
      window.location.href = '/dashboard';
    } catch (err: any) {
      posthog.captureException(err);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      posthog.identify(credential.user.uid, { email: credential.user.email });
      posthog.capture('user_logged_in', { method: 'google', email: credential.user.email });
      window.location.href = '/dashboard';
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        posthog.captureException(err);
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <style>{`
        .auth-card { max-width: 420px; width: 100%; background: #fff; padding: 40px 36px; border-radius: 16px; border: 1px solid #e5e9f5; box-shadow: 0 4px 24px rgba(15,31,92,0.06); font-family: 'DM Sans', sans-serif; }
        .auth-card-logo { font-family: 'Lora', serif; font-size: 22px; font-weight: 600; color: #0f1f5c; text-align: center; margin-bottom: 8px; }
        .auth-card-logo span { color: #2563eb; }
        .auth-card-title { font-family: 'Lora', serif; font-size: 24px; font-weight: 600; color: #0f1f5c; text-align: center; margin-bottom: 8px; }
        .auth-card-sub { font-size: 14px; color: #6b7280; text-align: center; margin-bottom: 32px; }
        .auth-field { margin-bottom: 20px; }
        .auth-field label { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px; }
        .auth-field input { width: 100%; padding: 12px 16px; border: 1.5px solid #e5e9f5; border-radius: 10px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #111827; background: #fff; outline: none; transition: border-color 0.15s; }
        .auth-field input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .auth-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; font-size: 13px; padding: 10px 14px; border-radius: 8px; text-align: center; margin-bottom: 16px; }
        .auth-btn { width: 100%; background: #2563eb; color: #fff; padding: 13px; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.15s; }
        .auth-btn:hover { background: #1d4ed8; }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; color: #9ca3af; font-size: 12.5px; }
        .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: #e5e9f5; }
        .google-btn { width: 100%; background: #fff; color: #374151; padding: 12px; border: 1.5px solid #e5e9f5; border-radius: 10px; font-size: 14.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .google-btn:hover { border-color: #cbd5e1; background: #f8faff; }
        .google-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-footer { text-align: center; margin-top: 24px; font-size: 13.5px; color: #6b7280; }
        .auth-footer a { color: #2563eb; font-weight: 500; text-decoration: none; }
        .auth-footer a:hover { text-decoration: underline; }
        .auth-trust { display: flex; justify-content: center; gap: 20px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #f0f4ff; }
        .auth-trust-item { font-size: 11.5px; color: #9ca3af; display: flex; align-items: center; gap: 4px; }
        .auth-trust-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; }
      `}</style>
      <div className="auth-card">
        <div className="auth-card-logo">Paav<span>ti</span></div>
        <h2 className="auth-card-title">Welcome back</h2>
        <p className="auth-card-sub">Log in to manage your business</p>
        <form onSubmit={handleLogin}>
          <div className="auth-field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" required />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <div className="auth-divider">or</div>
        <button type="button" onClick={handleGoogle} disabled={loading} className="google-btn">
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>
        <p className="auth-footer">
          Don&apos;t have an account? <a href="/signup">Sign up free</a>
        </p>
        <div className="auth-trust">
          <div className="auth-trust-item"><div className="auth-trust-dot"></div> No credit card required</div>
          <div className="auth-trust-item"><div className="auth-trust-dot"></div> GST compliant</div>
          <div className="auth-trust-item"><div className="auth-trust-dot"></div> Built for India</div>
        </div>
      </div>
    </>
  );
}
