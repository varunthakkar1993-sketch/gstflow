import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { getPostHogClient } from '@/lib/posthog-server';
import { verifyAuth, rateLimit } from '@/lib/verify-auth';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    let uid: string;
    try {
      uid = await verifyAuth(req);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!rateLimit(`send:${uid}`, 30, 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
    }

    const { to, subject, invoiceNumber, clientName, businessName, total, date, pdfBase64, docType } = await req.json();

    const type = docType || 'invoice';
    const isReminder = type === 'reminder';
    const label = type === 'receipt' ? 'Receipt'
      : type === 'quote' ? 'Quote'
      : type === 'creditnote' ? 'Credit Note'
      : 'Invoice';
    const lowerLabel = type === 'receipt' ? 'receipt'
      : type === 'quote' ? 'quote'
      : type === 'creditnote' ? 'credit note'
      : 'invoice';

    await sgMail.send({
      to,
      from: { email: 'noreply@paavti.in', name: 'Paavti' },
      subject: subject || (isReminder
        ? `Payment reminder: invoice ${invoiceNumber}`
        : `${label} ${invoiceNumber} from ${businessName}`),
      html: isReminder ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #111;">Payment reminder from ${businessName}</h2>
          <p>Dear ${clientName},</p>
          <p>This is a gentle reminder that invoice <strong>${invoiceNumber}</strong> dated ${date} has <strong>Rs. ${total}</strong> still outstanding.</p>
          <p>A copy of the invoice is attached for your reference. If you have already made the payment, please ignore this message.</p>
          <br/>
          <p>Thank you!</p>
          <p style="color: #666; font-size: 12px;">Sent via Paavti.in</p>
        </div>
      ` : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #111;">${label} from ${businessName}</h2>
          <p>Dear ${clientName},</p>
          <p>Please find your ${lowerLabel} <strong>${invoiceNumber}</strong> for <strong>Rs. ${total}</strong> dated ${date}.</p>
          <p>The ${lowerLabel} PDF is attached to this email.</p>
          <br/>
          <p>Thank you for your business!</p>
          <p style="color: #666; font-size: 12px;">Sent via Paavti.in</p>
        </div>
      `,
      attachments: [
        {
          content: pdfBase64,
          filename: `${isReminder ? 'Invoice' : label}-${invoiceNumber}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    });

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: to,
      event: `${lowerLabel}_send_completed`,
      properties: { [`${lowerLabel}_number`]: invoiceNumber, client_name: clientName, total, business_name: businessName },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('SendGrid error:', error?.response?.body || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
