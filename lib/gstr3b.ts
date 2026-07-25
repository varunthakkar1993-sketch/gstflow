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

  // Eligible ITC from expenses (input GST embedded in the inclusive amount).
  let itcTotal = 0;
  let hasInputGst = false;
  for (const exp of expenses) {
    const rate = parseFloat(String(exp.gstRate)) || 0;
    if (rate <= 0) continue;
    hasInputGst = true;
    const amt = Number(exp.amount) || 0;
    itcTotal += round2(amt * rate / (100 + rate));
  }
  itcTotal = round2(itcTotal);

  // Default head split for ITC (no intra/inter data on expenses).
  const itcCgst = round2(itcTotal / 2);
  const itcSgst = round2(itcTotal - itcCgst); // keep the two halves summing exactly to total
  const itcIgst = 0;

  if (hasInputGst) {
    warnings.push({ message: 'Eligible ITC is split as CGST + SGST (half each), assuming local/intra-state purchases. If you bought inter-state (IGST) this month, ask your CA to reclassify that portion.' });
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
