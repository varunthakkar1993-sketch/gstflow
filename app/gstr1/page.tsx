'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import posthog from 'posthog-js';
import { buildGstr1, Gstr1Result } from '../../lib/gstr1';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Gstr1Page() {
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [result, setResult] = useState<Gstr1Result | null>(null);

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
      const monthInvoices = isnap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter((inv: any) => {
          if (!inv.date) return false;
          const dt = new Date(inv.date);
          return dt.getMonth() === month && dt.getFullYear() === year;
        })
        .sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''));

      const pSnap = await getDoc(doc(db, 'profiles', user.uid));
      const prof = pSnap.exists() ? pSnap.data() : (profile || {});
      const r = buildGstr1(monthInvoices, prof as any, month, year);
      setResult(r);
      setFetched(true);
      posthog.capture('gstr1_previewed', {
        month: MONTHS[month], year, b2b: r.b2b.length, b2cl: r.b2cl.length,
        b2cs: r.b2cs.length, invoices: r.totals.count,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result.json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1-${result.fp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    posthog.capture('gstr1_json_downloaded', { fp: result.fp });
  };

  const downloadExcel = async () => {
    if (!result) return;
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    const summary = [
      ['GSTR-1 Summary'],
      ['Business', profile?.businessName || ''],
      ['GSTIN', result.gstin],
      ['Return Period', result.period, `(${result.fp})`],
      [],
      ['Section', 'Records', 'Taxable Value', 'IGST', 'CGST', 'SGST'],
      ['B2B', result.b2b.length, sum(result.b2b, 'txval'), sum(result.b2b, 'iamt'), sum(result.b2b, 'camt'), sum(result.b2b, 'samt')],
      ['B2CL', result.b2cl.length, sum(result.b2cl, 'txval'), sum(result.b2cl, 'iamt'), 0, 0],
      ['B2CS', result.b2cs.length, sum(result.b2cs, 'txval'), sum(result.b2cs, 'iamt'), sum(result.b2cs, 'camt'), sum(result.b2cs, 'samt')],
      [],
      ['TOTAL', result.totals.count, result.totals.taxable, result.totals.igst, result.totals.cgst, result.totals.sgst],
      ['Total Invoice Value', '', result.totals.invoiceValue],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');

    const b2b = [['GSTIN/UIN of Recipient','Receiver Name','Invoice Number','Invoice Date','Invoice Value','Place Of Supply','Reverse Charge','Invoice Type','Rate','Taxable Value','IGST','CGST','SGST']];
    result.b2b.forEach(r => b2b.push([r.ctin, r.clientName, r.inum, r.idt, r.val, r.posLabel, r.rchrg, r.inv_typ, r.rate, r.txval, r.iamt, r.camt, r.samt] as any));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(b2b), 'B2B');

    const b2cl = [['Invoice Number','Invoice Date','Invoice Value','Place Of Supply','Rate','Taxable Value','IGST','Receiver Name']];
    result.b2cl.forEach(r => b2cl.push([r.inum, r.idt, r.val, r.posLabel, r.rate, r.txval, r.iamt, r.clientName] as any));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(b2cl), 'B2CL');

    const b2cs = [['Type','Place Of Supply','Rate','Taxable Value','IGST','CGST','SGST']];
    result.b2cs.forEach(r => b2cs.push([r.sply_ty, r.posLabel, r.rate, r.txval, r.iamt, r.camt, r.samt] as any));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(b2cs), 'B2CS');

    const hsn = [['HSN/SAC','Description','UQC','Total Quantity','Rate','Total Value','Taxable Value','IGST','CGST','SGST']];
    result.hsn.forEach(r => hsn.push([r.hsn_sc, r.desc, r.uqc, r.qty, r.rate, r.total, r.txval, r.iamt, r.camt, r.samt] as any));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hsn), 'HSN');

    if (result.warnings.length) {
      const warn = [['Invoice','Note']];
      result.warnings.forEach(w => warn.push([w.invoiceNumber, w.message]));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(warn), 'Check');
    }

    XLSX.writeFile(wb, `GSTR1-${result.fp}.xlsx`);
    posthog.capture('gstr1_excel_downloaded', { fp: result.fp });
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
        .page-header { margin-bottom: 28px; }
        .page-header h2 { font-family: 'Lora', serif; font-size: 26px; color: #0f1f5c; font-weight: 600; }
        .page-header p { color: #6b7280; font-size: 14px; margin-top: 4px; }
        .tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1.5px solid #e5e9f5; }
        .tab { padding: 10px 18px; font-size: 14px; font-weight: 600; color: #6b7280; text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -1.5px; }
        .tab.active { color: #2563eb; border-bottom-color: #2563eb; }
        .tab:hover { color: #2563eb; }
        .controls { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; flex-wrap: wrap; }
        .controls select { padding: 10px 14px; border: 1.5px solid #e5e9f5; border-radius: 8px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #111827; background: #fff; outline: none; transition: border-color 0.15s; }
        .controls select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .btn-fetch { background: #2563eb; color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.15s; }
        .btn-fetch:hover { background: #1d4ed8; }
        .btn-fetch:disabled { opacity: 0.6; cursor: not-allowed; }
        .dl-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .btn-download { background: #0f1f5c; color: #fff; border: none; padding: 13px 28px; border-radius: 9px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; gap: 8px; }
        .btn-download:hover { background: #1a2f7a; }
        .btn-download.alt { background: #fff; color: #0f1f5c; border: 1.5px solid #0f1f5c; }
        .btn-download.alt:hover { background: #f0f4ff; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .summary-box { background: #fff; border: 1px solid #e5e9f5; border-radius: 12px; padding: 20px; }
        .summary-box-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 8px; }
        .summary-box-value { font-family: 'Lora', serif; font-size: 22px; font-weight: 600; color: #0f1f5c; }
        .card { background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; overflow: hidden; margin-bottom: 20px; }
        .card-header { padding: 16px 24px; border-bottom: 1px solid #f0f4ff; display: flex; align-items: center; justify-content: space-between; }
        .card-header h3 { font-size: 14px; font-weight: 600; color: #0f1f5c; }
        .card-header span { font-size: 12px; color: #9ca3af; }
        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 16px; text-align: left; background: #f8faff; border-bottom: 1px solid #f0f4ff; white-space: nowrap; }
        td { font-size: 13px; color: #374151; padding: 12px 16px; border-bottom: 1px solid #f8faff; white-space: nowrap; }
        .num { text-align: right; }
        .empty-row { text-align: center; color: #9ca3af; font-size: 13px; padding: 20px; }
        .no-data { text-align: center; padding: 60px 20px; color: #9ca3af; font-size: 15px; }
        .warn-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; }
        .warn-box h4 { font-size: 13px; color: #92400e; font-weight: 600; margin-bottom: 8px; }
        .warn-box ul { margin: 0; padding-left: 18px; }
        .warn-box li { font-size: 12.5px; color: #92400e; margin-bottom: 4px; }
        .info-strip { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; font-size: 12.5px; color: #1e40af; }
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
          .nav-item { padding: 12px 14px; font-size: 15px; white-space: nowrap; gap: 10px; }
          .sidebar-footer { display: none; }
          .main { margin-left: 0 !important; padding: 16px !important; width: 100% !important; }
          .page-header h2 { font-size: 22px; }
          .summary-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .controls { flex-direction: column; align-items: stretch; }
          .controls select, .controls button { width: 100%; }
          .dl-row { flex-direction: column; }
          .dl-row button { width: 100%; justify-content: center; }
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
            <p>Export your outward supplies in GSTR-1 format. Upload the JSON to the GST portal or hand the Excel to your CA.</p>
          </div>

          <div className="tabs">
            <a href="/gstr1" className="tab active">GSTR-1 (Sales)</a>
            <a href="/gstr3b" className="tab">GSTR-3B (Summary)</a>
          </div>

          <div className="info-strip">
            GSTR-1 covers your sales. Records are split into B2B (registered buyers), B2CL (inter-state consumer sales above Rs 1 lakh) and B2CS (all other consumer sales), plus an HSN summary.
          </div>

          <div className="controls">
            <select value={month} onChange={e => { setMonth(parseInt(e.target.value)); setFetched(false); }}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={year} onChange={e => { setYear(parseInt(e.target.value)); setFetched(false); }}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn-fetch" onClick={fetchData} disabled={loading}>
              {loading ? 'Loading...' : 'Prepare GSTR-1'}
            </button>
          </div>

          {!fetched || !result ? (
            <div className="no-data">Select a return period and click Prepare GSTR-1.</div>
          ) : result.totals.count === 0 ? (
            <div className="no-data">No invoices found for {result.period}.</div>
          ) : (
            <>
              <div className="dl-row" style={{ marginBottom: 24 }}>
                <button className="btn-download" onClick={downloadJSON}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download JSON (portal)
                </button>
                <button className="btn-download alt" onClick={downloadExcel}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download Excel (CA)
                </button>
              </div>

              <div className="summary-grid">
                <div className="summary-box">
                  <div className="summary-box-label">Taxable Value</div>
                  <div className="summary-box-value">Rs. {result.totals.taxable.toLocaleString('en-IN')}</div>
                </div>
                <div className="summary-box">
                  <div className="summary-box-label">Total IGST</div>
                  <div className="summary-box-value">Rs. {result.totals.igst.toLocaleString('en-IN')}</div>
                </div>
                <div className="summary-box">
                  <div className="summary-box-label">CGST + SGST</div>
                  <div className="summary-box-value">Rs. {(result.totals.cgst + result.totals.sgst).toLocaleString('en-IN')}</div>
                </div>
                <div className="summary-box">
                  <div className="summary-box-label">Invoices</div>
                  <div className="summary-box-value">{result.totals.count}</div>
                </div>
              </div>

              {result.warnings.length > 0 && (
                <div className="warn-box">
                  <h4>Please review before filing ({result.warnings.length})</h4>
                  <ul>
                    {result.warnings.slice(0, 12).map((w, i) => (
                      <li key={i}><strong>{w.invoiceNumber !== '-' ? `${w.invoiceNumber}: ` : ''}</strong>{w.message}</li>
                    ))}
                    {result.warnings.length > 12 && <li>...and {result.warnings.length - 12} more (see the Check sheet in the Excel).</li>}
                  </ul>
                </div>
              )}

              <div className="card">
                <div className="card-header"><h3>B2B — Registered Buyers</h3><span>{result.b2b.length} record{result.b2b.length !== 1 ? 's' : ''}</span></div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>GSTIN</th><th>Buyer</th><th>Invoice</th><th>Date</th><th>POS</th><th>Rate</th><th className="num">Taxable</th><th className="num">IGST</th><th className="num">CGST</th><th className="num">SGST</th></tr></thead>
                    <tbody>
                      {result.b2b.length === 0 ? <tr><td colSpan={10} className="empty-row">None</td></tr> :
                        result.b2b.map((r, i) => (
                          <tr key={i}><td>{r.ctin}</td><td>{r.clientName || '—'}</td><td style={{ color: '#2563eb', fontWeight: 500 }}>{r.inum}</td><td>{r.idt}</td><td>{r.pos}</td><td>{r.rate}%</td><td className="num">{r.txval.toLocaleString('en-IN')}</td><td className="num">{r.iamt.toLocaleString('en-IN')}</td><td className="num">{r.camt.toLocaleString('en-IN')}</td><td className="num">{r.samt.toLocaleString('en-IN')}</td></tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3>B2CL — Large Consumer Sales</h3><span>{result.b2cl.length} record{result.b2cl.length !== 1 ? 's' : ''}</span></div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Invoice</th><th>Date</th><th>POS</th><th>Rate</th><th className="num">Invoice Value</th><th className="num">Taxable</th><th className="num">IGST</th></tr></thead>
                    <tbody>
                      {result.b2cl.length === 0 ? <tr><td colSpan={7} className="empty-row">None</td></tr> :
                        result.b2cl.map((r, i) => (
                          <tr key={i}><td style={{ color: '#2563eb', fontWeight: 500 }}>{r.inum}</td><td>{r.idt}</td><td>{r.pos}</td><td>{r.rate}%</td><td className="num">{r.val.toLocaleString('en-IN')}</td><td className="num">{r.txval.toLocaleString('en-IN')}</td><td className="num">{r.iamt.toLocaleString('en-IN')}</td></tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3>B2CS — Small Consumer Sales</h3><span>{result.b2cs.length} record{result.b2cs.length !== 1 ? 's' : ''}</span></div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Type</th><th>POS</th><th>Rate</th><th className="num">Taxable</th><th className="num">IGST</th><th className="num">CGST</th><th className="num">SGST</th></tr></thead>
                    <tbody>
                      {result.b2cs.length === 0 ? <tr><td colSpan={7} className="empty-row">None</td></tr> :
                        result.b2cs.map((r, i) => (
                          <tr key={i}><td>{r.sply_ty}</td><td>{r.pos}</td><td>{r.rate}%</td><td className="num">{r.txval.toLocaleString('en-IN')}</td><td className="num">{r.iamt.toLocaleString('en-IN')}</td><td className="num">{r.camt.toLocaleString('en-IN')}</td><td className="num">{r.samt.toLocaleString('en-IN')}</td></tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3>HSN Summary</h3><span>{result.hsn.length} row{result.hsn.length !== 1 ? 's' : ''}</span></div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>HSN/SAC</th><th>Rate</th><th>UQC</th><th className="num">Taxable</th><th className="num">IGST</th><th className="num">CGST</th><th className="num">SGST</th></tr></thead>
                    <tbody>
                      {result.hsn.map((r, i) => (
                        <tr key={i}><td>{r.hsn_sc || <span style={{ color: '#dc2626' }}>missing</span>}</td><td>{r.rate}%</td><td>{r.uqc}</td><td className="num">{r.txval.toLocaleString('en-IN')}</td><td className="num">{r.iamt.toLocaleString('en-IN')}</td><td className="num">{r.camt.toLocaleString('en-IN')}</td><td className="num">{r.samt.toLocaleString('en-IN')}</td></tr>
                      ))}
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

function sum(rows: any[], key: string): number {
  return Math.round(rows.reduce((s, r) => s + (r[key] || 0), 0) * 100) / 100;
}
