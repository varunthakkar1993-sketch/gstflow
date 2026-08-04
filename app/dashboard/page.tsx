'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { paymentStatus, balanceDue, isDue, FREQUENCY_LABELS } from '../../lib/recurring';
import posthog from 'posthog-js';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [thisMonthExpenses, setThisMonthExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const q = query(collection(db, 'invoices'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err: any) {
          console.error('Firestore error:', err?.message);
          setInvoices([]);
        }
        try {
          const eq = query(collection(db, 'expenses'), where('userId', '==', currentUser.uid));
          const esnap = await getDocs(eq);
          const expTotal = esnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);
          setTotalExpenses(expTotal);
          const now = new Date();
          const thisMonthExp = esnap.docs
            .filter(d => {
              const date = new Date(d.data().date);
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            })
            .reduce((sum, d) => sum + (d.data().amount || 0), 0);
          setThisMonthExpenses(thisMonthExp);
        } catch (e) {}
        try {
          const subDoc = await getDoc(doc(db, 'subscriptions', currentUser.uid));
          if (subDoc.exists() && subDoc.data()?.status === 'active') setIsPro(true);
        } catch (e) {}
      } else {
        window.location.href = '/login';
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleStatus = async (inv: any) => {
    const next = inv.status === 'paid' ? 'unpaid' : inv.status === 'unpaid' ? 'sent' : 'paid';
    await updateDoc(doc(db, 'invoices', inv.id), { status: next });
    setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: next } : i));
    posthog.capture('invoice_status_changed', {
      invoice_number: inv.invoiceNumber,
      previous_status: inv.status || 'unpaid',
      new_status: next,
      invoice_total: inv.total,
    });
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  // Collected reflects money actually received, including part payments.
  const paidRevenue = invoices.reduce((sum, inv) => {
    const recorded = Number(inv.amountPaid) || 0;
    if (recorded > 0) return sum + recorded;
    return sum + (inv.status === 'paid' ? (inv.total || 0) : 0);
  }, 0);
  const unpaidCount = invoices.filter(i => paymentStatus(i.total || 0, i.amountPaid || 0) !== 'paid').length;
  const outstandingTotal = invoices.reduce((sum, inv) => sum + balanceDue(inv.total || 0, inv.amountPaid || 0), 0);
  const dueRecurring = invoices.filter(inv => inv.recurring && inv.recurring !== 'none' && isDue(inv.nextDue));
  const thisMonth = invoices.filter(inv => {
    if (!inv.date) return false;
    const d = new Date(inv.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthRevenue = thisMonth.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const thisMonthGST = thisMonth.reduce((sum, inv) => sum + (inv.amount || 0) * (parseFloat(inv.gstRate) || 0) / 100, 0);
  const thisMonthInvoiceCount = thisMonth.length;
  const freeLimit = 5;
  const atLimit = !isPro && thisMonthInvoiceCount >= freeLimit;

  const handleNewInvoice = (e: any) => {
    e.preventDefault();
    if (atLimit) { setShowLimitModal(true); return; }
    window.location.href = '/editor?new=' + Date.now();
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  const statusStyle = (status: string) => {
    if (status === 'paid') return { background: '#dcfce7', color: '#16a34a' };
    if (status === 'partial') return { background: '#fff7ed', color: '#d97706' };
    if (status === 'unpaid') return { background: '#fee2e2', color: '#dc2626' };
    return { background: '#dbeafe', color: '#1d4ed8' };
  };

  const statusLabel = (status: string) => {
    if (status === 'paid') return '✓ Paid';
    if (status === 'partial') return '◑ Part paid';
    if (status === 'unpaid') return '⚠ Unpaid';
    return '→ Sent';
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#6b7280', fontFamily: 'Georgia, serif' }}>Loading your workspace…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }
        .field label { font-size: 13.5px; }
        .field input, .field textarea, .field select { font-size: 15px; }
        th { font-size: 12px; }
        td { font-size: 14px; }

        
        .menu-toggle { display: none; background: none; border: none; color: #ffffff; font-size: 30px; cursor: pointer; padding: 4px 8px; }
        @media (max-width: 768px) {
          .editor-root, .root { flex-direction: column; }
          .editor-root, .root, .dash-root { flex-direction: column !important; min-height: auto !important; }
          .sidebar { width: 100% !important; min-height: auto !important; position: relative !important; flex-direction: row !important; flex-wrap: wrap !important; align-items: center; top: auto !important; bottom: auto !important; left: auto !important; height: auto !important; z-index: auto !important; }
          .sidebar-logo { padding: 14px 16px; border-bottom: none; }
          .sidebar-logo h1 { font-size: 18px; }
          .sidebar-logo p { display: none; }
          .sidebar-logo { display: flex !important; align-items: center; width: 100%; gap: 12px; padding: 12px 16px !important; }
          .sidebar-logo p { display: none; }
          .sidebar-logo img { height: 42px !important; }
          .menu-toggle { display: block !important; margin-left: auto; font-size: 32px; color: #ffffff !important; }
          .sidebar-nav { display: none !important; flex-direction: column; padding: 0 12px 12px; gap: 2px; width: 100%; }
          .sidebar-nav.nav-open { display: flex !important; }
          .nav-label { display: none; }
          .nav-item { padding: 12px 14px; font-size: 15px; white-space: nowrap; gap: 10px; }
          .nav-item svg { width: 14px; height: 14px; }
          .sidebar-footer { display: none; }
          .main { margin-left: 0 !important; padding: 16px !important; width: 100% !important; }
          .page-header { margin-bottom: 16px; }
          .page-header h2 { font-size: 22px; }
          .page-header p { font-size: 13px; }
          .editor-grid { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
          .summary-card { position: static; }
          .summary-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .stats-grid { grid-template-columns: 1fr; gap: 10px; }
          .content-grid { grid-template-columns: 1fr; }
          .controls { flex-direction: column; align-items: stretch; }
          .controls select, .controls button { width: 100%; }
          .card-body { padding: 16px; }
          .card-header { padding: 12px 16px; }
          table { font-size: 12px; }
          th { font-size: 10px; padding: 8px 10px; }
          td { font-size: 12.5px; padding: 10px; }
          .action-btns { gap: 8px; }
          .modal { width: 95vw; max-height: 90vh; overflow-y: auto; }
        }
      `}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f4ff; }
        .dash-root { display: flex; min-height: 100vh; font-family: 'DM Sans', sans-serif; background: #f0f4ff; }
        .sidebar { width: 240px; background: #0f1f5c; min-height: 100vh; display: flex; flex-direction: column; position: fixed; left: 0; top: 0; bottom: 0; z-index: 10; }
        .sidebar-logo { padding: 28px 24px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .sidebar-logo h1 { font-family: 'Lora', serif; font-size: 22px; color: #fff; font-weight: 600; letter-spacing: -0.3px; }
        .sidebar-logo p { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; letter-spacing: 0.5px; text-transform: uppercase; }
        .sidebar-nav { padding: 20px 12px; flex: 1; }
        .nav-label { font-size: 10px; color: rgba(255,255,255,0.3); letter-spacing: 1px; text-transform: uppercase; padding: 0 12px; margin-bottom: 8px; margin-top: 16px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; color: rgba(255,255,255,0.6); font-size: 13.5px; font-weight: 400; text-decoration: none; transition: all 0.15s; cursor: pointer; border: none; background: none; width: 100%; text-align: left; }
        .nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .nav-item.active { background: rgba(99,130,255,0.2); color: #fff; font-weight: 500; }
        .upgrade-btn { display: flex; align-items: center; gap: 8px; margin: 12px 12px 0; padding: 11px 14px; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #fff; border-radius: 9px; font-size: 13px; font-weight: 600; text-decoration: none; transition: opacity 0.15s; }
        .upgrade-btn:hover { opacity: 0.9; }
        .sidebar-footer { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.08); }
        .user-chip { display: flex; align-items: center; gap: 10px; padding: 8px 12px; }
        .user-avatar { width: 32px; height: 32px; background: linear-gradient(135deg, #6382ff, #3b5bdb); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 600; flex-shrink: 0; }
        .user-email { font-size: 11.5px; color: rgba(255,255,255,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .logout-btn { display: flex; align-items: center; gap: 8px; padding: 8px 12px; color: rgba(255,255,255,0.4); font-size: 12px; cursor: pointer; border: none; background: none; width: 100%; border-radius: 6px; transition: all 0.15s; margin-top: 4px; }
        .logout-btn:hover { color: #ff6b6b; background: rgba(255,107,107,0.1); }
        .main { margin-left: 240px; flex: 1; padding: 36px 40px; }
        .upgrade-banner { background: linear-gradient(135deg, #eff6ff, #f5f3ff); border: 1.5px solid #dbeafe; border-radius: 12px; padding: 14px 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
        .upgrade-banner-text { font-size: 13.5px; color: #1e40af; font-weight: 500; }
        .upgrade-banner-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .upgrade-banner-btn { background: #2563eb; color: #fff; padding: 8px 18px; border-radius: 7px; font-size: 13px; font-weight: 600; text-decoration: none; white-space: nowrap; transition: background 0.15s; }
        .upgrade-banner-btn:hover { background: #1d4ed8; }
        .progress-bar { height: 4px; background: #e5e9f5; border-radius: 4px; margin-top: 8px; overflow: hidden; width: 200px; }
        .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
        .page-header { margin-bottom: 32px; }
        .page-header h2 { font-family: 'Lora', serif; font-size: 26px; color: #0f1f5c; font-weight: 600; }
        .page-header p { color: #6b7280; font-size: 14px; margin-top: 4px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
        .stat-card { background: #fff; border-radius: 12px; padding: 20px 24px; border: 1px solid #e5e9f5; position: relative; overflow: hidden; }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
        .stat-card.blue::before { background: #2563eb; }
        .stat-card.indigo::before { background: #4f46e5; }
        .stat-card.green::before { background: #16a34a; }
        .stat-card.red::before { background: #dc2626; }
        .stat-label { font-size: 13px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 500; }
        .stat-value { font-family: 'Lora', serif; font-size: 28px; color: #0f1f5c; font-weight: 600; margin-top: 6px; letter-spacing: -0.5px; }
        .stat-sub { font-size: 12px; color: #9ca3af; margin-top: 4px; }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .section-title { font-family: 'Lora', serif; font-size: 17px; color: #0f1f5c; font-weight: 600; }
        .new-btn { display: inline-flex; align-items: center; gap: 6px; background: #2563eb; color: #fff; padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; text-decoration: none; transition: background 0.15s; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .new-btn:hover { background: #1d4ed8; }
        .new-btn.disabled { background: #9ca3af; cursor: not-allowed; }
        .invoice-table { background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; overflow: hidden; }
        .table-head { display: grid; grid-template-columns: 1fr 2fr 1.5fr 1fr 1fr; gap: 16px; padding: 12px 24px; background: #f8faff; border-bottom: 1px solid #e5e9f5; }
        .th { font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.7px; font-weight: 600; }
        .table-row { display: grid; grid-template-columns: 1fr 2fr 1.5fr 1fr 1fr; gap: 16px; padding: 16px 24px; border-bottom: 1px solid #f3f4f6; align-items: center; transition: background 0.1s; }
        .table-row:last-child { border-bottom: none; }
        .table-row:hover { background: #f8faff; }
        .inv-client { font-size: 14px; color: #111827; font-weight: 500; }
        .inv-client-email { font-size: 13px; color: #9ca3af; margin-top: 1px; }
        .inv-amount { font-size: 14px; font-weight: 600; color: #111827; font-family: 'Lora', serif; }
        .inv-date { font-size: 13px; color: #6b7280; }
        .status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; border: none; transition: opacity 0.15s; }
        .status-badge:hover { opacity: 0.8; }
        .status-hint { font-size: 11px; color: #9ca3af; margin-top: 3px; }
        .quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
        .action-card { background: #fff; border: 1px solid #e5e9f5; border-radius: 12px; padding: 20px 24px; display: flex; align-items: center; gap: 16px; text-decoration: none; transition: all 0.15s; cursor: pointer; }
        .action-card:hover { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .action-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .action-title { font-size: 14px; font-weight: 600; color: #0f1f5c; }
        .action-sub { font-size: 12px; color: #9ca3af; margin-top: 2px; }
        .empty-state { padding: 60px 24px; text-align: center; }
        .empty-icon { width: 56px; height: 56px; background: #eff6ff; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .empty-title { font-family: 'Lora', serif; font-size: 17px; color: #0f1f5c; font-weight: 600; margin-bottom: 6px; }
        .empty-sub { font-size: 13.5px; color: #9ca3af; margin-bottom: 20px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; display: flex; align-items: center; justify-content: center; }
        .modal { background: #fff; border-radius: 16px; width: 440px; padding: 36px; text-align: center; }
        .modal-icon { width: 56px; height: 56px; background: #fff7ed; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .modal-title { font-family: 'Lora', serif; font-size: 20px; color: #0f1f5c; font-weight: 600; margin-bottom: 10px; }
        .modal-sub { font-size: 14px; color: #6b7280; line-height: 1.6; margin-bottom: 28px; }
        .modal-btn-primary { display: block; width: 100%; background: #2563eb; color: #fff; padding: 12px; border-radius: 9px; font-size: 14px; font-weight: 600; text-decoration: none; margin-bottom: 10px; transition: background 0.15s; }
        .modal-btn-primary:hover { background: #1d4ed8; }
        .modal-btn-secondary { display: block; width: 100%; background: #f3f4f6; color: #374151; padding: 12px; border-radius: 9px; font-size: 14px; font-weight: 500; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .modal-btn-secondary:hover { background: #e5e7eb; }
      
        .field label { font-size: 13.5px; }
        .field input, .field textarea, .field select { font-size: 15px; }
        th { font-size: 12px; }
        td { font-size: 14px; }

        @media (max-width: 768px) {
          .editor-root, .root { flex-direction: column; }
          .editor-root, .root, .dash-root { flex-direction: column !important; min-height: auto !important; }
          .sidebar { width: 100% !important; min-height: auto !important; position: relative !important; flex-direction: row !important; flex-wrap: wrap !important; align-items: center; top: auto !important; bottom: auto !important; left: auto !important; height: auto !important; z-index: auto !important; }
          .sidebar-logo { padding: 14px 16px; border-bottom: none; }
          .sidebar-logo h1 { font-size: 18px; }
          .sidebar-logo p { display: none; }
          .sidebar-logo { display: flex !important; align-items: center; width: 100%; gap: 12px; padding: 12px 16px !important; }
          .sidebar-logo p { display: none; }
          .sidebar-logo img { height: 42px !important; }
          .menu-toggle { display: block !important; margin-left: auto; font-size: 32px; color: #ffffff !important; }
          .sidebar-nav { display: none !important; flex-direction: column; padding: 0 12px 12px; gap: 2px; width: 100%; }
          .sidebar-nav.nav-open { display: flex !important; }
          .nav-label { display: none; }
          .nav-item { padding: 12px 14px; font-size: 15px; white-space: nowrap; gap: 10px; }
          .nav-item svg { width: 14px; height: 14px; }
          .sidebar-footer { display: none; }
          .main { margin-left: 0 !important; padding: 16px !important; width: 100% !important; }
          .page-header { margin-bottom: 16px; }
          .page-header h2 { font-size: 22px; }
          .page-header p { font-size: 13px; }
          .editor-grid { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
          .summary-card { position: static; }
          .summary-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .stats-grid { grid-template-columns: 1fr; gap: 10px; }
          .content-grid { grid-template-columns: 1fr; }
          .controls { flex-direction: column; align-items: stretch; }
          .controls select, .controls button { width: 100%; }
          .card-body { padding: 16px; }
          .card-header { padding: 12px 16px; }
          table { font-size: 12px; }
          th { font-size: 10px; padding: 8px 10px; }
          td { font-size: 12.5px; padding: 10px; }
          .action-btns { gap: 8px; }
          .modal { width: 95vw; max-height: 90vh; overflow-y: auto; }
        }
      `}</style>

      <div className="dash-root">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img src="/logo-white.svg" alt="Paavti" style={{ height: '38px' }} />
            <p>Business Manager</p>
            <button className="menu-toggle" onClick={() => setShowMenu(!showMenu)}>&#9776;</button>
          </div>
          <nav className={`sidebar-nav ${showMenu ? "nav-open" : ""}`}>
            <div className="nav-label">Main</div>
            <a href="/dashboard" className="nav-item active"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Dashboard</a>
            <a href="/editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>New Invoice</a>
            <a href="/quote-editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>New Quote</a>
            <a href="/receipt-editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>New Receipt</a>
            <a href="/reports" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>Reports</a>
            <a href="/gstr1" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>GST Filing</a>
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
            <button onClick={handleLogout} className="logout-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign out
            </button>
          </div>
        </aside>

        <main className="main">
          <div className="page-header">
            <h2>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.email?.split('@')[0]} 👋</h2>
            <p>Here's what's happening with your invoices.</p>
          </div>

          {!isPro && (
            <div className="upgrade-banner">
              <div>
                <div className="upgrade-banner-text">
                  {atLimit ? '🔒 Invoice limit reached for this month' : `${thisMonthInvoiceCount}/${freeLimit} invoices used this month`}
                </div>
                <div className="upgrade-banner-sub">
                  {atLimit ? 'Upgrade to Pro for unlimited invoices, quotes and more.' : `${freeLimit - thisMonthInvoiceCount} invoices remaining. Upgrade for unlimited access.`}
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min((thisMonthInvoiceCount / freeLimit) * 100, 100)}%`, background: atLimit ? '#dc2626' : 'linear-gradient(90deg, #2563eb, #4f46e5)' }} />
                </div>
              </div>
              <a href="/pricing" className="upgrade-banner-btn">Upgrade to Pro →</a>
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">Rs. {totalRevenue.toLocaleString('en-IN')}</div>
              <div className="stat-sub">All time</div>
            </div>
            <div className="stat-card indigo">
              <div className="stat-label">This Month</div>
              <div className="stat-value">Rs. {thisMonthRevenue.toLocaleString('en-IN')}</div>
              <div className="stat-sub">{thisMonth.length} invoice{thisMonth.length !== 1 ? 's' : ''} · Exp: Rs. {thisMonthExpenses.toLocaleString('en-IN')}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-label">Collected</div>
              <div className="stat-value">Rs. {paidRevenue.toLocaleString('en-IN')}</div>
              <div className="stat-sub">Marked as paid</div>
            </div>
            <div className="stat-card red">
              <div className="stat-label">Pending</div>
              <div className="stat-value">Rs. {Math.round(outstandingTotal).toLocaleString('en-IN')}</div>
              <div className="stat-sub">Across {unpaidCount} unpaid invoice{unpaidCount !== 1 ? 's' : ''}</div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: '16px 24px', border: '1px solid #e5e9f5', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 500 }}>Net Profit (Revenue - Expenses)</div>
              <div style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: (totalRevenue - totalExpenses) >= 0 ? '#16a34a' : '#dc2626', marginTop: 4 }}>
                Rs. {(totalRevenue - totalExpenses).toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Revenue: Rs. {totalRevenue.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 12, color: '#dc2626', marginTop: 2 }}>Expenses: Rs. {totalExpenses.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="quick-actions">
            <div onClick={handleNewInvoice} className="action-card">
              <div className="action-icon" style={{ background: '#eff6ff' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              </div>
              <div>
                <div className="action-title">Create New Invoice</div>
                <div className="action-sub">{atLimit ? '⚠ Limit reached — upgrade to continue' : 'Generate a GST-compliant invoice'}</div>
              </div>
            </div>
            <a href="/gstr1" className="action-card">
              <div className="action-icon" style={{ background: '#ecfdf5' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <div>
                <div className="action-title">GST Filing</div>
                <div className="action-sub">{thisMonthGST > 0 ? `Rs. ${Math.round(thisMonthGST).toLocaleString('en-IN')} output tax this month` : 'GSTR-1 & GSTR-3B ready to export'}</div>
              </div>
            </a>
            <a href="/profile" className="action-card">
              <div className="action-icon" style={{ background: '#f5f3ff' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div className="action-title">Business Profile</div>
                <div className="action-sub">Update your business details</div>
              </div>
            </a>
          </div>

          {dueRecurring.length > 0 && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1e40af', marginBottom: 10 }}>
                {dueRecurring.length} recurring invoice{dueRecurring.length !== 1 ? 's' : ''} due to be raised
              </div>
              {dueRecurring.slice(0, 4).map(inv => (
                <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '7px 0', fontSize: 13, color: '#1e3a8a' }}>
                  <span>{inv.clientName || 'Client'} · {FREQUENCY_LABELS[(inv.recurring || 'none') as keyof typeof FREQUENCY_LABELS]} · was due {inv.nextDue}</span>
                  <a
                    href={`/editor?clientName=${encodeURIComponent(inv.clientName || '')}&clientEmail=${encodeURIComponent(inv.clientEmail || '')}&clientAddress=${encodeURIComponent(inv.clientAddress || '')}&description=${encodeURIComponent(inv.description || '')}&amount=${inv.amount || ''}`}
                    style={{ background: '#2563eb', color: '#fff', padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
                  >
                    Raise now
                  </a>
                </div>
              ))}
            </div>
          )}

          <div className="section-header">
            <div className="section-title">Recent Invoices</div>
            <button onClick={handleNewInvoice} className={`new-btn ${atLimit ? 'disabled' : ''}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Invoice
            </button>
          </div>

          <div className="invoice-table">
            <div className="table-head">
              <div className="th">#</div>
              <div className="th">Client</div>
              <div className="th">Amount</div>
              <div className="th">Date</div>
              <div className="th">Status</div>
            </div>
            {invoices.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div className="empty-title">No invoices yet</div>
                <div className="empty-sub">Create your first invoice to get started</div>
                <button onClick={handleNewInvoice} className="new-btn" style={{ margin: '0 auto', display: 'inline-flex' }}>Create Invoice</button>
              </div>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="table-row">
                  <a href={`/invoice/${inv.id}`} style={{fontSize:14,fontWeight:600,color:"#2563eb",textDecoration:"none"}}>{inv.invoiceNumber}</a>
                  <div>
                    <div className="inv-client">{inv.clientName || '—'}</div>
                    <div className="inv-client-email">{inv.clientEmail || ''}</div>
                  </div>
                  <div className="inv-amount">
                    Rs. {(inv.total || 0).toLocaleString('en-IN')}
                    {(inv.amountPaid || 0) > 0 && balanceDue(inv.total || 0, inv.amountPaid || 0) > 0 && (
                      <div style={{ fontSize: 11, color: '#d97706', fontWeight: 500 }}>
                        Rs. {balanceDue(inv.total || 0, inv.amountPaid || 0).toLocaleString('en-IN')} due
                      </div>
                    )}
                  </div>
                  <div className="inv-date">{inv.date || '—'}</div>
                  <div>
                    {(inv.amountPaid || 0) > 0 ? (
                      <a href={`/invoice/${inv.id}`} className="status-badge" style={{ ...statusStyle(paymentStatus(inv.total || 0, inv.amountPaid || 0)), textDecoration: 'none' }}>
                        {statusLabel(paymentStatus(inv.total || 0, inv.amountPaid || 0))}
                      </a>
                    ) : (
                      <>
                        <button className="status-badge" style={statusStyle(inv.status || 'sent')} onClick={() => toggleStatus(inv)} title="Click to change status">
                          {statusLabel(inv.status || 'sent')}
                        </button>
                        <div className="status-hint">click to change</div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {showLimitModal && (
        <div className="modal-overlay" onClick={() => setShowLimitModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <div className="modal-title">Monthly limit reached</div>
            <div className="modal-sub">You have used all 5 free invoices this month. Upgrade to Pro for unlimited invoices, quotes, expense tracking and more.</div>
            <a href="/pricing" className="modal-btn-primary">Upgrade to Pro →</a>
            <button className="modal-btn-secondary" onClick={() => setShowLimitModal(false)}>Maybe later</button>
          </div>
        </div>
      )}
    </>
  );
}
