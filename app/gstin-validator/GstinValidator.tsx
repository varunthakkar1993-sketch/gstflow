"use client";

import { useMemo, useState } from "react";
import posthog from "posthog-js";

/**
 * GSTIN Validator (client-side only, no DB).
 * Validates a GST number's format, state code and checksum, and decodes
 * each part. Format + check-digit only, NOT live status against the GST portal.
 * Two modes: single GSTIN, and bulk paste for CAs checking a supplier list.
 */

const CP = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MOD = 36;

// Official GSTN check-digit algorithm over the first 14 characters.
function checkDigit(first14: string): string {
  let factor = 2;
  let sum = 0;
  for (let i = first14.length - 1; i >= 0; i--) {
    const cp = CP.indexOf(first14[i]);
    let d = factor * cp;
    factor = factor === 2 ? 1 : 2;
    d = Math.floor(d / MOD) + (d % MOD);
    sum += d;
  }
  return CP[(MOD - (sum % MOD)) % MOD];
}

const STATES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
  "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
  "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
  "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
  "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "25": "Daman & Diu (former)", "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra",
  "28": "Andhra Pradesh (former)", "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala",
  "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar Islands", "36": "Telangana",
  "37": "Andhra Pradesh", "38": "Ladakh", "97": "Other Territory", "99": "Centre Jurisdiction",
};

const HOLDER: Record<string, string> = {
  P: "Individual / Proprietor", C: "Company", H: "Hindu Undivided Family (HUF)",
  F: "Firm / LLP", A: "Association of Persons (AOP)", T: "Trust",
  B: "Body of Individuals (BOI)", L: "Local Authority", J: "Artificial Juridical Person",
  G: "Government",
};

type Result =
  | { ok: true; state: string; stateCode: string; pan: string; holder: string; entity: string; check: string }
  | { ok: false; reason: string };

function validate(raw: string): Result | null {
  const g = raw.replace(/\s+/g, "").toUpperCase();
  if (!g) return null;
  if (g.length !== 15) return { ok: false, reason: `A GSTIN has 15 characters. This one has ${g.length}.` };
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g))
    return { ok: false, reason: "The pattern does not match a GSTIN (2 digits, 10-char PAN, entity code, Z, then a check digit)." };
  const stateCode = g.slice(0, 2);
  if (!STATES[stateCode]) return { ok: false, reason: `${stateCode} is not a valid GST state code.` };
  const expected = checkDigit(g.slice(0, 14));
  if (expected !== g[14])
    return { ok: false, reason: `The check digit is wrong. Expected "${expected}" but found "${g[14]}". This is not a genuine GSTIN.` };
  const pan = g.slice(2, 12);
  const holderChar = g[5];
  return {
    ok: true,
    state: STATES[stateCode],
    stateCode,
    pan,
    holder: HOLDER[holderChar] || "Unknown type",
    entity: g[12],
    check: g[14],
  };
}

const PORTAL_NOTE = (
  <p className="mt-3 text-[12.5px] text-slate-500">
    This checks the GSTIN format, state code and check digit, so it catches typos and fake numbers. It
    does not confirm live registration status. For that, verify on the official
    {" "}
    <a href="https://services.gst.gov.in/services/searchtp" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#2563eb] hover:underline">
      GST portal
    </a>.
  </p>
);

function csvCell(v: string) {
  return `"${String(v).replace(/"/g, '""')}"`;
}

