// GSTR-3B summary logic for Paavti.
// GSTR-3B is the monthly self-assessment return: total outward tax (from invoices)
// minus eligible input tax credit (from expenses) = net GST payable.
//
// Data notes:
// - Invoice.amount is the taxable value; tax is split CGST+SGST (intra) or IGST (inter).
// - Invoice gstRate 0 is treated as nil-rated / exempt outward supply (table 3.1(c)).
// - Expense.amount is GST-INCLUSIVE, so input GST = amount * rate / (100 + rate)
//   (same basis the monthly report uses).
// - Expenses carry no intra/inter flag, so ITC cannot be head-split from data.
//   We default eligible ITC to CGST + SGST (half each), the common case for local
//   SME purchases, and flag it for the CA to reclassify any inter-state (IGST) buys.

import { InvoiceLike } from './gstr1';

export interface ExpenseLike {
  amount?: number;      // GST-inclusive total
  gstRate?: string | number;
  category?: string;
  date?: string;
  vendor?: string;
  isIntraState?: boolean; // true/undefined => CGST+SGST; false => IGST
}

export interface Gstr3bWarning { message: string; }

export interface Gstr3bResult {
  fp: string;
  period: string;
  outward: { taxableValue: number; igst: number; cgst: number; sgst: number; totalTax: number };
  nilExempt: { taxableValue: number };
  itc: { total: number; igst: number; cgst: number; sgst: number };
  net: { total: number; igst: number; cgst: number; sgst: number };
  counts: { invoices: number; expenses: number };
  warnings: Gstr3bWarning[];
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function buildGstr3b(
  invoices: InvoiceLike[],
  expenses: ExpenseLike[],
  month: number,
  year: number,
  creditNotes: Array<{ amount?: number; gstRate?: string | number; isIntraState?: boolean }> = [],
): Gstr3bResult {
  const warnings: Gstr3bWarning[] = [];

  let oTax = 0, oIgst = 0, oCgst = 0, oSgst = 0, oTaxable = 0, nilTaxable = 0;

  for (const inv of invoices) {
    const taxable = round2(Number(inv.amount) || 0);
    const rate = parseFloat(String(inv.gstRate)) || 0;
    if (rate === 0) {
      nilTaxable += taxable;
      continue;
    }
    const tax = round2(taxable * rate / 100);
    const isIntra = inv.isIntraState === true;
    oTaxable += taxable;
    oTax += tax;
    if (isIntra) {
      oCgst += round2(tax / 2);
      oSgst += round2(tax / 2);
    } else {
      oIgst += tax;
    }
  }

  // Credit notes reduce outward supplies and output tax for the period.
  let creditTaxable = 0;
  for (const cn of creditNotes) {
    const taxable = round2(Number(cn.amount) || 0);
    const rate = parseFloat(String(cn.gstRate)) || 0;
    const tax = round2(taxable * rate / 100);
    creditTaxable += taxable;
    oTaxable -= taxable;
    oTax -= tax;
    if (cn.isIntraState === false) {
      oIgst -= tax;
    } else {
      oCgst -= round2(tax / 2);
      oSgst -= round2(tax / 2);
    }
  }
  if (creditTaxable > 0) {
    warnings.push({ message: `Credit notes worth Rs. ${round2(creditTaxable).toLocaleString('en-IN')} taxable value have been deducted from your outward supplies for this period.` });
  }

  // Eligible ITC from expenses (input GST embedded in the inclusive amount).
  // Head-split by each expense's intra/inter flag; expenses saved before the
  // flag existed have isIntraState === undefined and default to CGST+SGST.
  let itcIgst = 0, itcCgst = 0, itcSgst = 0;
  let hasInputGst = false;
  let assumedCount = 0;
  for (const exp of expenses) {
    const rate = parseFloat(String(exp.gstRate)) || 0;
    if (rate <= 0) continue;
    hasInputGst = true;
    const amt = Number(exp.amount) || 0;
    const input = round2(amt * rate / (100 + rate));
    if (exp.isIntraState === false) {
      itcIgst = round2(itcIgst + input);
    } else {
      const half = round2(input / 2);
      itcCgst = round2(itcCgst + half);
      itcSgst = round2(itcSgst + (input - half));
      if (exp.isIntraState === undefined) assumedCount++;
    }
  }
  const itcTotal = round2(itcIgst + itcCgst + itcSgst);

  if (assumedCount > 0) {
    warnings.push({ message: `${assumedCount} older expense${assumedCount !== 1 ? 's' : ''} had no GST type saved, so ${assumedCount !== 1 ? 'their' : 'its'} input credit is assumed CGST + SGST. Re-save with the correct GST type for an exact split.` });
  }
  if (invoices.some(i => (parseFloat(String(i.gstRate)) || 0) === 0)) {
    warnings.push({ message: 'Invoices at 0% are reported as nil-rated / exempt outward supplies (table 3.1(c)), not taxable sales.' });
  }

  const outward = {
    taxableValue: round2(oTaxable),
    igst: round2(oIgst),
    cgst: round2(oCgst),
    sgst: round2(oSgst),
    totalTax: round2(oTax),
  };
  const itc = { total: itcTotal, igst: itcIgst, cgst: itcCgst, sgst: itcSgst };
  const net = {
    igst: round2(outward.igst - itc.igst),
    cgst: round2(outward.cgst - itc.cgst),
    sgst: round2(outward.sgst - itc.sgst),
    total: round2(outward.totalTax - itc.total),
  };

  const fp = `${String(month + 1).padStart(2, '0')}${year}`;
  const period = `${MONTHS[month]} ${year}`;

  return {
    fp, period, outward,
    nilExempt: { taxableValue: round2(nilTaxable) },
    itc, net,
    counts: { invoices: invoices.length, expenses: expenses.length },
    warnings,
  };
}
