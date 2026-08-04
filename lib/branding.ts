// PDF footer branding.
// Free plans carry a small "Made with Paavti" credit on generated documents.
// Pro, yearly and lifetime plans get a clean document with no Paavti mark.
//
// The credit is deliberately small and centred rather than a diagonal
// watermark: these documents are sent by our users to their own clients,
// and a heavy watermark would undercut how professional they look.

import { doc as fsDoc, getDoc, Firestore } from 'firebase/firestore';

export const BRAND_LINE = 'Made with Paavti · paavti.com';

// True when the user is on any paid plan.
export async function isProUser(db: Firestore, uid?: string): Promise<boolean> {
  if (!uid) return false;
  try {
    const snap = await getDoc(fsDoc(db, 'subscriptions', uid));
    return snap.exists() && snap.data()?.status === 'active';
  } catch {
    // If the lookup fails, fall back to showing the credit rather than
    // silently stripping branding for someone who has not paid.
    return false;
  }
}

// Draw the centred credit line at the bottom of the current page.
// Pass showBranding=false for paid users to skip it entirely.
export function drawBrandFooter(
  pdf: any,
  showBranding: boolean,
  opts: { color?: [number, number, number]; fontSize?: number; offsetY?: number } = {},
) {
  if (!showBranding) return;
  const { color = [150, 158, 172], fontSize = 8, offsetY = 6 } = opts;
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  pdf.setFontSize(fontSize);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(color[0], color[1], color[2]);
  pdf.text(BRAND_LINE, pw / 2, ph - offsetY, { align: 'center' });
}
