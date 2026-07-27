"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";

/**
 * Free Payment Receipt Generator (client-side only, no DB).
 * Anonymous visitors create and download a payment receipt PDF for free (SEO magnet).
 * "Save & manage" links to /signup where account features apply.
 * Uses your existing `jspdf` (dynamically imported).
 */

const MODES = ["Cash", "UPI", "Bank transfer", "Cheque", "Card"];

const rs = (n: number) =>
  "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Indian-system number to words (rupees), whole + paise.
function inWords(num: number): string {
  if (!isFinite(num) || num <= 0) return "Zero rupees only";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const twoDigits = (n: number): string => {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  };
  const threeDigits = (n: number): string => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return (h ? ones[h] + " Hundred" + (r ? " " : "") : "") + (r ? twoDigits(r) : "");
  };
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let n = rupees;
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const hundred = n;
  if (crore) parts.push(threeDigits(crore) + " Crore");
  if (lakh) parts.push(twoDigits(lakh) + " Lakh");
  if (thousand) parts.push(twoDigits(thousand) + " Thousand");
  if (hundred) parts.push(threeDigits(hundred));
  let words = parts.join(" ").trim() || "Zero";
  words += " rupees";
  if (paise) words += " and " + twoDigits(paise) + " paise";
  return words + " only";
}

