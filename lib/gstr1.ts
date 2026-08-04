// GSTR-1 export logic for Paavti.
// Turns saved invoices + business profile into the GSTR-1 sections a CA files:
// B2B, B2CL, B2CS and an HSN summary, plus a GSTN-schema JSON that uploads
// directly to the GST portal.
//
// Rules baked in (verified July 2026):
// - B2CL threshold: inter-state B2C invoice value > Rs 1,00,000 (effective 01-Aug-2024,
//   Notification 12/2024-CT, GST Council 53rd meeting). Below/equal goes to B2CS.
// - Place of supply is a 2-digit state code. For B2B it comes from the client GSTIN;
//   for intra-state supplies it is the supplier's own state.
// - Tax split: intra-state => CGST + SGST (half each); inter-state => IGST.

export const B2CL_THRESHOLD = 100000; // Rs 1 lakh, inter-state B2C

// GST state name -> 2-digit code. Used as a fallback for place of supply when a
// GSTIN is not available (kept lowercase, punctuation-insensitive on lookup).
export const STATE_CODES: Record<string, string> = {
  'jammu and kashmir': '01', 'jammu & kashmir': '01',
  'himachal pradesh': '02',
  'punjab': '03',
  'chandigarh': '04',
  'uttarakhand': '05', 'uttaranchal': '05',
  'haryana': '06',
  'delhi': '07',
  'rajasthan': '08',
  'uttar pradesh': '09',
  'bihar': '10',
  'sikkim': '11',
  'arunachal pradesh': '12',
  'nagaland': '13',
  'manipur': '14',
  'mizoram': '15',
  'tripura': '16',
  'meghalaya': '17',
  'assam': '18',
  'west bengal': '19',
  'jharkhand': '20',
  'odisha': '21', 'orissa': '21',
  'chhattisgarh': '22',
  'madhya pradesh': '23',
  'gujarat': '24',
  'dadra and nagar haveli and daman and diu': '26', 'daman and diu': '26', 'dadra and nagar haveli': '26',
  'maharashtra': '27',
  'karnataka': '29',
  'goa': '30',
  'lakshadweep': '31',
  'kerala': '32',
  'tamil nadu': '33',
  'puducherry': '34', 'pondicherry': '34',
  'andaman and nicobar islands': '35', 'andaman and nicobar': '35',
  'telangana': '36',
  'andhra pradesh': '37',
  'ladakh': '38',
  'other territory': '97',
};

const STATE_NAME_BY_CODE: Record<string, string> = {
  '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur',
  '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu', '27': 'Maharashtra', '29': 'Karnataka',
  '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands', '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
  '97': 'Other Territory',
};

export function stateCodeFromName(name?: string): string {
  if (!name) return '';
  const key = name.trim().toLowerCase().replace(/&/g, 'and').replace(/\s+/g, ' ');
  return STATE_CODES[key] || '';
}

export function stateLabel(code: string): string {
  if (!code) return '';
  return `${code}-${STATE_NAME_BY_CODE[code] || ''}`.replace(/-$/, '');
}

// A GSTIN encodes its state in the first two characters.
export function stateCodeFromGSTIN(gstin?: string): string {
  if (!gstin) return '';
  const s = gstin.trim();
  return /^\d{2}/.test(s) ? s.substring(0, 2) : '';
}

const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/i;
export function isValidGSTIN(gstin?: string): boolean {
  if (!gstin) return false;
  return GSTIN_RE.test(gstin.trim());
}

export interface InvoiceLike {
  invoiceNumber?: string;
  date?: string;            // ISO yyyy-mm-dd
  clientName?: string;
  clientGSTIN?: string;
  amount?: number;          // taxable value (subtotal)
  gstRate?: string | number;
  isIntraState?: boolean;
  total?: number;           // invoice value incl. tax
  hsn?: string;             // optional HSN/SAC code
  unit?: string;            // optional UQC, e.g. NOS / OTH
  description?: string;
}

export interface ProfileLike {
  gstin?: string;
  state?: string;
  businessName?: string;
}

export interface CreditNoteLike {
  creditNoteNumber?: string;
  date?: string;            // ISO yyyy-mm-dd
  invoiceRef?: string;
  invoiceDate?: string;
  clientName?: string;
  clientGSTIN?: string;
  amount?: number;          // taxable value credited
  gstRate?: string | number;
  isIntraState?: boolean;
  total?: number;
  reason?: string;
}

export interface CDNRRow {
  ctin: string; nt_num: string; nt_dt: string; inum: string; idt: string;
  val: number; pos: string; posLabel: string; ntty: 'C'; rate: number;
  txval: number; iamt: number; camt: number; samt: number; clientName: string;
}

