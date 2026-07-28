// Shared client-side field validators for Indian business forms.
// Each returns an error string when invalid, or '' when valid.
// Empty input returns '' (fields are validated for FORMAT; use `required`
// checks separately where a value is mandatory).

export const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const HSN_RE = /^\d{4}(\d{2})?(\d{2})?$/; // 4, 6, or 8 digits
export const PINCODE_RE = /^\d{6}$/;

export function validateEmail(v: string): string {
  if (!v) return '';
  return EMAIL_RE.test(v.trim()) ? '' : 'Enter a valid email address.';
}

// Indian mobile: 10 digits starting 6-9, optional +91 / 0 prefix which we ignore.
export function validateMobile(v: string): string {
  if (!v) return '';
  const digits = v.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '');
  return /^[6-9]\d{9}$/.test(digits) ? '' : 'Enter a valid 10-digit mobile number.';
}

export function validateGSTIN(v: string): string {
  if (!v) return '';
  return GSTIN_RE.test(v.trim().toUpperCase()) ? '' : 'Enter a valid 15-character GSTIN (e.g. 27ABCDE1234F1Z5).';
}

export function validateHSN(v: string): string {
  if (!v) return '';
  return HSN_RE.test(v.trim()) ? '' : 'HSN/SAC must be 4, 6, or 8 digits.';
}

export function validatePincode(v: string): string {
  if (!v) return '';
  return PINCODE_RE.test(v.trim()) ? '' : 'Enter a valid 6-digit pincode.';
}

// Normalise a GSTIN for storage (uppercase, trimmed).
export function normalizeGSTIN(v: string): string {
  return (v || '').trim().toUpperCase();
}
