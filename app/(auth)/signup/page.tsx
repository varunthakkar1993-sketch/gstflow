'use client';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import posthog from 'posthog-js';
export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      posthog.identify(credential.user.uid, { email });
      posthog.capture('user_signed_up', { email });
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error(err);
      posthog.captureException(err);
      if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in.');
      } else {
        setError('Something went wrong. Please try again.');
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
        .auth-footer { text-align: center; margin-top: 24px; font-size: 13.5px; color: #6b7280; }
        .auth-footer a { color: #2563eb; font-weight: 500; text-decoration: none; }
        .auth-footer a:hover { text-decoration: underline; }
        .auth-trust { display: flex; justify-content: center; gap: 20px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #f0f4ff; }
        .auth-trust-item { font-size: 11.5px; color: #9ca3af; display: flex; align-items: center; gap: 4px; }
        .auth-trust-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; }
      `}</style>
      <div className="auth-card">
        <div className="auth-card-logo">Paav<span>ti</span></div>
        <h2 className="auth-card-title">Create your account</h2>
        <p className="auth-card-sub">Start creating invoices in 60 seconds</p>
        <form onSubmit={handleSignup}>
          <div className="auth-field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" required />
          </div>
          <div className="auth-field">
            <label>Password (min 6 characters)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password" required />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Creating account...' : 'Get Started Free'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <a href="/login">Log in</a>
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