export interface Gstr1Warning {
  invoiceNumber: string;
  message: string;
}

export interface B2BRow {
  ctin: string; inum: string; idt: string; val: number; pos: string; posLabel: string;
  rchrg: 'N'; inv_typ: 'R'; rate: number; txval: number; iamt: number; camt: number; samt: number;
  clientName: string;
}
export interface B2CLRow {
  pos: string; posLabel: string; inum: string; idt: string; val: number; rate: number; txval: number; iamt: number;
  clientName: string;
}
export interface B2CSRow {
  sply_ty: 'INTRA' | 'INTER'; pos: string; posLabel: string; typ: 'OE'; rate: number; txval: number; iamt: number; camt: number; samt: number;
}
export interface HSNRow {
  num: number; hsn_sc: string; desc: string; uqc: string; qty: number; rate: number;
  txval: number; iamt: number; camt: number; samt: number; total: number;
}

export interface Gstr1Result {
  gstin: string;
  fp: string;            // MMYYYY
  period: string;        // human label
  b2b: B2BRow[];
  b2cl: B2CLRow[];
  b2cs: B2CSRow[];
  cdnr: CDNRRow[];
  hsn: HSNRow[];
  totals: { taxable: number; igst: number; cgst: number; sgst: number; invoiceValue: number; count: number; creditTaxable: number; creditTax: number };
  warnings: Gstr1Warning[];
  json: any;             // GSTN GSTR-1 upload schema
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function isoToDdmmyyyy(iso?: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// month is 0-indexed (Jan = 0), matching JS Date + the reports page.
export function buildGstr1(
  invoices: InvoiceLike[],
  profile: ProfileLike,
  month: number,
  year: number,
  creditNotes: CreditNoteLike[] = [],
): Gstr1Result {
  const warnings: Gstr1Warning[] = [];
  const supplierGstin = (profile.gstin || '').trim().toUpperCase();
  const supplierState = stateCodeFromGSTIN(supplierGstin) || stateCodeFromName(profile.state);

  if (!supplierGstin) {
    warnings.push({ invoiceNumber: '-', message: 'Your business GSTIN is missing. Add it in Business Profile before filing.' });
  }

  const b2b: B2BRow[] = [];
  const b2cl: B2CLRow[] = [];
  const b2cs: B2CSRow[] = [];
  // B2CS aggregates by (place of supply, rate, supply type); accumulate then flatten.
  const b2csMap = new Map<string, B2CSRow>();
  // HSN aggregates by (hsn code, rate); we group by rate when HSN is absent.
  const hsnMap = new Map<string, HSNRow>();

  let tTax = 0, tIgst = 0, tCgst = 0, tSgst = 0, tVal = 0;

  for (const inv of invoices) {
    const inum = inv.invoiceNumber || '';
    const taxable = round2(Number(inv.amount) || 0);
    const rate = parseFloat(String(inv.gstRate)) || 0;
    const tax = round2(taxable * rate / 100);
    const isIntra = inv.isIntraState === true;
    const val = round2(Number(inv.total) || round2(taxable + tax));
    const idt = isoToDdmmyyyy(inv.date);

    const igst = isIntra ? 0 : tax;
    const cgst = isIntra ? round2(tax / 2) : 0;
    const sgst = isIntra ? round2(tax / 2) : 0;

    tTax += taxable; tIgst += igst; tCgst += cgst; tSgst += sgst; tVal += val;

    // Place of supply
    let pos = '';
    const clientGstin = (inv.clientGSTIN || '').trim().toUpperCase();
    const hasGstin = !!clientGstin;
    if (isIntra) {
      pos = supplierState;
    } else if (hasGstin) {
      pos = stateCodeFromGSTIN(clientGstin);
    }
    if (!pos) {
      pos = supplierState; // safe default
      if (!isIntra) {
        warnings.push({ invoiceNumber: inum, message: 'Inter-state sale with no client GSTIN, so place of supply is unknown. Defaulted to your state. Verify before filing.' });
      }
    }
    const posLabel = stateLabel(pos);

    if (hasGstin) {
      if (!isValidGSTIN(clientGstin)) {
        warnings.push({ invoiceNumber: inum, message: `Client GSTIN "${clientGstin}" is not a valid 15-character GSTIN. It will be reported as-is.` });
      }
      b2b.push({ ctin: clientGstin, inum, idt, val, pos, posLabel, rchrg: 'N', inv_typ: 'R', rate, txval: taxable, iamt: igst, camt: cgst, samt: sgst, clientName: inv.clientName || '' });
    } else if (!isIntra && val > B2CL_THRESHOLD) {
      b2cl.push({ pos, posLabel, inum, idt, val, rate, txval: taxable, iamt: igst, clientName: inv.clientName || '' });
    } else {
      const sply_ty: 'INTRA' | 'INTER' = isIntra ? 'INTRA' : 'INTER';
      const key = `${sply_ty}|${pos}|${rate}`;
      const existing = b2csMap.get(key);
      if (existing) {
        existing.txval = round2(existing.txval + taxable);
        existing.iamt = round2(existing.iamt + igst);
        existing.camt = round2(existing.camt + cgst);
        existing.samt = round2(existing.samt + sgst);
      } else {
        b2csMap.set(key, { sply_ty, pos, posLabel, typ: 'OE', rate, txval: taxable, iamt: igst, camt: cgst, samt: sgst });
      }
    }

    // HSN summary
    const hsnCode = (inv.hsn || '').trim();
    const uqc = (inv.unit || 'OTH').trim().toUpperCase();
    if (!hsnCode) {
      warnings.push({ invoiceNumber: inum, message: 'No HSN/SAC code on this invoice. Grouped by tax rate in the HSN summary. Add HSN codes for a complete return.' });
    }
    const hkey = `${hsnCode || 'NA'}|${rate}`;
    const hex = hsnMap.get(hkey);
    if (hex) {
      hex.txval = round2(hex.txval + taxable);
      hex.iamt = round2(hex.iamt + igst);
      hex.camt = round2(hex.camt + cgst);
      hex.samt = round2(hex.samt + sgst);
      hex.total = round2(hex.total + val);
    } else {
      hsnMap.set(hkey, {
        num: 0, hsn_sc: hsnCode || '', desc: inv.description ? String(inv.description).substring(0, 30) : '',
        uqc: uqc || 'OTH', qty: 0, rate, txval: taxable, iamt: igst, camt: cgst, samt: sgst, total: val,
      });
    }
  }

  for (const [, row] of b2csMap) b2cs.push(row);

  // Credit notes (table 9B). Registered-buyer credits go to CDNR; unregistered
  // credits are netted off B2CS by reducing the matching rate bucket.
  const cdnr: CDNRRow[] = [];
  let cTaxable = 0, cTax = 0;
  for (const cn of creditNotes) {
    const taxable = round2(Number(cn.amount) || 0);
    const rate = parseFloat(String(cn.gstRate)) || 0;
    const tax = round2(taxable * rate / 100);
    const isIntra = cn.isIntraState === true;
    const val = round2(Number(cn.total) || round2(taxable + tax));
    const igst = isIntra ? 0 : tax;
    const camt = isIntra ? round2(tax / 2) : 0;
    const samt = isIntra ? round2(tax / 2) : 0;
    cTaxable += taxable; cTax += tax;

    const ctin = (cn.clientGSTIN || '').trim().toUpperCase();
    const pos = isIntra ? supplierState : (stateCodeFromGSTIN(ctin) || supplierState);

    if (ctin) {
      cdnr.push({
        ctin, nt_num: cn.creditNoteNumber || '', nt_dt: isoToDdmmyyyy(cn.date),
        inum: cn.invoiceRef || '', idt: isoToDdmmyyyy(cn.invoiceDate),
        val, pos, posLabel: stateLabel(pos), ntty: 'C', rate,
        txval: taxable, iamt: igst, camt, samt, clientName: cn.clientName || '',
      });
    } else {
      // Unregistered buyer: net the credit against the B2CS bucket for that rate.
      const sply_ty: 'INTRA' | 'INTER' = isIntra ? 'INTRA' : 'INTER';
      const key = `${sply_ty}|${pos}|${rate}`;
      const existing = b2cs.find(r => `${r.sply_ty}|${r.pos}|${r.rate}` === key);
      if (existing) {
        existing.txval = round2(existing.txval - taxable);
        existing.iamt = round2(existing.iamt - igst);
        existing.camt = round2(existing.camt - camt);
        existing.samt = round2(existing.samt - samt);
      } else {
        b2cs.push({ sply_ty, pos, posLabel: stateLabel(pos), typ: 'OE', rate, txval: -taxable, iamt: -igst, camt: -camt, samt: -samt });
      }
      warnings.push({ invoiceNumber: cn.creditNoteNumber || '-', message: 'Credit note has no client GSTIN, so it is netted off your B2CS totals rather than reported as a separate CDNR record.' });
    }
  }

  const hsn = Array.from(hsnMap.values()).map((h, i) => ({ ...h, num: i + 1 }));

  const fp = `${String(month + 1).padStart(2, '0')}${year}`;
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const period = `${MONTHS[month]} ${year}`;

  const json = buildGstnJson(supplierGstin, fp, b2b, b2cl, b2cs, hsn, cdnr);

  return {
    gstin: supplierGstin,
    fp,
    period,
    b2b, b2cl, b2cs, cdnr, hsn,
    totals: {
      taxable: round2(tTax), igst: round2(tIgst), cgst: round2(tCgst), sgst: round2(tSgst),
      invoiceValue: round2(tVal), count: invoices.length,
      creditTaxable: round2(cTaxable), creditTax: round2(cTax),
    },
    warnings,
    json,
  };
}

// GSTN GSTR-1 upload schema (portal-importable JSON).
function buildGstnJson(gstin: string, fp: string, b2b: B2BRow[], b2cl: B2CLRow[], b2cs: B2CSRow[], hsn: HSNRow[], cdnr: CDNRRow[] = []) {
  // B2B grouped by counterparty GSTIN.
  const b2bByCtin = new Map<string, B2BRow[]>();
  for (const r of b2b) {
    const arr = b2bByCtin.get(r.ctin) || [];
    arr.push(r);
    b2bByCtin.set(r.ctin, arr);
  }
  const b2bJson = Array.from(b2bByCtin.entries()).map(([ctin, rows]) => ({
    ctin,
    inv: rows.map(r => ({
      inum: r.inum,
      idt: r.idt,
      val: r.val,
      pos: r.pos,
      rchrg: r.rchrg,
      inv_typ: r.inv_typ,
      itms: [{
        num: 1,
        itm_det: r.iamt > 0
          ? { txval: r.txval, rt: r.rate, iamt: r.iamt, csamt: 0 }
          : { txval: r.txval, rt: r.rate, camt: r.camt, samt: r.samt, csamt: 0 },
      }],
    })),
  }));

  // B2CL grouped by place of supply.
  const b2clByPos = new Map<string, B2CLRow[]>();
  for (const r of b2cl) {
    const arr = b2clByPos.get(r.pos) || [];
    arr.push(r);
    b2clByPos.set(r.pos, arr);
  }
  const b2clJson = Array.from(b2clByPos.entries()).map(([pos, rows]) => ({
    pos,
    inv: rows.map(r => ({
      inum: r.inum,
      idt: r.idt,
      val: r.val,
      itms: [{ num: 1, itm_det: { txval: r.txval, rt: r.rate, iamt: r.iamt, csamt: 0 } }],
    })),
  }));

  const b2csJson = b2cs.map(r => (
    r.sply_ty === 'INTRA'
      ? { sply_ty: 'INTRA', pos: r.pos, typ: 'OE', txval: r.txval, rt: r.rate, camt: r.camt, samt: r.samt, csamt: 0 }
      : { sply_ty: 'INTER', pos: r.pos, typ: 'OE', txval: r.txval, rt: r.rate, iamt: r.iamt, csamt: 0 }
  ));

  const hsnJson = {
    data: hsn.map(h => ({
      num: h.num,
      hsn_sc: h.hsn_sc,
      desc: h.desc,
      uqc: h.uqc,
      qty: h.qty,
      txval: h.txval,
      rt: h.rate,
      iamt: h.iamt,
      camt: h.camt,
      samt: h.samt,
      csamt: 0,
    })),
  };

  // CDNR grouped by counterparty GSTIN.
  const cdnrByCtin = new Map<string, CDNRRow[]>();
  for (const r of cdnr) {
    const arr = cdnrByCtin.get(r.ctin) || [];
    arr.push(r);
    cdnrByCtin.set(r.ctin, arr);
  }
  const cdnrJson = Array.from(cdnrByCtin.entries()).map(([ctin, rows]) => ({
    ctin,
    nt: rows.map(r => ({
      ntty: r.ntty,
      nt_num: r.nt_num,
      nt_dt: r.nt_dt,
      inum: r.inum,
      idt: r.idt,
      val: r.val,
      pos: r.pos,
      rchrg: 'N',
      itms: [{
        num: 1,
        itm_det: r.iamt > 0
          ? { txval: r.txval, rt: r.rate, iamt: r.iamt, csamt: 0 }
          : { txval: r.txval, rt: r.rate, camt: r.camt, samt: r.samt, csamt: 0 },
      }],
    })),
  }));

  const out: any = { gstin, fp, version: 'GST3.2.2', hash: 'hash' };
  if (b2bJson.length) out.b2b = b2bJson;
  if (b2clJson.length) out.b2cl = b2clJson;
  if (b2csJson.length) out.b2cs = b2csJson;
  if (cdnrJson.length) out.cdnr = cdnrJson;
  if (hsnJson.data.length) out.hsn = hsnJson;
  return out;
}
