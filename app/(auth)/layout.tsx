export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .auth-wrapper { display: flex; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
        .auth-brand { width: 44%; background: #0f1f5c; padding: 60px; display: flex; flex-direction: column; justify-content: center; color: #fff; position: relative; overflow: hidden; }
        .auth-brand::before { content: ''; position: absolute; top: -120px; right: -120px; width: 300px; height: 300px; border-radius: 50%; background: rgba(99,130,255,0.08); }
        .auth-brand::after { content: ''; position: absolute; bottom: -80px; left: -80px; width: 200px; height: 200px; border-radius: 50%; background: rgba(99,130,255,0.06); }
        .auth-logo { font-family: 'Lora', serif; font-size: 28px; font-weight: 600; margin-bottom: 4px; }
        .auth-logo span { color: #6382ff; }
        .auth-tagline { font-size: 11px; color: rgba(255,255,255,0.4); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 52px; }
        .auth-headline { font-family: 'Lora', serif; font-size: 30px; font-weight: 600; line-height: 1.35; margin-bottom: 16px; }
        .auth-subtext { font-size: 15px; color: rgba(255,255,255,0.55); line-height: 1.7; margin-bottom: 44px; }
        .auth-checks { display: flex; flex-direction: column; gap: 14px; }
        .auth-check { display: flex; align-items: center; gap: 10px; font-size: 14px; color: rgba(255,255,255,0.7); }
        .auth-check-icon { width: 20px; height: 20px; border-radius: 50%; background: rgba(74,222,128,0.15); display: flex; align-items: center; justify-content: center; font-size: 11px; color: #4ade80; flex-shrink: 0; }
        .auth-form-side { flex: 1; display: flex; align-items: center; justify-content: center; background: #f0f4ff; padding: 40px; }
        @media (max-width: 768px) {
          .auth-wrapper { flex-direction: column; }
          .auth-brand { width: 100%; padding: 36px 24px; min-height: auto; }
          .auth-headline { font-size: 22px; }
          .auth-checks { display: none; }
          .auth-form-side { padding: 24px; }
        }
      `}</style>
      <div className="auth-wrapper">
        <div className="auth-brand">
          <div>
            <div className="auth-logo">Paav<span>ti</span></div>
            <div className="auth-tagline">Business Manager</div>
          </div>
          <h1 className="auth-headline">Invoices. Quotes.<br />Expenses. All in<br />one place.</h1>
          <p className="auth-subtext">The complete business toolkit for Indian freelancers and small businesses.</p>
          <div className="auth-checks">
            <div className="auth-check"><div className="auth-check-icon">✓</div> GST compliant invoices with UPI QR</div>
            <div className="auth-check"><div className="auth-check-icon">✓</div> Send via email or WhatsApp</div>
            <div className="auth-check"><div className="auth-check-icon">✓</div> Track expenses and net profit</div>
            <div className="auth-check"><div className="auth-check-icon">✓</div> Free forever, no credit card needed</div>
          </div>
        </div>
        <div className="auth-form-side">
          {children}
        </div>
      </div>
    </>
  );
}
