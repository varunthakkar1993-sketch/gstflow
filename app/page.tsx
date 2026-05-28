import Link from 'next/link';

export default function Home() {
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
        .hero { padding: 96px 60px 80px; max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .hero-badge { display: inline-flex; align-items: center; gap: 6px; background: #eff6ff; color: #2563eb; padding: 5px 12px; border-radius: 20px; font-size: 12.5px; font-weight: 500; margin-bottom: 20px; border: 1px solid #dbeafe; }
        .hero-title { font-family: 'Lora', serif; font-size: 48px; font-weight: 700; color: #0f1f5c; line-height: 1.15; margin-bottom: 20px; letter-spacing: -0.5px; }
        .hero-title span { color: #2563eb; }
        .hero-sub { font-size: 17px; color: #6b7280; line-height: 1.7; margin-bottom: 36px; }
        .hero-actions { display: flex; gap: 12px; align-items: center; }
        .btn-hero-primary { background: #2563eb; color: #fff; padding: 13px 28px; border-radius: 9px; font-size: 15px; font-weight: 600; text-decoration: none; transition: background 0.15s; }
        .btn-hero-primary:hover { background: #1d4ed8; }
        .btn-hero-secondary { color: #374151; padding: 13px 24px; border-radius: 9px; font-size: 15px; font-weight: 500; text-decoration: none; border: 1.5px solid #e5e9f5; transition: all 0.15s; }
        .btn-hero-secondary:hover { border-color: #2563eb; color: #2563eb; }
        .hero-trust { display: flex; align-items: center; gap: 20px; margin-top: 28px; }
        .trust-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #9ca3af; }
        .trust-dot { width: 6px; height: 6px; background: #16a34a; border-radius: 50%; }
        .hero-visual { background: #f8faff; border-radius: 16px; border: 1px solid #e5e9f5; overflow: hidden; }
        .mock-header { background: #0f1f5c; padding: 12px 20px; display: flex; align-items: center; gap: 8px; }
        .mock-dot { width: 10px; height: 10px; border-radius: 50%; }
        .mock-body { padding: 20px; }
        .mock-inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .mock-biz { font-family: 'Lora', serif; font-size: 15px; font-weight: 600; color: #0f1f5c; }
        .mock-biz-sub { font-size: 11px; color: #9ca3af; margin-top: 2px; }
        .mock-inv-label { font-size: 18px; font-weight: 700; color: #0f1f5c; text-align: right; }
        .mock-inv-num { font-size: 11px; color: #9ca3af; text-align: right; }
        .mock-divider { height: 1px; background: #e5e9f5; margin: 12px 0; }
        .mock-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; }
        .mock-row-label { color: #6b7280; }
        .mock-row-value { color: #111827; font-weight: 500; }
        .mock-total { display: flex; justify-content: space-between; padding: 10px 0 0; border-top: 2px solid #0f1f5c; margin-top: 8px; }
        .mock-total-label { font-size: 13px; font-weight: 600; color: #0f1f5c; }
        .mock-total-value { font-family: 'Lora', serif; font-size: 18px; font-weight: 700; color: #2563eb; }
        .mock-qr { width: 52px; height: 52px; background: #e5e9f5; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-top: 12px; }
        .mock-qr-inner { width: 36px; height: 36px; background: repeating-linear-gradient(45deg, #9ca3af 0px, #9ca3af 2px, transparent 2px, transparent 6px); border-radius: 2px; }
        .stats-bar { background: #0f1f5c; padding: 32px 60px; }
        .stats-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .stat-item { text-align: center; }
        .stat-num { font-family: 'Lora', serif; font-size: 28px; font-weight: 700; color: #fff; }
        .stat-label { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 4px; }
        .features { padding: 80px 60px; max-width: 1100px; margin: 0 auto; }
        .section-label { font-size: 12px; color: #2563eb; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
        .section-title { font-family: 'Lora', serif; font-size: 34px; font-weight: 700; color: #0f1f5c; margin-bottom: 16px; }
        .section-sub { font-size: 16px; color: #6b7280; max-width: 520px; line-height: 1.7; margin-bottom: 52px; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .feature-card { background: #fff; border: 1px solid #e5e9f5; border-radius: 12px; padding: 28px; transition: all 0.2s; }
        .feature-card:hover { border-color: #2563eb; box-shadow: 0 4px 20px rgba(37,99,235,0.08); transform: translateY(-2px); }
        .feature-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .feature-title { font-size: 15px; font-weight: 600; color: #0f1f5c; margin-bottom: 8px; }
        .feature-desc { font-size: 14px; color: #6b7280; line-height: 1.6; }
        .how-it-works { background: #f8faff; padding: 80px 60px; }
        .how-inner { max-width: 1100px; margin: 0 auto; }
        .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; margin-top: 48px; }
        .step { text-align: center; }
        .step-num { width: 40px; height: 40px; background: #2563eb; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; margin: 0 auto 16px; font-family: 'Lora', serif; }
        .step-title { font-size: 16px; font-weight: 600; color: #0f1f5c; margin-bottom: 8px; }
        .step-desc { font-size: 14px; color: #6b7280; line-height: 1.6; }
        .step-connector { display: none; }
        .cta-section { padding: 80px 60px; max-width: 1100px; margin: 0 auto; text-align: center; }
        .cta-box { background: #0f1f5c; border-radius: 20px; padding: 64px; }
        .cta-title { font-family: 'Lora', serif; font-size: 36px; font-weight: 700; color: #fff; margin-bottom: 16px; }
        .cta-sub { font-size: 16px; color: rgba(255,255,255,0.6); margin-bottom: 36px; }
        .btn-cta { background: #2563eb; color: #fff; padding: 14px 32px; border-radius: 9px; font-size: 15px; font-weight: 600; text-decoration: none; display: inline-block; transition: background 0.15s; }
        .btn-cta:hover { background: #1d4ed8; }
        .cta-note { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 16px; }
        .footer { border-top: 1px solid #f0f4ff; padding: 32px 60px; display: flex; align-items: center; justify-content: space-between; }
        .footer-logo { font-family: 'Lora', serif; font-size: 18px; font-weight: 600; color: #0f1f5c; }
        .footer-copy { font-size: 13px; color: #9ca3af; }
        .footer-links { display: flex; gap: 24px; }
        .footer-link { font-size: 13px; color: #9ca3af; text-decoration: none; }
        .footer-link:hover { color: #2563eb; }
      `}</style>

      <nav className="nav">
        <a href="/" className="nav-logo">GST<span>Flow</span></a>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How it works</a>
          <a href="/login" className="nav-link">Login</a>
          <a href="/signup" className="nav-cta">Start Free</a>
        </div>
      </nav>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 60px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
        <div>
          <div className="hero-badge">
            <div className="trust-dot" />
            Built for Indian Freelancers & Businesses
          </div>
          <h1 className="hero-title">
            GST Invoices in <span>60 seconds.</span> Not 60 minutes.
          </h1>
          <p className="hero-sub">
            Create professional GST-compliant invoices with automatic CGST/SGST/IGST calculations, UPI QR code, and instant PDF download.
          </p>
          <div className="hero-actions">
            <a href="/signup" className="btn-hero-primary">Create Free Invoice →</a>
            <a href="/login" className="btn-hero-secondary">Login</a>
          </div>
          <div className="hero-trust">
            <div className="trust-item"><div className="trust-dot" /> No credit card required</div>
            <div className="trust-item"><div className="trust-dot" /> GST compliant</div>
            <div className="trust-item"><div className="trust-dot" /> Free forever</div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="mock-header">
            <div className="mock-dot" style={{ background: '#ff5f57' }} />
            <div className="mock-dot" style={{ background: '#febc2e' }} />
            <div className="mock-dot" style={{ background: '#28c840' }} />
          </div>
          <div className="mock-body">
            <div className="mock-inv-header">
              <div>
                <div className="mock-biz">Clarvit Technologies</div>
                <div className="mock-biz-sub">GSTIN: 27AAABC1234D1Z5</div>
                <div className="mock-biz-sub">Mumbai, Maharashtra</div>
              </div>
              <div>
                <div className="mock-inv-label">INVOICE</div>
                <div className="mock-inv-num">INV-007 · 28 May 2026</div>
              </div>
            </div>
            <div className="mock-divider" />
            <div className="mock-row"><span className="mock-row-label">Client</span><span className="mock-row-value">Manifest.ai</span></div>
            <div className="mock-row"><span className="mock-row-label">Description</span><span className="mock-row-value">Web Development</span></div>
            <div className="mock-divider" />
            <div className="mock-row"><span className="mock-row-label">Subtotal</span><span className="mock-row-value">Rs. 5,000</span></div>
            <div className="mock-row"><span className="mock-row-label">CGST 9%</span><span className="mock-row-value">Rs. 450</span></div>
            <div className="mock-row"><span className="mock-row-label">SGST 9%</span><span className="mock-row-value">Rs. 450</span></div>
            <div className="mock-total">
              <span className="mock-total-label">Total</span>
              <span className="mock-total-value">Rs. 5,900</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <div className="mock-qr"><div className="mock-qr-inner" /></div>
              <div>
                <div style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>Pay via UPI</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>business@okaxis</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="stats-bar">
        <div className="stats-inner">
          <div className="stat-item"><div className="stat-num">1.4 Cr+</div><div className="stat-label">GST registered businesses in India</div></div>
          <div className="stat-item"><div className="stat-num">60 sec</div><div className="stat-label">Average invoice creation time</div></div>
          <div className="stat-item"><div className="stat-num">100%</div><div className="stat-label">GST compliant invoices</div></div>
          <div className="stat-item"><div className="stat-num">Free</div><div className="stat-label">No hidden charges</div></div>
        </div>
      </div>

      <section id="features" className="features">
        <div className="section-label">Features</div>
        <h2 className="section-title">Everything you need to invoice professionally</h2>
        <p className="section-sub">Built specifically for Indian freelancers and small businesses who need GST compliance without the complexity.</p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ background: '#eff6ff' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div className="feature-title">Auto GST Calculation</div>
            <div className="feature-desc">Automatic CGST, SGST, and IGST calculation based on transaction type. Supports all GST slabs — 0%, 5%, 12%, 18%, 28%.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: '#f0fdf4' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <div className="feature-title">UPI QR Code</div>
            <div className="feature-desc">Scannable UPI QR code embedded directly in your invoice. Clients can pay instantly with any UPI app — PhonePe, GPay, Paytm.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: '#fff7ed' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
            <div className="feature-title">Instant PDF Download</div>
            <div className="feature-desc">Download a professional PDF invoice in one click. Share via email or WhatsApp directly from the app.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: '#f5f3ff' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div className="feature-title">Business Profile</div>
            <div className="feature-desc">Save your business details once — GSTIN, address, bank account, UPI ID. Auto-fills every invoice you create.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: '#fff1f2' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div className="feature-title">Email to Client</div>
            <div className="feature-desc">Send the invoice PDF directly to your client's inbox with one click. Professional email template included.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: '#f0fdf4' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div className="feature-title">Invoice Dashboard</div>
            <div className="feature-desc">Track all your invoices, total revenue, and monthly billing in a clean dashboard. Never lose an invoice again.</div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-it-works">
        <div className="how-inner">
          <div className="section-label">How it works</div>
          <h2 className="section-title">Invoice ready in 3 simple steps</h2>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-title">Set up your profile</div>
              <div className="step-desc">Enter your business name, GSTIN, address, and bank details once. We save everything securely.</div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-title">Fill in client details</div>
              <div className="step-desc">Enter client name, address, and select the right GST slab. Our system calculates taxes automatically.</div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-title">Download & share</div>
              <div className="step-desc">Get a professional PDF with UPI QR code. Email it directly or share via WhatsApp in seconds.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-box">
          <h2 className="cta-title">Start creating GST invoices for free</h2>
          <p className="cta-sub">Join thousands of Indian freelancers and businesses who invoice professionally with GSTFlow.</p>
          <a href="/signup" className="btn-cta">Create Your First Invoice →</a>
          <div className="cta-note">No credit card required · Free forever</div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-logo">GSTFlow</div>
        <div className="footer-copy">© 2026 GSTFlow. Built for India.</div>
        <div className="footer-links">
          <a href="/login" className="footer-link">Login</a>
          <a href="/signup" className="footer-link">Sign Up</a>
        </div>
      </footer>
    </>
  );
}
