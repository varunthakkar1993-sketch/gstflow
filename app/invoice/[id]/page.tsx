'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export default function InvoiceDetail() {
  const params = useParams();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!id) return;
    onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { window.location.href = '/login'; return; }
      setUser(currentUser);
      try {
        const [invSnap, profileSnap] = await Promise.all([
          getDoc(doc(db, 'invoices', id)),
          getDoc(doc(db, 'profiles', currentUser.uid)),
        ]);
        if (invSnap.exists()) setInvoice({ id: invSnap.id, ...invSnap.data() });
        if (profileSnap.exists()) setProfile(profileSnap.data());
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    });
  }, [id]);

  const buildPDF = async () => {
    const doc2 = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc2.internal.pageSize.getWidth();
    doc2.setFontSize(20); doc2.setFont('helvetica', 'bold');
    doc2.text(profile?.businessName || 'Your Business', 20, 22);
    doc2.setFontSize(9); doc2.setFont('helvetica', 'normal');
    if (profile?.address) doc2.text(`${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`, 20, 29);
    if (profile?.gstin) doc2.text(`GSTIN: ${profile.gstin}`, 20, 35);
    if (profile?.phone) doc2.text(`Phone: ${profile.phone}`, 20, 41);
    doc2.setFontSize(22); doc2.setFont('helvetica', 'bold');
    doc2.text('INVOICE', pageWidth - 20, 22, { align: 'right' });
    doc2.setFontSize(9); doc2.setFont('helvetica', 'normal');
    doc2.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - 20, 30, { align: 'right' });
    doc2.text(`Date: ${invoice.date}`, pageWidth - 20, 36, { align: 'right' });
    doc2.setLineWidth(0.8); doc2.line(20, 50, pageWidth - 20, 50);
    let y = 60;
    doc2.setFontSize(10); doc2.setFont('helvetica', 'bold');
    doc2.text('Bill To:', 20, y); y += 7;
    doc2.setFont('helvetica', 'normal');
    doc2.text(invoice.clientName || 'Client Name', 20, y); y += 6;
    if (invoice.clientEmail) { doc2.text(invoice.clientEmail, 20, y); y += 6; }
    if (invoice.clientAddress) { doc2.text(invoice.clientAddress, 20, y); y += 6; }
    if (invoice.clientGSTIN) { doc2.text(`GSTIN: ${invoice.clientGSTIN}`, 20, y); y += 6; }
    y += 8;
    doc2.setFont('helvetica', 'bold'); doc2.setFontSize(10);
    doc2.text('Description', 20, y);
    doc2.text('Amount (Rs.)', pageWidth - 20, y, { align: 'right' });
    y += 5; doc2.setLineWidth(0.3); doc2.line(20, y, pageWidth - 20, y); y += 7;
    doc2.setFont('helvetica', 'normal');
    doc2.text(invoice.description || '', 20, y);
    doc2.text((invoice.amount || 0).toLocaleString('en-IN'), pageWidth - 20, y, { align: 'right' }); y += 10;
    const taxAmount = (invoice.amount || 0) * (parseFloat(invoice.gstRate) / 100);
    doc2.line(20, y, pageWidth - 20, y); y += 7;
    doc2.setFont('helvetica', 'bold');
    if (invoice.isIntraState) {
      doc2.text(`CGST (${parseFloat(invoice.gstRate) / 2}%)`, 20, y);
      doc2.text((taxAmount/2).toFixed(2), pageWidth - 20, y, { align: 'right' }); y += 7;
      doc2.text(`SGST (${parseFloat(invoice.gstRate) / 2}%)`, 20, y);
      doc2.text((taxAmount/2).toFixed(2), pageWidth - 20, y, { align: 'right' }); y += 7;
    } else {
      doc2.text(`IGST (${invoice.gstRate}%)`, 20, y);
      doc2.text(taxAmount.toFixed(2), pageWidth - 20, y, { align: 'right' }); y += 7;
    }
    doc2.setLineWidth(0.8); doc2.line(20, y, pageWidth - 20, y); y += 8;
    doc2.setFontSize(12);
    doc2.text('Total', 20, y);
    doc2.text(`Rs. ${(invoice.total || 0).toLocaleString('en-IN')}`, pageWidth - 20, y, { align: 'right' }); y += 16;
    if (profile?.bankName) {
      doc2.setFontSize(10); doc2.setFont('helvetica', 'bold');
      doc2.text('Bank Details:', 20, y); y += 7;
      doc2.setFont('helvetica', 'normal');
      doc2.text(`Bank: ${profile.bankName}`, 20, y); y += 6;
      doc2.text(`Account Holder: ${profile.accountHolder}`, 20, y); y += 6;
      doc2.text(`Account No: ${profile.accountNumber}`, 20, y); y += 6;
      doc2.text(`IFSC: ${profile.ifscCode}`, 20, y); y += 10;
    }
    if (profile?.upiId) {
      doc2.setFont('helvetica', 'bold'); doc2.setFontSize(10);
      doc2.text('Pay via UPI:', 20, y); y += 7;
      const upiLink = `upi://pay?pa=${profile.upiId}&pn=${encodeURIComponent(profile.businessName || '')}&am=${(invoice.total || 0).toFixed(2)}&cu=INR`;
      const qrDataUrl = await QRCode.toDataURL(upiLink, { width: 200, margin: 1 });
      doc2.addImage(qrDataUrl, 'PNG', 20, y, 40, 40);
      doc2.setFont('helvetica', 'normal');
      doc2.text(profile.upiId, 65, y + 20); y += 48;
    }
    doc2.setFontSize(9); doc2.setFont('helvetica', 'normal');
    doc2.text('Thank you for your business!', 20, y);
    doc2.text('Made with Paavti.in', 20, y + 6);
    return doc2;
  };

  const handleDownload = async () => {
    setDownloading(true);
    const doc2 = await buildPDF();
    doc2.save(`Paavti-${invoice.invoiceNumber}.pdf`);
    setDownloading(false);
  };

  const handleEmail = async () => {
    if (!invoice.clientEmail) { alert('No client email on this invoice.'); return; }
    setSending(true);
    const doc2 = await buildPDF();
    const base64 = doc2.output('datauristring').split(',')[1];
    const res = await fetch('/api/send-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: invoice.clientEmail,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        businessName: profile?.businessName || 'Paavti',
        total: (invoice.total || 0).toLocaleString('en-IN'),
        date: invoice.date,
        pdfBase64: base64,
      }),
    });
    if (res.ok) alert('✅ Invoice emailed successfully!');
    else alert('Failed to send email.');
    setSending(false);
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hi ${invoice.clientName}, please find your invoice ${invoice.invoiceNumber} for Rs. ${(invoice.total || 0).toLocaleString('en-IN')} from ${profile?.businessName || 'Paavti'} dated ${invoice.date}. Thank you for your business!`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
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

  if (!invoice) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Invoice not found. <a href="/dashboard">Go back</a></p>
    </div>
  );

  const taxAmount = (invoice.amount || 0) * (parseFloat(invoice.gstRate) / 100);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f4ff; font-family: 'DM Sans', sans-serif; }
        .sidebar { width: 240px; background: #0f1f5c; min-height: 100vh; display: flex; flex-direction: column; position: fixed; left: 0; top: 0; bottom: 0; z-index: 10; }
        .sidebar-logo { padding: 28px 24px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .sidebar-logo h1 { font-family: 'Lora', serif; font-size: 22px; color: #fff; font-weight: 600; }
        .sidebar-logo p { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; letter-spacing: 0.5px; text-transform: uppercase; }
        .sidebar-nav { padding: 20px 12px; flex: 1; }
        .nav-label { font-size: 10px; color: rgba(255,255,255,0.3); letter-spacing: 1px; text-transform: uppercase; padding: 0 12px; margin-bottom: 8px; margin-top: 16px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; color: rgba(255,255,255,0.6); font-size: 13.5px; text-decoration: none; transition: all 0.15s; }
        .nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .main { margin-left: 240px; padding: 36px 40px; max-width: 900px; }
        .back-btn { display: inline-flex; align-items: center; gap: 6px; color: #6b7280; font-size: 13.5px; text-decoration: none; margin-bottom: 24px; transition: color 0.15s; }
        .back-btn:hover { color: #2563eb; }
        .inv-card { background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; overflow: hidden; }
        .inv-card-header { padding: 24px 32px; border-bottom: 1px solid #f0f4ff; display: flex; justify-content: space-between; align-items: center; }
        .inv-title { font-family: 'Lora', serif; font-size: 22px; font-weight: 600; color: #0f1f5c; }
        .inv-meta { font-size: 13px; color: #9ca3af; margin-top: 4px; }
        .status-badge { padding: 5px 14px; border-radius: 20px; font-size: 12.5px; font-weight: 500; }
        .inv-body { padding: 32px; }
        .inv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
        .inv-section-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.7px; font-weight: 600; margin-bottom: 12px; }
        .inv-field-value { font-size: 14px; color: #111827; font-weight: 500; }
        .inv-field-sub { font-size: 12.5px; color: #9ca3af; margin-top: 3px; }
        .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .inv-table th { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.7px; padding: 10px 0; border-bottom: 1px solid #f0f4ff; text-align: left; }
        .inv-table th:last-child { text-align: right; }
        .inv-table td { padding: 12px 0; font-size: 14px; color: #374151; border-bottom: 1px solid #f9fafb; }
        .inv-table td:last-child { text-align: right; font-weight: 500; }
        .inv-total-row { display: flex; justify-content: space-between; padding: 16px 0 0; border-top: 2px solid #0f1f5c; }
        .inv-total-label { font-size: 15px; font-weight: 600; color: #0f1f5c; }
        .inv-total-value { font-family: 'Lora', serif; font-size: 22px; font-weight: 700; color: #2563eb; }
        .action-bar { padding: 20px 32px; background: #f8faff; border-top: 1px solid #f0f4ff; display: flex; gap: 12px; flex-wrap: wrap; }
        .btn { padding: 10px 20px; border-radius: 8px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 7px; transition: all 0.15s; text-decoration: none; }
        .btn-primary { background: #2563eb; color: #fff; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-green { background: #16a34a; color: #fff; }
        .btn-green:hover { background: #15803d; }
        .btn-outline { background: #fff; color: #374151; border: 1.5px solid #e5e9f5; }
        .btn-outline:hover { border-color: #2563eb; color: #2563eb; }
      
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

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img src="/logo-white.svg" alt="Paavti" style={{ height: '38px' }} />
            <p>Business Manager</p>
            <button className="menu-toggle" onClick={() => setShowMenu(!showMenu)}>&#9776;</button>
          </div>
          <nav className={`sidebar-nav ${showMenu ? "nav-open" : ""}`}>
            <div className="nav-label">Main</div>
            <a href="/dashboard" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Dashboard</a>
            <a href="/editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>New Invoice</a>
            <a href="/quote-editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>New Quote</a>
            <a href="/receipt-editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>New Receipt</a>
            <a href="/reports" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>Reports</a>
            <div className="nav-label">Documents</div>
            <a href="/dashboard" className="nav-item active"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>Invoices</a>
            <a href="/quotes" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Quotes</a>
            <a href="/expenses" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Expenses</a>
            <a href="/clients" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Clients</a>
            <div className="nav-label">Settings</div>
            <a href="/profile" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Business Profile</a>
            <a href="/templates" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>Templates</a>
          </nav>
        </aside>

        <main className="main">
          <a href="/dashboard" className="back-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Dashboard
          </a>

          <div className="inv-card">
            <div className="inv-card-header">
              <div>
                <div className="inv-title">{invoice.invoiceNumber}</div>
                <div className="inv-meta">{invoice.date} · {invoice.clientName || '—'}</div>
              </div>
              <span className="status-badge" style={
                invoice.status === 'paid' ? { background: '#dcfce7', color: '#16a34a' } :
                invoice.status === 'unpaid' ? { background: '#fee2e2', color: '#dc2626' } :
                { background: '#dbeafe', color: '#1d4ed8' }
              }>
                {invoice.status === 'paid' ? '✓ Paid' : invoice.status === 'unpaid' ? '⚠ Unpaid' : '→ Sent'}
              </span>
            </div>

            <div className="inv-body">
              <div className="inv-grid">
                <div>
                  <div className="inv-section-label">From</div>
                  <div className="inv-field-value">{profile?.businessName || '—'}</div>
                  <div className="inv-field-sub">{profile?.gstin ? `GSTIN: ${profile.gstin}` : ''}</div>
                  <div className="inv-field-sub">{profile?.city}, {profile?.state}</div>
                </div>
                <div>
                  <div className="inv-section-label">Bill To</div>
                  <div className="inv-field-value">{invoice.clientName || '—'}</div>
                  <div className="inv-field-sub">{invoice.clientEmail || ''}</div>
                  <div className="inv-field-sub">{invoice.clientAddress || ''}</div>
                  <div className="inv-field-sub">{invoice.clientGSTIN ? `GSTIN: ${invoice.clientGSTIN}` : ''}</div>
                </div>
              </div>

              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{invoice.description}</td>
                    <td>Rs. {(invoice.amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  {invoice.isIntraState ? (
                    <>
                      <tr>
                        <td style={{ color: '#9ca3af' }}>CGST ({parseFloat(invoice.gstRate) / 2}%)</td>
                        <td style={{ color: '#9ca3af' }}>Rs. {taxAmount.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#9ca3af' }}>SGST ({parseFloat(invoice.gstRate) / 2}%)</td>
                        <td style={{ color: '#9ca3af' }}>Rs. {taxAmount.toFixed(2)}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td style={{ color: '#9ca3af' }}>IGST ({invoice.gstRate}%)</td>
                      <td style={{ color: '#9ca3af' }}>Rs. {taxAmount.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="inv-total-row">
                <div className="inv-total-label">Total</div>
                <div className="inv-total-value">Rs. {(invoice.total || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="action-bar">
              <button onClick={handleDownload} disabled={downloading} className="btn btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {downloading ? 'Generating…' : 'Download PDF'}
              </button>
              <button onClick={handleEmail} disabled={sending} className="btn btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {sending ? 'Sending…' : 'Email to Client'}
              </button>
              <button onClick={handleWhatsApp} className="btn btn-green">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                WhatsApp
              </button>
              <a href="/dashboard" className="btn btn-outline">← Back</a>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
