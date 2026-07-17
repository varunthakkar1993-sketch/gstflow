'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';

export default function QuoteDetail() {
  const params = useParams();
  const id = params?.id as string;
  const [quote, setQuote] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { window.location.href = '/login'; return; }
      const [qSnap, pSnap] = await Promise.all([
        getDoc(doc(db, 'quotes', id)),
        getDoc(doc(db, 'profiles', currentUser.uid)),
      ]);
      if (qSnap.exists()) setQuote({ id: qSnap.id, ...qSnap.data() });
      if (pSnap.exists()) setProfile(pSnap.data());
      setLoading(false);
    });
  }, [id]);

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
    doc2.text(`${quote.quoteNumber}  ·  Valid until ${quote.validUntil}`, pageWidth - 14, 32, { align: 'right' });
    let y = 54;
    doc2.setFontSize(13); doc2.setFont('helvetica', 'bold');
    doc2.setTextColor(109, 40, 217);
    doc2.text(profile?.businessName || 'Your Business', 14, y); y += 6;
    doc2.setFontSize(8); doc2.setFont('helvetica', 'normal');
    doc2.setTextColor(100, 110, 130);
    if (profile?.address) { doc2.text(`${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`, 14, y); y += 5; }
    if (profile?.gstin) { doc2.text(`GSTIN: ${profile.gstin}`, 14, y); y += 5; }
    y += 3;
    doc2.setDrawColor(109, 40, 217); doc2.setLineWidth(0.5);
    doc2.line(14, y, pageWidth - 14, y); y += 8;
    doc2.setFontSize(7.5); doc2.setFont('helvetica', 'bold'); doc2.setTextColor(100, 110, 130);
    doc2.text('PREPARED FOR', 14, y); doc2.text('QUOTE DETAILS', pageWidth / 2, y); y += 5;
    doc2.setFont('helvetica', 'bold'); doc2.setFontSize(9.5); doc2.setTextColor(15, 31, 92);
    doc2.text(quote.clientName || 'Client', 14, y);
    doc2.setFont('helvetica', 'normal'); doc2.setFontSize(8.5); doc2.setTextColor(60, 70, 90);
    doc2.text(`Quote #: ${quote.quoteNumber}`, pageWidth / 2, y); y += 5;
    doc2.setTextColor(100, 110, 130); doc2.setFontSize(8);
    if (quote.clientEmail) { doc2.text(quote.clientEmail, 14, y); }
    doc2.text(`Valid Until: ${quote.validUntil}`, pageWidth / 2, y); y += 5;
    if (quote.clientAddress) { doc2.text(quote.clientAddress, 14, y); y += 5; }
    y += 5;
    doc2.setFillColor(245, 240, 255);
    doc2.rect(14, y - 4, pageWidth - 28, 10, 'F');
    doc2.setFontSize(8); doc2.setFont('helvetica', 'bold'); doc2.setTextColor(109, 40, 217);
    doc2.text('DESCRIPTION', 18, y + 2); doc2.text('AMOUNT (Rs.)', pageWidth - 18, y + 2, { align: 'right' }); y += 12;
    (quote.items || []).forEach((item: any) => {
      if (!item.description && !item.amount) return;
      doc2.setFont('helvetica', 'normal'); doc2.setFontSize(9); doc2.setTextColor(30, 40, 60);
      doc2.text(item.description || '—', 18, y);
      doc2.text((parseFloat(item.amount) || 0).toLocaleString('en-IN'), pageWidth - 18, y, { align: 'right' }); y += 8;
    });
    y += 2;
    doc2.setFillColor(109, 40, 217); doc2.rect(14, y, pageWidth - 28, 12, 'F');
    doc2.setFontSize(11); doc2.setFont('helvetica', 'bold'); doc2.setTextColor(255, 255, 255);
    doc2.text('TOTAL ESTIMATE', 18, y + 8);
    doc2.text(`Rs. ${(quote.total || 0).toLocaleString('en-IN')}`, pageWidth - 18, y + 8, { align: 'right' }); y += 20;
    if (quote.notes) {
      doc2.setFontSize(7.5); doc2.setFont('helvetica', 'bold'); doc2.setTextColor(100, 110, 130);
      doc2.text('NOTES', 14, y); y += 5;
      doc2.setFont('helvetica', 'normal'); doc2.setFontSize(8.5); doc2.setTextColor(60, 70, 90);
      const lines = doc2.splitTextToSize(quote.notes, pageWidth - 28);
      doc2.text(lines, 14, y);
    }
    doc2.setFillColor(245, 240, 255);
    doc2.rect(0, pageHeight - 14, pageWidth, 14, 'F');
    doc2.setFontSize(8); doc2.setFont('helvetica', 'normal'); doc2.setTextColor(100, 110, 130);
    doc2.text('This is an estimate. Prices are subject to change.', 14, pageHeight - 6);
    doc2.text('Made with Paavti.in', pageWidth - 14, pageHeight - 6, { align: 'right' });
    return doc2;
  };

  const handleDownload = async () => {
    setDownloading(true);
    const doc2 = await buildPDF();
    doc2.save(`Paavti-${quote.quoteNumber}.pdf`);
    setDownloading(false);
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hi ${quote.clientName}, please find your quote ${quote.quoteNumber} for Rs. ${(quote.total || 0).toLocaleString('en-IN')} from ${profile?.businessName || 'Paavti'}. Valid until ${quote.validUntil}.`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff' }}><div style={{ width: 40, height: 40, border: '3px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin { to { transform: rotate(360deg); } }
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
      `}</style></div>;
  if (!quote) return <div style={{ padding: 40 }}>Quote not found. <a href="/quotes">Go back</a></div>;

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
        .back-btn { display: inline-flex; align-items: center; gap: 6px; color: #6b7280; font-size: 13.5px; text-decoration: none; margin-bottom: 24px; }
        .back-btn:hover { color: #7c3aed; }
        .card { background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; overflow: hidden; }
        .card-header { padding: 24px 32px; border-bottom: 1px solid #f0f4ff; display: flex; justify-content: space-between; align-items: center; }
        .card-title { font-family: 'Lora', serif; font-size: 22px; font-weight: 600; color: #0f1f5c; }
        .card-meta { font-size: 13px; color: #9ca3af; margin-top: 4px; }
        .status-badge { padding: 5px 14px; border-radius: 20px; font-size: 12.5px; font-weight: 500; }
        .card-body { padding: 32px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 24px; }
        .section-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.7px; font-weight: 600; margin-bottom: 10px; }
        .field-value { font-size: 14px; color: #111827; font-weight: 500; }
        .field-sub { font-size: 12.5px; color: #9ca3af; margin-top: 3px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.7px; padding: 10px 0; border-bottom: 1px solid #f0f4ff; text-align: left; }
        .items-table th:last-child { text-align: right; }
        .items-table td { padding: 10px 0; font-size: 14px; color: #374151; border-bottom: 1px solid #f9fafb; }
        .items-table td:last-child { text-align: right; font-weight: 500; }
        .total-row { display: flex; justify-content: space-between; padding: 16px 0 0; border-top: 2px solid #7c3aed; }
        .total-label { font-size: 15px; font-weight: 600; color: #0f1f5c; }
        .total-value { font-family: 'Lora', serif; font-size: 22px; font-weight: 700; color: #7c3aed; }
        .action-bar { padding: 20px 32px; background: #f8faff; border-top: 1px solid #f0f4ff; display: flex; gap: 12px; flex-wrap: wrap; }
        .btn { padding: 10px 20px; border-radius: 8px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 7px; transition: all 0.15s; text-decoration: none; }
        .btn-purple { background: #7c3aed; color: #fff; }
        .btn-purple:hover { background: #6d28d9; }
        .btn-green { background: #16a34a; color: #fff; }
        .btn-green:hover { background: #15803d; }
        .btn-outline { background: #fff; color: #374151; border: 1.5px solid #e5e9f5; }
        .btn-outline:hover { border-color: #7c3aed; color: #7c3aed; }
      
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
          <div className="sidebar-logo"><img src="/logo-white.svg" alt="Paavti" style={{ height: '38px' }} />
            <button className="menu-toggle" onClick={() => setShowMenu(!showMenu)}>&#9776;</button><p>Business Manager</p></div>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
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
            <div className="nav-label">Settings</div>
            <a href="/profile" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Business Profile
            </a>
          </nav>
        </aside>

        <main className="main">
          <a href="/quotes" className="back-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Quotes
          </a>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">{quote.quoteNumber}</div>
                <div className="card-meta">{quote.date} · Valid until {quote.validUntil} · {quote.clientName}</div>
              </div>
              <span className="status-badge" style={
                quote.status === 'accepted' ? { background: '#dcfce7', color: '#16a34a' } :
                quote.status === 'rejected' ? { background: '#fee2e2', color: '#dc2626' } :
                quote.status === 'sent' ? { background: '#dbeafe', color: '#1d4ed8' } :
                { background: '#f3f4f6', color: '#6b7280' }
              }>
                {quote.status === 'accepted' ? '✓ Accepted' : quote.status === 'rejected' ? '✗ Rejected' : quote.status === 'sent' ? '→ Sent' : '○ Draft'}
              </span>
            </div>

            <div className="card-body">
              <div className="grid">
                <div>
                  <div className="section-label">From</div>
                  <div className="field-value">{profile?.businessName || '—'}</div>
                  <div className="field-sub">{profile?.gstin ? `GSTIN: ${profile.gstin}` : ''}</div>
                  <div className="field-sub">{profile?.city}, {profile?.state}</div>
                </div>
                <div>
                  <div className="section-label">Prepared For</div>
                  <div className="field-value">{quote.clientName || '—'}</div>
                  <div className="field-sub">{quote.clientEmail || ''}</div>
                  <div className="field-sub">{quote.clientAddress || ''}</div>
                </div>
              </div>

              <table className="items-table">
                <thead><tr><th>Description</th><th>Amount</th></tr></thead>
                <tbody>
                  {(quote.items || []).map((item: any, i: number) => (
                    <tr key={i}>
                      <td>{item.description}</td>
                      <td>Rs. {(parseFloat(item.amount) || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="total-row">
                <div className="total-label">Total Estimate</div>
                <div className="total-value">Rs. {(quote.total || 0).toLocaleString('en-IN')}</div>
              </div>

              {quote.notes && (
                <div style={{ marginTop: 20, padding: '14px 16px', background: '#f9fafb', borderRadius: 8, fontSize: 13.5, color: '#374151' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 600, marginBottom: 6 }}>Notes</div>
                  {quote.notes}
                </div>
              )}
            </div>

            <div className="action-bar">
              <button onClick={handleDownload} disabled={downloading} className="btn btn-purple">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {downloading ? 'Generating…' : 'Download PDF'}
              </button>
              <button onClick={handleWhatsApp} className="btn btn-green">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                WhatsApp
              </button>
              {(quote.status === 'accepted' || quote.status === 'sent') && (
                <a href={`/editor?clientName=${encodeURIComponent(quote.clientName || '')}&clientEmail=${encodeURIComponent(quote.clientEmail || '')}&clientAddress=${encodeURIComponent(quote.clientAddress || '')}&amount=${quote.total}`} className="btn btn-green">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  Convert to Invoice
                </a>
              )}
              <a href="/quotes" className="btn btn-outline">← Back</a>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
