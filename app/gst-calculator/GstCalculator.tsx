"use client";

import { useMemo, useState } from "react";
import posthog from "posthog-js";

/**
 * Free GST Calculator — client-side only, no DB.
 * Add GST (exclusive) or Remove GST (extract from an inclusive amount),
 * with CGST/SGST or IGST split.
 */

const GST_SLABS = [3, 5, 12, 18, 28];

const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function GstCalculator() {
  const [amount, setAmount] = useState(10000);
  const [rate, setRate] = useState(18);
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [intra, setIntra] = useState(true);

  const { base, gst, total } = useMemo(() => {
    const a = amount || 0;
    const r = rate || 0;
    if (mode === "add") {
      const g = (a * r) / 100;
      return { base: a, gst: g, total: a + g };
    }
    const b = a / (1 + r / 100);
    return { base: b, gst: a - b, total: a };
  }, [amount, rate, mode]);

  const field =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#2563eb] focus:outline-none";
  const label = "mb-1.5 block text-[13px] font-semibold text-slate-600";

  return (
    <div className="my-8 grid gap-6 lg:grid-cols-2">
      {/* INPUTS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className={label}>Amount (₹)</label>
        <input
          type="number"
          className={field + " text-lg font-semibold"}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
        />

        <div className="mt-4">
          <label className={label}>GST rate</label>
          <div className="flex flex-wrap gap-2">
            {GST_SLABS.map((g) => (
              <button
                key={g}
                onClick={() => setRate(g)}
                className={
                  "rounded-lg border px-4 py-2 text-sm font-semibold transition " +
                  (rate === g
                    ? "border-[#2563eb] bg-[#2563eb] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#2563eb]")
                }
              >
                {g}%
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className={label}>Calculation</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("add")}
              className={
                "rounded-lg border px-3 py-2.5 text-sm font-semibold transition " +
                (mode === "add"
                  ? "border-[#2563eb] bg-[#eff4ff] text-[#1d4ed8]"
                  : "border-slate-200 text-slate-600 hover:border-[#2563eb]")
              }
            >
              Add GST
              <span className="block text-[11px] font-normal text-slate-400">amount is before tax</span>
            </button>
            <button
              onClick={() => setMode("remove")}
              className={
                "rounded-lg border px-3 py-2.5 text-sm font-semibold transition " +
                (mode === "remove"
                  ? "border-[#2563eb] bg-[#eff4ff] text-[#1d4ed8]"
                  : "border-slate-200 text-slate-600 hover:border-[#2563eb]")
              }
            >
              Remove GST
              <span className="block text-[11px] font-normal text-slate-400">amount includes tax</span>
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className={label}>Transaction type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIntra(true)}
              className={
                "rounded-lg border px-3 py-2 text-sm font-semibold transition " +
                (intra
                  ? "border-[#2563eb] bg-[#eff4ff] text-[#1d4ed8]"
                  : "border-slate-200 text-slate-600 hover:border-[#2563eb]")
              }
            >
              Same state
              <span className="block text-[11px] font-normal text-slate-400">CGST + SGST</span>
            </button>
            <button
              onClick={() => setIntra(false)}
              className={
                "rounded-lg border px-3 py-2 text-sm font-semibold transition " +
                (!intra
                  ? "border-[#2563eb] bg-[#eff4ff] text-[#1d4ed8]"
                  : "border-slate-200 text-slate-600 hover:border-[#2563eb]")
              }
            >
              Other state
              <span className="block text-[11px] font-normal text-slate-400">IGST</span>
            </button>
          </div>
        </div>
      </div>

      {/* RESULT */}
      <div className="flex flex-col justify-between rounded-2xl bg-[#0f1f5c] p-6 text-white">
        <div>
          <div className="text-sm uppercase tracking-wide text-white/60">
            {mode === "add" ? "Base amount" : "Amount before GST"}
          </div>
          <div className="mt-1 text-2xl font-bold">{inr(base)}</div>

          <div className="mt-5 space-y-2 border-t border-white/15 pt-4 text-[15px]">
            {intra ? (
              <>
                <Row label={`CGST @ ${rate / 2}%`} value={inr(gst / 2)} />
                <Row label={`SGST @ ${rate / 2}%`} value={inr(gst / 2)} />
              </>
            ) : (
              <Row label={`IGST @ ${rate}%`} value={inr(gst)} />
            )}
            <Row label="Total GST" value={inr(gst)} strong />
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white/10 p-4">
          <div className="text-sm uppercase tracking-wide text-white/60">
            {mode === "add" ? "Total payable (incl. GST)" : "Total amount (incl. GST)"}
          </div>
          <div className="mt-1 text-3xl font-extrabold">{inr(total)}</div>
        </div>

        <a
          href="/gst-invoice-generator"
          onClick={() =>
            posthog.capture("signup_cta_clicked", {
              source: "gst_calculator",
              cta: "make_invoice",
            })
          }
          className="mt-4 block rounded-lg bg-white px-5 py-2.5 text-center font-semibold text-[#2563eb] hover:bg-slate-100"
        >
          Turn this into a GST invoice →
        </a>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={"flex justify-between " + (strong ? "font-bold" : "text-white/90")}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
