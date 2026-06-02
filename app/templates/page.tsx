'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';

const templates = [
  {
    id: 1,
    name: "Freelance Service Invoice",
    desc: "For designers, developers, writers and other freelancers billing for services.",
    icon: "💼",
    color: "#eff6ff",
    params: { description: "Freelance Services", gst: "18", notes: "Thank you for your business!" },
    target: "invoice",
  },
  {
    id: 2,
    name: "GST Tax Invoice",
    desc: "Standard GST-compliant invoice with CGST, SGST and IGST breakdown.",
    icon: "📄",
    color: "#f5f3ff",
    params: { description: "Goods / Services", gst: "18", notes: "GST Invoice as per Indian tax laws." },
    target: "invoice",
  },
  {
    id: 3,
    name: "Quotation / Estimate",
    desc: "Send a professional estimate before billing. Convert to invoice in one click.",
    icon: "📝",
    color: "#f0fdf4",
    params: { description: "Project Estimate", notes: "This is a quotation only. Final invoice will follow." },
    target: "quote",
  },
  {
    id: 4,
    name: "Payment Receipt",
    desc: "Acknowledge payments received from clients with a formal receipt.",
    icon: "✅",
    color: "#dcfce7",
    params: { description: "Payment Received", gst: "0", notes: "Payment received in full. Thank you!" },
    target: "receipt",
  },
  {
    id: 5,
    name: "Proforma Invoice",
    desc: "A preliminary invoice sent before delivery of goods or services.",
    icon: "📋",
    color: "#fff7ed",
    params: { description: "Proforma Invoice", gst: "18", notes: "This is a proforma invoice and not a demand for payment." },
    target: "invoice",
  },
  {
    id: 6,
    name: "Consulting Invoice",
    desc: "For consultants billing by hour or project. Includes GST at 18%.",
    icon: "💡",
    color: "#fef9c3",
    params: { description: "Consulting Services", gst: "18", notes: "Consulting fees as agreed. Payment due within 15 days." },
    target: "invoice",
  },
];

export default function Templates() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) window.location.href = '/login';
      else setUser(currentUser);
    });
  }, []);

  const handleUse = (template: typeof templates[0]) => {
    const p = template.params as any;
    if (template.target === 'quote') {
      const qs = new URLSearchParams({ description: p.description || '', notes: p.notes || '', new: Date.now().toString() });
      window.location.href = `/quote-editor?${qs.toString()}`;
    } else if (template.target === 'receipt') {
      window.location.href = '/receipt-editor';
    } else {
      const qs = new URLSearchParams({ description: p.description || '', gst: p.gst || '18', notes: p.notes || '', new: Date.now().toString() });
      window.location.href = `/editor?${qs.toString()}`;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #f0f4ff; color: #111827; }
        .nav { display: flex; align-items: center; justify-content: space-between; padding: 0 60px; height: 64px; background: #fff; border-bottom: 1px solid #e5e9f5; }
        .nav-logo { font-family: 'Lora', serif; font-size: 20px; font-weight: 600; color: #0f1f5c; text-decoration: none; }
        .nav-logo span { color: #2563eb; }
        .nav-back { display: flex; align-items: center; gap: 6px; font-size: 13.5px; color: #6b7280; text-decoration: none; transition: color 0.15s; }
        .nav-back:hover { color: #2563eb; }
        .page { max-width: 1100px; margin: 0 auto; padding: 52px 60px 80px; }
        .page-label { font-size: 12px; color: #2563eb; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; }
        .page-title { font-family: 'Lora', serif; font-size: 34px; font-weight: 700; color: #0f1f5c; margin-bottom: 10px; }
        .page-sub { font-size: 15px; color: #6b7280; margin-bottom: 48px; line-height: 1.6; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .card { background: #fff; border: 1.5px solid #e5e9f5; border-radius: 14px; padding: 28px; transition: all 0.2s; display: flex; flex-direction: column; }
        .card:hover { border-color: #2563eb; box-shadow: 0 4px 20px rgba(37,99,235,0.08); transform: translateY(-2px); }
        .card-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 16px; }
        .card-name { font-size: 15px; font-weight: 600; color: #0f1f5c; margin-bottom: 8px; }
        .card-desc { font-size: 13px; color: #6b7280; line-height: 1.6; flex: 1; margin-bottom: 16px; }
        .card-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: #2563eb; background: #eff6ff; padding: 3px 10px; border-radius: 20px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
        .card-tag.quote { color: #16a34a; background: #f0fdf4; }
        .use-btn { width: 100%; background: #0f1f5c; color: #fff; padding: 11px; border-radius: 8px; font-size: 13.5px; font-weight: 600; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s; }
        .use-btn:hover { background: #1a2f7a; }
      `}</style>

      <nav className="nav">
        <a href="/" className="nav-logo">Paav<span>ti</span></a>
        <a href="/dashboard" className="nav-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Dashboard
        </a>
      </nav>

      <div className="page">
        <div className="page-label">Templates</div>
        <h1 className="page-title">Start from a template</h1>
        <p className="page-sub">Pick a ready-made template and get your invoice or quote ready in seconds. All fields are pre-filled — just add your client and amount.</p>

        <div className="grid">
          {templates.map((t) => (
            <div key={t.id} className="card">
              <div className="card-icon" style={{ background: t.color }}>{t.icon}</div>
              <div className="card-name">{t.name}</div>
              <div className="card-desc">{t.desc}</div>
              <div className={`card-tag ${t.target === 'quote' ? 'quote' : t.target === 'receipt' ? 'receipt' : ''}`}>
                {t.target === 'quote' ? '📝 Quote' : t.target === 'receipt' ? '✅ Receipt' : '🧾 Invoice'}
              </div>
              <button className="use-btn" onClick={() => handleUse(t)}>Use This Template →</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
