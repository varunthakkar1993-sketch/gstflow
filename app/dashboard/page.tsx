'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const paidRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);
  const unpaidCount = invoices.filter(i => i.status === 'unpaid').length;
  const thisMonth = invoices.filter(inv => {
    if (!inv.date) return false;
    const d = new Date(inv.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthRevenue = thisMonth.reduce((sum, inv) => sum + (inv.total || 0), 0);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  const statusStyle = (status: string) => {
    if (status === 'paid') return { background: '#dcfce7', color: '#16a34a' };
    if (status === 'unpaid') return { background: '#fee2e2', color: '#dc2626' };
    return { background: '#dbeafe', color: '#1d4ed8' };
  };

  const statusLabel = (status: string) => {
    if (status === 'paid') return '✓ Paid';
    if (status === 'unpaid') return '⚠ Unpaid';
    return '→ Sent';
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#6b7280', fontFamily: 'Georgia, serif' }}>Loading your workspace…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
        .sidebar-footer { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.08); }
        .user-chip { display: flex; align-items: center; gap: 10px; padding: 8px 12px; }
        .user-avatar { width: 32px; height: 32px; background: linear-gradient(135deg, #6382ff, #3b5bdb); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 600; flex-shrink: 0; }
        .user-email { font-size: 11.5px; color: rgba(255,255,255,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .logout-btn { display: flex; align-items: center; gap: 8px; padding: 8px 12px; color: rgba(255,255,255,0.4); font-size: 12px; cursor: pointer; border: none; background: none; width: 100%; border-radius: 6px; transition: all 0.15s; margin-top: 4px; }
        .logout-btn:hover { color: #ff6b6b; background: rgba(255,107,107,0.1); }
        .main { margin-left: 240px; flex: 1; padding: 36px 40px; }
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
        .new-btn { display: inline-flex; align-items: center; gap: 6px; background: #2563eb; color: #fff; padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; text-decoration: none; transition: background 0.15s; }
        .new-btn:hover { background: #1d4ed8; }
        .invoice-table { background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; overflow: hidden; }
        .table-head { display: grid; grid-template-columns: 1fr 2fr 1.5fr 1fr 1fr; gap: 16px; padding: 12px 24px; background: #f8faff; border-bottom: 1px solid #e5e9f5; }
        .th { font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.7px; font-weight: 600; }
        .table-row { display: grid; grid-template-columns: 1fr 2fr 1.5fr 1fr 1fr; gap: 16px; padding: 16px 24px; border-bottom: 1px solid #f3f4f6; align-items: center; transition: background 0.1s; }
        .table-row:last-child { border-bottom: none; }
        .table-row:hover { background: #f8faff; }
        .inv-number { font-size: 14px; font-weight: 600; color: #2563eb; }
        .inv-client { font-size: 14px; color: #111827; font-weight: 500; }
        .inv-client-email { font-size: 13px; color: #9ca3af; margin-top: 1px; }
        .inv-amount { font-size: 14px; font-weight: 600; color: #111827; font-family: 'Lora', serif; }
        .inv-date { font-size: 13px; color: #6b7280; }
        .status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; border: none; transition: opacity 0.15s; }
        .status-badge:hover { opacity: 0.8; }
        .status-hint { font-size: 11px; color: #9ca3af; margin-top: 3px; }
        .quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
        .action-card { background: #fff; border: 1px solid #e5e9f5; border-radius: 12px; padding: 20px 24px; display: flex; align-items: center; gap: 16px; text-decoration: none; transition: all 0.15s; }
        .action-card:hover { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .action-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .action-title { font-size: 14px; font-weight: 600; color: #0f1f5c; }
        .action-sub { font-size: 12px; color: #9ca3af; margin-top: 2px; }
        .empty-state { padding: 60px 24px; text-align: center; }
        .empty-icon { width: 56px; height: 56px; background: #eff6ff; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .empty-title { font-family: 'Lora', serif; font-size: 17px; color: #0f1f5c; font-weight: 600; margin-bottom: 6px; }
        .empty-sub { font-size: 13.5px; color: #9ca3af; margin-bottom: 20px; }
      `}</style>

      <div className="dash-root">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>GSTFlow</h1>
            <p>Invoice Manager</p>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-label">Main</div>
            <a href="/dashboard" className="nav-item active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              Dashboard
            </a>
            <a href="/editor" onClick={(e: any) => { e.preventDefault(); window.location.href = "/editor?new=" + Date.now(); }} className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              New Invoice
            </a>
            <a href="/quote-editor" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="11" y2="17"/></svg>
              New Quote
            </a>
            <div className="nav-label">Documents</div>
            <a href="/dashboard" className="nav-item active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              Invoices
            </a>
            <a href="/quotes" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Quotes
            </a>
            <div className="nav-label">Settings</div>
            <a href="/profile" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Business Profile
            </a>
            <a href="/templates" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              Templates
            </a>
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

          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">Rs. {totalRevenue.toLocaleString('en-IN')}</div>
              <div className="stat-sub">All time</div>
            </div>
            <div className="stat-card indigo">
              <div className="stat-label">This Month</div>
              <div className="stat-value">Rs. {thisMonthRevenue.toLocaleString('en-IN')}</div>
              <div className="stat-sub">{thisMonth.length} invoice{thisMonth.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-label">Collected</div>
              <div className="stat-value">Rs. {paidRevenue.toLocaleString('en-IN')}</div>
              <div className="stat-sub">Marked as paid</div>
            </div>
            <div className="stat-card red">
              <div className="stat-label">Pending</div>
              <div className="stat-value">{unpaidCount}</div>
              <div className="stat-sub">Unpaid invoice{unpaidCount !== 1 ? 's' : ''}</div>
            </div>
          </div>

          <div className="quick-actions">
            <a href="/editor" onClick={(e: any) => { e.preventDefault(); window.location.href = "/editor?new=" + Date.now(); }} className="action-card">
              <div className="action-icon" style={{ background: '#eff6ff' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              </div>
              <div>
                <div className="action-title">Create New Invoice</div>
                <div className="action-sub">Generate a GST-compliant invoice</div>
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

          <div className="section-header">
            <div className="section-title">Recent Invoices</div>
            <a href="/editor" onClick={(e: any) => { e.preventDefault(); window.location.href = "/editor?new=" + Date.now(); }} className="new-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Invoice
            </a>
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
                <a href="/editor" onClick={(e: any) => { e.preventDefault(); window.location.href = "/editor?new=" + Date.now(); }} className="new-btn" style={{ margin: '0 auto', display: 'inline-flex' }}>Create Invoice</a>
              </div>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="table-row">
                  <a href={`/invoice/${inv.id}`} style={{fontSize:14,fontWeight:600,color:"#2563eb",textDecoration:"none"}}>{inv.invoiceNumber}</a>
                  <div>
                    <div className="inv-client">{inv.clientName || '—'}</div>
                    <div className="inv-client-email">{inv.clientEmail || ''}</div>
                  </div>
                  <div className="inv-amount">Rs. {(inv.total || 0).toLocaleString('en-IN')}</div>
                  <div className="inv-date">{inv.date || '—'}</div>
                  <div>
                    <button
                      className="status-badge"
                      style={statusStyle(inv.status || 'sent')}
                      onClick={() => toggleStatus(inv)}
                      title="Click to change status"
                    >
                      {statusLabel(inv.status || 'sent')}
                    </button>
                    <div className="status-hint">click to change</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </>
  );
}
