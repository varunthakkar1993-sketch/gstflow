"use client";

import { useMemo, useState } from "react";
import posthog from "posthog-js";

/**
 * GST Rate / HSN Lookup (client-side only, no DB).
 * Searchable table of common goods & services with their current GST rate
 * (GST 2.0 structure effective 22 Sep 2025: 0 / 5 / 18 / 40, plus 3% for bullion).
 * Rates are indicative; the CTA points users to the free invoice generator.
 */

type Row = { name: string; code: string; kind: "HSN" | "SAC"; rate: number; group: string; note?: string };

const DATA: Row[] = [
  // Food & grocery
  { name: "Fresh milk", code: "0401", kind: "HSN", rate: 0, group: "Food & grocery" },
  { name: "Fresh fruits & vegetables", code: "0700", kind: "HSN", rate: 0, group: "Food & grocery" },
  { name: "Unbranded rice, wheat & flour", code: "1006", kind: "HSN", rate: 0, group: "Food & grocery" },
  { name: "Pre-packaged paneer", code: "0406", kind: "HSN", rate: 5, group: "Food & grocery" },
  { name: "Butter & ghee", code: "0405", kind: "HSN", rate: 5, group: "Food & grocery" },
  { name: "Packaged namkeen & snacks", code: "2106", kind: "HSN", rate: 5, group: "Food & grocery" },
  { name: "Chocolate & cocoa products", code: "1806", kind: "HSN", rate: 18, group: "Food & grocery" },
  { name: "Packaged drinking water", code: "2201", kind: "HSN", rate: 18, group: "Food & grocery" },
  { name: "Aerated & carbonated drinks", code: "2202", kind: "HSN", rate: 40, group: "Food & grocery", note: "Sin / luxury slab" },

  // Personal care
  { name: "Soap bar", code: "3401", kind: "HSN", rate: 5, group: "Personal care" },
  { name: "Shampoo & hair oil", code: "3305", kind: "HSN", rate: 5, group: "Personal care" },
  { name: "Toothpaste & toothbrush", code: "3306", kind: "HSN", rate: 5, group: "Personal care" },
  { name: "Cosmetics & makeup", code: "3304", kind: "HSN", rate: 18, group: "Personal care" },
  { name: "Perfume & deodorant", code: "3307", kind: "HSN", rate: 18, group: "Personal care" },

  // Apparel & footwear
  { name: "Apparel up to ₹2,500 / piece", code: "6101-6217", kind: "HSN", rate: 5, group: "Apparel & footwear" },
  { name: "Apparel above ₹2,500 / piece", code: "6101-6217", kind: "HSN", rate: 18, group: "Apparel & footwear" },
  { name: "Footwear up to ₹2,500 / pair", code: "6401-6405", kind: "HSN", rate: 5, group: "Apparel & footwear" },
  { name: "Footwear above ₹2,500 / pair", code: "6401-6405", kind: "HSN", rate: 18, group: "Apparel & footwear" },

  // Electronics
  { name: "Mobile phone", code: "8517", kind: "HSN", rate: 18, group: "Electronics" },
  { name: "Laptop & computer", code: "8471", kind: "HSN", rate: 18, group: "Electronics" },
  { name: "Television", code: "8528", kind: "HSN", rate: 18, group: "Electronics" },
  { name: "Air conditioner", code: "8415", kind: "HSN", rate: 18, group: "Electronics" },
  { name: "Refrigerator", code: "8418", kind: "HSN", rate: 18, group: "Electronics" },

  // Home & building
  { name: "Wooden furniture", code: "9403", kind: "HSN", rate: 18, group: "Home & building" },
  { name: "Mattress", code: "9404", kind: "HSN", rate: 18, group: "Home & building" },
  { name: "Cement", code: "2523", kind: "HSN", rate: 18, group: "Home & building" },
  { name: "LED lights & fixtures", code: "9405", kind: "HSN", rate: 18, group: "Home & building" },

  // Health & education
  { name: "Specified life-saving medicines", code: "3004", kind: "HSN", rate: 0, group: "Health & education", note: "Notified drugs only" },
  { name: "Medicines (general)", code: "3004", kind: "HSN", rate: 5, group: "Health & education" },
  { name: "Vitamins & health supplements", code: "2106", kind: "HSN", rate: 18, group: "Health & education" },
  { name: "Printed books", code: "4901", kind: "HSN", rate: 0, group: "Health & education" },
  { name: "Exercise books & pencils", code: "4820", kind: "HSN", rate: 0, group: "Health & education" },
  { name: "Stationery (pens, files)", code: "9608", kind: "HSN", rate: 18, group: "Health & education" },

  // Jewellery & metals
  { name: "Gold & silver jewellery", code: "7113", kind: "HSN", rate: 3, group: "Jewellery & metals", note: "Special bullion rate" },
  { name: "Cut & polished diamonds", code: "7102", kind: "HSN", rate: 1.5, group: "Jewellery & metals", note: "Special rate" },

  // Vehicles
  { name: "Small car (petrol ≤1200cc / diesel ≤1500cc)", code: "8703", kind: "HSN", rate: 18, group: "Vehicles" },
  { name: "Motorcycle up to 350cc", code: "8711", kind: "HSN", rate: 18, group: "Vehicles" },
  { name: "Luxury car / large SUV", code: "8703", kind: "HSN", rate: 40, group: "Vehicles", note: "Sin / luxury slab" },
  { name: "Motorcycle above 350cc", code: "8711", kind: "HSN", rate: 40, group: "Vehicles", note: "Sin / luxury slab" },

  // Services (SAC)
  { name: "Standalone restaurant (without ITC)", code: "9963", kind: "SAC", rate: 5, group: "Services" },
  { name: "Professional & consulting services", code: "9983", kind: "SAC", rate: 18, group: "Services" },
  { name: "IT & software services", code: "9983", kind: "SAC", rate: 18, group: "Services" },
  { name: "Works contract / construction", code: "9954", kind: "SAC", rate: 18, group: "Services" },
  { name: "Individual health & life insurance", code: "9971", kind: "SAC", rate: 0, group: "Services" },
  { name: "Betting, casino & lottery", code: "9996", kind: "SAC", rate: 40, group: "Services", note: "Sin / luxury slab" },
];

