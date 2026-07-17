'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function ClientsPage() {
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', gstin: '', notes: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { window.location.href = '/login'; return; }
      setUser(currentUser);
      await fetchData(currentUser.uid);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (uid: string) => {
    try {
      const [cSnap, iSnap] = await Promise.all([
        getDocs(query(collection(db, 'clients'), where('userId', '==', uid))),
        getDocs(query(collection(db, 'invoices'), where('userId', '==', uid))),
      ]);
      setClients(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setInvoices(iSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err: any) {
      console.error(err?.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!form.name) { alert('Client name is required.'); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, 'clients', editId), { ...form });
        setClients(prev => prev.map(c => c.id === editId ? { ...c, ...form } : c));
      } else {
        const ref = await addDoc(collection(db, 'clients'), {
          userId: user.uid, ...form, createdAt: serverTimestamp(),
        });
        setClients(prev => [...prev, { id: ref.id, userId: user.uid, ...form }]);
      }
      setForm({ name: '', email: '', phone: '', address: '', gstin: '', notes: '' });
      setEditId(null);
      setShowForm(false);
    } catch { alert('Failed to save client.'); }
    finally { setSaving(false); }
  };

  const handleEdit = (client: any) => {
    setForm({ name: client.name || '', email: client.email || '', phone: client.phone || '', address: client.address || '', gstin: client.gstin || '', notes: client.notes || '' });
    setEditId(client.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client?')) return;
    await deleteDoc(doc(db, 'clients', id));
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const getClientInvoices = (clientName: string) =>
    invoices.filter(inv => inv.clientName?.toLowerCase() === clientName?.toLowerCase());

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }
        .field label { font-size: 13.5px; }
        .field input, .field textarea, .field select { font-size: 15px; }
        th { font-size: 12px; }
        td { font-size: 14px; }

        
        .menu-toggle { display: none; background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; padding: 4px 8px; }
        @media (max-width: 768px) {
          .editor-root, .root { flex-direction: column; }
          .editor-root, .root { flex-direction: column; min-height: auto; }
          .sidebar { width: 100% !important; min-height: auto !important; position: relative !important; flex-direction: row !important; flex-wrap: wrap !important; align-items: center; top: auto !important; bottom: auto !important; left: auto !important; height: auto !important; z-index: auto !important; }
          .sidebar-logo { padding: 14px 16px; border-bottom: none; }
          .sidebar-logo h1 { font-size: 18px; }
          .sidebar-logo p { display: none; }
          .sidebar-logo { display: flex !important; align-items: center; width: 100%; gap: 12px; padding: 12px 16px !important; }
          .sidebar-logo p { display: none; }
          .sidebar-logo img { height: 32px !important; }
          .menu-toggle { display: block !important; margin-left: auto; font-size: 28px; }
          .sidebar-nav { display: none !important; flex-direction: column; padding: 0 12px 12px; gap: 2px; width: 100%; }
          .sidebar-nav.nav-open { display: flex !important; }
          .nav-label { display: none; }
          .nav-item { padding: 7px 10px; font-size: 12px; white-space: nowrap; gap: 6px; }
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
        .header-right { display: flex; gap: 12px; align-items: center; }
        .search-box { padding: 9px 14px; border: 1.5px solid #e5e9f5; border-radius: 8px; font-size: 13.5px; font-family: 'DM Sans', sans-serif; outline: none; width: 220px; }
        .search-box:focus { border-color: #2563eb; }
        .add-btn { display: inline-flex; align-items: center; gap: 6px; background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 13.5px; font-weight: 500; cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; }
        .add-btn:hover { background: #1d4ed8; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
        .stat-card { background: #fff; border-radius: 12px; padding: 20px 24px; border: 1px solid #e5e9f5; position: relative; overflow: hidden; }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
        .stat-card.blue::before { background: #2563eb; }
        .stat-card.green::before { background: #16a34a; }
        .stat-card.purple::before { background: #7c3aed; }
        .stat-label { font-size: 13px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 500; }
        .stat-value { font-family: 'Lora', serif; font-size: 26px; color: #0f1f5c; font-weight: 600; margin-top: 6px; }
        .stat-sub { font-size: 12px; color: #9ca3af; margin-top: 4px; }
        .clients-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .client-card { background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; padding: 20px; transition: all 0.15s; }
        .client-card:hover { border-color: #2563eb; box-shadow: 0 4px 16px rgba(37,99,235,0.08); }
        .client-avatar { width: 44px; height: 44px; background: linear-gradient(135deg, #eff6ff, #dbeafe); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-family: 'Lora', serif; font-size: 18px; font-weight: 600; color: #2563eb; margin-bottom: 12px; }
        .client-name { font-size: 15px; font-weight: 600; color: #0f1f5c; margin-bottom: 4px; }
        .client-email { font-size: 12.5px; color: #6b7280; margin-bottom: 2px; }
        .client-phone { font-size: 12.5px; color: #6b7280; margin-bottom: 8px; }
        .client-gstin { font-size: 11.5px; color: #9ca3af; background: #f8faff; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 12px; }
        .client-stats { display: flex; gap: 12px; padding-top: 12px; border-top: 1px solid #f0f4ff; margin-bottom: 12px; }
        .client-stat { text-align: center; flex: 1; }
        .client-stat-value { font-size: 15px; font-weight: 600; color: #0f1f5c; font-family: 'Lora', serif; }
        .client-stat-label { font-size: 11px; color: #9ca3af; margin-top: 2px; }
        .client-actions { display: flex; gap: 8px; }
        .btn-invoice { flex: 1; background: #2563eb; color: #fff; border: none; padding: 8px; border-radius: 7px; font-size: 12.5px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 4px; }
        .btn-invoice:hover { background: #1d4ed8; }
        .btn-edit { background: #f8faff; color: #374151; border: 1.5px solid #e5e9f5; padding: 8px 12px; border-radius: 7px; font-size: 12.5px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .btn-edit:hover { border-color: #2563eb; color: #2563eb; }
        .btn-del { background: #fff1f2; color: #e11d48; border: none; padding: 8px 10px; border-radius: 7px; font-size: 12.5px; cursor: pointer; }
        .btn-del:hover { background: #fee2e2; }
        .empty-state { grid-column: 1/-1; padding: 60px 24px; text-align: center; background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; }
        .empty-title { font-family: 'Lora', serif; font-size: 17px; color: #0f1f5c; font-weight: 600; margin-bottom: 6px; }
        .empty-sub { font-size: 13.5px; color: #9ca3af; margin-bottom: 20px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 50; display: flex; align-items: center; justify-content: center; }
        .modal { background: #fff; border-radius: 16px; width: 520px; overflow: hidden; }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid #f0f4ff; display: flex; align-items: center; justify-content: space-between; }
        .modal-title { font-family: 'Lora', serif; font-size: 18px; color: #0f1f5c; font-weight: 600; }
        .modal-close { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 22px; line-height: 1; }
        .modal-body { padding: 20px 24px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-row.single { grid-template-columns: 1fr; }
        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 12.5px; font-weight: 500; color: #374151; margin-bottom: 5px; }
        .field input, .field textarea { width: 100%; padding: 9px 13px; border: 1.5px solid #e5e9f5; border-radius: 8px; font-size: 13.5px; font-family: 'DM Sans', sans-serif; color: #111827; outline: none; }
        .field input:focus, .field textarea:focus { border-color: #2563eb; }
        .modal-footer { padding: 16px 24px; border-top: 1px solid #f0f4ff; display: flex; gap: 10px; justify-content: flex-end; }
        .btn-cancel { background: #f3f4f6; color: #374151; border: none; padding: 9px 20px; border-radius: 8px; font-size: 13.5px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .btn-save { background: #2563eb; color: #fff; border: none; padding: 9px 20px; border-radius: 8px; font-size: 13.5px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .btn-save:disabled { opacity: 0.6; }
      
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
          .sidebar-logo img { height: 32px !important; }
          .menu-toggle { display: block !important; margin-left: auto; font-size: 28px; }
          .sidebar-nav { display: none !important; flex-direction: column; padding: 0 12px 12px; gap: 2px; width: 100%; }
          .sidebar-nav.nav-open { display: flex !important; }
          .nav-label { display: none; }
          .nav-item { padding: 7px 10px; font-size: 12px; white-space: nowrap; gap: 6px; }
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
            <a href="/dashboard" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Dashboard</a>
            <a href="/editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>New Invoice</a>
            <a href="/quote-editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>New Quote</a>
            <a href="/receipt-editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>New Receipt</a>
            <div className="nav-label">Documents</div>
            <a href="/dashboard" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>Invoices</a>
            <a href="/quotes" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Quotes</a>
            <a href="/expenses" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Expenses</a>
            <a href="/clients" className="nav-item active"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Clients</a>
            <div className="nav-label">Settings</div>
            <a href="/profile" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Business Profile</a>
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
              <h2>Client Book</h2>
              <p>Save client details once, auto-fill every invoice and quote.</p>
            </div>
            <div className="header-right">
              <input className="search-box" placeholder="Search clients…" value={search} onChange={e => setSearch(e.target.value)} />
              <button className="add-btn" onClick={() => { setForm({ name: '', email: '', phone: '', address: '', gstin: '', notes: '' }); setEditId(null); setShowForm(true); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Client
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card blue"><div className="stat-label">Total Clients</div><div className="stat-value">{clients.length}</div><div className="stat-sub">Saved in client book</div></div>
            <div className="stat-card green"><div className="stat-label">Total Billed</div><div className="stat-value">Rs. {invoices.reduce((sum, inv) => sum + (inv.total || 0), 0).toLocaleString('en-IN')}</div><div className="stat-sub">Across all clients</div></div>
            <div className="stat-card purple"><div className="stat-label">Active Clients</div><div className="stat-value">{clients.filter(c => getClientInvoices(c.name).length > 0).length}</div><div className="stat-sub">With invoices</div></div>
          </div>

          <div className="clients-grid">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-title">{search ? 'No clients found' : 'No clients yet'}</div>
                <div className="empty-sub">{search ? 'Try a different search' : 'Add your first client to auto-fill invoices and quotes'}</div>
                {!search && <button className="add-btn" style={{ margin: '0 auto' }} onClick={() => setShowForm(true)}>Add First Client</button>}
              </div>
            ) : (
              filtered.map(client => {
                const clientInvs = getClientInvoices(client.name);
                const totalBilled = clientInvs.reduce((sum, inv) => sum + (inv.total || 0), 0);
                return (
                  <div key={client.id} className="client-card">
                    <div className="client-avatar">{client.name?.[0]?.toUpperCase()}</div>
                    <div className="client-name">{client.name}</div>
                    {client.email && <div className="client-email">{client.email}</div>}
                    {client.phone && <div className="client-phone">{client.phone}</div>}
                    {client.gstin && <div className="client-gstin">GSTIN: {client.gstin}</div>}
                    <div className="client-stats">
                      <div className="client-stat">
                        <div className="client-stat-value">{clientInvs.length}</div>
                        <div className="client-stat-label">Invoices</div>
                      </div>
                      <div className="client-stat">
                        <div className="client-stat-value">Rs. {totalBilled.toLocaleString('en-IN')}</div>
                        <div className="client-stat-label">Total Billed</div>
                      </div>
                    </div>
                    <div className="client-actions">
                      <a href={`/editor?clientName=${encodeURIComponent(client.name)}&clientEmail=${encodeURIComponent(client.email || '')}&clientAddress=${encodeURIComponent(client.address || '')}&clientGSTIN=${encodeURIComponent(client.gstin || '')}`} className="btn-invoice">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        New Invoice
                      </a>
                      <button className="btn-edit" onClick={() => handleEdit(client)}>Edit</button>
                      <button className="btn-del" onClick={() => handleDelete(client.id)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editId ? 'Edit Client' : 'Add Client'}</div>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row single">
                <div className="field"><label>Client Name *</label><input name="name" value={form.name} onChange={handleChange} placeholder="Acme Corp or John Doe" /></div>
              </div>
              <div className="form-row">
                <div className="field"><label>Email</label><input type="email" name="email" value={form.email} onChange={handleChange} placeholder="client@company.com" /></div>
                <div className="field"><label>Phone</label><input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" /></div>
              </div>
              <div className="form-row single">
                <div className="field"><label>Address</label><input name="address" value={form.address} onChange={handleChange} placeholder="Street, City, State, Pincode" /></div>
              </div>
              <div className="form-row single">
                <div className="field"><label>GSTIN (optional)</label><input name="gstin" value={form.gstin} onChange={handleChange} placeholder="29AAABC1234D1Z5" /></div>
              </div>
              <div className="form-row single">
                <div className="field"><label>Notes (optional)</label><textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Any notes about this client" /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editId ? 'Update Client' : 'Save Client'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
