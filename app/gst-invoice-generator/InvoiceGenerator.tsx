"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Free GST Invoice Generator — client-side only.
 *
 * Nothing here touches Firestore or the 5-invoices/month account limit.
 * Anonymous visitors can create and download unlimited PDFs (the SEO magnet).
 * The "Save & send" button links to /signup, where account limits apply.
 *
 * Uses your existing deps: `jspdf` and `qrcode` (dynamically imported).
 */

type Item = { id: number; desc: string; hsn: string; qty: number; rate: number; gst: number };

const STATES = [
  "Karnataka", "Maharashtra", "Delhi", "Tamil Nadu", "Gujarat", "Telangana",
  "Uttar Pradesh", "West Bengal", "Rajasthan", "Kerala", "Haryana", "Punjab",
];
const GST_SLABS = [0, 5, 12, 18, 28];

const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// jsPDF's built-in fonts don't render the ₹ glyph reliably, so PDFs use "Rs.".
const rs = (n: number) =>
  "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function InvoiceGenerator() {
  const [from, setFrom] = useState({
    name: "Rao Design Studio",
    gstin: "29ABCDE1234F1Z5",
    state: "Karnataka",
    upi: "raodesign@okaxis",
  });
  const [to, setTo] = useState({ name: "Nimbus Tech Pvt Ltd", state: "Maharashtra" });
  const [meta, setMeta] = useState({ number: "INV-2026-014", date: "" });
  const [items, setItems] = useState<Item[]>([
    { id: 1, desc: "Logo & brand identity design", hsn: "9983", qty: 1, rate: 25000, gst: 18 },
    { id: 2, desc: "Website UI design (5 pages)", hsn: "9983", qty: 1, rate: 40000, gst: 18 },
  ]);
  const [qr, setQr] = useState("");
  const [downloading, setDownloading] = useState(false);
  const idRef = useRef(3);

  // Set today's date on the client to avoid SSR hydration mismatch.
  useEffect(() => {
    if (!meta.date) {
      setMeta((m) => ({ ...m, date: new Date().toISOString().slice(0, 10) }));
    }
  }, [meta.date]);

  const intra = from.state === to.state;
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

  // Generate the UPI QR whenever the payee or amount changes.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!from.upi) {
        setQr("");
        return;
      }
      const QRCode = (await import("qrcode")).default;
      const upiUrl =
        `upi://pay?pa=${encodeURIComponent(from.upi)}` +
        `&pn=${encodeURIComponent(from.name)}` +
        `&am=${total.toFixed(2)}&cu=INR`;
      try {
        const url = await QRCode.toDataURL(upiUrl, { margin: 1, width: 220 });
        if (active) setQr(url);
      } catch {
        if (active) setQr("");
      }
    })();
    return () => {
      active = false;
    };
  }, [from.upi, from.name, total]);

  const updateItem = (id: number, key: keyof Item, value: string) =>
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, [key]: key === "desc" || key === "hsn" ? value : Number(value) || 0 }
          : it
      )
    );
  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: idRef.current++, desc: "New item", hsn: "", qty: 1, rate: 0, gst: 18 },
    ]);
  const removeItem = (id: number) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  async function downloadPdf() {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const W = 595;
      const M = 42;
      const navy: [number, number, number] = [15, 31, 92];
      const blue: [number, number, number] = [37, 99, 235];

      // Header band
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
      doc.text("TAX INVOICE", W - M, 34, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`#${meta.number}`, W - M, 52, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(meta.date, W - M, 68, { align: "right" });

      // Parties
      doc.setTextColor(...navy);
      let y = 130;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 130);
      doc.text("BILLED TO", M, y);
      doc.text("PLACE OF SUPPLY", W - M, y, { align: "right" });
      doc.setTextColor(...navy);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(to.name || "Client", M, y + 16);
      doc.text(to.state, M, y + 31);
      doc.text(to.state, W - M, y + 16, { align: "right" });
      doc.text(intra ? "Intra-state" : "Inter-state", W - M, y + 31, { align: "right" });

      // Table header
      y += 62;
      doc.setFillColor(248, 250, 252);
      doc.rect(M, y, W - 2 * M, 24, "F");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 130);
      doc.text("ITEM", M + 8, y + 16);
      doc.text("HSN", 300, y + 16, { align: "right" });
      doc.text("QTY", 350, y + 16, { align: "right" });
      doc.text("RATE", 428, y + 16, { align: "right" });
      doc.text("GST", 472, y + 16, { align: "right" });
      doc.text("AMOUNT", W - M - 8, y + 16, { align: "right" });
      y += 24;

      // Rows
      doc.setTextColor(...navy);
      doc.setFontSize(10);
      for (const it of items) {
        const amt = (it.qty || 0) * (it.rate || 0);
        y += 22;
        doc.text(String(it.desc).slice(0, 34), M + 8, y);
        doc.text(it.hsn || "-", 300, y, { align: "right" });
        doc.text(String(it.qty), 350, y, { align: "right" });
        doc.text(rs(it.rate), 428, y, { align: "right" });
        doc.text(`${it.gst}%`, 472, y, { align: "right" });
        doc.text(rs(amt), W - M - 8, y, { align: "right" });
        doc.setDrawColor(240, 242, 246);
        doc.line(M, y + 8, W - M, y + 8);
      }

      // Totals
      y += 34;
      const lx = 360;
      const rx = W - M - 8;
      doc.setFontSize(10);
      const totLine = (label: string, val: string, bold = false) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.text(label, lx, y);
        doc.text(val, rx, y, { align: "right" });
        y += 18;
      };
      totLine("Subtotal", rs(subtotal));
      if (intra) {
        totLine("CGST", rs(tax / 2));
        totLine("SGST", rs(tax / 2));
      } else {
        totLine("IGST", rs(tax));
      }
      doc.setDrawColor(...navy);
      doc.line(lx, y - 6, rx, y - 6);
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...blue);
      doc.text("Total", lx, y);
      doc.text(rs(total), rx, y, { align: "right" });

      // UPI QR
      if (qr) {
        doc.addImage(qr, "PNG", M, y - 30, 70, 70);
        doc.setTextColor(...navy);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Scan to pay via UPI", M + 82, y - 6);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 120, 130);
        doc.setFontSize(9);
        doc.text(`${rs(total)} to ${from.name}`, M + 82, y + 8);
      }

      // Footer
      doc.setTextColor(170, 174, 185);
      doc.setFontSize(8);
      doc.text("Generated with Paavti - paavti.com", W / 2, 812, { align: "center" });

      doc.save(`${meta.number || "invoice"}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  const field =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none";
  const label = "mb-1 mt-2.5 block text-[13px] font-semibold text-slate-600";

  return (
    <div className="my-8 grid gap-6 lg:grid-cols-2">
      {/* ---------- FORM ---------- */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          1. Your details
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className={label}>Your business name</label>
            <input className={field} value={from.name}
              onChange={(e) => setFrom({ ...from, name: e.target.value })} />
          </div>
          <div>
            <label className={label}>Your GSTIN</label>
            <input className={field} value={from.gstin}
              onChange={(e) => setFrom({ ...from, gstin: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className={label}>Your state</label>
            <select className={field} value={from.state}
              onChange={(e) => setFrom({ ...from, state: e.target.value })}>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Your UPI ID</label>
            <input className={field} value={from.upi} placeholder="name@bank"
              onChange={(e) => setFrom({ ...from, upi: e.target.value })} />
          </div>
        </div>

        <h3 className="mb-3 mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">
          2. Client details
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className={label}>Client name</label>
            <input className={field} value={to.name}
              onChange={(e) => setTo({ ...to, name: e.target.value })} />
          </div>
          <div>
            <label className={label}>Client state</label>
            <select className={field} value={to.state}
              onChange={(e) => setTo({ ...to, state: e.target.value })}>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <h3 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">
          3. Items
        </h3>
        <div className="mb-1 grid grid-cols-[2fr_1fr_0.7fr_1fr_1fr_auto] gap-2 px-1 text-[11px] font-semibold uppercase text-slate-400">
          <span>Description</span><span>HSN/SAC</span><span>Qty</span><span>Rate ₹</span><span>GST</span><span></span>
        </div>
        <div className="space-y-1.5">
          {items.map((it) => (
            <div key={it.id} className="grid grid-cols-[2fr_1fr_0.7fr_1fr_1fr_auto] items-center gap-2">
              <input className={field} value={it.desc}
                onChange={(e) => updateItem(it.id, "desc", e.target.value)} />
              <input className={field} value={it.hsn} placeholder="9983"
                onChange={(e) => updateItem(it.id, "hsn", e.target.value)} />
              <input className={field} type="number" value={it.qty}
                onChange={(e) => updateItem(it.id, "qty", e.target.value)} />
              <input className={field} type="number" value={it.rate}
                onChange={(e) => updateItem(it.id, "rate", e.target.value)} />
              <select className={field} value={it.gst}
                onChange={(e) => updateItem(it.id, "gst", e.target.value)}>
                {GST_SLABS.map((g) => <option key={g} value={g}>{g}%</option>)}
              </select>
              <button aria-label="Remove item" onClick={() => removeItem(it.id)}
                className="h-9 w-9 rounded-md bg-red-100 text-red-700 hover:bg-red-200">
                ×
              </button>
            </div>
          ))}
        </div>
        <button onClick={addItem}
          className="mt-2.5 w-full rounded-lg border border-dashed border-[#2563eb] bg-[#eff4ff] py-2 text-sm font-semibold text-[#1d4ed8] hover:bg-[#dbe6ff]">
          + Add line item
        </button>
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800">
          Intra-state (same state) auto-splits into CGST + SGST. Inter-state
          applies IGST. Change the client state to see it switch.
        </p>
      </div>

      {/* ---------- LIVE PREVIEW ---------- */}
      <div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 text-[13px]">
          <div className="flex items-start justify-between bg-[#0f1f5c] px-5 py-4 text-white">
            <div>
              <h4 className="text-xl font-bold">{from.name || "Your Business"}</h4>
              <div className="text-xs opacity-80">GSTIN: {from.gstin || "-"}</div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-80">TAX INVOICE</div>
              <div className="font-bold">#{meta.number}</div>
              <div className="text-xs opacity-80">{meta.date}</div>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="mb-3 flex justify-between gap-4">
              <div className="text-[12.5px] text-slate-700">
                <div className="text-[11px] uppercase text-slate-400">Billed to</div>
                {to.name || "Client"}<br />{to.state}
              </div>
              <div className="text-right text-[12.5px] text-slate-700">
                <div className="text-[11px] uppercase text-slate-400">Place of supply</div>
                {to.state}<br />{intra ? "Intra-state" : "Inter-state"}
              </div>
            </div>
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase text-slate-400">
                  <th className="border-b border-slate-200 px-2 py-1.5 text-left">Item</th>
                  <th className="border-b border-slate-200 px-2 py-1.5 text-right">HSN</th>
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
                    <td className="border-b border-slate-100 px-2 py-1.5 text-right">{it.hsn || "-"}</td>
                    <td className="border-b border-slate-100 px-2 py-1.5 text-right">{it.qty}</td>
                    <td className="border-b border-slate-100 px-2 py-1.5 text-right">{inr(it.rate)}</td>
                    <td className="border-b border-slate-100 px-2 py-1.5 text-right">{it.gst}%</td>
                    <td className="border-b border-slate-100 px-2 py-1.5 text-right">
                      {inr((it.qty || 0) * (it.rate || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ml-auto mt-3 w-64 text-[13px]">
              <div className="flex justify-between py-1"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
              {intra ? (
                <>
                  <div className="flex justify-between py-1"><span>CGST</span><span>{inr(tax / 2)}</span></div>
                  <div className="flex justify-between py-1"><span>SGST</span><span>{inr(tax / 2)}</span></div>
                </>
              ) : (
                <div className="flex justify-between py-1"><span>IGST</span><span>{inr(tax)}</span></div>
              )}
              <div className="mt-1.5 flex justify-between border-t-2 border-[#0f1f5c] pt-2 text-base font-extrabold text-[#2563eb]">
                <span>Total</span><span>{inr(total)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#eff4ff] p-3">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="UPI QR code" className="h-16 w-16 rounded" />
              ) : (
                <div className="h-16 w-16 rounded bg-slate-200" />
              )}
              <div>
                <b className="text-[#1d4ed8]">Scan to pay via UPI</b>
                <div className="text-xs text-slate-500">{inr(total)} to {from.name}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <button onClick={downloadPdf} disabled={downloading}
            className="rounded-lg bg-[#2563eb] px-5 py-2.5 font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60">
            {downloading ? "Preparing…" : "⬇ Download PDF (free)"}
          </button>
          <a href="/signup"
            className="rounded-lg border-[1.5px] border-[#2563eb] bg-white px-5 py-2.5 font-semibold text-[#2563eb] hover:bg-[#eff4ff]">
            🔒 Save &amp; send to client →
          </a>
        </div>
        <p className="mt-2 text-[12.5px] text-slate-500">
          Downloading is free &amp; unlimited. <b>Saving, tracking &amp; sending</b>{" "}
          needs a free account — <b>5 invoices/month</b> included.
        </p>
      </div>
    </div>
  );
}