const rateStyles: Record<string, string> = {
  "0": "bg-emerald-100 text-emerald-700",
  "1.5": "bg-amber-100 text-amber-700",
  "3": "bg-amber-100 text-amber-700",
  "5": "bg-sky-100 text-sky-700",
  "18": "bg-indigo-100 text-indigo-700",
  "40": "bg-rose-100 text-rose-700",
};

const FILTERS = ["All", "0%", "5%", "18%", "40%"];

export default function GstRateFinder() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return DATA.filter((r) => {
      const matchQ =
        !term ||
        r.name.toLowerCase().includes(term) ||
        r.code.toLowerCase().includes(term) ||
        r.group.toLowerCase().includes(term);
      const matchF = filter === "All" || `${r.rate}%` === filter;
      return matchQ && matchF;
    });
  }, [q, filter]);

  return (
    <div className="my-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            if (e.target.value.length === 3) posthog.capture("gst_rate_searched", { source: "gst_rate_finder" });
          }}
          placeholder="Search a product, service or HSN code…"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#2563eb] focus:outline-none"
        />
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "rounded-lg px-3 py-2 text-sm font-semibold " +
                (filter === f ? "bg-[#2563eb] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="bg-[#f8faff] text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">HSN / SAC</th>
                <th className="px-4 py-3 text-right font-semibold">GST rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-[#0f1f5c]">
                    {r.name}
                    {r.note ? <span className="ml-2 text-[11px] font-normal text-slate-400">{r.note}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{r.group}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] text-slate-600">{r.code}</span>
                    <span className="ml-1 text-[10px] uppercase text-slate-400">{r.kind}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={"inline-block rounded-full px-2.5 py-1 text-[13px] font-bold " + (rateStyles[String(r.rate)] || "bg-slate-100 text-slate-700")}>
                      {r.rate}%
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No match. Try a different product name or HSN code.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-[12.5px] text-slate-500">
        Rates reflect the GST 2.0 structure effective 22 September 2025 and are indicative. Rates can vary
        by exact product, brand and price, so confirm the notified rate on the official
        {" "}
        <a href="https://cbic-gst.gov.in/gst-goods-services-rates.html" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#2563eb] hover:underline">
          CBIC GST rate finder
        </a>
        {" "}
        before filing.
      </p>
    </div>
  );
}
