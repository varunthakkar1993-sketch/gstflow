"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import posthog from "posthog-js";

/**
 * Free Quotation / Estimate Generator (client-side only, no DB).
 * Anonymous visitors create and download a quotation PDF for free (SEO magnet).
 * "Save & send" links to /signup where account features apply.
 * Uses your existing `jspdf` (dynamically imported).
 */

type Item = { id: number; desc: string; qty: number; rate: number; gst: number };
const GST_SLABS = [0, 5, 12, 18, 28];

const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rs = (n: number) =>
  "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function QuotationGenerator() {
  const [from, setFrom] = useState({ name: "Rao Design Studio", gstin: "29ABCDE1234F1Z5" });
  const [to, setTo] = useState({ name: "Nimbus Tech Pvt Ltd" });
  const [meta, setMeta] = useState({ number: "QTN-2026-014", date: "", valid: "" });
  const [items, setItems] = useState<Item[]>([
    { id: 1, desc: "Logo & brand identity design", qty: 1, rate: 25000, gst: 18 },
    { id: 2, desc: "Website UI design (5 pages)", qty: 1, rate: 40000, gst: 18 },
  ]);
  const [notes, setNotes] = useState("50% advance to start, balance on delivery. Quotation valid for 15 days.");
  const [downloading, setDownloading] = useState(false);
  const idRef = useRef(3);

  // client-only dates to avoid hydration mismatch
  useEffect(() => {
    if (!meta.date) {
      const today = new Date();
      const valid = new Date(today.getTime() + 15 * 864e5);
      setMeta((m) => ({
        ...m,
        date: today.toISOString().slice(0, 10),
        valid: valid.toISOString().slice(0, 10),
      }));
    }
  }, [meta.date]);

  const { subtotal, tax, total } = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const it of items) {
      const amt = (it.qty || 0) * (it.rate || 0);
      subtotal += amt;
      tax += (amt * (it.gst || 0)) / 100;
    }
    return { subtotal, tax, total: subtotal + tax };
  }, [items]);

  const updateItem = (id: number, key: keyof Item, value: string) =>
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, [key]: key === "desc" ? value : Number(value) || 0 } : it
      )
    );
  const addItem = () =>
    setItems((prev) => [...prev, { id: idRef.current++, desc: "New item", qty: 1, rate: 0, gst: 18 }]);
  const removeItem = (id: number) => setItems((prev) => prev.filter((it) => it.id !== id));

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
      doc.text("QUOTATION", W - M, 34, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`#${meta.number}`, W - M, 52, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(meta.date, W - M, 68, { align: "right" });

      doc.setTextColor(...navy);
      let y = 130;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 130);
      doc.text("QUOTATION FOR", M, y);
      doc.text("VALID UNTIL", W - M, y, { align: "right" });
      doc.setTextColor(...navy);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(to.name || "Client", M, y + 16);
      doc.text(meta.valid || "-", W - M, y + 16, { align: "right" });

      y += 50;
      doc.setFillColor(248, 250, 252);
      doc.rect(M, y, W - 2 * M, 24, "F");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 130);
      doc.text("ITEM", M + 8, y + 16);
      doc.text("QTY", 350, y + 16, { align: "right" });
      doc.text("RATE", 420, y + 16, { align: "right" });
      doc.text("GST", 464, y + 16, { align: "right" });
      doc.text("AMOUNT", W - M - 8, y + 16, { align: "right" });
      y += 24;

      doc.setTextColor(...navy);
      doc.setFontSize(10);
      for (const it of items) {
        const amt = (it.qty || 0) * (it.rate || 0);
        y += 22;
        doc.text(String(it.desc).slice(0, 42), M + 8, y);
        doc.text(String(it.qty), 350, y, { align: "right" });
        doc.text(rs(it.rate), 420, y, { align: "right" });
        doc.text(`${it.gst}%`, 464, y, { align: "right" });
        doc.text(rs(amt), W - M - 8, y, { align: "right" });
        doc.setDrawColor(240, 242, 246);
        doc.line(M, y + 8, W - M, y + 8);
      }

      y += 34;
      const lx = 360;
      const rx = W - M - 8;
      doc.setFontSize(10);
      const line = (label: string, val: string) => {
        doc.setFont("helvetica", "normal");
        doc.text(label, lx, y);
        doc.text(val, rx, y, { align: "right" });
        y += 18;
      };
      line("Subtotal", rs(subtotal));
      line("GST", rs(tax));
      doc.setDrawColor(...navy);
      doc.line(lx, y - 6, rx, y - 6);
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...blue);
      doc.text("Total", lx, y);
      doc.text(rs(total), rx, y, { align: "right" });

      if (notes) {
        y += 34;
        doc.setTextColor(120, 120, 130);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("NOTES & TERMS", M, y);
        doc.setTextColor(60, 60, 70);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(doc.splitTextToSize(notes, W - 2 * M), M, y + 15);
      }

      doc.setTextColor(170, 174, 185);
      doc.setFontSize(8);
      doc.text("Generated with Paavti - paavti.com", W / 2, 812, { align: "center" });

      doc.save(`${meta.number || "quotation"}.pdf`);
      posthog.capture("quotation_pdf_downloaded", {
        source: "quotation_generator",
        total,
        item_count: items.length,
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
            <label className={label}>Client name</label>
            <input className={field} value={to.name} onChange={(e) => setTo({ ...to, name: e.target.value })} />
          </div>
          <div>
            <label className={label}>Valid until</label>
            <input type="date" className={field} value={meta.valid} onChange={(e) => setMeta({ ...meta, valid: e.target.value })} />
          </div>
        </div>

        <h3 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">Items</h3>
        <div className="mb-1 grid grid-cols-[2fr_0.8fr_1fr_1fr_auto] gap-2 px-1 text-[11px] font-semibold uppercase text-slate-400">
          <span>Description</span><span>Qty</span><span>Rate ₹</span><span>GST</span><span></span>
        </div>
        <div className="space-y-1.5">
          {items.map((it) => (
            <div key={it.id} className="grid grid-cols-[2fr_0.8fr_1fr_1fr_auto] items-center gap-2">
              <input className={field} value={it.desc} onChange={(e) => updateItem(it.id, "desc", e.target.value)} />
              <input className={field} type="number" value={it.qty} onChange={(e) => updateItem(it.id, "qty", e.target.value)} />
              <input className={field} type="number" value={it.rate} onChange={(e) => updateItem(it.id, "rate", e.target.value)} />
              <select className={field} value={it.gst} onChange={(e) => updateItem(it.id, "gst", e.target.value)}>
                {GST_SLABS.map((g) => <option key={g} value={g}>{g}%</option>)}
              </select>
              <button aria-label="Remove item" onClick={() => removeItem(it.id)} className="h-9 w-9 rounded-md bg-red-100 text-red-700 hover:bg-red-200">×</button>
            </div>
          ))}
        </div>
        <button onClick={addItem} className="mt-2.5 w-full rounded-lg border border-dashed border-[#2563eb] bg-[#eff4ff] py-2 text-sm font-semibold text-[#1d4ed8] hover:bg-[#e2e8ff]">
          + Add line item
        </button>

        <label className={label}>Notes &amp; terms</label>
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
              <div className="text-xs opacity-80">QUOTATION</div>
              <div className="font-bold">#{meta.number}</div>
              <div className="text-xs opacity-80">{meta.date}</div>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="mb-3 flex justify-between gap-4">
              <div className="text-[12.5px] text-slate-700">
                <div className="text-[11px] uppercase text-slate-400">Quotation for</div>
                {to.name || "Client"}
              </div>
              <div className="text-right text-[12.5px] text-slate-700">
                <div className="text-[11px] uppercase text-slate-400">Valid until</div>
                {meta.valid || "-"}
              </div>
            </div>
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase text-slate-400">
                  <th className="border-b border-slate-200 px-2 py-1.5 text-left">Item</th>
                  <th className="border-b border-slate-200 px-2 py-1.5 text-right">Qty</th>
                  <th className="border-b border-slate-200 px-2 py-1.5 text-right">Rate</th>
                  <th className="border-b border-slate-200 px-2 py-1.5 text-right">GST</th>
                  <th className="border-b border-slate-200 px-2 py-1.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td className="border-b border-slate-100 px-2 py-1.5">{it.desc}</td>
                    <td className="border-b border-slate-100 px-2 py-1.5 text-right">{it.qty}</td>
                    <td className="border-b border-slate-100 px-2 py-1.5 text-right">{inr(it.rate)}</td>
                    <td className="border-b border-slate-100 px-2 py-1.5 text-right">{it.gst}%</td>
                    <td className="border-b border-slate-100 px-2 py-1.5 text-right">{inr((it.qty || 0) * (it.rate || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ml-auto mt-3 w-60 text-[13px]">
              <div className="flex justify-between py-1"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
              <div className="flex justify-between py-1"><span>GST</span><span>{inr(tax)}</span></div>
              <div className="mt-1.5 flex justify-between border-t-2 border-[#0f1f5c] pt-2 text-base font-extrabold text-[#2563eb]">
                <span>Total</span><span>{inr(total)}</span>
              </div>
            </div>
            {notes ? (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-[12px] text-slate-600">
                <div className="mb-1 text-[10.5px] font-semibold uppercase text-slate-400">Notes &amp; terms</div>
                {notes}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <button onClick={downloadPdf} disabled={downloading} className="rounded-lg bg-[#2563eb] px-5 py-2.5 font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60">
            {downloading ? "Preparing…" : "⬇ Download PDF (free)"}
          </button>
          <a href="/signup" onClick={() => posthog.capture("signup_cta_clicked", { source: "quotation_generator", cta: "save_and_send" })}
            className="rounded-lg border-[1.5px] border-[#2563eb] bg-white px-5 py-2.5 font-semibold text-[#2563eb] hover:bg-[#eff4ff]">
            🔒 Save &amp; convert to invoice →
          </a>
        </div>
        <p className="mt-2 text-[12.5px] text-slate-500">
          Downloading is free &amp; unlimited. A free account lets you save clients and turn a quote into an invoice in one click.
        </p>
      </div>
    </div>
  );
}
