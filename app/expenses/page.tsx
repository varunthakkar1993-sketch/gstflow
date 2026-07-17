'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';

const CATEGORIES = ['Software', 'Travel', 'Office', 'Contractor', 'Marketing', 'Meals', 'Tax', 'Other'];
const categoryColors: Record<string, { bg: string; color: string }> = {
  Software:   { bg: '#eff6ff', color: '#2563eb' },
  Travel:     { bg: '#f0fdf4', color: '#16a34a' },
  Office:     { bg: '#fefce8', color: '#ca8a04' },
  Contractor: { bg: '#f5f3ff', color: '#7c3aed' },
  Marketing:  { bg: '#fff1f2', color: '#e11d48' },
  Meals:      { bg: '#fff7ed', color: '#ea580c' },
  Tax:        { bg: '#f0f9ff', color: '#0284c7' },
  Other:      { bg: '#f3f4f6', color: '#6b7280' },
};

export default function ExpensesPage() {
  const [user, setUser] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [billPhotoBase64, setBillPhotoBase64] = useState('');
  const [billPhotoName, setBillPhotoName] = useState('');

  const handleBillPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBillPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 800;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        setBillPhotoBase64(compressed);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Software',
    description: '',
    vendor: '',
    amount: '',
    reference: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { window.location.href = '/login'; return; }
      setUser(currentUser);
      await fetchExpenses(currentUser.uid);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchExpenses = async (uid: string) => {
    try {
      const q = query(collection(db, 'expenses'), where('userId', '==', uid), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err: any) {
      console.error('Expenses error:', err?.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async () => {
    if (!form.description || !form.amount) { alert('Please fill description and amount.'); return; }

    setSaving(true);
    try {
        await addDoc(collection(db, 'expenses'), {
          userId: user.uid,
          date: form.date,
          category: form.category,
          description: form.description,
          vendor: form.vendor,
          amount: parseFloat(form.amount),
          reference: form.reference,
          gstRate: form.gstRate || '0',
          billPhotoBase64: billPhotoBase64 || '',
          createdAt: serverTimestamp(),
        });
      setForm({ date: new Date().toISOString().split('T')[0], category: 'Software', description: '', vendor: '', amount: '', reference: '', gstRate: '0' });
      setBillPhotoBase64('');
      setBillPhotoName('');
      setShowForm(false);
      await fetchExpenses(user.uid);
    } catch (err) {
      alert('Failed to save expense.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    await deleteDoc(doc(db, 'expenses', id));
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const thisMonth = expenses.filter(e => {
    if (!e.date) return false;
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonth.reduce((sum, e) => sum + (e.amount || 0), 0);
  const byCategory = CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + (e.amount || 0), 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
        .add-btn { display: inline-flex; align-items: center; gap: 6px; background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 13.5px; font-weight: 500; cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
        .stat-card { background: #fff; border-radius: 12px; padding: 20px 24px; border: 1px solid #e5e9f5; position: relative; overflow: hidden; }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
        .stat-card.red::before { background: #dc2626; }
        .stat-card.orange::before { background: #ea580c; }
        .stat-card.purple::before { background: #7c3aed; }
        .stat-label { font-size: 13px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 500; }
        .stat-value { font-family: 'Lora', serif; font-size: 26px; color: #0f1f5c; font-weight: 600; margin-top: 6px; }
        .stat-sub { font-size: 12px; color: #9ca3af; margin-top: 4px; }
        .content-grid { display: grid; grid-template-columns: 1fr 260px; gap: 24px; }
        .card { background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; overflow: hidden; }
        .card-header { padding: 16px 24px; border-bottom: 1px solid #f0f4ff; }
        .card-title { font-family: 'Lora', serif; font-size: 16px; color: #0f1f5c; font-weight: 600; }
        .table-head { display: grid; grid-template-columns: 110px 1fr 1fr 100px 90px; gap: 12px; padding: 10px 24px; background: #f8faff; border-bottom: 1px solid #e5e9f5; }
        .th { font-size: 11.5px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600; }
        .table-row { display: grid; grid-template-columns: 110px 1fr 1fr 100px 90px; gap: 12px; padding: 14px 24px; border-bottom: 1px solid #f3f4f6; align-items: center; }
        .table-row:last-child { border-bottom: none; }
        .table-row:hover { background: #f8faff; }
        .cat-badge { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
        .exp-desc { font-size: 14px; color: #111827; font-weight: 500; }
        .exp-ref { font-size: 12px; color: #9ca3af; margin-top: 2px; }
        .exp-vendor { font-size: 13px; color: #6b7280; }
        .exp-amount { font-size: 14px; font-weight: 600; color: #dc2626; }
        .exp-date { font-size: 12.5px; color: #6b7280; }
        .delete-btn { background: none; border: none; color: #9ca3af; cursor: pointer; padding: 4px; border-radius: 4px; }
        .delete-btn:hover { color: #dc2626; }
        .empty-state { padding: 48px 24px; text-align: center; }
        .empty-title { font-family: 'Lora', serif; font-size: 16px; color: #0f1f5c; font-weight: 600; margin-bottom: 6px; }
        .empty-sub { font-size: 13.5px; color: #9ca3af; }
        .cat-row { display: flex; align-items: center; padding: 10px 24px; gap: 10px; }
        .cat-bar-wrap { flex: 1; height: 4px; background: #f0f4ff; border-radius: 2px; }
        .cat-bar { height: 4px; border-radius: 2px; }
        .cat-name { font-size: 12.5px; min-width: 80px; }
        .cat-amt { font-size: 12.5px; font-weight: 600; color: #374151; min-width: 90px; text-align: right; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 50; display: flex; align-items: center; justify-content: center; }
        .modal { background: #fff; border-radius: 16px; width: 500px; overflow: hidden; }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid #f0f4ff; display: flex; align-items: center; justify-content: space-between; }
        .modal-title { font-family: 'Lora', serif; font-size: 18px; color: #0f1f5c; font-weight: 600; }
        .modal-close { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 22px; line-height: 1; }
        .modal-body { padding: 20px 24px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-row.single { grid-template-columns: 1fr; }
        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 12.5px; font-weight: 500; color: #374151; margin-bottom: 5px; }
        .field input, .field select { width: 100%; padding: 9px 13px; border: 1.5px solid #e5e9f5; border-radius: 8px; font-size: 13.5px; font-family: 'DM Sans', sans-serif; color: #111827; outline: none; }
        .field input:focus, .field select:focus { border-color: #2563eb; }
        .modal-footer { padding: 16px 24px; border-top: 1px solid #f0f4ff; display: flex; gap: 10px; justify-content: flex-end; }
        .btn-cancel { background: #f3f4f6; color: #374151; border: none; padding: 9px 20px; border-radius: 8px; font-size: 13.5px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .btn-save { background: #2563eb; color: #fff; border: none; padding: 9px 20px; border-radius: 8px; font-size: 13.5px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .btn-save:disabled { opacity: 0.6; }
        .bill-photo-link { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; color: #2563eb; text-decoration: none; font-weight: 500; }
        .bill-photo-link:hover { text-decoration: underline; }
      `}</style>

      <div className="root">
        <aside className="sidebar">
          <div className="sidebar-logo"><h1>Paavti</h1><p>Business Manager</p></div>
          <nav className="sidebar-nav">
            <div className="nav-label">Main</div>
            <a href="/dashboard" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Dashboard</a>
            <a href="/editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>New Invoice</a>
            <a href="/quote-editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>New Quote</a>
            <a href="/receipt-editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>New Receipt</a>
            <div className="nav-label">Documents</div>
            <a href="/dashboard" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>Invoices</a>
            <a href="/quotes" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Quotes</a>
            <a href="/expenses" className="nav-item active"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Expenses</a>
            <a href="/clients" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Clients</a>
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
            <div><h2>Expenses</h2><p>Track your business expenses and see your net profit.</p></div>
            <button className="add-btn" onClick={() => setShowForm(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Expense
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card red"><div className="stat-label">Total Expenses</div><div className="stat-value">Rs. {totalExpenses.toLocaleString('en-IN')}</div><div className="stat-sub">All time</div></div>
            <div className="stat-card orange"><div className="stat-label">This Month</div><div className="stat-value">Rs. {thisMonthTotal.toLocaleString('en-IN')}</div><div className="stat-sub">{thisMonth.length} expense{thisMonth.length !== 1 ? 's' : ''}</div></div>
            <div className="stat-card purple"><div className="stat-label">Categories Used</div><div className="stat-value">{byCategory.length}</div><div className="stat-sub">Active categories</div></div>
          </div>

          <div className="content-grid">
            <div className="card">
              <div className="card-header"><div className="card-title">All Expenses</div></div>
              <div className="table-head">
                <div className="th">Category</div>
                <div className="th">Description</div>
                <div className="th">Vendor</div>
                <div className="th">Amount</div>
                <div className="th">Date</div>
              </div>
              {expenses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-title">No expenses yet</div>
                  <div className="empty-sub">Click "Add Expense" to log your first business expense</div>
                </div>
              ) : (
                expenses.map(exp => (
                  <div key={exp.id} className="table-row">
                    <span className="cat-badge" style={categoryColors[exp.category] || categoryColors.Other}>{exp.category}</span>
                    <div><div className="exp-desc">{exp.description}</div>{exp.reference && <div className="exp-ref">Ref: {exp.reference}</div>}</div>
                    <div className="exp-vendor">{exp.vendor || '—'}</div>
                    <div className="exp-amount">- Rs. {(exp.amount || 0).toLocaleString('en-IN')}</div>
                    <div>
                      <div className="exp-date">{exp.date}</div>
                      <button className="delete-btn" onClick={() => handleDelete(exp.id)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">By Category</div></div>
              {byCategory.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No data yet</div>
              ) : (
                byCategory.map(c => (
                  <div key={c.cat} className="cat-row">
                    <div className="cat-name" style={{ color: categoryColors[c.cat]?.color || '#6b7280' }}>{c.cat}</div>
                    <div className="cat-bar-wrap"><div className="cat-bar" style={{ width: `${Math.round((c.total / totalExpenses) * 100)}%`, background: categoryColors[c.cat]?.color || '#6b7280' }} /></div>
                    <div className="cat-amt">Rs. {c.total.toLocaleString('en-IN')}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Expense</div>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="field"><label>Date</label><input type="date" name="date" value={form.date} onChange={handleChange} /></div>
                <div className="field"><label>Category</label><select name="category" value={form.category} onChange={handleChange}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div className="form-row single">
                <div className="field"><label>Description *</label><input name="description" value={form.description} onChange={handleChange} placeholder="e.g. AWS hosting subscription" /></div>
              </div>
              <div className="form-row">
                <div className="field"><label>Vendor / Paid To</label><input name="vendor" value={form.vendor} onChange={handleChange} placeholder="e.g. Amazon Web Services" /></div>
                <div className="field"><label>Amount (Rs.) *</label><input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="0" /></div>
                <div className="field"><label>GST on this expense</label><select name="gstRate" value={form.gstRate} onChange={handleChange}><option value="0">0% - No GST</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option></select></div>
              </div>
              <div className="form-row single">
                <div className="field"><label>Reference / Notes</label><input name="reference" value={form.reference} onChange={handleChange} placeholder="Invoice number, receipt ID, or any notes" /></div>
                <div className="form-row single">
                  <div className="field">
                    <label>Bill Photo (optional)</label>
                    <input type="file" accept="image/*" onChange={handleBillPhoto} style={{ padding: '8px 0' }} />
                    {billPhotoBase64 && <div style={{ marginTop: '8px' }}><img src={billPhotoBase64} alt="Bill" style={{ maxWidth: '120px', borderRadius: '6px', border: '1px solid #e5e9f5' }} /><div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>{billPhotoName}</div></div>}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-save" onClick={handleAdd} disabled={saving}>{saving ? 'Saving…' : 'Save Expense'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