export default function PaymentReceiptGenerator() {
  const [from, setFrom] = useState({ name: "Sharma Traders", gstin: "27ABCDE1234F1Z5" });
  const [payer, setPayer] = useState("Verma Enterprises");
  const [meta, setMeta] = useState({ number: "RCP-2026-014", date: "" });
  const [amount, setAmount] = useState(25960);
  const [mode, setMode] = useState("UPI");
  const [against, setAgainst] = useState("INV-2026-014");
  const [notes, setNotes] = useState("Payment received in full against the above invoice.");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!meta.date) {
      setMeta((m) => ({ ...m, date: new Date().toISOString().slice(0, 10) }));
    }
  }, [meta.date]);

  const words = inWords(amount || 0);

  async function downloadPdf() {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const W = 595;
      const M = 42;
      const navy: [number, number, number] = [15, 31, 92];
      const blue: [number, number, number] = [37, 99, 235];

      doc.setFillColor(...navy);
      doc.rect(0, 0, W, 92, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(from.name || "Your Business", M, 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`GSTIN: ${from.gstin || "-"}`, M, 60);
      doc.setFontSize(9);
      doc.text("PAYMENT RECEIPT", W - M, 34, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`#${meta.number}`, W - M, 52, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(meta.date, W - M, 68, { align: "right" });

      // Amount box
      let y = 132;
      doc.setFillColor(239, 244, 255);
      doc.rect(M, y, W - 2 * M, 56, "F");
      doc.setTextColor(120, 120, 130);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("AMOUNT RECEIVED", M + 14, y + 22);
      doc.setTextColor(...blue);
      doc.setFontSize(22);
      doc.text(rs(amount || 0), M + 14, y + 44);
      doc.setTextColor(120, 120, 130);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("MODE", W - M - 14, y + 22, { align: "right" });
      doc.setTextColor(...navy);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(mode, W - M - 14, y + 42, { align: "right" });

      y += 90;
      doc.setTextColor(60, 60, 70);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const bodyLine = (label: string, val: string) => {
        doc.setTextColor(120, 120, 130);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(label, M, y);
        doc.setTextColor(30, 30, 40);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(doc.splitTextToSize(val || "-", W - 2 * M), M, y + 15);
        y += 40;
      };
      bodyLine("RECEIVED WITH THANKS FROM", payer);
      bodyLine("AMOUNT IN WORDS", words);
      if (against) bodyLine("AGAINST INVOICE", against);
      if (notes) bodyLine("TOWARDS", notes);

      // Signature
      y = Math.max(y, 640);
      doc.setDrawColor(200, 204, 214);
      doc.line(W - M - 150, y, W - M, y);
      doc.setTextColor(120, 120, 130);
      doc.setFontSize(9);
      doc.text(`For ${from.name || "Your Business"}`, W - M, y + 16, { align: "right" });
      doc.text("Authorised signatory", W - M, y + 30, { align: "right" });

      doc.setTextColor(170, 174, 185);
      doc.setFontSize(8);
      doc.text("Generated with Paavti - paavti.com", W / 2, 812, { align: "center" });

      doc.save(`${meta.number || "payment-receipt"}.pdf`);
      posthog.capture("receipt_pdf_downloaded", {
        source: "payment_receipt_generator",
        amount,
        mode,
      });
    } finally {
      setDownloading(false);
    }
  }

  const field =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none";
  const label = "mb-1 mt-2.5 block text-[13px] font-semibold text-slate-600";

  return (
    <div className="my-8 grid gap-6 lg:grid-cols-2">
      {/* FORM */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className={label}>Your business name</label>
            <input className={field} value={from.name} onChange={(e) => setFrom({ ...from, name: e.target.value })} />
          </div>
          <div>
            <label className={label}>Your GSTIN (optional)</label>
            <input className={field} value={from.gstin} onChange={(e) => setFrom({ ...from, gstin: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className={label}>Receipt number</label>
            <input className={field} value={meta.number} onChange={(e) => setMeta({ ...meta, number: e.target.value })} />
          </div>
          <div>
            <label className={label}>Date</label>
            <input type="date" className={field} value={meta.date} onChange={(e) => setMeta({ ...meta, date: e.target.value })} />
          </div>
        </div>
        <label className={label}>Received from</label>
        <input className={field} value={payer} onChange={(e) => setPayer(e.target.value)} />
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className={label}>Amount received (₹)</label>
            <input type="number" className={field} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className={label}>Payment mode</label>
            <select className={field} value={mode} onChange={(e) => setMode(e.target.value)}>
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <label className={label}>Against invoice (optional)</label>
        <input className={field} value={against} onChange={(e) => setAgainst(e.target.value)} />
        <label className={label}>Towards / notes</label>
        <textarea className={field + " h-20 resize-none"} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {/* PREVIEW */}
      <div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 text-[13px]">
          <div className="flex items-start justify-between bg-[#0f1f5c] px-5 py-4 text-white">
            <div>
              <h4 className="text-xl font-bold">{from.name || "Your Business"}</h4>
              <div className="text-xs opacity-80">GSTIN: {from.gstin || "-"}</div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-80">PAYMENT RECEIPT</div>
              <div className="font-bold">#{meta.number}</div>
              <div className="text-xs opacity-80">{meta.date}</div>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between rounded-xl bg-[#eff4ff] px-4 py-3">
              <div>
                <div className="text-[10.5px] font-semibold uppercase text-slate-400">Amount received</div>
                <div className="text-2xl font-extrabold text-[#2563eb]">{rs(amount || 0)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10.5px] font-semibold uppercase text-slate-400">Mode</div>
                <div className="text-base font-bold text-[#0f1f5c]">{mode}</div>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-[12.5px]">
              <div>
                <div className="text-[10.5px] font-semibold uppercase text-slate-400">Received with thanks from</div>
                <div className="text-slate-700">{payer || "-"}</div>
              </div>
              <div>
                <div className="text-[10.5px] font-semibold uppercase text-slate-400">Amount in words</div>
                <div className="text-slate-700">{words}</div>
              </div>
              {against ? (
                <div>
                  <div className="text-[10.5px] font-semibold uppercase text-slate-400">Against invoice</div>
                  <div className="text-slate-700">{against}</div>
                </div>
              ) : null}
              {notes ? (
                <div>
                  <div className="text-[10.5px] font-semibold uppercase text-slate-400">Towards</div>
                  <div className="text-slate-700">{notes}</div>
                </div>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end">
              <div className="text-right text-[12px] text-slate-500">
                <div className="mb-5">For {from.name || "Your Business"}</div>
                <div className="border-t border-slate-300 pt-1">Authorised signatory</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <button onClick={downloadPdf} disabled={downloading} className="rounded-lg bg-[#2563eb] px-5 py-2.5 font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60">
            {downloading ? "Preparing…" : "⬇ Download PDF (free)"}
          </button>
          <a href="/signup" onClick={() => posthog.capture("signup_cta_clicked", { source: "payment_receipt_generator", cta: "save_and_manage" })}
            className="rounded-lg border-[1.5px] border-[#2563eb] bg-white px-5 py-2.5 font-semibold text-[#2563eb] hover:bg-[#eff4ff]">
            🔒 Save &amp; track payments →
          </a>
        </div>
        <p className="mt-2 text-[12.5px] text-slate-500">
          Downloading is free &amp; unlimited. A free account lets you track which invoices are paid and send receipts automatically.
        </p>
      </div>
    </div>
  );
}
