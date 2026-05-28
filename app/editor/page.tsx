'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getCountFromServer } from 'firebase/firestore';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import Link from 'next/link';

export default function InvoiceEditor() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    clientGSTIN: '',
    description: 'Web Development Services',
    amount: '5000',
    isIntraState: true,
    gstRate: 18,
  });

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { window.location.href = '/login'; return; }
      setUser(currentUser);

      // Load business profile
      const profileSnap = await getDoc(doc(db, 'profiles', currentUser.uid));
      if (profileSnap.exists()) setProfile(profileSnap.data());

      // Auto-increment invoice number
      const q = query(collection(db, 'invoices'), where('userId', '==', currentUser.uid));
      const countSnap = await getCountFromServer(q);
      const count = countSnap.data().count + 1;
      const invoiceNumber = `INV-${String(count).padStart(3, '0')}`;
      setInvoiceData(prev => ({ ...prev, invoiceNumber }));
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInvoiceData({ ...invoiceData, [name]: value });
  };

  const subtotal = parseFloat(invoiceData.amount) || 0;
  const rate = parseFloat(invoiceData.gstRate.toString()) / 100 || 0;
  const taxAmount = subtotal * rate;
  const total = subtotal + (invoiceData.isIntraState ? taxAmount * 2 : taxAmount);

  const generateAndSavePDF = async () => {
    setLoading(true);
    try {
      const doc2 = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc2.internal.pageSize.getWidth();

      // Header — Business Info
      doc2.setFontSize(20);
      doc2.setFont('helvetica', 'bold');
      doc2.text(profile?.businessName || 'Your Business', 20, 22);
      doc2.setFontSize(9);
      doc2.setFont('helvetica', 'normal');
      if (profile?.address) doc2.text(`${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`, 20, 29);
      if (profile?.gstin) doc2.text(`GSTIN: ${profile.gstin}`, 20, 35);
      if (profile?.phone) doc2.text(`Phone: ${profile.phone}`, 20, 41);

      // Invoice number + date (top right)
      doc2.setFontSize(22);
      doc2.setFont('helvetica', 'bold');
      doc2.text('INVOICE', pageWidth - 20, 22, { align: 'right' });
      doc2.setFontSize(9);
      doc2.setFont('helvetica', 'normal');
      doc2.text(`Invoice #: ${invoiceData.invoiceNumber}`, pageWidth - 20, 30, { align: 'right' });
      doc2.text(`Date: ${invoiceData.date}`, pageWidth - 20, 36, { align: 'right' });

      // Divider
      doc2.setLineWidth(0.8);
      doc2.line(20, 50, pageWidth - 20, 50);

      // Bill To
      let y = 60;
      doc2.setFontSize(10);
      doc2.setFont('helvetica', 'bold');
      doc2.text('Bill To:', 20, y);
      y += 7;
      doc2.setFont('helvetica', 'normal');
      doc2.text(invoiceData.clientName || 'Client Name', 20, y); y += 6;
      if (invoiceData.clientEmail) { doc2.text(invoiceData.clientEmail, 20, y); y += 6; }
      if (invoiceData.clientAddress) { doc2.text(invoiceData.clientAddress, 20, y); y += 6; }
      if (invoiceData.clientGSTIN) { doc2.text(`GSTIN: ${invoiceData.clientGSTIN}`, 20, y); y += 6; }

      // Items table
      y += 8;
      doc2.setFont('helvetica', 'bold');
      doc2.setFontSize(10);
      doc2.text('Description', 20, y);
      doc2.text('Amount (₹)', pageWidth - 20, y, { align: 'right' });
      y += 5;
      doc2.setLineWidth(0.3);
      doc2.line(20, y, pageWidth - 20, y);
      y += 7;
      doc2.setFont('helvetica', 'normal');
      doc2.text(invoiceData.description, 20, y);
      doc2.text(subtotal.toLocaleString('en-IN'), pageWidth - 20, y, { align: 'right' });
      y += 10;

      // GST breakdown
      doc2.setLineWidth(0.3);
      doc2.line(20, y, pageWidth - 20, y);
      y += 7;
      doc2.setFont('helvetica', 'bold');
      if (invoiceData.isIntraState) {
        doc2.text(`CGST (${invoiceData.gstRate / 2}%)`, 20, y);
        doc2.text(taxAmount.toFixed(2), pageWidth - 20, y, { align: 'right' }); y += 7;
        doc2.text(`SGST (${invoiceData.gstRate / 2}%)`, 20, y);
        doc2.text(taxAmount.toFixed(2), pageWidth - 20, y, { align: 'right' }); y += 7;
      } else {
        doc2.text(`IGST (${invoiceData.gstRate}%)`, 20, y);
        doc2.text(taxAmount.toFixed(2), pageWidth - 20, y, { align: 'right' }); y += 7;
      }

      // Total
      doc2.setLineWidth(0.8);
      doc2.line(20, y, pageWidth - 20, y); y += 8;
      doc2.setFontSize(12);
      doc2.text('Total', 20, y);
      doc2.text(`₹ ${total.toLocaleString('en-IN')}`, pageWidth - 20, y, { align: 'right' });
      y += 16;

      // Bank details
      if (profile?.bankName) {
        doc2.setFontSize(10);
        doc2.setFont('helvetica', 'bold');
        doc2.text('Bank Details:', 20, y); y += 7;
        doc2.setFont('helvetica', 'normal');
        doc2.text(`Bank: ${profile.bankName}`, 20, y); y += 6;
        doc2.text(`Account Holder: ${profile.accountHolder}`, 20, y); y += 6;
        doc2.text(`Account No: ${profile.accountNumber}`, 20, y); y += 6;
        doc2.text(`IFSC: ${profile.ifscCode}`, 20, y); y += 10;
      }

      // UPI QR
      if (profile?.upiId) {
        doc2.setFont('helvetica', 'bold');
        doc2.setFontSize(10);
        doc2.text('Pay via UPI:', 20, y); y += 7;
        const upiLink = `upi://pay?pa=${profile.upiId}&pn=${encodeURIComponent(profile.businessName || '')}&am=${total.toFixed(2)}&cu=INR`;
        const qrDataUrl = await QRCode.toDataURL(upiLink, { width: 200, margin: 1 });
        doc2.addImage(qrDataUrl, 'PNG', 20, y, 40, 40);
        doc2.setFont('helvetica', 'normal');
        doc2.text(profile.upiId, 65, y + 20);
        y += 48;
      }

      // Footer
      doc2.setFontSize(9);
      doc2.setFont('helvetica', 'normal');
      doc2.text('Thank you for your business!', 20, y);
      doc2.text('Made with GSTFlow.in', 20, y + 6);

      doc2.save(`GSTFlow-${invoiceData.invoiceNumber}.pdf`);

      // Save to Firestore
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
        isIntraState: invoiceData.isIntraState,
        total: total,
        createdAt: serverTimestamp(),
      });

      window.location.href = '/dashboard';
    } catch (error) {
      console.error(error);
      alert('Failed to generate invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">GSTFlow</div>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-gray-500">{user?.email}</span>
            <Link href="/profile" className="hover:underline">My Profile</Link>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          </div>
        </div>
      </nav>

      {!profile && (
        <div className="max-w-4xl mx-auto px-6 pt-6">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-5 py-4 text-sm">
            ⚠️ Your business profile is incomplete. <Link href="/profile" className="font-semibold underline">Set it up here</Link> so your invoices include your details automatically.
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-8">Create GST Invoice</h1>

        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Invoice Number</label>
              <input type="text" name="invoiceNumber" value={invoiceData.invoiceNumber} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input type="date" name="date" value={invoiceData.date} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="font-semibold mb-4">Client Details</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Client Name</label>
                <input type="text" name="clientName" value={invoiceData.clientName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Client Email</label>
                <input type="email" name="clientEmail" value={invoiceData.clientEmail} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Client Address</label>
                <input type="text" name="clientAddress" value={invoiceData.clientAddress} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="Street, City, State, Pincode" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Client GSTIN (optional)</label>
                <input type="text" name="clientGSTIN" value={invoiceData.clientGSTIN} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="29AAABC1234D1Z5" />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="font-semibold mb-4">Invoice Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea name="description" value={invoiceData.description} onChange={handleChange} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Subtotal (₹)</label>
                  <input type="number" name="amount" value={invoiceData.amount} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">GST Rate</label>
                  <select name="gstRate" value={invoiceData.gstRate} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl">
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">GST Type</label>
                <select name="isIntraState" value={invoiceData.isIntraState.toString()} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl">
                  <option value="true">Intra-State (CGST + SGST)</option>
                  <option value="false">Inter-State (IGST)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-xl text-sm">
            <div className="flex justify-between mb-2"><span>Subtotal</span><span>₹ {subtotal.toLocaleString('en-IN')}</span></div>
            {invoiceData.isIntraState ? (
              <>
                <div className="flex justify-between mb-2"><span>CGST ({invoiceData.gstRate / 2}%)</span><span>₹ {taxAmount.toFixed(2)}</span></div>
                <div className="flex justify-between mb-2"><span>SGST ({invoiceData.gstRate / 2}%)</span><span>₹ {taxAmount.toFixed(2)}</span></div>
              </>
            ) : (
              <div className="flex justify-between mb-2"><span>IGST ({invoiceData.gstRate}%)</span><span>₹ {taxAmount.toFixed(2)}</span></div>
            )}
            <hr className="my-3" />
            <div className="flex justify-between font-bold text-base"><span>Total</span><span>₹ {total.toLocaleString('en-IN')}</span></div>
          </div>

          <button onClick={generateAndSavePDF} disabled={loading} className="w-full bg-black text-white py-4 rounded-2xl text-lg font-medium hover:bg-gray-800 disabled:opacity-70">
            {loading ? 'Generating...' : 'Generate & Download Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}
