'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { isProUser, drawBrandFooter } from '../../lib/branding';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getCountFromServer } from 'firebase/firestore';
import jsPDF from 'jspdf';
import posthog from 'posthog-js';
import { validateEmail, validateGSTIN, normalizeGSTIN } from '../../lib/validators';

type Item = { description: string; amount: string };

export default function QuoteEditor() {
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [quoteSaved, setQuoteSaved] = useState(false);
  const [savedId, setSavedId] = useState('');
  const [pdfBase64, setPdfBase64] = useState('');
  const [sending, setSending] = useState(false);

  const defaultValidUntil = () => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  };

  const [quoteData, setQuoteData] = useState({
    quoteNumber: '',
    date: new Date().toISOString().split('T')[0],
    validUntil: defaultValidUntil(),
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    clientGSTIN: '',
    notes: '',
  });
  const [items, setItems] = useState<Item[]>([{ description: '', amount: '' }]);
  const [errors, setErrors] = useState<{ clientEmail?: string; clientGSTIN?: string }>({});

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { window.location.href = '/login'; return; }
      setUser(currentUser);
      const profileSnap = await getDoc(doc(db, 'profiles', currentUser.uid));
      if (profileSnap.exists()) setProfile(profileSnap.data());
      setIsPro(await isProUser(db, currentUser.uid));
      const q = query(collection(db, 'quotes'), where('userId', '==', currentUser.uid));
      const countSnap = await getCountFromServer(q);
      const count = countSnap.data().count + 1;
      setQuoteData(prev => ({ ...prev, quoteNumber: `QUO-${String(count).padStart(3, '0')}` }));
    });
  }, []);

  // Pre-fill from a template via ?description=&notes=
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const description = params.get('description') || '';
    const notes = params.get('notes') || '';
    if (description) setItems([{ description, amount: '' }]);
    if (notes) setQuoteData(prev => ({ ...prev, notes }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setQuoteData({ ...quoteData, [name]: value });
    if (name === 'clientEmail') setErrors(p => ({ ...p, clientEmail: validateEmail(value) }));
    if (name === 'clientGSTIN') setErrors(p => ({ ...p, clientGSTIN: validateGSTIN(value) }));
  };

  const updateItem = (i: number, field: keyof Item, value: string) => {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it));
  };
  const addItem = () => setItems(prev => [...prev, { description: '', amount: '' }]);
  const removeItem = (i: number) => setItems(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i));

  const total = items.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);

  const buildPDF = async () => {
    const doc2 = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc2.internal.pageSize.getWidth();
    const pageHeight = doc2.internal.pageSize.getHeight();

    // Purple header band (quote theme)
    doc2.setFillColor(76, 29, 149);
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
    doc2.setTextColor(76, 29, 149);
    doc2.text(profile?.businessName || 'Your Business', 14, y); y += 6;
    doc2.setFontSize(8); doc2.setFont('helvetica', 'normal');
    doc2.setTextColor(100, 110, 130);
    if (profile?.address) { doc2.text(`${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`, 14, y); y += 5; }
    if (profile?.gstin) { doc2.text(`GSTIN: ${profile.gstin}`, 14, y); y += 5; }
    if (profile?.phone) { doc2.text(`Phone: ${profile.phone}`, 14, y); y += 5; }

    y += 3;
    doc2.setDrawColor(124, 58, 237); doc2.setLineWidth(0.5);
    doc2.line(14, y, pageWidth - 14, y); y += 8;

    doc2.setFontSize(7.5); doc2.setFont('helvetica', 'bold'); doc2.setTextColor(100, 110, 130);
    doc2.text('PREPARED FOR', 14, y); doc2.text('QUOTE DETAILS', pageWidth / 2, y); y += 5;
    doc2.setFont('helvetica', 'bold'); doc2.setFontSize(9.5); doc2.setTextColor(15, 31, 92);
    doc2.text(quoteData.clientName || 'Client', 14, y);
    doc2.setFont('helvetica', 'normal'); doc2.setFontSize(8.5); doc2.setTextColor(60, 70, 90);
    doc2.text(`Quote #: ${quoteData.quoteNumber}`, pageWidth / 2, y); y += 5;
    doc2.setTextColor(100, 110, 130); doc2.setFontSize(8);
    if (quoteData.clientEmail) doc2.text(quoteData.clientEmail, 14, y);
    doc2.setTextColor(60, 70, 90);
    doc2.text(`Valid Until: ${quoteData.validUntil}`, pageWidth / 2, y); y += 5;
    doc2.setTextColor(100, 110, 130);
    if (quoteData.clientAddress) { doc2.text(quoteData.clientAddress, 14, y); y += 5; }
    if (quoteData.clientGSTIN) { doc2.text(`GSTIN: ${quoteData.clientGSTIN}`, 14, y); y += 5; }
    y += 5;

    doc2.setFillColor(245, 240, 255);
    doc2.rect(14, y - 4, pageWidth - 28, 10, 'F');
    doc2.setFontSize(8); doc2.setFont('helvetica', 'bold'); doc2.setTextColor(76, 29, 149);
    doc2.text('DESCRIPTION', 18, y + 2); doc2.text('AMOUNT (Rs.)', pageWidth - 18, y + 2, { align: 'right' }); y += 12;

    items.forEach((item) => {
      if (!item.description && !item.amount) return;
      doc2.setFont('helvetica', 'normal'); doc2.setFontSize(9); doc2.setTextColor(30, 40, 60);
      const lines = doc2.splitTextToSize(item.description || '—', pageWidth - 70);
      doc2.text(lines, 18, y);
      doc2.text((parseFloat(item.amount) || 0).toLocaleString('en-IN'), pageWidth - 18, y, { align: 'right' });
      y += Math.max(8, lines.length * 5 + 3);
    });

    y += 2;
    doc2.setFillColor(76, 29, 149); doc2.rect(14, y, pageWidth - 28, 12, 'F');
    doc2.setFontSize(11); doc2.setFont('helvetica', 'bold'); doc2.setTextColor(255, 255, 255);
    doc2.text('TOTAL ESTIMATE', 18, y + 8);
    doc2.text(`Rs. ${total.toLocaleString('en-IN')}`, pageWidth - 18, y + 8, { align: 'right' }); y += 20;

    if (quoteData.notes) {
      doc2.setFontSize(7.5); doc2.setFont('helvetica', 'bold'); doc2.setTextColor(100, 110, 130);
      doc2.text('NOTES', 14, y); y += 5;
      doc2.setFont('helvetica', 'normal'); doc2.setFontSize(8.5); doc2.setTextColor(60, 70, 90);
      const nlines = doc2.splitTextToSize(quoteData.notes, pageWidth - 28);
      doc2.text(nlines, 14, y);
    }

    doc2.setFillColor(245, 240, 255);
    doc2.rect(0, pageHeight - 14, pageWidth, 14, 'F');
    doc2.setFontSize(8); doc2.setFont('helvetica', 'normal'); doc2.setTextColor(100, 110, 130);
    doc2.text('This is an estimate. Prices are subject to change.', 14, pageHeight - 6);
    drawBrandFooter(doc2, !isPro);
    return doc2;
  };

  const generateAndSave = async () => {
    // Validation
    const emailErr = validateEmail(quoteData.clientEmail);
    const gstinErr = validateGSTIN(quoteData.clientGSTIN);
    setErrors({ clientEmail: emailErr, clientGSTIN: gstinErr });
    if (emailErr || gstinErr) return;
    if (!quoteData.clientName.trim()) { alert('Please enter a client name.'); return; }
    const validItems = items.filter(it => it.description.trim() || it.amount);
    if (validItems.length === 0) { alert('Add at least one line item.'); return; }

    setLoading(true);
    try {
      const doc2 = await buildPDF();
      doc2.save(`Paavti-${quoteData.quoteNumber}.pdf`);
      const base64 = doc2.output('datauristring').split(',')[1];
      setPdfBase64(base64);
      const ref = await addDoc(collection(db, 'quotes'), {
        userId: user.uid,
        quoteNumber: quoteData.quoteNumber,
        date: quoteData.date,
        validUntil: quoteData.validUntil,
        clientName: quoteData.clientName,
        clientEmail: quoteData.clientEmail,
        clientAddress: quoteData.clientAddress,
        clientGSTIN: normalizeGSTIN(quoteData.clientGSTIN),
        items: validItems.map(it => ({ description: it.description, amount: parseFloat(it.amount) || 0 })),
        notes: quoteData.notes,
        total,
        status: 'draft',
        createdAt: serverTimestamp(),
      });
      setSavedId(ref.id);
      posthog.capture('quote_generated', {
        quote_number: quoteData.quoteNumber,
        total,
        line_items: validItems.length,
        has_client_email: !!quoteData.clientEmail,
      });
      setQuoteSaved(true);
    } catch (error) {
      console.error(error);
      posthog.captureException(error);
      alert('Failed to generate quote.');
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!quoteData.clientEmail) { alert('Please enter client email first.'); return; }
    setSending(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          to: quoteData.clientEmail,
          subject: `Quote ${quoteData.quoteNumber} from ${profile?.businessName || 'Paavti'}`,
          invoiceNumber: quoteData.quoteNumber,
          clientName: quoteData.clientName,
          businessName: profile?.businessName || 'Paavti',
          total: total.toLocaleString('en-IN'),
          date: quoteData.date,
          pdfBase64,
          docType: 'quote',
        }),
      });
      if (res.ok) {
        posthog.capture('quote_emailed', { quote_number: quoteData.quoteNumber, total });
        alert('✅ Quote emailed successfully!');
      } else {
        alert('Failed to send email.');
      }
    } catch { alert('Failed to send email.'); }
    finally { setSending(false); }
  };

  const sendWhatsApp = () => {
    const msg = encodeURIComponent(`Hi ${quoteData.clientName}, please find your quote ${quoteData.quoteNumber} for Rs. ${total.toLocaleString('en-IN')} from ${profile?.businessName || 'Paavti'}. Valid until ${quoteData.validUntil}.`);
    posthog.capture('quote_whatsapped', { quote_number: quoteData.quoteNumber, total });
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
        .field input.invalid { border-color: #dc2626; }
        .field textarea { resize: vertical; min-height: 80px; }
        .field-error { color: #dc2626; font-size: 12px; margin-top: 5px; }
        .item-row { display: grid; grid-template-columns: 1fr 150px 38px; gap: 10px; align-items: center; margin-bottom: 10px; }
        .item-row input { width: 100%; padding: 10px 14px; border: 1.5px solid #e5e9f5; border-radius: 8px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #111827; outline: none; }
        .item-row input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .item-remove { height: 40px; background: #fef2f2; color: #dc2626; border: none; border-radius: 8px; cursor: pointer; font-size: 18px; line-height: 1; }
        .item-remove:hover { background: #fee2e2; }
        .item-remove:disabled { opacity: 0.4; cursor: not-allowed; }
        .add-item { width: 100%; background: #f0f4ff; color: #2563eb; border: 1.5px dashed #bcd0f5; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 13.5px; font-family: 'DM Sans', sans-serif; }
        .add-item:hover { background: #e5edff; }
        .summary-card { background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; position: sticky; top: 24px; }
        .summary-header { padding: 16px 24px; border-bottom: 1px solid #f0f4ff; }
        .summary-header h3 { font-family: 'Lora', serif; font-size: 16px; color: #0f1f5c; font-weight: 600; }
        .summary-body { padding: 20px 24px; }
        .summary-business { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f0f4ff; }
        .summary-business-name { font-size: 15px; font-weight: 600; color: #0f1f5c; }
        .summary-business-detail { font-size: 12px; color: #9ca3af; margin-top: 3px; }
        .summary-inv-row { display: flex; justify-content: space-between; font-size: 13px; color: #374151; margin-bottom: 10px; }
        .summary-divider { border: none; border-top: 1px solid #f0f4ff; margin: 12px 0; }
        .summary-total { display: flex; justify-content: space-between; align-items: center; padding: 14px 0 0; }
        .summary-total-label { font-size: 14px; font-weight: 600; color: #0f1f5c; }
        .summary-total-value { font-family: 'Lora', serif; font-size: 22px; font-weight: 600; color: #7c3aed; }
        .btn-primary { width: 100%; background: #7c3aed; color: #fff; border: none; padding: 13px; border-radius: 9px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.15s; margin-top: 20px; }
        .btn-primary:hover { background: #6d28d9; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .success-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 9px; padding: 14px; text-align: center; color: #16a34a; font-size: 13.5px; font-weight: 500; margin-top: 20px; }
        .action-btns { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
        .btn-email { background: #2563eb; color: #fff; border: none; padding: 11px; border-radius: 9px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-email:hover { background: #1d4ed8; }
        .btn-whatsapp { background: #16a34a; color: #fff; border: none; padding: 11px; border-radius: 9px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-whatsapp:hover { background: #15803d; }
        .btn-secondary { background: #f8faff; color: #374151; border: 1.5px solid #e5e9f5; padding: 11px; border-radius: 9px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; }
        .btn-secondary:hover { border-color: #2563eb; color: #2563eb; }
        .profile-missing { background: #fffbeb; border: 1px solid #fde68a; border-radius: 9px; padding: 12px 16px; font-size: 13px; color: #92400e; margin-bottom: 20px; }
        .profile-missing a { color: #2563eb; font-weight: 500; }
        .menu-toggle { display: none; background: none; border: none; color: #ffffff; font-size: 30px; cursor: pointer; padding: 4px 8px; }
        @media (max-width: 768px) {
          .editor-root, .root { flex-direction: column; min-height: auto; }
          .sidebar { width: 100% !important; min-height: auto !important; position: relative !important; flex-direction: row !important; flex-wrap: wrap !important; align-items: center; top: auto !important; bottom: auto !important; left: auto !important; height: auto !important; z-index: auto !important; }
          .sidebar-logo { display: flex !important; align-items: center; width: 100%; gap: 12px; padding: 12px 16px !important; border-bottom: none; }
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
          .editor-grid { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
          .summary-card { position: static; }
          .card-body { padding: 16px; }
          .card-header { padding: 12px 16px; }
        }
      `}</style>

      <div className="editor-root">
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
            <a href="/quote-editor" className="nav-item active"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>New Quote</a>
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
          </div>
        </aside>

        <main className="main">
          <div className="page-header">
            <h2>New Quote</h2>
            <p>Send a professional estimate to your client. Convert it to an invoice once accepted.</p>
          </div>

          {!profile && (
            <div className="profile-missing">
              ⚠️ Business profile incomplete. <a href="/profile">Set it up here</a> so your quotes include your details.
            </div>
          )}

          <div className="editor-grid">
            <div>
              <div className="card">
                <div className="card-header">
                  <div className="card-icon" style={{ background: '#f5f3ff' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <h3>Quote Details</h3>
                </div>
                <div className="card-body">
                  <div className="form-row">
                    <div className="field">
                      <label>Quote Number</label>
                      <input name="quoteNumber" value={quoteData.quoteNumber} onChange={handleChange} className="readonly" readOnly />
                    </div>
                    <div className="field">
                      <label>Date</label>
                      <input type="date" name="date" value={quoteData.date} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-row single">
                    <div className="field">
                      <label>Valid Until</label>
                      <input type="date" name="validUntil" value={quoteData.validUntil} onChange={handleChange} />
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
                      <input name="clientName" value={quoteData.clientName} onChange={handleChange} placeholder="Acme Corp" />
                    </div>
                    <div className="field">
                      <label>Client Email</label>
                      <input type="email" name="clientEmail" value={quoteData.clientEmail} onChange={handleChange} placeholder="client@company.com" className={errors.clientEmail ? 'invalid' : ''} />
                      {errors.clientEmail && <div className="field-error">{errors.clientEmail}</div>}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="field">
                      <label>Client Address</label>
                      <input name="clientAddress" value={quoteData.clientAddress} onChange={handleChange} placeholder="Street, City, State, Pincode" />
                    </div>
                    <div className="field">
                      <label>Client GSTIN (optional)</label>
                      <input name="clientGSTIN" value={quoteData.clientGSTIN} onChange={handleChange} placeholder="27ABCDE1234F1Z5" className={errors.clientGSTIN ? 'invalid' : ''} />
                      {errors.clientGSTIN && <div className="field-error">{errors.clientGSTIN}</div>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-icon" style={{ background: '#eff6ff' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  </div>
                  <h3>Line Items</h3>
                </div>
                <div className="card-body">
                  {items.map((item, i) => (
                    <div className="item-row" key={i}>
                      <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Description of work or product" />
                      <input type="number" value={item.amount} onChange={e => updateItem(i, 'amount', e.target.value)} placeholder="Amount" />
                      <button type="button" className="item-remove" onClick={() => removeItem(i)} disabled={items.length === 1} title="Remove">×</button>
                    </div>
                  ))}
                  <button type="button" className="add-item" onClick={addItem}>+ Add line item</button>
                  <div className="field" style={{ marginTop: 16, marginBottom: 0 }}>
                    <label>Notes (optional)</label>
                    <textarea name="notes" value={quoteData.notes} onChange={handleChange} placeholder="Payment terms, scope notes, or anything the client should know." />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="summary-card">
                <div className="summary-header">
                  <h3>Quote Summary</h3>
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
                    <span>Quote</span>
                    <span style={{ fontWeight: 600 }}>{quoteData.quoteNumber}</span>
                  </div>
                  <div className="summary-inv-row">
                    <span>Date</span>
                    <span>{quoteData.date}</span>
                  </div>
                  <div className="summary-inv-row">
                    <span>Valid Until</span>
                    <span>{quoteData.validUntil}</span>
                  </div>
                  <div className="summary-inv-row">
                    <span>Client</span>
                    <span>{quoteData.clientName || '—'}</span>
                  </div>
                  <div className="summary-inv-row">
                    <span>Items</span>
                    <span>{items.filter(it => it.description.trim() || it.amount).length}</span>
                  </div>

                  <hr className="summary-divider" />

                  <div className="summary-total">
                    <div className="summary-total-label">Total Estimate</div>
                    <div className="summary-total-value">Rs. {total.toLocaleString('en-IN')}</div>
                  </div>

                  {!quoteSaved ? (
                    <button onClick={generateAndSave} disabled={loading} className="btn-primary">
                      {loading ? 'Generating…' : '↓ Generate & Download Quote'}
                    </button>
                  ) : (
                    <>
                      <div className="success-box">✅ Quote saved successfully!</div>
                      <div className="action-btns">
                        <button onClick={generateAndSave} disabled={loading} className="btn-secondary">
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
                        <a href="/quotes" className="btn-secondary">← Back to Quotes</a>
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
