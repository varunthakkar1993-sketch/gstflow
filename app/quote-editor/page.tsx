'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getCountFromServer } from 'firebase/firestore';
import jsPDF from 'jspdf';

export default function QuoteEditor() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);

  const [quoteData, setQuoteData] = useState({
    quoteNumber: '',
    date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    clientGSTIN: '',
    items: [{ description: '', amount: '' }],
    notes: '',
  });

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { window.location.href = '/login'; return; }
      setUser(currentUser);
      const profileSnap = await getDoc(doc(db, 'profiles', currentUser.uid));
      if (profileSnap.exists()) setProfile(profileSnap.data());
      const q = query(collection(db, 'quotes'), where('userId', '==', currentUser.uid));
      const countSnap = await getCountFromServer(q);
      const count = countSnap.data().count + 1;
      setQuoteData(prev => ({ ...prev, quoteNumber: `QT-${String(count).padStart(3, '0')}` }));
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setQuoteData({ ...quoteData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const items = [...quoteData.items];
    items[index] = { ...items[index], [field]: value };
    setQuoteData({ ...quoteData, items });
  };

  const addItem = () => setQuoteData({ ...quoteData, items: [...quoteData.items, { description: '', amount: '' }] });
  const removeItem = (i: number) => setQuoteData({ ...quoteData, items: quoteData.items.filter((_, idx) => idx !== i) });

  const total = quoteData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const buildPDF = async () => {
    const doc2 = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc2.internal.pageSize.getWidth();
    const pageHeight = doc2.internal.pageSize.getHeight();
    doc2.setFillColor(109, 40, 217);
    doc2.rect(0, 0, pageWidth, 42, 'F');
    if (profile?.logoBase64) {
      try {
        const ext = profile.logoBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc2.addImage(profile.logoBase64, ext, 12, 8, 0, 26);
      } catch (e) {}
    }
    doc2.setFontSize(22); doc2.setFont('helvetica', 'bold');
    doc2.setTextColor(255, 255, 255);
    doc2.text('QUOTE', pageWidth - 14, 24, { align: 'right' });
    doc2.setFontSize(8); doc2.setFont('helvetica', 'normal');
    doc2.setTextColor(210, 190, 255);
    doc2.text(`${quoteData.quoteNumber}  ·  Valid until ${quoteData.validUntil}`, pageWidth - 14, 32, { align: 'right' });
    let y = 54;
    doc2.setFontSize(13); doc2.setFont('helvetica', 'bold');
    doc2.setTextColor(109, 40, 217);
    doc2.text(profile?.businessName || 'Your Business', 14, y); y += 6;
    doc2.setFontSize(8); doc2.setFont('helvetica', 'normal');
    doc2.setTextColor(100, 110, 130);
    if (profile?.address) { doc2.text(`${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`, 14, y); y += 5; }
    if (profile?.gstin) { doc2.text(`GSTIN: ${profile.gstin}`, 14, y); y += 5; }
    if (profile?.phone) { doc2.text(`Phone: ${profile.phone}`, 14, y); y += 5; }
    y += 3;
    doc2.setDrawColor(109, 40, 217); doc2.setLineWidth(0.5);
    doc2.line(14, y, pageWidth - 14, y); y += 8;
    doc2.setFontSize(7.5); doc2.setFont('helvetica', 'bold'); doc2.setTextColor(100, 110, 130);
    doc2.text('PREPARED FOR', 14, y); doc2.text('QUOTE DETAILS', pageWidth / 2, y); y += 5;
    doc2.setFont('helvetica', 'bold'); doc2.setFontSize(9.5); doc2.setTextColor(15, 31, 92);
    doc2.text(quoteData.clientName || 'Client', 14, y);
    doc2.setFont('helvetica', 'normal'); doc2.setFontSize(8.5); doc2.setTextColor(60, 70, 90);
    doc2.text(`Quote #: ${quoteData.quoteNumber}`, pageWidth / 2, y); y += 5;
    doc2.setTextColor(100, 110, 130); doc2.setFontSize(8);
    if (quoteData.clientEmail) { doc2.text(quoteData.clientEmail, 14, y); }
    doc2.text(`Valid Until: ${quoteData.validUntil}`, pageWidth / 2, y); y += 5;
    if (quoteData.clientAddress) { doc2.text(quoteData.clientAddress, 14, y); y += 5; }
    y += 5;
    doc2.setFillColor(245, 240, 255);
    doc2.rect(14, y - 4, pageWidth - 28, 10, 'F');
    doc2.setFontSize(8); doc2.setFont('helvetica', 'bold'); doc2.setTextColor(109, 40, 217);
    doc2.text('DESCRIPTION', 18, y + 2); doc2.text('AMOUNT (Rs.)', pageWidth - 18, y + 2, { align: 'right' }); y += 12;
    quoteData.items.forEach(item => {
      if (!item.description && !item.amount) return;
      doc2.setFont('helvetica', 'normal'); doc2.setFontSize(9); doc2.setTextColor(30, 40, 60);
      doc2.text(item.description || '—', 18, y);
      doc2.text((parseFloat(item.amount) || 0).toLocaleString('en-IN'), pageWidth - 18, y, { align: 'right' }); y += 8;
    });
    y += 2;
    doc2.setFillColor(109, 40, 217); doc2.rect(14, y, pageWidth - 28, 12, 'F');
    doc2.setFontSize(11); doc2.setFont('helvetica', 'bold'); doc2.setTextColor(255, 255, 255);
    doc2.text('TOTAL ESTIMATE', 18, y + 8);
    doc2.text(`Rs. ${total.toLocaleString('en-IN')}`, pageWidth - 18, y + 8, { align: 'right' }); y += 20;
    if (quoteData.notes) {
      doc2.setFontSize(7.5); doc2.setFont('helvetica', 'bold'); doc2.setTextColor(100, 110, 130);
      doc2.text('NOTES', 14, y); y += 5;
      doc2.setFont('helvetica', 'normal'); doc2.setFontSize(8.5); doc2.setTextColor(60, 70, 90);
      const lines = doc2.splitTextToSize(quoteData.notes, pageWidth - 28);
      doc2.text(lines, 14, y);
    }
    doc2.setFillColor(245, 240, 255);
    doc2.rect(0, pageHeight - 14, pageWidth, 14, 'F');
    doc2.setFontSize(8); doc2.setFont('helvetica', 'normal'); doc2.setTextColor(100, 110, 130);
    doc2.text('This is an estimate. Prices are subject to change.', 14, pageHeight - 6);
    doc2.text('Made with Paavti.in', pageWidth - 14, pageHeight - 6, { align: 'right' });
    return doc2;
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const doc2 = await buildPDF();
      doc2.save(`Paavti-${quoteData.quoteNumber}.pdf`);
      await addDoc(collection(db, 'quotes'), {
        userId: user.uid,
        quoteNumber: quoteData.quoteNumber,
        date: quoteData.date,
        validUntil: quoteData.validUntil,
        clientName: quoteData.clientName,
        clientEmail: quoteData.clientEmail,
        clientAddress: quoteData.clientAddress,
        clientGSTIN: quoteData.clientGSTIN,
        items: quoteData.items,
        notes: quoteData.notes,
        total,
        status: 'draft',
        createdAt: serverTimestamp(),
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
      alert('Failed to generate quote.');
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!quoteData.clientEmail) { alert('Please enter client email first.'); return; }
    setSending(true);
    try {
      const doc2 = await buildPDF();
      const base64 = doc2.output('datauristring').split(',')[1];
      const res = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: quoteData.clientEmail,
          invoiceNumber: quoteData.quoteNumber,
          clientName: quoteData.clientName,
          businessName: profile?.businessName || 'Paavti',
          total: total.toLocaleString('en-IN'),
          date: quoteData.date,
          pdfBase64: base64,
        }),
      });
      if (res.ok) alert('✅ Quote emailed!');
      else alert('Failed to send.');
    } catch { alert('Failed to send.'); }
    finally { setSending(false); }
  };

  const sendWhatsApp = () => {
    const msg = encodeURIComponent(`Hi ${quoteData.clientName}, please find your quote ${quoteData.quoteNumber} for Rs. ${total.toLocaleString('en-IN')} from ${profile?.businessName || 'Paavti'}. Valid until ${quoteData.validUntil}.`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

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
        .nav-item.active { background: rgba(167,139,250,0.2); color: #fff; font-weight: 500; }
        .sidebar-footer { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.08); }
        .user-chip { display: flex; align-items: center; gap: 10px; padding: 8px 12px; }
        .user-avatar { width: 32px; height: 32px; background: linear-gradient(135deg, #6382ff, #3b5bdb); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 600; flex-shrink: 0; }
        .user-email { font-size: 11.5px; color: rgba(255,255,255,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .main { margin-left: 240px; flex: 1; padding: 36px 40px; }
        .page-header { margin-bottom: 28px; }
        .page-header h2 { font-family: 'Lora', serif; font-size: 26px; color: #0f1f5c; font-weight: 600; }
        .page-header p { color: #6b7280; font-size: 14px; margin-top: 4px; }
        .editor-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
        .card { background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; overflow: hidden; margin-bottom: 20px; }
        .card-header { padding: 16px 24px; border-bottom: 1px solid #f0f4ff; display: flex; align-items: center; gap: 10px; }
        .card-header h3 { font-size: 14px; font-weight: 600; color: #0f1f5c; }
        .card-icon { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; }
        .card-body { padding: 20px 24px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-row.single { grid-template-columns: 1fr; }
        .field { margin-bottom: 16px; }
        .field label { display: block; font-size: 12.5px; font-weight: 500; color: #374151; margin-bottom: 6px; }
        .field input, .field textarea { width: 100%; padding: 10px 14px; border: 1.5px solid #e5e9f5; border-radius: 8px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #111827; background: #fff; transition: border-color 0.15s; outline: none; }
        .field input:focus, .field textarea:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
        .field input.readonly { background: #f8faff; color: #6b7280; }
        .item-row { display: grid; grid-template-columns: 1fr 140px 36px; gap: 10px; margin-bottom: 10px; align-items: center; }
        .item-input { padding: 9px 12px; border: 1.5px solid #e5e9f5; border-radius: 8px; font-size: 13.5px; font-family: 'DM Sans', sans-serif; color: #111827; outline: none; width: 100%; }
        .item-input:focus { border-color: #7c3aed; }
        .remove-btn { width: 32px; height: 32px; background: #fee2e2; border: none; border-radius: 6px; color: #dc2626; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .add-item-btn { display: inline-flex; align-items: center; gap: 6px; color: #7c3aed; font-size: 13px; font-weight: 500; background: none; border: 1.5px dashed #c4b5fd; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .add-item-btn:hover { background: #f5f3ff; }
        .summary-card { background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; position: sticky; top: 24px; }
        .summary-header { padding: 16px 24px; border-bottom: 1px solid #f0f4ff; }
        .summary-header h3 { font-family: 'Lora', serif; font-size: 16px; color: #0f1f5c; font-weight: 600; }
        .summary-body { padding: 20px 24px; }
        .summary-row { display: flex; justify-content: space-between; font-size: 13px; color: #374151; margin-bottom: 8px; }
        .summary-divider { border: none; border-top: 1px solid #f0f4ff; margin: 12px 0; }
        .summary-total { display: flex; justify-content: space-between; align-items: center; padding: 14px 0 0; }
        .summary-total-label { font-size: 14px; font-weight: 600; color: #0f1f5c; }
        .summary-total-value { font-family: 'Lora', serif; font-size: 22px; font-weight: 600; color: #7c3aed; }
        .btn-primary { width: 100%; background: #7c3aed; color: #fff; border: none; padding: 13px; border-radius: 9px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; margin-top: 20px; }
        .btn-primary:hover { background: #6d28d9; }
        .btn-primary:disabled { opacity: 0.6; }
        .success-box { background: #f5f3ff; border: 1px solid #c4b5fd; border-radius: 9px; padding: 14px; text-align: center; color: #7c3aed; font-size: 13.5px; font-weight: 500; margin-top: 20px; }
        .action-btns { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
        .btn-email { background: #2563eb; color: #fff; border: none; padding: 11px; border-radius: 9px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; }
        .btn-wa { background: #16a34a; color: #fff; border: none; padding: 11px; border-radius: 9px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; }
        .btn-secondary { background: #f8faff; color: #374151; border: 1.5px solid #e5e9f5; padding: 11px; border-radius: 9px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; text-decoration: none; display: block; text-align: center; }
        .valid-badge { display: inline-flex; align-items: center; gap: 5px; background: #f5f3ff; color: #7c3aed; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-bottom: 16px; }
      `}</style>

      <div className="root">
        <aside className="sidebar">
          <div className="sidebar-logo"><h1>Paavti</h1><p>Business Manager</p></div>
          <nav className="sidebar-nav">
            <div className="nav-label">Main</div>
            <a href="/dashboard" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              Dashboard
            </a>
            <a href="/editor" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              New Invoice
            </a>
            <a href="/quote-editor" className="nav-item active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="11" y2="17"/></svg>
              New Quote
            </a>
            <div className="nav-label">Documents</div>
            <a href="/dashboard" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              Invoices
            </a>
            <a href="/quotes" className="nav-item">
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
            <h2>New Quote</h2>
            <p>Create an estimate for your client before raising an invoice.</p>
          </div>

          <div className="editor-grid">
            <div>
              <div className="card">
                <div className="card-header">
                  <div className="card-icon" style={{ background: '#f5f3ff' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <h3>Quote Details</h3>
                </div>
                <div className="card-body">
                  <div className="form-row">
                    <div className="field"><label>Quote Number</label><input name="quoteNumber" value={quoteData.quoteNumber} className="readonly" readOnly /></div>
                    <div className="field"><label>Date</label><input type="date" name="date" value={quoteData.date} onChange={handleChange} /></div>
                  </div>
                  <div className="form-row">
                    <div className="field"><label>Valid Until</label><input type="date" name="validUntil" value={quoteData.validUntil} onChange={handleChange} /></div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-icon" style={{ background: '#f5f3ff' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <h3>Client Details</h3>
                </div>
                <div className="card-body">
                  <div className="form-row">
                    <div className="field"><label>Client Name</label><input name="clientName" value={quoteData.clientName} onChange={handleChange} placeholder="Acme Corp" /></div>
                    <div className="field"><label>Client Email</label><input type="email" name="clientEmail" value={quoteData.clientEmail} onChange={handleChange} placeholder="client@company.com" /></div>
                  </div>
                  <div className="form-row single">
                    <div className="field"><label>Client Address</label><input name="clientAddress" value={quoteData.clientAddress} onChange={handleChange} placeholder="Street, City, State, Pincode" /></div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-icon" style={{ background: '#f5f3ff' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  </div>
                  <h3>Line Items</h3>
                </div>
                <div className="card-body">
                  {quoteData.items.map((item, i) => (
                    <div key={i} className="item-row">
                      <input className="item-input" placeholder="Description" value={item.description} onChange={e => handleItemChange(i, 'description', e.target.value)} />
                      <input className="item-input" placeholder="Amount" type="number" value={item.amount} onChange={e => handleItemChange(i, 'amount', e.target.value)} />
                      {quoteData.items.length > 1 && (
                        <button className="remove-btn" onClick={() => removeItem(i)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addItem} className="add-item-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Line Item
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-icon" style={{ background: '#f5f3ff' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <h3>Notes (optional)</h3>
                </div>
                <div className="card-body">
                  <div className="field">
                    <textarea name="notes" value={quoteData.notes} onChange={handleChange} rows={3} placeholder="Payment terms, conditions, or any other notes..." />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="summary-card">
                <div className="summary-header"><h3>Quote Summary</h3></div>
                <div className="summary-body">
                  <div className="valid-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Valid until {quoteData.validUntil}
                  </div>
                  <div className="summary-row"><span>Quote</span><span style={{ fontWeight: 600 }}>{quoteData.quoteNumber}</span></div>
                  <div className="summary-row"><span>Client</span><span>{quoteData.clientName || '—'}</span></div>
                  <div className="summary-row"><span>Items</span><span>{quoteData.items.filter(i => i.description).length}</span></div>
                  <hr className="summary-divider" />
                  {quoteData.items.filter(i => i.description || i.amount).map((item, i) => (
                    <div key={i} className="summary-row">
                      <span style={{ color: '#9ca3af', fontSize: 12 }}>{item.description || `Item ${i+1}`}</span>
                      <span>Rs. {(parseFloat(item.amount) || 0).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <hr className="summary-divider" />
                  <div className="summary-total">
                    <div className="summary-total-label">Total Estimate</div>
                    <div className="summary-total-value">Rs. {total.toLocaleString('en-IN')}</div>
                  </div>
                  {!saved ? (
                    <button onClick={handleGenerate} disabled={loading} className="btn-primary">
                      {loading ? 'Generating…' : '↓ Generate & Download Quote'}
                    </button>
                  ) : (
                    <>
                      <div className="success-box">✅ Quote saved!</div>
                      <div className="action-btns">
                        <button onClick={handleGenerate} disabled={loading} className="btn-secondary">Download Again</button>
                        <button onClick={sendEmail} disabled={sending} className="btn-email">{sending ? 'Sending…' : '✉ Email to Client'}</button>
                        <button onClick={sendWhatsApp} className="btn-wa">💬 WhatsApp</button>
                        <a href="/quotes" className="btn-secondary">View All Quotes →</a>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
