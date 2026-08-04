'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import posthog from 'posthog-js';
import { buildGstr3b, Gstr3bResult } from '../../lib/gstr3b';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Gstr3bPage() {
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [result, setResult] = useState<Gstr3bResult | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { window.location.href = '/login'; return; }
      setUser(currentUser);
      const profileSnap = await getDoc(doc(db, 'profiles', currentUser.uid));
      if (profileSnap.exists()) setProfile(profileSnap.data());
    });
  }, []);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const iq = query(collection(db, 'invoices'), where('userId', '==', user.uid));
      const isnap = await getDocs(iq);
      const monthInvoices = isnap.docs.map(d => d.data() as any).filter((inv: any) => {
        if (!inv.date) return false;
        const dt = new Date(inv.date);
        return dt.getMonth() === month && dt.getFullYear() === year;
      });
      const eq2 = query(collection(db, 'expenses'), where('userId', '==', user.uid));
      const esnap = await getDocs(eq2);
      const monthExpenses = esnap.docs.map(d => d.data() as any).filter((exp: any) => {
        if (!exp.date) return false;
        const dt = new Date(exp.date);
        return dt.getMonth() === month && dt.getFullYear() === year;
      });
      const cq = query(collection(db, 'creditNotes'), where('userId', '==', user.uid));
      const csnap = await getDocs(cq);
      const monthCredits = csnap.docs.map(d => d.data() as any).filter((cn: any) => {
        if (!cn.date) return false;
        const dt = new Date(cn.date);
        return dt.getMonth() === month && dt.getFullYear() === year;
      });
      const r = buildGstr3b(monthInvoices, monthExpenses, month, year, monthCredits);
      setResult(r);
      setFetched(true);
      posthog.capture('gstr3b_previewed', { month: MONTHS[month], year, net: r.net.total, invoices: r.counts.invoices, expenses: r.counts.expenses });
    } catch (err) {
      console.error(err);
      alert('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const inr = (n: number) => `Rs. ${n.toLocaleString('en-IN')}`;

  const downloadPDF = async () => {
    if (!result) return;
    setGenerating(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();

      pdf.setFillColor(15, 31, 92);
      pdf.rect(0, 0, pw, 38, 'F');
      if (profile?.logoBase64) {
        try {
          const ext = profile.logoBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
          pdf.addImage(profile.logoBase64, ext, 12, 7, 0, 24);
        } catch (e) {}
      }
      pdf.setFontSize(18); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255, 255, 255);
      pdf.text('GSTR-3B SUMMARY', pw - 14, 20, { align: 'right' });
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(180, 195, 230);
      pdf.text(`${result.period}  (${result.fp})`, pw - 14, 28, { align: 'right' });

      let y = 48;
      pdf.setFontSize(12); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15, 31, 92);
      pdf.text(profile?.businessName || 'Your Business', 14, y); y += 5;
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 110, 130);
      if (profile?.gstin) { pdf.text(`GSTIN: ${profile.gstin}`, 14, y); y += 4; }
      y += 4;
      pdf.setDrawColor(37, 99, 235); pdf.setLineWidth(0.5); pdf.line(14, y, pw - 14, y); y += 10;

      const row = (label: string, vals: string[], bold = false) => {
        if (y > ph - 24) { pdf.addPage(); y = 20; }
        pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(8.5);
        pdf.setTextColor(bold ? 15 : 60, bold ? 31 : 70, bold ? 92 : 90);
        pdf.text(label, 16, y);
        const cols = [pw - 120, pw - 86, pw - 52, pw - 16];
        vals.forEach((v, i) => pdf.text(v, cols[i], y, { align: 'right' }));
        y += 6;
      };
      const head = (t: string) => {
        y += 2;
        pdf.setFillColor(240, 244, 255); pdf.rect(14, y - 4, pw - 28, 8, 'F');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(15, 31, 92);
        pdf.text(t, 16, y + 1.5);
        y += 4;
        pdf.setFontSize(7); pdf.setTextColor(120, 130, 150);
        pdf.text('IGST', pw - 120, y + 3.5, { align: 'right' });
        pdf.text('CGST', pw - 86, y + 3.5, { align: 'right' });
        pdf.text('SGST', pw - 52, y + 3.5, { align: 'right' });
        pdf.text('TOTAL', pw - 16, y + 3.5, { align: 'right' });
        y += 8;
      };

      head('3.1(a) Outward taxable supplies');
      row('Taxable value', ['', '', '', inr(result.outward.taxableValue)]);
      row('Tax', [inr(result.outward.igst), inr(result.outward.cgst), inr(result.outward.sgst), inr(result.outward.totalTax)], true);
      if (result.nilExempt.taxableValue > 0) {
        y += 2;
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(60, 70, 90);
        pdf.text(`3.1(c) Nil-rated / exempt outward supplies (taxable value): ${inr(result.nilExempt.taxableValue)}`, 16, y); y += 6;
      }

      head('4. Eligible ITC');
      row('ITC available', [inr(result.itc.igst), inr(result.itc.cgst), inr(result.itc.sgst), inr(result.itc.total)], true);

      head('5. Net tax payable');
      row('Payable', [inr(result.net.igst), inr(result.net.cgst), inr(result.net.sgst), inr(result.net.total)], true);

      y += 6;
      if (y > ph - 30) { pdf.addPage(); y = 20; }
      pdf.setFillColor(15, 31, 92); pdf.rect(14, y, pw - 28, 16, 'F');
      pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255, 255, 255);
      pdf.text('NET GST PAYABLE', 20, y + 10);
      pdf.text(inr(result.net.total), pw - 20, y + 10, { align: 'right' });
      y += 24;

      pdf.setFontSize(7); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(150, 150, 150);
      result.warnings.forEach(w => { if (y > ph - 16) { pdf.addPage(); y = 20; } pdf.text(`Note: ${w.message}`, 16, y, { maxWidth: pw - 32 }); y += 8; });

      pdf.setFillColor(240, 244, 255); pdf.rect(0, ph - 12, pw, 12, 'F');
      pdf.setFontSize(7); pdf.setTextColor(100, 110, 130);
      pdf.text(`GSTR-3B Summary: ${result.period}`, 14, ph - 5);
      pdf.text('Generated with Paavti.in', pw - 14, ph - 5, { align: 'right' });

      pdf.save(`Paavti-GSTR3B-${result.fp}.pdf`);
      posthog.capture('gstr3b_pdf_downloaded', { fp: result.fp });
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f4ff; }
        .editor-root { display: flex; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
        .sidebar { width: 240px; background: #0f1f5c; min-height: 100vh; display: flex; flex-direction: column; position: fixed; left: 0; top: 0; bottom: 0; z-index: 10; }
        .sidebar-logo { padding: 28px 24px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .sidebar-logo h1 { font-family: 'Lora', serif; font-size: 22px; color: #fff; font-weight: 600; }
        .sidebar-logo p { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; letter-spacing: 0.5px; text-transform: uppercase; }
        .sidebar-nav { padding: 20px 12px; flex: 1; }
        .nav-label { font-size: 10px; color: rgba(255,255,255,0.3); letter-spacing: 1px; text-transform: uppercase; padding: 0 12px; margin-bottom: 8px; margin-top: 16px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; color: rgba(255,255,255,0.6); font-size: 13.5px; text-decoration: none; transition: all 0.15s; }
        .nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .nav-item.active { background: rgba(99,130,255,0.2); color: #fff; font-weight: 500; }
        .sidebar-footer { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.08); }
        .user-chip { display: flex; align-items: center; gap: 10px; padding: 8px 12px; }
        .user-avatar { width: 32px; height: 32px; background: linear-gradient(135deg, #6382ff, #3b5bdb); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 600; flex-shrink: 0; }
        .user-email { font-size: 11.5px; color: rgba(255,255,255,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .main { margin-left: 240px; flex: 1; padding: 36px 40px; }
        .page-header { margin-bottom: 20px; }
        .page-header h2 { font-family: 'Lora', serif; font-size: 26px; color: #0f1f5c; font-weight: 600; }
        .page-header p { color: #6b7280; font-size: 14px; margin-top: 4px; }
        .tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1.5px solid #e5e9f5; }
        .tab { padding: 10px 18px; font-size: 14px; font-weight: 600; color: #6b7280; text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -1.5px; }
        .tab.active { color: #2563eb; border-bottom-color: #2563eb; }
        .tab:hover { color: #2563eb; }
        .controls { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; flex-wrap: wrap; }
        .controls select { padding: 10px 14px; border: 1.5px solid #e5e9f5; border-radius: 8px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #111827; background: #fff; outline: none; }
        .controls select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .btn-fetch { background: #2563eb; color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; }
        .btn-fetch:hover { background: #1d4ed8; }
        .btn-fetch:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-download { background: #0f1f5c; color: #fff; border: none; padding: 13px 28px; border-radius: 9px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 24px; }
        .btn-download:hover { background: #1a2f7a; }
        .btn-download:disabled { opacity: 0.6; cursor: not-allowed; }
        .net-band { background: linear-gradient(135deg, #0f1f5c, #1e3a8a); border-radius: 12px; padding: 24px 28px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
        .net-band .lbl { color: rgba(255,255,255,0.7); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        .net-band .val { color: #fff; font-family: 'Lora', serif; font-size: 30px; font-weight: 600; }
        .net-band .sub { color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 4px; }
        .card { background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; overflow: hidden; margin-bottom: 20px; }
        .card-header { padding: 16px 24px; border-bottom: 1px solid #f0f4ff; }
        .card-header h3 { font-size: 14px; font-weight: 600; color: #0f1f5c; }
        .card-header span { font-size: 12px; color: #9ca3af; display: block; margin-top: 2px; }
        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 16px; text-align: right; background: #f8faff; border-bottom: 1px solid #f0f4ff; }
        th:first-child { text-align: left; }
        td { font-size: 13px; color: #374151; padding: 12px 16px; border-bottom: 1px solid #f8faff; text-align: right; }
        td:first-child { text-align: left; }
        .total-row td { font-weight: 600; color: #0f1f5c; background: #f8faff; }
        .no-data { text-align: center; padding: 60px 20px; color: #9ca3af; font-size: 15px; }
        .warn-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; }
        .warn-box h4 { font-size: 13px; color: #92400e; font-weight: 600; margin-bottom: 8px; }
        .warn-box ul { margin: 0; padding-left: 18px; }
        .warn-box li { font-size: 12.5px; color: #92400e; margin-bottom: 4px; }
        .menu-toggle { display: none; background: none; border: none; color: #ffffff; font-size: 30px; cursor: pointer; padding: 4px 8px; }
        @media (max-width: 768px) {
          .editor-root { flex-direction: column; }
          .sidebar { width: 100% !important; min-height: auto !important; position: relative !important; flex-direction: row !important; flex-wrap: wrap !important; align-items: center; top: auto !important; bottom: auto !important; left: auto !important; height: auto !important; z-index: auto !important; }
          .sidebar-logo { display: flex !important; align-items: center; width: 100%; gap: 12px; padding: 12px 16px !important; border-bottom: none; }
          .sidebar-logo p { display: none; }
          .sidebar-logo img { height: 42px !important; }
          .menu-toggle { display: block !important; margin-left: auto; font-size: 32px; color: #ffffff !important; }
          .sidebar-nav { display: none !important; flex-direction: column; padding: 0 12px 12px; gap: 2px; width: 100%; }
          .sidebar-nav.nav-open { display: flex !important; }
          .nav-label { display: none; }
          .nav-item { padding: 12px 14px; font-size: 15px; }
          .sidebar-footer { display: none; }
          .main { margin-left: 0 !important; padding: 16px !important; width: 100% !important; }
          .page-header h2 { font-size: 22px; }
          .controls { flex-direction: column; align-items: stretch; }
          .controls select, .controls button { width: 100%; }
          .net-band { flex-direction: column; align-items: flex-start; gap: 8px; }
          table { font-size: 12px; }
          th { font-size: 10px; padding: 8px 10px; }
          td { font-size: 12.5px; padding: 10px; }
        }
      `}</style>

      <div className="editor-root">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img src="/logo-white.svg" alt="Paavti" style={{ height: '38px' }} />
            <p>Business Manager</p>
            <button className="menu-toggle" onClick={() => setShowMenu(!showMenu)}>&#9776;</button>
          </div>
          <nav className={`sidebar-nav ${showMenu ? 'nav-open' : ''}`}>
            <div className="nav-label">Main</div>
            <a href="/dashboard" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Dashboard</a>
            <a href="/editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>New Invoice</a>
            <a href="/quote-editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>New Quote</a>
            <a href="/receipt-editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>New Receipt</a>
            <a href="/reports" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>Reports</a>
            <a href="/gstr1" className="nav-item active"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>GST Filing</a>
            <div className="nav-label">Documents</div>
            <a href="/dashboard" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>Invoices</a>
            <a href="/quotes" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Quotes</a>
            <a href="/expenses" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Expenses</a>
            <a href="/clients" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Clients</a>
            <div className="nav-label">Settings</div>
            <a href="/profile" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Business Profile</a>
            <a href="/templates" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>Templates</a>
          </nav>
          <div className="sidebar-footer">
            <div className="user-chip">
              <div className="user-avatar">{user?.email?.[0]?.toUpperCase()}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="page-header">
            <h2>GST Filing</h2>
            <p>Prepare your monthly GST returns from your invoices and expenses.</p>
          </div>

          <div className="tabs">
            <a href="/gstr1" className="tab">GSTR-1 (Sales)</a>
            <a href="/gstr3b" className="tab active">GSTR-3B (Summary)</a>
          </div>

          <div className="controls">
            <select value={month} onChange={e => { setMonth(parseInt(e.target.value)); setFetched(false); }}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={year} onChange={e => { setYear(parseInt(e.target.value)); setFetched(false); }}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn-fetch" onClick={fetchData} disabled={loading}>
              {loading ? 'Loading...' : 'Prepare GSTR-3B'}
            </button>
          </div>

          {!fetched || !result ? (
            <div className="no-data">Select a period and click Prepare GSTR-3B.</div>
          ) : (result.counts.invoices === 0 && result.counts.expenses === 0) ? (
            <div className="no-data">No invoices or expenses found for {result.period}.</div>
          ) : (
            <>
              <div className="net-band">
                <div>
                  <div className="lbl">Net GST Payable</div>
                  <div className="sub">{result.period} · {result.counts.invoices} invoices · {result.counts.expenses} expenses</div>
                </div>
                <div className="val">{result.net.total < 0 ? `(${inr(Math.abs(result.net.total))} credit)` : inr(result.net.total)}</div>
              </div>

              <button className="btn-download" onClick={downloadPDF} disabled={generating}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {generating ? 'Generating...' : 'Download PDF'}
              </button>

              {result.warnings.length > 0 && (
                <div className="warn-box">
                  <h4>Notes for your CA</h4>
                  <ul>{result.warnings.map((w, i) => <li key={i}>{w.message}</li>)}</ul>
                </div>
              )}

              <div className="card">
                <div className="card-header"><h3>3.1 Outward Supplies (Output Tax)</h3><span>Tax you collected on sales</span></div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Nature</th><th>Taxable Value</th><th>IGST</th><th>CGST</th><th>SGST</th></tr></thead>
                    <tbody>
                      <tr><td>(a) Taxable supplies</td><td>{inr(result.outward.taxableValue)}</td><td>{inr(result.outward.igst)}</td><td>{inr(result.outward.cgst)}</td><td>{inr(result.outward.sgst)}</td></tr>
                      <tr><td>(c) Nil-rated / exempt</td><td>{inr(result.nilExempt.taxableValue)}</td><td>—</td><td>—</td><td>—</td></tr>
                      <tr className="total-row"><td>Total output tax</td><td>—</td><td>{inr(result.outward.igst)}</td><td>{inr(result.outward.cgst)}</td><td>{inr(result.outward.sgst)}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3>4. Eligible ITC (Input Credit)</h3><span>GST you paid on expenses, claimable as credit</span></div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Nature</th><th>IGST</th><th>CGST</th><th>SGST</th><th>Total</th></tr></thead>
                    <tbody>
                      <tr className="total-row"><td>(A5) All other ITC</td><td>{inr(result.itc.igst)}</td><td>{inr(result.itc.cgst)}</td><td>{inr(result.itc.sgst)}</td><td>{inr(result.itc.total)}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3>5. Net Tax Payable</h3><span>Output tax minus input credit, per head</span></div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Head</th><th>Output</th><th>ITC</th><th>Net Payable</th></tr></thead>
                    <tbody>
                      <tr><td>IGST</td><td>{inr(result.outward.igst)}</td><td>{inr(result.itc.igst)}</td><td>{inr(result.net.igst)}</td></tr>
                      <tr><td>CGST</td><td>{inr(result.outward.cgst)}</td><td>{inr(result.itc.cgst)}</td><td>{inr(result.net.cgst)}</td></tr>
                      <tr><td>SGST</td><td>{inr(result.outward.sgst)}</td><td>{inr(result.itc.sgst)}</td><td>{inr(result.net.sgst)}</td></tr>
                      <tr className="total-row"><td>Total</td><td>{inr(result.outward.totalTax)}</td><td>{inr(result.itc.total)}</td><td>{inr(result.net.total)}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