export default function GstinValidator() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [value, setValue] = useState("27AAPFU0939F1ZV");
  const [bulkText, setBulkText] = useState("");

  const result = useMemo(() => validate(value), [value]);

  const bulkRows = useMemo(() => {
    const tokens = bulkText.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean);
    return tokens.slice(0, 500).map((t) => ({ input: t.toUpperCase(), res: validate(t) }));
  }, [bulkText]);

  const validCount = bulkRows.filter((r) => r.res && r.res.ok).length;
  const invalidCount = bulkRows.length - validCount;

  function downloadCsv() {
    const header = ["GSTIN", "Status", "State", "State code", "PAN", "Holder type", "Notes"];
    const lines = [header.map(csvCell).join(",")];
    for (const { input, res } of bulkRows) {
      if (res && res.ok) {
        lines.push([input, "Valid", res.state, res.stateCode, res.pan, res.holder, ""].map(csvCell).join(","));
      } else {
        lines.push([input, "Invalid", "", "", "", "", res ? res.reason : ""].map(csvCell).join(","));
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gstin-validation.csv";
    a.click();
    URL.revokeObjectURL(url);
    posthog.capture("gstin_bulk_downloaded", { count: bulkRows.length, valid: validCount });
  }

  return (
    <div className="my-8">
      <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${mode === "single" ? "bg-white text-[#0f1f5c] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Single GSTIN
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("bulk");
            posthog.capture("gstin_bulk_opened");
          }}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${mode === "bulk" ? "bg-white text-[#0f1f5c] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Bulk check
        </button>
      </div>

      {mode === "single" ? (
        <>
          <label className="mb-1 block text-[13px] font-semibold text-slate-600">Enter a GST number (GSTIN)</label>
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (e.target.value.replace(/\s+/g, "").length === 15) posthog.capture("gstin_validated", { source: "gstin_validator" });
            }}
            placeholder="e.g. 27AAPFU0939F1ZV"
            maxLength={20}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-lg tracking-wide focus:border-[#2563eb] focus:outline-none"
          />

          {result ? (
            result.ok ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-2 bg-emerald-50 px-5 py-3 text-emerald-700">
                  <span className="text-lg">✅</span>
                  <span className="font-semibold">Valid format &amp; checksum</span>
                </div>
                <table className="w-full text-left text-sm">
                  <tbody className="text-slate-600">
                    <tr className="border-t border-slate-100"><td className="px-5 py-3 font-medium text-slate-400">State</td><td className="px-5 py-3 text-[#0f1f5c]">{result.state} <span className="text-slate-400">({result.stateCode})</span></td></tr>
                    <tr className="border-t border-slate-100"><td className="px-5 py-3 font-medium text-slate-400">PAN of holder</td><td className="px-5 py-3 font-mono text-[#0f1f5c]">{result.pan}</td></tr>
                    <tr className="border-t border-slate-100"><td className="px-5 py-3 font-medium text-slate-400">Holder type</td><td className="px-5 py-3 text-[#0f1f5c]">{result.holder}</td></tr>
                    <tr className="border-t border-slate-100"><td className="px-5 py-3 font-medium text-slate-400">Registration in state</td><td className="px-5 py-3 text-[#0f1f5c]">Entity no. {result.entity}</td></tr>
                    <tr className="border-t border-slate-100"><td className="px-5 py-3 font-medium text-slate-400">Check digit</td><td className="px-5 py-3 font-mono text-[#0f1f5c]">{result.check} (matches)</td></tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
                <div className="flex items-center gap-2 font-semibold text-rose-700"><span className="text-lg">⚠️</span> Not a valid GSTIN</div>
                <p className="mt-1.5 text-sm text-rose-600">{result.reason}</p>
              </div>
            )
          ) : null}

          {PORTAL_NOTE}
        </>
      ) : (
        <>
          <label className="mb-1 block text-[13px] font-semibold text-slate-600">
            Paste GST numbers — one per line, or separated by commas
          </label>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={7}
            placeholder={"27AAPFU0939F1ZV\n29AAGCB7383J1Z4\n24AAACC1206D1ZM"}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm tracking-wide focus:border-[#2563eb] focus:outline-none"
          />
          <p className="mt-1.5 text-[12.5px] text-slate-500">
            Up to 500 at a time. Everything runs in your browser — nothing is uploaded.
          </p>

          {bulkRows.length > 0 && (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                  {validCount} valid
                </span>
                <span className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700">
                  {invalidCount} invalid
                </span>
                <button
                  type="button"
                  onClick={downloadCsv}
                  className="ml-auto rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
                >
                  Download CSV
                </button>
              </div>

              <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[12.5px] uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">GSTIN</th>
                      <th className="px-4 py-2.5 font-semibold">Status</th>
                      <th className="px-4 py-2.5 font-semibold">State</th>
                      <th className="px-4 py-2.5 font-semibold">PAN</th>
                      <th className="px-4 py-2.5 font-semibold">Holder type</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    {bulkRows.map(({ input, res }, i) => (
                      <tr key={`${input}-${i}`} className="border-t border-slate-100">
                        <td className="px-4 py-2.5 font-mono text-[#0f1f5c]">{input}</td>
                        <td className="px-4 py-2.5">
                          {res && res.ok ? (
                            <span className="font-semibold text-emerald-600">Valid</span>
                          ) : (
                            <span className="font-semibold text-rose-600" title={res && !res.ok ? res.reason : ""}>Invalid</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">{res && res.ok ? res.state : "—"}</td>
                        <td className="px-4 py-2.5 font-mono">{res && res.ok ? res.pan : "—"}</td>
                        <td className="px-4 py-2.5">{res && res.ok ? res.holder : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {PORTAL_NOTE}
        </>
      )}
    </div>
  );
}
