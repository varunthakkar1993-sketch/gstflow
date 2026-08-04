'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { isProUser, drawBrandFooter } from '../../lib/branding';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getCountFromServer } from 'firebase/firestore';
import jsPDF from 'jspdf';
import posthog from 'posthog-js';
import { validateEmail, validateGSTIN, normalizeGSTIN } from '../../lib/validators';

const REASONS = [
  'Sales return',
  'Goods rejected',
  'Deficiency in service',
  'Correction in invoice value',
  'Post-sale discount',
  'Order cancelled',
  'Other',
];

export default function CreditNoteEditor() {
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [saved, setSaved] = useState(false);
  const [linkedInvoice, setLinkedInvoice] = useState<any>(null);

  const [data, setData] = useState({
    creditNoteNumber: '',
    date: new Date().toISOString().split('T')[0],
    invoiceRef: '',
    invoiceDate: '',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    clientGSTIN: '',
    reason: 'Sales return',
    amount: '',
    gstRate: '18',
    isIntraState: 'true',
    notes: '',
  });
  const [errors, setErrors] = useState<{ clientEmail?: string; clientGSTIN?: string }>({});

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { window.location.href = '/login'; return; }
      setUser(currentUser);
      const profileSnap = await getDoc(doc(db, 'profiles', currentUser.uid));
      if (profileSnap.exists()) setProfile(profileSnap.data());
      setIsPro(await isProUser(db, currentUser.uid));

      const q = query(collection(db, 'creditNotes'), where('userId', '==', currentUser.uid));
      const countSnap = await getCountFromServer(q);
      const count = countSnap.data().count + 1;
      setData(prev => ({ ...prev, creditNoteNumber: `CRN-${String(count).padStart(3, '0')}` }));

      // Prefill from an invoice when arriving via ?invoice=<id>
      const invId = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('invoice') : null;
      if (invId) {
        const invSnap = await getDoc(doc(db, 'invoices', invId));
        if (invSnap.exists()) {
          const inv: any = invSnap.data();
          setLinkedInvoice({ id: invSnap.id, ...inv });
          setData(prev => ({
            ...prev,
            invoiceRef: inv.invoiceNumber || '',
            invoiceDate: inv.date || '',
            clientName: inv.clientName || '',
            clientEmail: inv.clientEmail || '',
            clientAddress: inv.clientAddress || '',
            clientGSTIN: inv.clientGSTIN || '',
            amount: String(inv.amount ?? ''),
            gstRate: String(inv.gstRate ?? '18'),
            isIntraState: inv.isIntraState === false ? 'false' : 'true',
          }));
        }
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
    if (name === 'clientEmail') setErrors(p => ({ ...p, clientEmail: validateEmail(value) }));
    if (name === 'clientGSTIN') setErrors(p => ({ ...p, clientGSTIN: validateGSTIN(value) }));
  };

  const taxable = parseFloat(data.amount) || 0;
  const rate = parseFloat(data.gstRate) || 0;
  const tax = taxable * rate / 100;
  const isIntra = data.isIntraState === 'true';
  const total = taxable + tax;

  const buildPDF = async () => {
    const d = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = d.internal.pageSize.getWidth();
    const ph = d.internal.pageSize.getHeight();

    d.setFillColor(153, 27, 27);
    d.rect(0, 0, pw, 42, 'F');
    if (profile?.logoBase64) {
      try {
        const ext = profile.logoBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        d.addImage(profile.logoBase64, ext, 12, 8, 0, 26);
      } catch (e) {}
    }
    d.setFontSize(20); d.setFont('helvetica', 'bold'); d.setTextColor(255, 255, 255);
    d.text('CREDIT NOTE', pw - 14, 24, { align: 'right' });
    d.setFontSize(8); d.setFont('helvetica', 'normal'); d.setTextColor(250, 200, 200);
    d.text(`${data.creditNoteNumber}  ·  ${data.date}`, pw - 14, 32, { align: 'right' });

    let y = 54;
    d.setFontSize(13); d.setFont('helvetica', 'bold'); d.setTextColor(153, 27, 27);
    d.text(profile?.businessName || 'Your Business', 14, y); y += 6;
    d.setFontSize(8); d.setFont('helvetica', 'normal'); d.setTextColor(100, 110, 130);
    if (profile?.address) { d.text(`${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`, 14, y); y += 5; }
    if (profile?.gstin) { d.text(`GSTIN: ${profile.gstin}`, 14, y); y += 5; }

    y += 3;
    d.setDrawColor(220, 38, 38); d.setLineWidth(0.5);
    d.line(14, y, pw - 14, y); y += 8;

    d.setFontSize(7.5); d.setFont('helvetica', 'bold'); d.setTextColor(100, 110, 130);
    d.text('ISSUED TO', 14, y); d.text('CREDIT NOTE DETAILS', pw / 2, y); y += 5;
    d.setFont('helvetica', 'bold'); d.setFontSize(9.5); d.setTextColor(15, 31, 92);
    d.text(data.clientName || 'Client', 14, y);
    d.setFont('helvetica', 'normal'); d.setFontSize(8.5); d.setTextColor(60, 70, 90);
    d.text(`Credit Note #: ${data.creditNoteNumber}`, pw / 2, y); y += 5;
    d.setTextColor(100, 110, 130); d.setFontSize(8);
    if (data.clientEmail) d.text(data.clientEmail, 14, y);
    d.setTextColor(60, 70, 90);
    d.text(`Against Invoice: ${data.invoiceRef || '-'}`, pw / 2, y); y += 5;
    d.setTextColor(100, 110, 130);
    if (data.clientAddress) d.text(data.clientAddress, 14, y);
    d.setTextColor(60, 70, 90);
    if (data.invoiceDate) d.text(`Invoice Date: ${data.invoiceDate}`, pw / 2, y);
    y += 5;
    if (data.clientGSTIN) { d.setTextColor(100, 110, 130); d.text(`GSTIN: ${data.clientGSTIN}`, 14, y); y += 5; }
    y += 5;

    d.setFillColor(254, 242, 242);
    d.rect(14, y - 4, pw - 28, 10, 'F');
    d.setFontSize(8); d.setFont('helvetica', 'bold'); d.setTextColor(153, 27, 27);
    d.text('REASON FOR CREDIT', 18, y + 2);
    d.text('AMOUNT (Rs.)', pw - 18, y + 2, { align: 'right' }); y += 12;

    d.setFont('helvetica', 'normal'); d.setFontSize(9); d.setTextColor(30, 40, 60);
    d.text(data.reason, 18, y);
    d.text(taxable.toLocaleString('en-IN'), pw - 18, y, { align: 'right' }); y += 10;

    d.setDrawColor(220, 225, 235); d.setLineWidth(0.3);
    d.line(14, y, pw - 14, y); y += 6;
    d.setFontSize(8.5); d.setTextColor(100, 110, 130);
    if (isIntra) {
      d.text(`CGST (${rate / 2}%)`, 18, y);
      d.text((tax / 2).toFixed(2), pw - 18, y, { align: 'right' }); y += 6;
      d.text(`SGST (${rate / 2}%)`, 18, y);
      d.text((tax / 2).toFixed(2), pw - 18, y, { align: 'right' }); y += 6;
    } else {
      d.text(`IGST (${rate}%)`, 18, y);
      d.text(tax.toFixed(2), pw - 18, y, { align: 'right' }); y += 6;
    }

    y += 4;
    d.setFillColor(153, 27, 27); d.rect(14, y, pw - 28, 12, 'F');
    d.setFontSize(11); d.setFont('helvetica', 'bold'); d.setTextColor(255, 255, 255);
    d.text('TOTAL CREDITED', 18, y + 8);
    d.text(`Rs. ${total.toLocaleString('en-IN')}`, pw - 18, y + 8, { align: 'right' }); y += 20;

    if (data.notes) {
      d.setFontSize(7.5); d.setFont('helvetica', 'bold'); d.setTextColor(100, 110, 130);
      d.text('NOTES', 14, y); y += 5;
      d.setFont('helvetica', 'normal'); d.setFontSize(8.5); d.setTextColor(60, 70, 90);
      d.text(d.splitTextToSize(data.notes, pw - 28), 14, y);
    }

    d.setFillColor(254, 242, 242);
    d.rect(0, ph - 14, pw, 14, 'F');
    d.setFontSize(8); d.setFont('helvetica', 'normal'); d.setTextColor(100, 110, 130);
    d.text('Credit note issued under Section 34 of the CGST Act.', 14, ph - 6);
    drawBrandFooter(d, !isPro);
    return d;
  };

  const generateAndSave = async () => {
    const emailErr = validateEmail(data.clientEmail);
    const gstinErr = validateGSTIN(data.clientGSTIN);
    setErrors({ clientEmail: emailErr, clientGSTIN: gstinErr });
    if (emailErr || gstinErr) return;
    if (!data.clientName.trim()) { alert('Please enter a client name.'); return; }
    if (taxable <= 0) { alert('Enter the amount being credited.'); return; }
    if (linkedInvoice && taxable > (linkedInvoice.amount || 0) + 0.01) {
      if (!confirm('This credit is larger than the original invoice taxable value. Continue anyway?')) return;
    }

    setLoading(true);
    try {
      const d = await buildPDF();
      d.save(`Paavti-${data.creditNoteNumber}.pdf`);
      await addDoc(collection(db, 'creditNotes'), {
        userId: user.uid,
        creditNoteNumber: data.creditNoteNumber,
        date: data.date,
        invoiceRef: data.invoiceRef,
        invoiceDate: data.invoiceDate,
        invoiceId: linkedInvoice?.id || '',
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientAddress: data.clientAddress,
        clientGSTIN: normalizeGSTIN(data.clientGSTIN),
        reason: data.reason,
        amount: taxable,
        gstRate: data.gstRate,
        isIntraState: isIntra,
        total,
        notes: data.notes,
        createdAt: serverTimestamp(),
      });
      posthog.capture('credit_note_generated', {
        credit_note_number: data.creditNoteNumber,
        total,
        reason: data.reason,
        against_invoice: data.invoiceRef,
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
      posthog.captureException(err);
      alert('Failed to create credit note.');
    } finally {
      setLoading(false);
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
        .field input, .field textarea, .field select { width: 100%; padding: 10px 14px; border: 1.5px solid #e5e9f5; border-radius: 8px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #111827; background: #fff; outline: none; }
        .field input:focus, .field textarea:focus, .field select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .field input.readonly { background: #f8faff; color: #6b7280; }
        .field input.invalid { border-color: #dc2626; }
        .field textarea { resize: vertical; min-height: 80px; }
        .field-error { color: #dc2626; font-size: 12px; margin-top: 5px; }
        .linked { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 9px; padding: 12px 16px; font-size: 13px; color: #9a3412; margin-bottom: 20px; }
        .summary-card { background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; position: sticky; top: 24px; }
        .summary-header { padding: 16px 24px; border-bottom: 1px solid #f0f4ff; }
        .summary-header h3 { font-family: 'Lora', serif; font-size: 16px; color: #0f1f5c; font-weight: 600; }
        .summary-body { padding: 20px 24px; }
        .summary-inv-row { display: flex; justify-content: space-between; font-size: 13px; color: #374151; margin-bottom: 10px; }
        .summary-divider { border: none; border-top: 1px solid #f0f4ff; margin: 12px 0; }
        .summary-total { display: flex; justify-content: space-between; align-items: center; padding: 14px 0 0; }
        .summary-total-label { font-size: 14px; font-weight: 600; color: #0f1f5c; }
        .summary-total-value { font-family: 'Lora', serif; font-size: 22px; font-weight: 600; color: #dc2626; }
        .btn-primary { width: 100%; background: #dc2626; color: #fff; border: none; padding: 13px; border-radius: 9px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; margin-top: 20px; }
        .btn-primary:hover { background: #b91c1c; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .success-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 9px; padding: 14px; text-align: center; color: #16a34a; font-size: 13.5px; font-weight: 500; margin-top: 20px; }
        .action-btns { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
        .btn-secondary { background: #f8faff; color: #374151; border: 1.5px solid #e5e9f5; padding: 11px; border-radius: 9px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; }
        .btn-secondary:hover { border-color: #2563eb; color: #2563eb; }
        .menu-toggle { display: none; background: none; border: none; color: #ffffff; font-size: 30px; cursor: pointer; padding: 4px 8px; }
        @media (max-width: 768px) {
          .editor-root { flex-direction: column; min-height: auto; }
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
          .editor-grid { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
          .summary-card { position: static; }
          .card-body { padding: 16px; }
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
            <a href="/credit-note-editor" className="nav-item active"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>Credit Note</a>
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
          </div>
        </aside>

        <main className="main">
          <div className="page-header">
            <h2>New Credit Note</h2>
            <p>Reverse all or part of an invoice for a return, cancellation or correction.</p>
          </div>

          {linkedInvoice && (
            <div className="linked">
              Crediting against invoice <strong>{linkedInvoice.invoiceNumber}</strong> dated {linkedInvoice.date}, original taxable value Rs. {(linkedInvoice.amount || 0).toLocaleString('en-IN')}. Reduce the amount below if this is a partial credit.
            </div>
          )}

          <div className="editor-grid">
            <div>
              <div className="card">
                <div className="card-header">
                  <div className="card-icon" style={{ background: '#fef2f2' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <h3>Credit Note Details</h3>
                </div>
                <div className="card-body">
                  <div className="form-row">
                    <div className="field">
                      <label>Credit Note Number</label>
                      <input name="creditNoteNumber" value={data.creditNoteNumber} className="readonly" readOnly />
                    </div>
                    <div className="field">
                      <label>Date</label>
                      <input type="date" name="date" value={data.date} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="field">
                      <label>Against Invoice</label>
                      <input name="invoiceRef" value={data.invoiceRef} onChange={handleChange} placeholder="INV-001" />
                    </div>
                    <div className="field">
                      <label>Original Invoice Date</label>
                      <input type="date" name="invoiceDate" value={data.invoiceDate} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-row single">
                    <div className="field">
                      <label>Reason</label>
                      <select name="reason" value={data.reason} onChange={handleChange}>
                        {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
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
                      <input name="clientName" value={data.clientName} onChange={handleChange} placeholder="Acme Corp" />
                    </div>
                    <div className="field">
                      <label>Client Email</label>
                      <input type="email" name="clientEmail" value={data.clientEmail} onChange={handleChange} placeholder="client@company.com" className={errors.clientEmail ? 'invalid' : ''} />
                      {errors.clientEmail && <div className="field-error">{errors.clientEmail}</div>}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="field">
                      <label>Client Address</label>
                      <input name="clientAddress" value={data.clientAddress} onChange={handleChange} placeholder="Street, City, State, Pincode" />
                    </div>
                    <div className="field">
                      <label>Client GSTIN (optional)</label>
                      <input name="clientGSTIN" value={data.clientGSTIN} onChange={handleChange} placeholder="27ABCDE1234F1Z5" className={errors.clientGSTIN ? 'invalid' : ''} />
                      {errors.clientGSTIN && <div className="field-error">{errors.clientGSTIN}</div>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-icon" style={{ background: '#fff7ed' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <h3>Amount Being Credited</h3>
                </div>
                <div className="card-body">
                  <div className="form-row">
                    <div className="field">
                      <label>Taxable Amount (Rs.)</label>
                      <input type="number" name="amount" value={data.amount} onChange={handleChange} placeholder="0" />
                    </div>
                    <div className="field">
                      <label>GST Rate</label>
                      <select name="gstRate" value={data.gstRate} onChange={handleChange}>
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
                      <select name="isIntraState" value={data.isIntraState} onChange={handleChange}>
                        <option value="true">Intra-State — CGST + SGST</option>
                        <option value="false">Inter-State — IGST</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row single">
                    <div className="field">
                      <label>Notes (optional)</label>
                      <textarea name="notes" value={data.notes} onChange={handleChange} placeholder="Any extra detail for the client or your CA." />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="summary-card">
                <div className="summary-header"><h3>Credit Summary</h3></div>
                <div className="summary-body">
                  <div className="summary-inv-row"><span>Credit Note</span><span style={{ fontWeight: 600 }}>{data.creditNoteNumber}</span></div>
                  <div className="summary-inv-row"><span>Against</span><span>{data.invoiceRef || '—'}</span></div>
                  <div className="summary-inv-row"><span>Client</span><span>{data.clientName || '—'}</span></div>
                  <div className="summary-inv-row"><span>Taxable</span><span>Rs. {taxable.toLocaleString('en-IN')}</span></div>
                  {isIntra ? (
                    <>
                      <div className="summary-inv-row"><span>CGST ({rate / 2}%)</span><span>Rs. {(tax / 2).toFixed(2)}</span></div>
                      <div className="summary-inv-row"><span>SGST ({rate / 2}%)</span><span>Rs. {(tax / 2).toFixed(2)}</span></div>
                    </>
                  ) : (
                    <div className="summary-inv-row"><span>IGST ({rate}%)</span><span>Rs. {tax.toFixed(2)}</span></div>
                  )}

                  <hr className="summary-divider" />

                  <div className="summary-total">
                    <div className="summary-total-label">Total Credited</div>
                    <div className="summary-total-value">Rs. {total.toLocaleString('en-IN')}</div>
                  </div>

                  {!saved ? (
                    <button onClick={generateAndSave} disabled={loading} className="btn-primary">
                      {loading ? 'Generating…' : '↓ Create & Download Credit Note'}
                    </button>
                  ) : (
                    <>
                      <div className="success-box">✅ Credit note saved. It will appear in your GSTR-1 as a CDNR record.</div>
                      <div className="action-btns">
                        <button onClick={generateAndSave} disabled={loading} className="btn-secondary">Download Again</button>
                        <a href="/gstr1" className="btn-secondary">View in GST Filing</a>
                        <a href="/dashboard" className="btn-secondary">← Back to Dashboard</a>
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
