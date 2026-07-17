'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import posthog from 'posthog-js';

export default function QuotesPage() {
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const q = query(collection(db, 'quotes'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          setQuotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err: any) {
          console.error('Quotes error:', err?.message);
        }
      } else {
        window.location.href = '/login';
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleStatus = async (quote: any) => {
    const cycle: Record<string, string> = { draft: 'sent', sent: 'accepted', accepted: 'rejected', rejected: 'draft' };
    const next = cycle[quote.status || 'draft'];
    await updateDoc(doc(db, 'quotes', quote.id), { status: next });
    setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: next } : q));
    posthog.capture('quote_status_changed', {
      quote_number: quote.quoteNumber,
      previous_status: quote.status || 'draft',
      new_status: next,
      quote_total: quote.total,
    });
  };

  const statusStyle = (status: string) => {
    if (status === 'accepted') return { background: '#dcfce7', color: '#16a34a' };
    if (status === 'rejected') return { background: '#fee2e2', color: '#dc2626' };
    if (status === 'sent') return { background: '#dbeafe', color: '#1d4ed8' };
    return { background: '#f3f4f6', color: '#6b7280' };
  };

  const statusLabel = (status: string) => {
    if (status === 'accepted') return '✓ Accepted';
    if (status === 'rejected') return '✗ Rejected';
    if (status === 'sent') return '→ Sent';
    return '○ Draft';
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }
        .field label { font-size: 13.5px; }
        .field input, .field textarea, .field select { font-size: 15px; }
        th { font-size: 12px; }
        td { font-size: 14px; }

        
        .menu-toggle { display: none; background: none; border: none; color: #ffffff; font-size: 30px; cursor: pointer; padding: 4px 8px; }
        @media (max-width: 768px) {
          .editor-root, .root { flex-direction: column; }
          .editor-root, .root { flex-direction: column; min-height: auto; }
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
        .root { display: flex; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
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
        .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .page-header h2 { font-family: 'Lora', serif; font-size: 26px; color: #0f1f5c; font-weight: 600; }
        .page-header p { color: #6b7280; font-size: 14px; margin-top: 4px; }
        .new-btn { display: inline-flex; align-items: center; gap: 6px; background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 13.5px; font-weight: 500; text-decoration: none; transition: background 0.15s; }
        .new-btn:hover { background: #1d4ed8; }
        .table-card { background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; overflow: hidden; }
        .table-head { display: grid; grid-template-columns: 1fr 2fr 1.5fr 1fr 1fr 1fr; gap: 16px; padding: 12px 24px; background: #f8faff; border-bottom: 1px solid #e5e9f5; }
        .th { font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.7px; font-weight: 600; }
        .table-row { display: grid; grid-template-columns: 1fr 2fr 1.5fr 1fr 1fr 1fr; gap: 16px; padding: 16px 24px; border-bottom: 1px solid #f3f4f6; align-items: center; transition: background 0.1s; }
        .table-row:last-child { border-bottom: none; }
        .table-row:hover { background: #f8faff; }
        .q-number { font-size: 14px; font-weight: 600; color: #7c3aed; text-decoration: none; }
        .q-number:hover { text-decoration: underline; }
        .q-client { font-size: 14px; color: #111827; font-weight: 500; }
        .q-sub { font-size: 12.5px; color: #9ca3af; margin-top: 1px; }
        .q-amount { font-size: 14px; font-weight: 600; color: #111827; }
        .q-date { font-size: 13px; color: #6b7280; }
        .status-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; border: none; transition: opacity 0.15s; }
        .status-badge:hover { opacity: 0.8; }
        .status-hint { font-size: 11px; color: #9ca3af; margin-top: 3px; }
        .convert-btn { display: inline-flex; align-items: center; gap: 4px; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; text-decoration: none; transition: all 0.15s; }
        .convert-btn:hover { background: #dcfce7; }
        .empty-state { padding: 60px 24px; text-align: center; }
        .empty-icon { width: 56px; height: 56px; background: #f5f3ff; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .empty-title { font-family: 'Lora', serif; font-size: 17px; color: #0f1f5c; font-weight: 600; margin-bottom: 6px; }
        .empty-sub { font-size: 13.5px; color: #9ca3af; margin-bottom: 20px; }
      
        .field label { font-size: 13.5px; }
        .field input, .field textarea, .field select { font-size: 15px; }
        th { font-size: 12px; }
        td { font-size: 14px; }

        @media (max-width: 768px) {
          .editor-root, .root { flex-direction: column; }
          .editor-root, .root { flex-direction: column; min-height: auto; }
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

      <div className="root">
        <aside className="sidebar">
          <div className="sidebar-logo"><img src="/logo-white.svg" alt="Paavti" style={{ height: '38px' }} /><p>Business Manager</p></div>
          <nav className={`sidebar-nav ${showMenu ? "nav-open" : ""}`}>
            <div className="nav-label">Main</div>
            <a href="/dashboard" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              Dashboard
            </a>
            <a href="/editor" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              New Invoice
            </a>
            <a href="/quote-editor" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="11" y2="17"/></svg>
              New Quote
            </a>
            <div className="nav-label">Documents</div>
            <a href="/dashboard" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              Invoices
            </a>
            <a href="/quotes" className="nav-item active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Quotes
            </a>
            <a href="/clients" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Clients</a>
            <div className="nav-label">Settings</div>
            <a href="/profile" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Business Profile
            </a>
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
            <div>
              <h2>Quotes</h2>
              <p>Send estimates to clients before raising an invoice.</p>
            </div>
            <a href="/quote-editor" className="new-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Quote
            </a>
          </div>

          <div className="table-card">
            <div className="table-head">
              <div className="th">#</div>
              <div className="th">Client</div>
              <div className="th">Amount</div>
              <div className="th">Valid Until</div>
              <div className="th">Status</div>
              <div className="th">Action</div>
            </div>

            {quotes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div className="empty-title">No quotes yet</div>
                <div className="empty-sub">Create a quote to send estimates to clients</div>
                <a href="/quote-editor" className="new-btn" style={{ margin: '0 auto', display: 'inline-flex' }}>Create Quote</a>
              </div>
            ) : (
              quotes.map((q) => (
                <div key={q.id} className="table-row">
                  <a href={`/quote/${q.id}`} className="q-number">{q.quoteNumber}</a>
                  <div>
                    <div className="q-client">{q.clientName || '—'}</div>
                    <div className="q-sub">{q.clientEmail || ''}</div>
                  </div>
                  <div className="q-amount">Rs. {(q.total || 0).toLocaleString('en-IN')}</div>
                  <div className="q-date">{q.validUntil || '—'}</div>
                  <div>
                    <button className="status-badge" style={statusStyle(q.status || 'draft')} onClick={() => toggleStatus(q)}>
                      {statusLabel(q.status || 'draft')}
                    </button>
                    <div className="status-hint">click to change</div>
                  </div>
                  <div>
                    {(q.status === 'accepted' || q.status === 'sent') && (
                      <a href={`/editor?clientName=${encodeURIComponent(q.clientName || "")}&clientEmail=${encodeURIComponent(q.clientEmail || "")}&clientAddress=${encodeURIComponent(q.clientAddress || "")}&amount=${q.total}`} className="convert-btn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                        Convert
                      </a>
                    )}
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
