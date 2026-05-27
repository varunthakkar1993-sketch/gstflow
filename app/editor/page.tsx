'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export default function InvoiceEditor() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "INV-001",
    date: new Date().toISOString().split('T')[0],
    clientName: "",
    clientEmail: "",
    clientGSTIN: "",
    upiId: "",
    description: "Web Development Services",
    amount: "5000",
    isIntraState: true,
    gstRate: 18,
  });

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) window.location.href = '/login';
      else setUser(currentUser);
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
      // Generate PDF
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("GSTFlow", 20, 25);
      doc.setFontSize(11);
      doc.text("Beautiful GST Invoices for Indian Freelancers & Businesses", 20, 33);

      doc.setFontSize(12);
      doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, pageWidth - 75, 25);
      doc.text(`Date: ${invoiceData.date}`, pageWidth - 75, 33);

      doc.setLineWidth(0.8);
      doc.line(20, 45, pageWidth - 20, 45);

      let y = 55;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", 20, y);
      y += 8;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(invoiceData.clientName || "Client Name", 20, y);
      y += 7;
      doc.text(invoiceData.clientEmail || "", 20, y);
      y += 7;
      if (invoiceData.clientGSTIN) {
        doc.text(`GSTIN: ${invoiceData.clientGSTIN}`, 20, y);
        y += 7;
      }

      y += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Description", 20, y);
      doc.text("Amount (₹)", pageWidth - 60, y);
      y += 8;
      doc.setLineWidth(0.5);
      doc.line(20, y, pageWidth - 20, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.text(invoiceData.description, 20, y);
      doc.text(subtotal.toLocaleString('en-IN'), pageWidth - 60, y);
      y += 15;

      doc.setFont("helvetica", "bold");
      if (invoiceData.isIntraState) {
        doc.text(`CGST (${invoiceData.gstRate/2}%)`, 20, y);
        doc.text(`SGST (${invoiceData.gstRate/2}%)`, 20, y + 8);
        doc.text(taxAmount.toFixed(2), pageWidth - 60, y);
        doc.text(taxAmount.toFixed(2), pageWidth - 60, y + 8);
      } else {
        doc.text(`IGST (${invoiceData.gstRate}%)`, 20, y);
        doc.text(taxAmount.toFixed(2), pageWidth - 60, y);
      }
      y += 22;

      doc.setLineWidth(0.8);
      doc.line(20, y, pageWidth - 20, y);
      y += 12;

      doc.setFontSize(14);
      doc.text("Total", pageWidth - 70, y);
      doc.text(`₹ ${total.toLocaleString('en-IN')}`, pageWidth - 60, y);

      if (invoiceData.upiId) {
        y += 25;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Pay Instantly via UPI", 20, y);
        y += 10;

        const upiLink = `upi://pay?pa=${invoiceData.upiId}&pn=${encodeURIComponent(invoiceData.clientName || 'Client')}&am=${total.toFixed(2)}&cu=INR`;
        const qrDataUrl = await QRCode.toDataURL(upiLink, { width: 220, margin: 2 });
        doc.addImage(qrDataUrl, 'PNG', 20, y, 50, 50);
        doc.setFontSize(10);
        doc.text(invoiceData.upiId, 80, y + 28);
      }

      doc.setFontSize(10);
      doc.text("Thank you for your business!", 20, 195);
      doc.text("Made with GSTFlow.in", 20, 202);

      const fileName = `GSTFlow-Invoice-${invoiceData.invoiceNumber}.pdf`;
      doc.save(fileName);

      // Save to Firebase
      await addDoc(collection(db, "invoices"), {
        userId: user.uid,
        invoiceNumber: invoiceData.invoiceNumber,
        date: invoiceData.date,
        clientName: invoiceData.clientName,
        clientEmail: invoiceData.clientEmail,
        clientGSTIN: invoiceData.clientGSTIN,
        upiId: invoiceData.upiId,
        description: invoiceData.description,
        amount: subtotal,
        gstRate: invoiceData.gstRate,
        isIntraState: invoiceData.isIntraState,
        total: total,
        createdAt: serverTimestamp()
      });

      alert("✅ Invoice saved + PDF downloaded!");
    } catch (error) {
      console.error(error);
      alert("Failed to save/generate invoice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">GSTFlow</div>
          <div className="flex items-center gap-6">
            <span>{user?.email}</span>
            <a href="/dashboard" className="text-black hover:underline">Dashboard</a>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-8">Create New GST Invoice</h1>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium mb-2">Invoice Number</label>
              <input type="text" name="invoiceNumber" value={invoiceData.invoiceNumber} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input type="date" name="date" value={invoiceData.date} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Client Name</label>
              <input type="text" name="clientName" value={invoiceData.clientName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Client Email</label>
              <input type="email" name="clientEmail" value={invoiceData.clientEmail} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Client GSTIN (optional)</label>
              <input type="text" name="clientGSTIN" value={invoiceData.clientGSTIN} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="29AAABC1234D1Z5" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Your UPI ID (for QR Code)</label>
              <input type="text" name="upiId" value={invoiceData.upiId} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="yourname@okaxis or @ybl" />
            </div>

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
                <label className="block text-sm font-medium mb-2">GST Rate (%)</label>
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

            <div className="bg-gray-50 p-5 rounded-xl text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>₹ {subtotal.toLocaleString('en-IN')}</span></div>
              {invoiceData.isIntraState ? (
                <>
                  <div className="flex justify-between"><span>CGST ({invoiceData.gstRate/2}%)</span><span>₹ {taxAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>SGST ({invoiceData.gstRate/2}%)</span><span>₹ {taxAmount.toFixed(2)}</span></div>
                </>
              ) : (
                <div className="flex justify-between"><span>IGST ({invoiceData.gstRate}%)</span><span>₹ {taxAmount.toFixed(2)}</span></div>
              )}
              <hr className="my-3" />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>₹ {total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={generateAndSavePDF}
            disabled={loading}
            className="mt-10 w-full bg-black text-white py-4 rounded-2xl text-lg font-medium hover:bg-gray-800 disabled:opacity-70"
          >
            {loading ? "Saving & Generating..." : "Generate & Download GST Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
