'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getCountFromServer } from 'firebase/firestore';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export default function InvoiceEditor() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [invoiceSaved, setInvoiceSaved] = useState(false);
  const [pdfBase64, setPdfBase64] = useState('');
  const [sending, setSending] = useState(false);

  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    clientGSTIN: '',
    description: 'Web Development Services',
    amount: '5000',
    isIntraState: 'true',
    gstRate: '18',
  });

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { window.location.href = '/login'; return; }
      setUser(currentUser);
      const profileSnap = await getDoc(doc(db, 'profiles', currentUser.uid));
      if (profileSnap.exists()) setProfile(profileSnap.data());
      const q = query(collection(db, 'invoices'), where('userId', '==', currentUser.uid));
      const countSnap = await getCountFromServer(q);
      const count = countSnap.data().count + 1;
      setInvoiceData(prev => ({ ...prev, invoiceNumber: `INV-${String(count).padStart(3, '0')}` }));
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setInvoiceData({ ...invoiceData, [e.target.name]: e.target.value });
  };

  const subtotal = parseFloat(invoiceData.amount) || 0;
  const rate = parseFloat(invoiceData.gstRate) / 100 || 0;
  const taxAmount = subtotal * rate;
  const isIntra = invoiceData.isIntraState === 'true';
  const total = subtotal + (isIntra ? taxAmount * 2 : taxAmount);

  const buildPDF = async () => {
    const doc2 = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc2.internal.pageSize.getWidth();
    const pageHeight = doc2.internal.pageSize.getHeight();

    // Dark header band
    doc2.setFillColor(15, 31, 92);
    doc2.rect(0, 0, pageWidth, 42, 'F');

    // Logo in header
    if (profile?.logoBase64) {
      try {
        const ext = profile.logoBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc2.addImage(profile.logoBase64, ext, 12, 8, 0, 26);
      } catch (e) {}
    }

    // INVOICE label in header top-right
    doc2.setFontSize(22); doc2.setFont('helvetica', 'bold');
    doc2.setTextColor(255, 255, 255);
    doc2.text('INVOICE', pageWidth - 14, 24, { align: 'right' });
    doc2.setFontSize(8); doc2.setFont('helvetica', 'normal');
    doc2.setTextColor(180, 195, 230);
    doc2.text(`${invoiceData.invoiceNumber}  ·  ${invoiceData.date}`, pageWidth - 14, 32, { align: 'right' });

    // Business info below header
    let y = 54;
    doc2.setFontSize(13); doc2.setFont('helvetica', 'bold');
    doc2.setTextColor(15, 31, 92);
    doc2.text(profile?.businessName || 'Your Business', 14, y); y += 6;
    doc2.setFontSize(8); doc2.setFont('helvetica', 'normal');
    doc2.setTextColor(100, 110, 130);
    if (profile?.address) { doc2.text(`${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`, 14, y); y += 5; }
    if (profile?.gstin) { doc2.text(`GSTIN: ${profile.gstin}`, 14, y); y += 5; }
    if (profile?.phone) { doc2.text(`Phone: ${profile.phone}`, 14, y); y += 5; }

    // Blue accent line
    y += 3;
    doc2.setDrawColor(37, 99, 235);
    doc2.setLineWidth(0.5);
    doc2.line(14, y, pageWidth - 14, y);
    y += 8;

    // Bill To / Invoice Details two columns
    doc2.setFontSize(7.5); doc2.setFont('helvetica', 'bold');
    doc2.setTextColor(100, 110, 130);
    doc2.text('BILL TO', 14, y);
    doc2.text('INVOICE DETAILS', pageWidth / 2, y);
    y += 5;

    doc2.setFont('helvetica', 'bold'); doc2.setFontSize(9.5);
    doc2.setTextColor(15, 31, 92);
    doc2.text(invoiceData.clientName || 'Client', 14, y);
    doc2.setFont('helvetica', 'normal'); doc2.setFontSize(8.5);
    doc2.setTextColor(60, 70, 90);
    doc2.text(`Invoice #: ${invoiceData.invoiceNumber}`, pageWidth / 2, y); y += 5;
    doc2.setTextColor(100, 110, 130); doc2.setFontSize(8);
    if (invoiceData.clientEmail) { doc2.text(invoiceData.clientEmail, 14, y); }
    doc2.setTextColor(60, 70, 90);
    doc2.text(`Date: ${invoiceData.date}`, pageWidth / 2, y); y += 5;
    doc2.setTextColor(100, 110, 130);
    if (invoiceData.clientAddress) { doc2.text(invoiceData.clientAddress, 14, y); y += 5; }
    if (invoiceData.clientGSTIN) { doc2.text(`GSTIN: ${invoiceData.clientGSTIN}`, 14, y); y += 5; }

    // Items table header
    y += 5;
    doc2.setFillColor(240, 244, 255);
    doc2.rect(14, y - 4, pageWidth - 28, 10, 'F');
    doc2.setFontSize(8); doc2.setFont('helvetica', 'bold');
    doc2.setTextColor(15, 31, 92);
    doc2.text('DESCRIPTION', 18, y + 2);
    doc2.text('AMOUNT (Rs.)', pageWidth - 18, y + 2, { align: 'right' });
    y += 12;

    // Item row
    doc2.setFont('helvetica', 'normal'); doc2.setFontSize(9);
    doc2.setTextColor(30, 40, 60);
    doc2.text(invoiceData.description, 18, y);
    doc2.text(subtotal.toLocaleString('en-IN'), pageWidth - 18, y, { align: 'right' });
    y += 8;

    // Tax rows
    doc2.setDrawColor(220, 225, 235);
    doc2.setLineWidth(0.3);
    doc2.line(14, y, pageWidth - 14, y); y += 6;
    doc2.setFontSize(8.5); doc2.setTextColor(100, 110, 130);
    if (isIntra) {
      doc2.text(`CGST (${parseFloat(invoiceData.gstRate) / 2}%)`, 18, y);
      doc2.text(`Rs. ${taxAmount.toFixed(2)}`, pageWidth - 18, y, { align: 'right' }); y += 6;
      doc2.text(`SGST (${parseFloat(invoiceData.gstRate) / 2}%)`, 18, y);
      doc2.text(`Rs. ${taxAmount.toFixed(2)}`, pageWidth - 18, y, { align: 'right' }); y += 6;
    } else {
      doc2.text(`IGST (${invoiceData.gstRate}%)`, 18, y);
      doc2.text(`Rs. ${taxAmount.toFixed(2)}`, pageWidth - 18, y, { align: 'right' }); y += 6;
    }

    // Total band
    y += 2;
    doc2.setFillColor(15, 31, 92);
    doc2.rect(14, y, pageWidth - 28, 12, 'F');
    doc2.setFontSize(11); doc2.setFont('helvetica', 'bold');
    doc2.setTextColor(255, 255, 255);
    doc2.text('TOTAL', 18, y + 8);
    doc2.text(`Rs. ${total.toLocaleString('en-IN')}`, pageWidth - 18, y + 8, { align: 'right' });
    y += 20;

    // Bank details
    if (profile?.bankName) {
      doc2.setFontSize(7.5); doc2.setFont('helvetica', 'bold');
      doc2.setTextColor(100, 110, 130);
      doc2.text('BANK DETAILS', 14, y); y += 5;
      doc2.setFont('helvetica', 'normal'); doc2.setFontSize(8.5);
      doc2.setTextColor(30, 40, 60);
      doc2.text(`${profile.bankName}  ·  A/C: ${profile.accountNumber}  ·  IFSC: ${profile.ifscCode}  ·  ${profile.accountHolder}`, 14, y); y += 10;
    }

    // UPI QR
    if (profile?.upiId) {
      doc2.setFontSize(7.5); doc2.setFont('helvetica', 'bold');
      doc2.setTextColor(100, 110, 130);
      doc2.text('PAY VIA UPI', 14, y); y += 5;
      const upiLink = `upi://pay?pa=${profile.upiId}&pn=${encodeURIComponent(profile.businessName || '')}&am=${total.toFixed(2)}&cu=INR`;
      const qrDataUrl = await QRCode.toDataURL(upiLink, { width: 200, margin: 1 });
      doc2.addImage(qrDataUrl, 'PNG', 14, y, 32, 32);
      doc2.setFontSize(8.5); doc2.setFont('helvetica', 'normal');
      doc2.setTextColor(30, 40, 60);
      doc2.text(profile.upiId, 50, y + 16); y += 38;
    }

    // Footer band
    doc2.setFillColor(240, 244, 255);
    doc2.rect(0, pageHeight - 14, pageWidth, 14, 'F');
    doc2.setFontSize(8); doc2.setFont('helvetica', 'normal');
    doc2.setTextColor(100, 110, 130);
    doc2.text('Thank you for your business!', 14, pageHeight - 6);
    doc2.text('Made with GSTFlow.in', pageWidth - 14, pageHeight - 6, { align: 'right' });

    return doc2;
  };

  const generateAndSavePDF = async () => {
    setLoading(true);
    try {
      const doc2 = await buildPDF();
      doc2.save(`GSTFlow-${invoiceData.invoiceNumber}.pdf`);
      const base64 = doc2.output('datauristring').split(',')[1];
      setPdfBase64(base64);
      await addDoc(collection(db, 'invoices'), {
        userId: user.uid,
        invoiceNumber: invoiceData.invoiceNumber,
        date: invoiceData.date,
        clientName: invoiceData.clientName,
        clientEmail: invoiceData.clientEmail,
        clientAddress: invoiceData.clientAddress,
        clientGSTIN: invoiceData.clientGSTIN,
        description: invoiceData.description,
        amount: subtotal,
        gstRate: invoiceData.gstRate,
        isIntraState: isIntra,
        total: total,
        createdAt: serverTimestamp(),
      });
      setInvoiceSaved(true);
    } catch (error) {
      console.error(error);
      alert('Failed to generate invoice.');
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!invoiceData.clientEmail) { alert('Please enter client email first.'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: invoiceData.clientEmail,
          invoiceNumber: invoiceData.invoiceNumber,
          clientName: invoiceData.clientName,
          businessName: profile?.businessName || 'GSTFlow',
          total: total.toLocaleString('en-IN'),
          date: invoiceData.date,
          pdfBase64,
        }),
      });
      if (res.ok) alert('✅ Invoice emailed successfully!');
      else alert('Failed to send email.');
    } catch { alert('Failed to send email.'); }
    finally { setSending(false); }
  };

  const sendWhatsApp = () => {
    const msg = encodeURIComponent(`Hi ${invoiceData.clientName}, please find your invoice ${invoiceData.invoiceNumber} for Rs. ${total.toLocaleString('en-IN')} from ${profile?.businessName || 'GSTFlow'} dated ${invoiceData.date}. Thank you for your business!`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
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
        .editor-grid { display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; }
        .card { background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; overflow: hidden; margin-bottom: 20px; }
        .card-header { padding: 16px 24px; border-bottom: 1px solid #f0f4ff; display: flex; align-items: center; gap: 10px; }
        .card-header h3 { font-size: 14px; font-weight: 600; color: #0f1f5c; }
        .card-icon { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; }
        .card-body { padding: 20px 24px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-row.single { grid-template-columns: 1fr; }
        .field { margin-bottom: 16px; }
        .field label { display: block; font-size: 12.5px; font-weight: 500; color: #374151; margin-bottom: 6px; }
        .field input, .field textarea, .field select { width: 100%; padding: 10px 14px; border: 1.5px solid #e5e9f5; border-radius: 8px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #111827; background: #fff; transition: border-color 0.15s; outline: none; }
        .field input:focus, .field textarea:focus, .field select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .field input.readonly { background: #f8faff; color: #6b7280; }
        .field textarea { resize: vertical; min-height: 80px; }
        .summary-card { background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; position: sticky; top: 24px; }
        .summary-header { padding: 16px 24px; border-bottom: 1px solid #f0f4ff; }
        .summary-header h3 { font-family: 'Lora', serif; font-size: 16px; color: #0f1f5c; font-weight: 600; }
        .summary-body { padding: 20px 24px; }
        .summary-business { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f0f4ff; }
        .summary-business-name { font-size: 15px; font-weight: 600; color: #0f1f5c; }
        .summary-business-detail { font-size: 12px; color: #9ca3af; margin-top: 3px; }
        .summary-inv-row { display: flex; justify-content: space-between; font-size: 13px; color: #374151; margin-bottom: 10px; }
        .summary-inv-row.bold { font-weight: 600; color: #0f1f5c; }
        .summary-divider { border: none; border-top: 1px solid #f0f4ff; margin: 12px 0; }
        .summary-total { display: flex; justify-content: space-between; align-items: center; padding: 14px 0 0; }
        .summary-total-label { font-size: 14px; font-weight: 600; color: #0f1f5c; }
        .summary-total-value { font-family: 'Lora', serif; font-size: 22px; font-weight: 600; color: #2563eb; }
        .btn-primary { width: 100%; background: #2563eb; color: #fff; border: none; padding: 13px; border-radius: 9px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.15s; margin-top: 20px; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .success-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 9px; padding: 14px; text-align: center; color: #16a34a; font-size: 13.5px; font-weight: 500; margin-top: 20px; }
        .action-btns { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
        .btn-email { background: #2563eb; color: #fff; border: none; padding: 11px; border-radius: 9px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-email:hover { background: #1d4ed8; }
        .btn-whatsapp { background: #16a34a; color: #fff; border: none; padding: 11px; border-radius: 9px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-whatsapp:hover { background: #15803d; }
        .btn-secondary { background: #f8faff; color: #374151; border: 1.5px solid #e5e9f5; padding: 11px; border-radius: 9px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-secondary:hover { border-color: #2563eb; color: #2563eb; }
        .profile-missing { background: #fffbeb; border: 1px solid #fde68a; border-radius: 9px; padding: 12px 16px; font-size: 13px; color: #92400e; margin-bottom: 20px; }
        .profile-missing a { color: #2563eb; font-weight: 500; }
      `}</style>

      <div className="editor-root">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>GSTFlow</h1>
            <p>Invoice Manager</p>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-label">Main</div>
            <a href="/dashboard" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              Dashboard
            </a>
            <a href="/editor" className="nav-item active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              New Invoice
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
          </div>
        </aside>

        <main className="main">
          <div className="page-header">
            <h2>New Invoice</h2>
            <p>Fill in the details below to generate a GST-compliant invoice.</p>
          </div>

          {!profile && (
            <div className="profile-missing">
              ⚠️ Business profile incomplete. <a href="/profile">Set it up here</a> so your invoices include your details.
            </div>
          )}

          <div className="editor-grid">
            <div>
              <div className="card">
                <div className="card-header">
                  <div className="card-icon" style={{ background: '#eff6ff' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <h3>Invoice Details</h3>
                </div>
                <div className="card-body">
                  <div className="form-row">
                    <div className="field">
                      <label>Invoice Number</label>
                      <input name="invoiceNumber" value={invoiceData.invoiceNumber} onChange={handleChange} className="readonly" readOnly />
                    </div>
                    <div className="field">
                      <label>Date</label>
                      <input type="date" name="date" value={invoiceData.date} onChange={handleChange} />
                    </div>
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
                    <div className="field">
                      <label>Client Name</label>
                      <input name="clientName" value={invoiceData.clientName} onChange={handleChange} placeholder="Acme Corp" />
                    </div>
                    <div className="field">
                      <label>Client Email</label>
                      <input type="email" name="clientEmail" value={invoiceData.clientEmail} onChange={handleChange} placeholder="client@company.com" />
                    </div>
                  </div>
                  <div className="form-row single">
                    <div className="field">
                      <label>Client Address</label>
                      <input name="clientAddress" value={invoiceData.clientAddress} onChange={handleChange} placeholder="Street, City, State, Pincode" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="field">
                      <label>Client GSTIN (optional)</label>
                      <input name="clientGSTIN" value={invoiceData.clientGSTIN} onChange={handleChange} placeholder="29AAABC1234D1Z5" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-icon" style={{ background: '#fff7ed' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <h3>Billing Details</h3>
                </div>
                <div className="card-body">
                  <div className="form-row single">
                    <div className="field">
                      <label>Description</label>
                      <textarea name="description" value={invoiceData.description} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="field">
                      <label>Subtotal (Rs.)</label>
                      <input type="number" name="amount" value={invoiceData.amount} onChange={handleChange} />
                    </div>
                    <div className="field">
                      <label>GST Rate</label>
                      <select name="gstRate" value={invoiceData.gstRate} onChange={handleChange}>
                        <option value="0">0% — Exempt</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18% — Standard</option>
                        <option value="28">28% — Luxury</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row single">
                    <div className="field">
                      <label>GST Type</label>
                      <select name="isIntraState" value={invoiceData.isIntraState} onChange={handleChange}>
                        <option value="true">Intra-State — CGST + SGST</option>
                        <option value="false">Inter-State — IGST</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="summary-card">
                <div className="summary-header">
                  <h3>Invoice Summary</h3>
                </div>
                <div className="summary-body">
                  {profile && (
                    <div className="summary-business">
                      <div className="summary-business-name">{profile.businessName}</div>
                      <div className="summary-business-detail">{profile.gstin ? `GSTIN: ${profile.gstin}` : 'No GSTIN set'}</div>
                      <div className="summary-business-detail">{profile.city}, {profile.state}</div>
                    </div>
                  )}

                  <div className="summary-inv-row">
                    <span>Invoice</span>
                    <span style={{ fontWeight: 600 }}>{invoiceData.invoiceNumber}</span>
                  </div>
                  <div className="summary-inv-row">
                    <span>Date</span>
                    <span>{invoiceData.date}</span>
                  </div>
                  <div className="summary-inv-row">
                    <span>Client</span>
                    <span>{invoiceData.clientName || '—'}</span>
                  </div>

                  <hr className="summary-divider" />

                  <div className="summary-inv-row">
                    <span>Subtotal</span>
                    <span>Rs. {subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {isIntra ? (
                    <>
                      <div className="summary-inv-row">
                        <span>CGST ({parseFloat(invoiceData.gstRate) / 2}%)</span>
                        <span>Rs. {taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="summary-inv-row">
                        <span>SGST ({parseFloat(invoiceData.gstRate) / 2}%)</span>
                        <span>Rs. {taxAmount.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="summary-inv-row">
                      <span>IGST ({invoiceData.gstRate}%)</span>
                      <span>Rs. {taxAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <hr className="summary-divider" />

                  <div className="summary-total">
                    <div className="summary-total-label">Total</div>
                    <div className="summary-total-value">Rs. {total.toLocaleString('en-IN')}</div>
                  </div>

                  {!invoiceSaved ? (
                    <button onClick={generateAndSavePDF} disabled={loading} className="btn-primary">
                      {loading ? 'Generating…' : '↓ Generate & Download PDF'}
                    </button>
                  ) : (
                    <>
                      <div className="success-box">✅ Invoice saved successfully!</div>
                      <div className="action-btns">
                        <button onClick={generateAndSavePDF} disabled={loading} className="btn-secondary">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Download Again
                        </button>
                        <button onClick={sendEmail} disabled={sending} className="btn-email">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          {sending ? 'Sending…' : 'Email to Client'}
                        </button>
                        <button onClick={sendWhatsApp} className="btn-whatsapp">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                          Send via WhatsApp
                        </button>
                        <button onClick={() => window.location.href = '/dashboard'} className="btn-secondary">
                          ← Back to Dashboard
                        </button>
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
