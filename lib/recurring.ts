// Helpers for recurring invoices.
// Paavti does not auto-send recurring invoices (there is no background job).
// Instead an invoice can be marked recurring with a next-due date, and the
// dashboard surfaces the ones that are due so the user can regenerate them
// in one click.

export type Frequency = 'none' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  none: 'Not recurring',
  weekly: 'Every week',
  monthly: 'Every month',
  quarterly: 'Every 3 months',
  yearly: 'Every year',
};

// Given an ISO date and a frequency, return the next due ISO date ('' if none).
export function nextDueDate(isoDate: string, frequency: string): string {
  if (!isoDate || !frequency || frequency === 'none') return '';
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return '';
  const [yy, mm, dd] = parts;
  let d: Date;
  if (frequency === 'weekly') {
    d = new Date(yy, mm - 1, dd + 7);
  } else {
    // Month/year steps clamp to the last day of the target month, so a bill
    // dated the 31st becomes the 28th in February rather than spilling into March.
    const step = frequency === 'monthly' ? 1 : frequency === 'quarterly' ? 3 : frequency === 'yearly' ? 12 : 0;
    if (!step) return '';
    const targetMonthIndex = (mm - 1) + step;
    const targetYear = yy + Math.floor(targetMonthIndex / 12);
    const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
    const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
    d = new Date(targetYear, targetMonth, Math.min(dd, lastDay));
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isDue(nextDue?: string, today = new Date()): boolean {
  if (!nextDue) return false;
  const t = today.toISOString().split('T')[0];
  return nextDue <= t;
}

// Payment status derived from what has actually been received.
export function paymentStatus(total: number, amountPaid: number): 'paid' | 'partial' | 'unpaid' {
  const paid = Number(amountPaid) || 0;
  if (paid <= 0) return 'unpaid';
  if (paid + 0.01 >= (Number(total) || 0)) return 'paid';
  return 'partial';
}

export function balanceDue(total: number, amountPaid: number): number {
  const bal = (Number(total) || 0) - (Number(amountPaid) || 0);
  return Math.max(0, Math.round((bal + Number.EPSILON) * 100) / 100);
}
