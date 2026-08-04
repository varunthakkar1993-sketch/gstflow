'use client';

import { useEffect, useRef, useState } from 'react';

// Tabbed product demo for the landing page. Auto-advances every 5s;
// clicking a tab pauses auto-advance for 15s so visitors can read.

const TABS = ['Invoices', 'Quotes', 'Expenses', 'GST Filing'] as const;

export default function HomeDemo() {
  const [active, setActive] = useState(0);
  const pausedUntil = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      setActive(a => (a + 1) % TABS.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const pick = (i: number) => {
    setActive(i);
    pausedUntil.current = Date.now() + 15000;
  };

  return (
    <section className="demo-section" id="demo">
      <style>{`
        .demo-section { background: #f8faff; padding: 80px 60px; }
        .demo-inner { max-width: 1100px; margin: 0 auto; }
        .demo-tabs { display: flex; gap: 8px; margin: 40px 0 28px; flex-wrap: wrap; }
        .demo-tab { position: relative; overflow: hidden; background: #fff; border: 1.5px solid #e5e9f5; color: #6b7280; padding: 10px 22px; border-radius: 10px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; }
        .demo-tab:hover { border-color: #2563eb; color: #2563eb; }
        .demo-tab.on { background: #0f1f5c; border-color: #0f1f5c; color: #fff; }
        .demo-tab.on::after { content: ''; position: absolute; left: 0; bottom: 0; height: 3px; background: #6382ff; animation: tabfill 5s linear; width: 100%; transform-origin: left; }
        @keyframes tabfill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .demo-stage { background: #fff; border: 1px solid #e5e9f5; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(15,31,92,0.06); }
        .demo-chrome { background: #0f1f5c; padding: 11px 18px; display: flex; align-items: center; gap: 7px; }
        .demo-chrome-dot { width: 9px; height: 9px; border-radius: 50%; }
        .demo-chrome-title { margin-left: 10px; font-size: 11.5px; color: rgba(255,255,255,0.55); letter-spacing: 0.4px; }
        .demo-panel { padding: 26px 28px; animation: panelin 0.35s ease; min-height: 320px; }
        @keyframes panelin { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .dp-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
        .dp-title { font-family: 'Lora', serif; font-size: 17px; font-weight: 600; color: #0f1f5c; }
        .dp-btn { background: #2563eb; color: #fff; font-size: 12px; font-weight: 600; padding: 8px 16px; border-radius: 7px; }
        .dp-btn.dark { background: #0f1f5c; }
        .dp-table { width: 100%; border: 1px solid #f0f4ff; border-radius: 10px; overflow: hidden; }
        .dp-tr { display: grid; grid-template-columns: 1.2fr 1.6fr 1fr 0.9fr; gap: 10px; padding: 11px 16px; border-bottom: 1px solid #f8faff; font-size: 13px; color: #374151; align-items: center; }
        .dp-tr.head { background: #f8faff; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        .dp-tr:last-child { border-bottom: none; }
        .dp-num { color: #2563eb; font-weight: 600; }
        .dp-amt { font-weight: 600; color: #0f1f5c; }
        .dp-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; width: fit-content; }
        .dp-badge .dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
        .dp-badge.green { background: #ecfdf5; color: #16a34a; }
        .dp-badge.blue { background: #dbeafe; color: #1d4ed8; }
        .dp-badge.amber { background: #fff7ed; color: #d97706; }
        .dp-badge.purple { background: #f5f3ff; color: #7c3aed; }
        .dp-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
        .dp-card { background: #f8faff; border: 1px solid #f0f4ff; border-radius: 10px; padding: 14px 16px; }
        .dp-card-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        .dp-card-value { font-family: 'Lora', serif; font-size: 18px; font-weight: 600; color: #0f1f5c; margin-top: 5px; }
        .dp-card-value.amber { color: #d97706; }
        .dp-band { background: linear-gradient(135deg, #0f1f5c, #1e3a8a); border-radius: 10px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
        .dp-band-label { color: rgba(255,255,255,0.7); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        .dp-band-value { color: #fff; font-family: 'Lora', serif; font-size: 20px; font-weight: 600; }
        .dp-note { font-size: 12px; color: #9ca3af; margin-top: 12px; }
        @media (max-width: 768px) {
          .demo-section { padding: 48px 20px; }
          .demo-tabs { gap: 6px; }
          .demo-tab { padding: 8px 14px; font-size: 13px; }
          .demo-panel { padding: 16px; min-height: 0; }
          .dp-cards { grid-template-columns: repeat(2, 1fr); }
          .dp-tr { grid-template-columns: 1fr 1fr; row-gap: 4px; }
          .dp-tr.head { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .demo-panel { animation: none; }
          .demo-tab.on::after { animation: none; }
        }
      `}</style>
      <div className="demo-inner">
        <div className="section-label">See it in action</div>
        <h2 className="section-title">One clean workspace for your whole business</h2>
        <p className="section-sub">Real screens from Paavti. Invoices, quotes, expenses and GST filing, all talking to each other.</p>

        <div className="demo-tabs">
          {TABS.map((t, i) => (
            <button key={t} className={`demo-tab ${active === i ? 'on' : ''}`} onClick={() => pick(i)}>{t}</button>
          ))}
        </div>

        <div className="demo-stage">
          <div className="demo-chrome">
            <div className="demo-chrome-dot" style={{ background: '#ff5f57' }} />
            <div className="demo-chrome-dot" style={{ background: '#febc2e' }} />
            <div className="demo-chrome-dot" style={{ background: '#28c840' }} />
            <div className="demo-chrome-title">paavti.com/{['dashboard', 'quotes', 'expenses', 'gstr1'][active]}</div>
          </div>

          {active === 0 && (
            <div className="demo-panel" key="p0">
              <div className="dp-head"><div className="dp-title">Invoices</div><div className="dp-btn">+ New Invoice</div></div>
              <div className="dp-cards">
                <div className="dp-card"><div className="dp-card-label">Revenue</div><div className="dp-card-value">Rs. 4,72,600</div></div>
                <div className="dp-card"><div className="dp-card-label">This Month</div><div className="dp-card-value">Rs. 88,500</div></div>
                <div className="dp-card"><div className="dp-card-label">Collected</div><div className="dp-card-value">Rs. 3,94,300</div></div>
                <div className="dp-card"><div className="dp-card-label">Pending</div><div className="dp-card-value amber">4</div></div>
              </div>
              <div className="dp-table">
                <div className="dp-tr head"><span>Invoice</span><span>Client</span><span>Amount</span><span>Status</span></div>
                <div className="dp-tr"><span className="dp-num">INV-042</span><span>Sharma Traders</span><span className="dp-amt">Rs. 23,600</span><span className="dp-badge green"><span className="dot" />Paid</span></div>
                <div className="dp-tr"><span className="dp-num">INV-041</span><span>Nova Designs</span><span className="dp-amt">Rs. 41,300</span><span className="dp-badge blue"><span className="dot" />Sent</span></div>
                <div className="dp-tr"><span className="dp-num">INV-040</span><span>Kavya Boutique</span><span className="dp-amt">Rs. 11,800</span><span className="dp-badge green"><span className="dot" />Paid</span></div>
              </div>
              <div className="dp-note">Every invoice carries your logo, bank details and a scannable UPI QR.</div>
            </div>
          )}

          {active === 1 && (
            <div className="demo-panel" key="p1">
              <div className="dp-head"><div className="dp-title">Quotes</div><div className="dp-btn">+ New Quote</div></div>
              <div className="dp-table">
                <div className="dp-tr head"><span>Quote</span><span>Client</span><span>Amount</span><span>Status</span></div>
                <div className="dp-tr"><span className="dp-num">QUO-018</span><span>Mehta &amp; Sons</span><span className="dp-amt">Rs. 65,000</span><span className="dp-badge green"><span className="dot" />Accepted</span></div>
                <div className="dp-tr"><span className="dp-num">QUO-017</span><span>Bluewater Cafe</span><span className="dp-amt">Rs. 28,500</span><span className="dp-badge blue"><span className="dot" />Sent</span></div>
                <div className="dp-tr"><span className="dp-num">QUO-016</span><span>Arjun Films</span><span className="dp-amt">Rs. 90,000</span><span className="dp-badge amber"><span className="dot" />Draft</span></div>
              </div>
              <div className="dp-band"><span className="dp-band-label">QUO-018 accepted</span><span className="dp-band-value">Convert to invoice in one click</span></div>
              <div className="dp-note">Valid-until dates, line items and status tracking built in.</div>
            </div>
          )}

          {active === 2 && (
            <div className="demo-panel" key="p2">
              <div className="dp-head"><div className="dp-title">Expenses</div><div className="dp-btn">+ Add Expense</div></div>
              <div className="dp-cards">
                <div className="dp-card"><div className="dp-card-label">Total</div><div className="dp-card-value">Rs. 1,12,400</div></div>
                <div className="dp-card"><div className="dp-card-label">This Month</div><div className="dp-card-value">Rs. 18,750</div></div>
                <div className="dp-card"><div className="dp-card-label">Outstanding</div><div className="dp-card-value amber">Rs. 9,200</div></div>
                <div className="dp-card"><div className="dp-card-label">Input Credit</div><div className="dp-card-value">Rs. 14,860</div></div>
              </div>
              <div className="dp-table">
                <div className="dp-tr head"><span>Category</span><span>Vendor</span><span>Amount</span><span>Status</span></div>
                <div className="dp-tr"><span className="dp-badge purple"><span className="dot" />Software</span><span>Adobe India</span><span className="dp-amt">Rs. 4,720</span><span className="dp-badge green"><span className="dot" />Paid</span></div>
                <div className="dp-tr"><span className="dp-badge blue"><span className="dot" />Office</span><span>Om Stationers</span><span className="dp-amt">Rs. 2,300</span><span className="dp-badge amber"><span className="dot" />Unpaid</span></div>
              </div>
              <div className="dp-note">Snap a bill photo and AI fills in the vendor, amount and GST for you.</div>
            </div>
          )}

          {active === 3 && (
            <div className="demo-panel" key="p3">
              <div className="dp-head"><div className="dp-title">GSTR-1 · July 2026</div><div style={{ display: 'flex', gap: 8 }}><div className="dp-btn dark">Download JSON</div><div className="dp-btn">Excel for CA</div></div></div>
              <div className="dp-cards">
                <div className="dp-card"><div className="dp-card-label">Taxable Value</div><div className="dp-card-value">Rs. 4,00,500</div></div>
                <div className="dp-card"><div className="dp-card-label">CGST + SGST</div><div className="dp-card-value">Rs. 72,090</div></div>
                <div className="dp-card"><div className="dp-card-label">B2B Records</div><div className="dp-card-value">12</div></div>
                <div className="dp-card"><div className="dp-card-label">Input Credit</div><div className="dp-card-value">Rs. 14,860</div></div>
              </div>
              <div className="dp-band"><span className="dp-band-label">Net GST Payable</span><span className="dp-band-value">Rs. 57,230</span></div>
              <div className="dp-note">GSTR-1 and GSTR-3B generated from your invoices and expenses. Upload the JSON to the GST portal or hand the Excel to your CA.</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
