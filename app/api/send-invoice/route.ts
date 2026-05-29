import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { to, subject, invoiceNumber, clientName, businessName, total, date, pdfBase64 } = await req.json();

    await sgMail.send({
      to,
      from: 'noreply@paavti.in', // must match your verified sender
      subject: subject || `Invoice ${invoiceNumber} from ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #111;">Invoice from ${businessName}</h2>
          <p>Dear ${clientName},</p>
          <p>Please find your invoice <strong>${invoiceNumber}</strong> for <strong>Rs. ${total}</strong> dated ${date}.</p>
          <p>The invoice PDF is attached to this email.</p>
          <br/>
          <p>Thank you for your business!</p>
          <p style="color: #666; font-size: 12px;">Sent via Paavti.in</p>
        </div>
      `,
      attachments: [
        {
          content: pdfBase64,
          filename: `Invoice-${invoiceNumber}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('SendGrid error:', error?.response?.body || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
