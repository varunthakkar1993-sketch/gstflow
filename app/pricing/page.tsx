'use client';

import { useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useEffect } from 'react';
import posthog from 'posthog-js';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const loadRazorpay = () => new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handlePayment = async (plan: string, billingType: string) => {
    if (!user) { window.location.href = '/signup'; return; }
    posthog.capture('upgrade_clicked', { plan, billing_type: billingType });
    setLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { alert('Failed to load payment gateway. Please try again.'); return; }

      const res = await fetch('/api/razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing: billingType }),
      });
      const { orderId, amount, currency, keyId } = await res.json();

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Paavti',
        description: `Pro ${billingType === 'lifetime' ? 'Lifetime' : billingType === 'yearly' ? 'Yearly' : 'Monthly'} Plan`,
        order_id: orderId,
        handler: async (response: any) => {
          const idToken = await auth.currentUser?.getIdToken();
          const verify = await fetch('/api/razorpay-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const result = await verify.json();
          if (result.success) {
            window.location.href = '/dashboard?upgraded=true';
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: { email: user.email },
        theme: { color: '#2563eb' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #fff; color: #111827; }
        .nav { display: flex; align-items: center; justify-content: space-between; padding: 0 60px; height: 68px; border-bottom: 1px solid #f0f4ff; background: #fff; position: sticky; top: 0; z-index: 100; }
        .nav-logo { font-family: 'Lora', serif; font-size: 22px; font-weight: 600; color: #0f1f5c; text-decoration: none; }
        .nav-logo span { color: #2563eb; }
        .nav-links { display: flex; align-items: center; gap: 32px; }
        .nav-link { font-size: 14px; color: #6b7280; text-decoration: none; transition: color 0.15s; }
        .nav-link:hover { color: #0f1f5c; }
        .nav-cta { background: #2563eb; color: #fff; padding: 9px 22px; border-radius: 8px; font-size: 14px; font-weight: 500; text-decoration: none; transition: background 0.15s; }
        .nav-cta:hover { background: #1d4ed8; }
        .pricing-hero { text-align: center; padding: 72px 60px 48px; }
        .section-label { font-size: 12px; color: #2563eb; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
        .pricing-title { font-family: 'Lora', serif; font-size: 40px; font-weight: 700; color: #0f1f5c; margin-bottom: 16px; }
        .pricing-sub { font-size: 17px; color: #6b7280; max-width: 480px; margin: 0 auto 36px; line-height: 1.7; }
        .billing-toggle { display: inline-flex; align-items: center; background: #f3f4f6; border-radius: 10px; padding: 4px; gap: 4px; margin-bottom: 56px; }
        .toggle-btn { padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; background: transparent; color: #6b7280; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .toggle-btn.active { background: #fff; color: #0f1f5c; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
        .save-badge { background: #dcfce7; color: #16a34a; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; margin-left: 6px; }
        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1000px; margin: 0 auto; padding: 0 60px 80px; align-items: start; }
        .plan-card { background: #fff; border: 1.5px solid #e5e9f5; border-radius: 16px; padding: 32px; transition: all 0.2s; position: relative; }
        .plan-card:hover { box-shadow: 0 8px 32px rgba(37,99,235,0.08); }
        .plan-card.featured { border-color: #2563eb; box-shadow: 0 8px 32px rgba(37,99,235,0.12); }
        .popular-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: #2563eb; color: #fff; font-size: 11.5px; font-weight: 600; padding: 4px 16px; border-radius: 20px; white-space: nowrap; }
        .ltd-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: #0f1f5c; color: #fff; font-size: 11.5px; font-weight: 600; padding: 4px 16px; border-radius: 20px; white-space: nowrap; }
        .plan-name { font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
        .plan-price { font-family: 'Lora', serif; font-size: 38px; font-weight: 700; color: #0f1f5c; line-height: 1; margin-bottom: 4px; }
        .plan-price span { font-size: 16px; font-weight: 500; color: #9ca3af; font-family: 'DM Sans', sans-serif; }
        .plan-desc { font-size: 13.5px; color: #6b7280; margin-bottom: 24px; line-height: 1.5; margin-top: 8px; }
        .plan-divider { height: 1px; background: #f0f4ff; margin-bottom: 24px; }
        .features-list { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; }
        .feature-item { display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px; color: #374151; line-height: 1.4; }
        .feature-item.disabled { color: #9ca3af; }
        .check { width: 18px; height: 18px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
        .cross { width: 18px; height: 18px; border-radius: 50%; background: #f3f4f6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
        .plan-btn { width: 100%; padding: 12px; border-radius: 9px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; transition: all 0.15s; text-decoration: none; display: block; text-align: center; }
        .plan-btn.outline { background: #fff; color: #0f1f5c; border: 1.5px solid #e5e9f5; }
        .plan-btn.outline:hover { border-color: #2563eb; color: #2563eb; }
        .plan-btn.primary { background: #2563eb; color: #fff; }
        .plan-btn.primary:hover { background: #1d4ed8; }
        .plan-btn.dark { background: #0f1f5c; color: #fff; }
        .plan-btn.dark:hover { background: #1a2f7a; }
        .plan-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .yearly-note { font-size: 12px; color: #16a34a; text-align: center; margin-top: 10px; font-weight: 500; }
        .faq { max-width: 640px; margin: 0 auto; padding: 0 60px 80px; }
        .faq-title { font-family: 'Lora', serif; font-size: 26px; font-weight: 700; color: #0f1f5c; margin-bottom: 32px; text-align: center; }
        .faq-item { border-bottom: 1px solid #f0f4ff; padding: 20px 0; }
        .faq-q { font-size: 15px; font-weight: 600; color: #0f1f5c; margin-bottom: 8px; }
        .faq-a { font-size: 14px; color: #6b7280; line-height: 1.7; }
        .footer { border-top: 1px solid #f0f4ff; padding: 32px 60px; display: flex; align-items: center; justify-content: space-between; }
        .footer-logo { font-family: 'Lora', serif; font-size: 18px; font-weight: 600; color: #0f1f5c; }
        .footer-copy { font-size: 13px; color: #9ca3af; }
        .footer-links { display: flex; gap: 24px; }
        .footer-link { font-size: 13px; color: #9ca3af; text-decoration: none; }
        .footer-link:hover { color: #2563eb; }
      `}</style>

      <nav className="nav">
        <a href="/" className="nav-logo">Paav<span>ti</span></a>
        <div className="nav-links">
          <a href="/#features" className="nav-link">Features</a>
          <a href="/#how-it-works" className="nav-link">How it works</a>
          <a href="/pricing" className="nav-link" style={{ color: '#0f1f5c', fontWeight: 500 }}>Pricing</a>
          <a href="/login" className="nav-link">Login</a>
          <a href="/signup" className="nav-cta">Start Free</a>
        </div>
      </nav>

      <div className="pricing-hero">
        <div className="section-label">Pricing</div>
        <h1 className="pricing-title">Simple, honest pricing</h1>
        <p className="pricing-sub">Start free, upgrade when you are ready. No hidden charges, no surprises.</p>
        <div className="billing-toggle">
          <button className={`toggle-btn ${billing === 'monthly' ? 'active' : ''}`} onClick={() => setBilling('monthly')}>Monthly</button>
          <button className={`toggle-btn ${billing === 'yearly' ? 'active' : ''}`} onClick={() => setBilling('yearly')}>
            Yearly <span className="save-badge">Save 30%</span>
          </button>
        </div>
      </div>

      <div className="pricing-grid">
        <div className="plan-card">
          <div className="plan-name">Free</div>
          <div className="plan-price">Rs. 0 <span>/ forever</span></div>
          <div className="plan-desc">Perfect for freelancers just getting started.</div>
          <div className="plan-divider" />
          <ul className="features-list">
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>5 invoices per month</li>
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>5 quotes per month</li>
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>GST compliant PDFs</li>
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>UPI QR code</li>
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>3 clients</li>
            <li className="feature-item disabled"><span className="cross"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/></svg></span>Custom logo on invoices</li>
            <li className="feature-item disabled"><span className="cross"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/></svg></span>Expense tracker</li>
            <li className="feature-item disabled"><span className="cross"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/></svg></span>WhatsApp sharing</li>
            <li className="feature-item disabled"><span className="cross"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/></svg></span>Business dashboard</li>
          </ul>
          <a href="/signup" className="plan-btn outline">Get Started Free</a>
        </div>

        <div className="plan-card featured">
          <div className="popular-badge">Most Popular</div>
          <div className="plan-name">Pro</div>
          <div className="plan-price">{billing === 'monthly' ? 'Rs. 299' : 'Rs. 208'} <span>/ month</span></div>
          <div className="plan-desc">{billing === 'yearly' ? 'Billed Rs. 2,499/year.' : 'Billed monthly.'}</div>
          <div className="plan-divider" />
          <ul className="features-list">
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>Unlimited invoices</li>
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>Unlimited quotes</li>
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>GST compliant PDFs</li>
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>UPI QR code</li>
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>Unlimited clients</li>
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>Custom logo on invoices</li>
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>Expense tracker</li>
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>WhatsApp sharing</li>
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>Business dashboard</li>
          </ul>
          <button className="plan-btn primary" disabled={loading} onClick={() => handlePayment('pro', billing)}>
            {loading ? 'Processing...' : 'Get Pro Plan'}
          </button>
          {billing === 'yearly' && <div className="yearly-note">You save Rs. 1,089 a year</div>}
        </div>

        <div className="plan-card">
          <div className="ltd-badge">Limited Time</div>
          <div className="plan-name">Lifetime</div>
          <div className="plan-price">Rs. 5,999 <span>/ once</span></div>
          <div className="plan-desc">Pay once, use forever. Lock in before price goes up.</div>
          <div className="plan-divider" />
          <ul className="features-list">
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>Everything in Pro</li>
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>Lifetime access, no renewals</li>
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>All future updates included</li>
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>Priority support</li>
            <li className="feature-item"><span className="check"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>Founding member status</li>
          </ul>
          <button className="plan-btn dark" disabled={loading} onClick={() => handlePayment('pro', 'lifetime')}>
            {loading ? 'Processing...' : 'Get Lifetime Access'}
          </button>
          <div className="yearly-note" style={{ color: '#6b7280' }}>Equivalent to ~20 months of Pro</div>
        </div>
      </div>

      <div className="faq">
        <div className="faq-title">Frequently asked questions</div>
        <div className="faq-item">
          <div className="faq-q">Is Paavti really free?</div>
          <div className="faq-a">Yes. The free plan is free forever, no credit card needed. You get 5 invoices and 5 quotes per month, which is enough to get started.</div>
        </div>
        <div className="faq-item">
          <div className="faq-q">Can I upgrade or cancel anytime?</div>
          <div className="faq-a">Yes. Upgrade to Pro anytime and cancel whenever you want. No lock-ins, no cancellation fees.</div>
        </div>
        <div className="faq-item">
          <div className="faq-q">What payment methods do you accept?</div>
          <div className="faq-a">We accept UPI, credit/debit cards, and net banking. All major Indian payment methods accepted.</div>
        </div>
        <div className="faq-item">
          <div className="faq-q">What is the Lifetime Deal?</div>
          <div className="faq-a">Pay once and get Pro access forever. This is a limited early adopter offer. Price will go up once we hit capacity. All future features included.</div>
        </div>
        <div className="faq-item">
          <div className="faq-q">Is my data safe?</div>
          <div className="faq-a">All data is stored securely on Firebase with encryption. We never share your business data with anyone.</div>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-logo">Paavti</div>
        <div className="footer-copy">© 2026 Paavti. Built for India.</div>
        <div className="footer-links">
          <a href="/login" className="footer-link">Login</a>
          <a href="/signup" className="footer-link">Sign Up</a>
        </div>
      </footer>
    </>
  );
}
