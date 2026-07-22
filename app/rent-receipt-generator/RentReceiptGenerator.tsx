"use client";

import { useMemo, useState } from "react";
import posthog from "posthog-js";

/**
 * Free Rent Receipt Generator — client-side only, no DB.
 * Generates one rent receipt per month across a chosen period (for HRA claims),
 * with amount in words and a multi-page PDF download.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const rs = (n: number) =>
  "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Amount in words, Indian system (handles up to ~99 crore — fine for rent).
function rupeesInWords(num: number): string {
  num = Math.round(num);
  if (num === 0) return "Zero";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
    "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number): string => (n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : ""));
  const three = (n: number): string => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return (h ? a[h] + " Hundred" + (r ? " " : "") : "") + (r ? two(r) : "");
  };
  let res = "";
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  if (crore) res += two(crore) + " Crore ";
  if (lakh) res += two(lakh) + " Lakh ";
  if (thousand) res += two(thousand) + " Thousand ";
  if (num) res += three(num);
  return res.trim();
}

// list of {label, month, year} between two "YYYY-MM" strings (inclusive)
function monthRange(from: string, to: string) {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  const out: { label: string; monthName: string; year: number }[] = [];
  let y = fy, m = fm;
  let guard = 0;
  while ((y < ty || (y === ty && m <= tm)) && guard < 120) {
    out.push({ label: `${MONTHS[m - 1]} ${y}`, monthName: MONTHS[m - 1], year: y });
    m++;
    if (m > 12) { m = 1; y++; }
    guard++;
  }
  return out;
}

export default function RentReceiptGenerator() {
  const [tenant, setTenant] = useState("Ankit Sharma");
  const [landlord, setLandlord] = useState("Mrs. Priya Verma");
  const [pan, setPan] = useState("");
  const [rent, setRent] = useState(25000);
  const [address, setAddress] = useState("Flat 402, Green Meadows, Koramangala, Bengaluru 560034");
  const [mode, setMode] = useState("UPI");
  const [from, setFrom] = useState("2025-04");
  const [to, setTo] = useState("2026-03");
  const [downloading, setDownloading] = useState(false);

  const months = useMemo(() => monthRange(from, to), [from, to]);
  const first = months[0];
  const words = rupeesInWords(rent);

  async function downloadPdf() {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const W = 595;
      const M = 48;
      const navy: [number, number, number] = [15, 31, 92];

      months.forEach((mo, i) => {
        if (i > 0) doc.addPage();

        // Border
        doc.setDrawColor(...navy);
        doc.setLineWidth(1);
        doc.rect(M, 60, W - 2 * M, 300);

        // Title bar
        doc.setFillColor(...navy);
        doc.rect(M, 60, W - 2 * M, 40, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("RENT RECEIPT", W / 2, 86, { align: "center" });

        let y = 130;
        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(`Receipt for: ${mo.label}`, M + 20, y);
        doc.text(`Date: ${mo.monthName.slice(0, 3)} ${mo.year}`, W - M - 20, y, { align: "right" });

        y += 34;
        doc.setFontSize(12);
        const line = (label: string, value: string) => {
          doc.setFont("helvetica", "bold");
          doc.text(label, M + 20, y);
          doc.setFont("helvetica", "normal");
          doc.text(value, M + 150, y, { maxWidth: W - 2 * M - 150 });
          y += 26;
        };
        line("Received from:", tenant || "-");
        line("Amount:", `${rs(rent)}  (Rupees ${words} only)`);
        line("Towards:", `Rent for ${mo.label}`);
        line("Property:", address || "-");
        line("Paid by:", mode);

        // Landlord + signature
        y += 24;
        doc.setDrawColor(180, 180, 180);
        doc.line(W - M - 180, y, W - M - 20, y);
        doc.setFontSize(10);
        doc.setTextColor(90, 90, 90);
        doc.text("Landlord signature", W - M - 100, y + 14, { align: "center" });
        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(landlord || "-", M + 20, y + 4);
        if (pan) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text(`Landlord PAN: ${pan}`, M + 20, y + 20);
        }

        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text("Generated with Paavti - paavti.com", W / 2, 388, { align: "center" });
      });

      doc.save(`rent-receipts-${from}-to-${to}.pdf`);
      posthog.capture("rent_receipt_downloaded", {
        source: "rent_receipt_generator",
        months: months.length,
        monthly_rent: rent,
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
            <label className={label}>Tenant name (paid by)</label>
            <input className={field} value={tenant} onChange={(e) => setTenant(e.target.value)} />
          </div>
          <div>
            <label className={label}>Landlord name</label>
            <input className={field} value={landlord} onChange={(e) => setLandlord(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className={label}>Monthly rent (₹)</label>
            <input type="number" className={field} value={rent}
              onChange={(e) => setRent(Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className={label}>Landlord PAN (optional)</label>
            <input className={field} value={pan} placeholder="required if rent &gt; ₹1L/yr"
              onChange={(e) => setPan(e.target.value.toUpperCase())} />
          </div>
        </div>
        <label className={label}>Rented property address</label>
        <input className={field} value={address} onChange={(e) => setAddress(e.target.value)} />
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className={label}>From</label>
            <input type="month" className={field} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className={label}>To</label>
            <input type="month" className={field} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className={label}>Paid by</label>
            <select className={field} value={mode} onChange={(e) => setMode(e.target.value)}>
              <option>UPI</option><option>Bank transfer</option><option>Cash</option><option>Cheque</option>
            </select>
          </div>
        </div>
        <p className="mt-3 rounded-lg border border-[#e0eaff] bg-[#eff4ff] px-3 py-2 text-[12.5px] text-[#1d4ed8]">
          Generates <b>{months.length} receipt{months.length === 1 ? "" : "s"}</b>
          {first ? ` (${first.label} – ${months[months.length - 1].label})` : ""}, one per month —
          exactly what you need for an HRA claim.
        </p>
      </div>

      {/* PREVIEW */}
      <div>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="bg-[#0f1f5c] px-5 py-3 text-center text-white">
            <div className="text-lg font-bold tracking-wide">RENT RECEIPT</div>
          </div>
          <div className="px-6 py-5 text-[13.5px] text-slate-700">
            <div className="mb-3 flex justify-between text-slate-500">
              <span>Receipt for: <b className="text-slate-800">{first ? first.label : "—"}</b></span>
              <span>{first ? `${first.monthName.slice(0, 3)} ${first.year}` : ""}</span>
            </div>
            <Line k="Received from" v={tenant || "—"} />
            <Line k="Amount" v={`${inr(rent)}`} />
            <div className="mb-2 text-[12.5px] italic text-slate-500">Rupees {words} only</div>
            <Line k="Towards" v={`Rent for ${first ? first.label : "—"}`} />
            <Line k="Property" v={address || "—"} />
            <Line k="Paid by" v={mode} />
            <div className="mt-6 flex items-end justify-between">
              <div>
                <div className="font-bold text-slate-800">{landlord || "—"}</div>
                {pan ? <div className="text-[12px] text-slate-500">PAN: {pan}</div> : null}
              </div>
              <div className="text-center">
                <div className="mb-1 h-8 w-32 border-b border-slate-300"></div>
                <div className="text-[11px] text-slate-400">Landlord signature</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <button onClick={downloadPdf} disabled={downloading || months.length === 0}
            className="rounded-lg bg-[#2563eb] px-5 py-2.5 font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60">
            {downloading ? "Preparing…" : `⬇ Download ${months.length} receipt${months.length === 1 ? "" : "s"} (PDF)`}
          </button>
          <a href="/gst-invoice-generator"
            onClick={() => posthog.capture("signup_cta_clicked", { source: "rent_receipt_generator", cta: "make_invoice" })}
            className="rounded-lg border-[1.5px] border-[#2563eb] bg-white px-5 py-2.5 font-semibold text-[#2563eb] hover:bg-[#eff4ff]">
            Need a GST invoice too? →
          </a>
        </div>
        <p className="mt-2 text-[12.5px] text-slate-500">
          Free &amp; unlimited. Tip: a landlord&apos;s PAN is required for HRA claims when annual rent exceeds ₹1,00,000.
        </p>
      </div>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="mb-2 flex gap-3">
      <span className="w-28 shrink-0 font-semibold text-slate-500">{k}</span>
      <span className="text-slate-800">{v}</span>
    </div>
  );
}
