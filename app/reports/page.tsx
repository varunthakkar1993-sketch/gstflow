'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import posthog from 'posthog-js';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Reports() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { window.location.href = '/login'; return; }
      setUser(currentUser);
      const profileSnap = await getDoc(doc(db, 'profiles', currentUser.uid));
      if (profileSnap.exists()) setProfile(profileSnap.data());
    });
  }, []);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const iq = query(collection(db, 'invoices'), where('userId', '==', user.uid));
      const isnap = await getDocs(iq);
      const monthInvoices = isnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((inv: any) => {
          if (!inv.date) return false;
          const d = new Date(inv.date);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .sort((a: any, b: any) => a.date.localeCompare(b.date));
      setInvoices(monthInvoices);

      const eq = query(collection(db, 'expenses'), where('userId', '==', user.uid));
      const esnap = await getDocs(eq);
      const monthExpenses = esnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((exp: any) => {
          if (!exp.date) return false;
          const d = new Date(exp.date);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .sort((a: any, b: any) => a.date.localeCompare(b.date));
      setExpenses(monthExpenses);
      setFetched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalSubtotal = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalGSTOutput = invoices.reduce((sum, inv) => {
    const sub = inv.amount || 0;
    const rate = parseFloat(inv.gstRate) || 0;
    return sum + (sub * rate / 100);
  }, 0);
  const totalExpenseAmt = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const totalGSTInput = expenses.reduce((sum, exp) => {
    const rate = parseFloat(exp.gstRate) || 0;
    return sum + ((exp.amount || 0) * rate / (100 + rate));
  }, 0);
  const netGSTPayable = totalGSTOutput - totalGSTInput;
  const netProfit = totalRevenue - totalExpenseAmt;

  const cgstTotal = invoices.reduce((sum, inv) => {
    if (!inv.isIntraState) return sum;
    const sub = inv.amount || 0;
    const rate = parseFloat(inv.gstRate) || 0;
    return sum + (sub * rate / 100 / 2);
  }, 0);
  const sgstTotal = cgstTotal;
  const igstTotal = invoices.reduce((sum, inv) => {
    if (inv.isIntraState) return sum;
    const sub = inv.amount || 0;
    const rate = parseFloat(inv.gstRate) || 0;
    return sum + (sub * rate / 100);
  }, 0);

  const buildPDF = async () => {
    setGenerating(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const label = `${MONTHS[month]} ${year}`;

      // Header
      pdf.setFillColor(15, 31, 92);
      pdf.rect(0, 0, pw, 38, 'F');
      if (profile?.logoBase64) {
        try {
          const ext = profile.logoBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
          pdf.addImage(profile.logoBase64, ext, 12, 7, 0, 24);
        } catch (e) {}
      }
      pdf.setFontSize(18); pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('MONTHLY REPORT', pw - 14, 20, { align: 'right' });
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(180, 195, 230);
      pdf.text(label, pw - 14, 28, { align: 'right' });

      // Business info
      let y = 48;
      pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 31, 92);
      pdf.text(profile?.businessName || 'Your Business', 14, y); y += 5;
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 110, 130);
      if (profile?.gstin) { pdf.text(`GSTIN: ${profile.gstin}`, 14, y); y += 4; }
      if (profile?.address) { pdf.text(`${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`, 14, y); y += 4; }

      // Blue line
      y += 4;
      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(0.5);
      pdf.line(14, y, pw - 14, y);
      y += 8;

      // Summary cards
      pdf.setFillColor(240, 244, 255);
      pdf.rect(14, y, (pw - 38) / 4, 20, 'F');
      pdf.rect(14 + (pw - 38) / 4 + 4, y, (pw - 38) / 4, 20, 'F');
      pdf.rect(14 + ((pw - 38) / 4 + 4) * 2, y, (pw - 38) / 4, 20, 'F');
      pdf.rect(14 + ((pw - 38) / 4 + 4) * 3, y, (pw - 38) / 4, 20, 'F');

      const cardW = (pw - 38) / 4;
      const cards = [
        { label: 'Revenue', value: `Rs. ${totalRevenue.toLocaleString('en-IN')}` },
        { label: 'Expenses', value: `Rs. ${totalExpenseAmt.toLocaleString('en-IN')}` },
        { label: 'Net Profit', value: `Rs. ${netProfit.toLocaleString('en-IN')}` },
        { label: 'Net GST', value: `Rs. ${netGSTPayable.toFixed(2)}` },
      ];
      cards.forEach((c, i) => {
        const cx = 14 + (cardW + 4) * i;
        pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 110, 130);
        pdf.text(c.label.toUpperCase(), cx + 6, y + 8);
        pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(15, 31, 92);
        pdf.text(c.value, cx + 6, y + 15);
      });
      y += 28;

      // Sales Register
      pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 31, 92);
      pdf.text('Sales Register', 14, y); y += 6;

      // Table header
      pdf.setFillColor(240, 244, 255);
      pdf.rect(14, y - 3, pw - 28, 8, 'F');
      pdf.setFontSize(7); pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 31, 92);
      pdf.text('DATE', 16, y + 2);
      pdf.text('INVOICE #', 40, y + 2);
      pdf.text('CLIENT', 68, y + 2);
      pdf.text('SUBTOTAL', 115, y + 2);
      pdf.text('GST', 142, y + 2);
      pdf.text('TOTAL', pw - 16, y + 2, { align: 'right' });
      y += 10;

      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5);
      pdf.setTextColor(30, 40, 60);
      if (invoices.length === 0) {
        pdf.setTextColor(150, 150, 150);
        pdf.text('No invoices this month', 16, y); y += 8;
      } else {
        invoices.forEach((inv: any) => {
          if (y > ph - 30) { pdf.addPage(); y = 20; }
          const sub = inv.amount || 0;
          const rate = parseFloat(inv.gstRate) || 0;
          const gst = sub * rate / 100;
          pdf.setTextColor(30, 40, 60);
          pdf.text(inv.date || '', 16, y);
          pdf.text(inv.invoiceNumber || '', 40, y);
          pdf.text((inv.clientName || '').substring(0, 22), 68, y);
          pdf.text(`Rs. ${sub.toLocaleString('en-IN')}`, 115, y);
          pdf.text(`Rs. ${gst.toFixed(0)}`, 142, y);
          pdf.text(`Rs. ${(inv.total || 0).toLocaleString('en-IN')}`, pw - 16, y, { align: 'right' });
          y += 6;
        });
      }

      // Sales totals row
      y += 2;
      pdf.setDrawColor(220, 225, 235);
      pdf.setLineWidth(0.3);
      pdf.line(14, y, pw - 14, y); y += 5;
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8);
      pdf.setTextColor(15, 31, 92);
      pdf.text('TOTAL', 16, y);
      pdf.text(`Rs. ${totalSubtotal.toLocaleString('en-IN')}`, 115, y);
      pdf.text(`Rs. ${totalGSTOutput.toFixed(0)}`, 142, y);
      pdf.text(`Rs. ${totalRevenue.toLocaleString('en-IN')}`, pw - 16, y, { align: 'right' });
      y += 12;

      // Expense Register
      if (y > ph - 60) { pdf.addPage(); y = 20; }
      pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 31, 92);
      pdf.text('Expense Register', 14, y); y += 6;

      pdf.setFillColor(240, 244, 255);
      pdf.rect(14, y - 3, pw - 28, 8, 'F');
      pdf.setFontSize(7); pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 31, 92);
      pdf.text('DATE', 16, y + 2);
      pdf.text('CATEGORY', 40, y + 2);
      pdf.text('VENDOR', 80, y + 2);
      pdf.text('DESCRIPTION', 118, y + 2);
      pdf.text('AMOUNT', pw - 16, y + 2, { align: 'right' });
      y += 10;

      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5);
      pdf.setTextColor(30, 40, 60);
      if (expenses.length === 0) {
        pdf.setTextColor(150, 150, 150);
        pdf.text('No expenses this month', 16, y); y += 8;
      } else {
        expenses.forEach((exp: any) => {
          if (y > ph - 30) { pdf.addPage(); y = 20; }
          pdf.setTextColor(30, 40, 60);
          pdf.text(exp.date || '', 16, y);
          pdf.text((exp.category || '').substring(0, 18), 40, y);
          pdf.text((exp.vendor || '').substring(0, 18), 80, y);
          pdf.text((exp.description || '').substring(0, 22), 118, y);
          pdf.text(`Rs. ${(exp.amount || 0).toLocaleString('en-IN')}`, pw - 16, y, { align: 'right' });
          y += 6;
        });
      }

      // Expense totals
      y += 2;
      pdf.setDrawColor(220, 225, 235);
      pdf.setLineWidth(0.3);
      pdf.line(14, y, pw - 14, y); y += 5;
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8);
      pdf.setTextColor(15, 31, 92);
      pdf.text('TOTAL', 16, y);
      pdf.text(`Rs. ${totalExpenseAmt.toLocaleString('en-IN')}`, pw - 16, y, { align: 'right' });
      y += 12;

      // GST Summary
      if (y > ph - 50) { pdf.addPage(); y = 20; }
      pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 31, 92);
      pdf.text('GST Summary', 14, y); y += 8;

      pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 70, 90);
      if (cgstTotal > 0) {
        pdf.text('CGST', 16, y);
        pdf.text(`Rs. ${cgstTotal.toFixed(2)}`, pw - 16, y, { align: 'right' }); y += 6;
        pdf.text('SGST', 16, y);
        pdf.text(`Rs. ${sgstTotal.toFixed(2)}`, pw - 16, y, { align: 'right' }); y += 6;
      }
      if (igstTotal > 0) {
        pdf.text('IGST', 16, y);
        pdf.text(`Rs. ${igstTotal.toFixed(2)}`, pw - 16, y, { align: 'right' }); y += 6;
      }
      y += 2;
      pdf.setDrawColor(220, 225, 235);
      pdf.line(14, y, pw - 14, y); y += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 31, 92);
      pdf.text('Total Output Tax', 16, y);
      pdf.text(`Rs. ${totalGSTOutput.toFixed(2)}`, pw - 16, y, { align: 'right' });
      y += 5;
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Note: Input tax credit not included. Add GST details to expenses for full GST reconciliation.', 16, y);
      y += 12;

      // Profit summary band
      if (y > ph - 30) { pdf.addPage(); y = 20; }
      pdf.setFillColor(15, 31, 92);
      pdf.rect(14, y, pw - 28, 16, 'F');
      pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('NET PROFIT', 20, y + 10);
      pdf.text(`Rs. ${netProfit.toLocaleString('en-IN')}`, pw - 20, y + 10, { align: 'right' });
      y += 24;

      // Footer
      pdf.setFillColor(240, 244, 255);
      pdf.rect(0, ph - 12, pw, 12, 'F');
      pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 110, 130);
      pdf.text(`Monthly Report: ${label}`, 14, ph - 5);
      pdf.text('Generated with Paavti.in', pw - 14, ph - 5, { align: 'right' });

      pdf.save(`Paavti-Report-${MONTHS[month]}-${year}.pdf`);
      posthog.capture('monthly_report_generated', { month: MONTHS[month], year, invoices: invoices.length, expenses: expenses.length, revenue: totalRevenue, net_profit: netProfit });
    } catch (err) {
      console.error(err);
      alert('Failed to generate report.');
    } finally {
      setGenerating(false);
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
        .controls { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; flex-wrap: wrap; }
        .controls select { padding: 10px 14px; border: 1.5px solid #e5e9f5; border-radius: 8px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #111827; background: #fff; outline: none; transition: border-color 0.15s; }
        .controls select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .btn-fetch { background: #2563eb; color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.15s; }
        .btn-fetch:hover { background: #1d4ed8; }
        .btn-fetch:disabled { opacity: 0.6; cursor: not-allowed; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
        .summary-box { background: #fff; border: 1px solid #e5e9f5; border-radius: 12px; padding: 20px; }
        .summary-box-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 8px; }
        .summary-box-value { font-family: 'Lora', serif; font-size: 22px; font-weight: 600; color: #0f1f5c; }
        .summary-box-value.green { color: #16a34a; }
        .summary-box-value.red { color: #dc2626; }
        .card { background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; overflow: hidden; margin-bottom: 20px; }
        .card-header { padding: 16px 24px; border-bottom: 1px solid #f0f4ff; display: flex; align-items: center; justify-content: space-between; }
        .card-header h3 { font-size: 14px; font-weight: 600; color: #0f1f5c; }
        .card-header span { font-size: 12px; color: #9ca3af; }
        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 16px; text-align: left; background: #f8faff; border-bottom: 1px solid #f0f4ff; }
        th:last-child { text-align: right; }
        td { font-size: 13px; color: #374151; padding: 12px 16px; border-bottom: 1px solid #f8faff; }
        td:last-child { text-align: right; font-weight: 500; }
        .empty-row { text-align: center; color: #9ca3af; font-size: 13px; padding: 24px; }
        .total-row td { font-weight: 600; color: #0f1f5c; background: #f8faff; border-top: 2px solid #e5e9f5; }
        .btn-download { background: #0f1f5c; color: #fff; border: none; padding: 13px 32px; border-radius: 9px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; gap: 8px; }
        .btn-download:hover { background: #1a2f7a; }
        .btn-download:disabled { opacity: 0.6; cursor: not-allowed; }
        .no-data { text-align: center; padding: 60px 20px; color: #9ca3af; font-size: 15px; }
      
        .field label { font-size: 13.5px; }
        .field input, .field textarea, .field select { font-size: 15px; }
        th { font-size: 12px; }
        td { font-size: 14px; }

        @media (max-width: 768px) {
          .editor-root, .root { flex-direction: column; }
          .sidebar { width: 100%; min-height: auto; position: relative; flex-direction: row; flex-wrap: wrap; align-items: center; }
          .sidebar-logo { padding: 14px 16px; border-bottom: none; }
          .sidebar-logo h1 { font-size: 18px; }
          .sidebar-logo p { display: none; }
          .sidebar-nav { display: flex; flex-direction: row; padding: 0 8px 10px; gap: 2px; overflow-x: auto; flex: 1; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; }
          .nav-label { display: none; }
          .nav-item { padding: 7px 10px; font-size: 12px; white-space: nowrap; gap: 6px; }
          .nav-item svg { width: 14px; height: 14px; }
          .sidebar-footer { display: none; }
          .main { margin-left: 0; padding: 16px; }
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

      <div className="editor-root">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>Paavti</h1>
            <p>Business Manager</p>
          </div>
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
            <a href="/receipt-editor" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              New Receipt
            </a>
            <a href="/reports" className="nav-item active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>
              Reports
            </a>
            <a href="/clients" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Clients
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
            <h2>Monthly Report</h2>
            <p>Generate a complete monthly summary with sales, expenses, GST and profit.</p>
          </div>

          <div className="controls">
            <select value={month} onChange={e => { setMonth(parseInt(e.target.value)); setFetched(false); }}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={year} onChange={e => { setYear(parseInt(e.target.value)); setFetched(false); }}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn-fetch" onClick={fetchData} disabled={loading}>
              {loading ? 'Loading...' : 'Fetch Report'}
            </button>
            {fetched && (
              <button className="btn-download" onClick={buildPDF} disabled={generating}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {generating ? 'Generating...' : 'Download PDF'}
              </button>
            )}
          </div>

          {!fetched ? (
            <div className="no-data">Select a month and click Fetch Report to view data.</div>
          ) : (
            <>
              <div className="summary-grid">
                <div className="summary-box">
                  <div className="summary-box-label">Revenue</div>
                  <div className="summary-box-value">Rs. {totalRevenue.toLocaleString('en-IN')}</div>
                </div>
                <div className="summary-box">
                  <div className="summary-box-label">Expenses</div>
                  <div className="summary-box-value red">Rs. {totalExpenseAmt.toLocaleString('en-IN')}</div>
                </div>
                <div className="summary-box">
                  <div className="summary-box-label">Net Profit</div>
                  <div className={`summary-box-value ${netProfit >= 0 ? 'green' : 'red'}`}>Rs. {netProfit.toLocaleString('en-IN')}</div>
                </div>
                <div className="summary-box">
                  <div className="summary-box-label">GST Output</div>
                  <div className="summary-box-value">Rs. {totalGSTOutput.toFixed(2)}</div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Sales Register</h3>
                  <span>{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Invoice #</th>
                        <th>Client</th>
                        <th>Subtotal</th>
                        <th>GST</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.length === 0 ? (
                        <tr><td colSpan={6} className="empty-row">No invoices this month</td></tr>
                      ) : (
                        <>
                          {invoices.map((inv: any) => {
                            const sub = inv.amount || 0;
                            const rate = parseFloat(inv.gstRate) || 0;
                            const gst = sub * rate / 100;
                            return (
                              <tr key={inv.id}>
                                <td>{inv.date}</td>
                                <td style={{ color: '#2563eb', fontWeight: 500 }}>{inv.invoiceNumber}</td>
                                <td>{inv.clientName || '—'}</td>
                                <td>Rs. {sub.toLocaleString('en-IN')}</td>
                                <td>Rs. {gst.toFixed(0)}</td>
                                <td>Rs. {(inv.total || 0).toLocaleString('en-IN')}</td>
                              </tr>
                            );
                          })}
                          <tr className="total-row">
                            <td colSpan={3}>Total</td>
                            <td>Rs. {totalSubtotal.toLocaleString('en-IN')}</td>
                            <td>Rs. {totalGSTOutput.toFixed(0)}</td>
                            <td>Rs. {totalRevenue.toLocaleString('en-IN')}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Expense Register</h3>
                  <span>{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Vendor</th>
                        <th>Description</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.length === 0 ? (
                        <tr><td colSpan={5} className="empty-row">No expenses this month</td></tr>
                      ) : (
                        <>
                          {expenses.map((exp: any) => (
                            <tr key={exp.id}>
                              <td>{exp.date}</td>
                              <td>{exp.category}</td>
                              <td>{exp.vendor || '—'}</td>
                              <td>{exp.description || '—'}</td>
                              <td>Rs. {(exp.amount || 0).toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                          <tr className="total-row">
                            <td colSpan={4}>Total</td>
                            <td>Rs. {totalExpenseAmt.toLocaleString('en-IN')}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>GST Summary</h3>
                  <span>Output tax, input credit, net payable</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Tax Type</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cgstTotal > 0 && (
                        <>
                          <tr><td>CGST</td><td>Rs. {cgstTotal.toFixed(2)}</td></tr>
                          <tr><td>SGST</td><td>Rs. {sgstTotal.toFixed(2)}</td></tr>
                        </>
                      )}
                      {igstTotal > 0 && (
                        <tr><td>IGST</td><td>Rs. {igstTotal.toFixed(2)}</td></tr>
                      )}
                      <tr className="total-row">
                        <td>Total Output Tax</td>
                        <td>Rs. {totalGSTOutput.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>Input Credit (from expenses)</td>
                        <td style={{ color: '#16a34a' }}>- Rs. {totalGSTInput.toFixed(2)}</td>
                      </tr>
                      <tr className="total-row">
                        <td>Net GST Payable</td>
                        <td style={{ color: netGSTPayable >= 0 ? '#dc2626' : '#16a34a' }}>Rs. {netGSTPayable.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
