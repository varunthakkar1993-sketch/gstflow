import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';
import { getPostHogClient } from '@/lib/posthog-server';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
const db = admin.firestore();

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan, billing } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await db.collection('subscriptions').doc(userId).set({
      plan,
      billing,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      activatedAt: new Date().toISOString(),
      status: 'active',
    });

    // Send Pro confirmation email
    try {
      const userRecord = await admin.auth().getUser(userId);
      const userEmail = userRecord.email;
      if (userEmail) {
        const planLabel = billing === 'lifetime' ? 'Lifetime Deal' : billing === 'yearly' ? 'Pro Yearly' : 'Pro Monthly';
        const amountLabel = billing === 'lifetime' ? 'Rs. 5,999 (one-time)' : billing === 'yearly' ? 'Rs. 2,499/year' : 'Rs. 299/month';

        await sgMail.send({
          to: userEmail,
          from: { email: 'noreply@paavti.in', name: 'Paavti' },
          subject: `Welcome to Paavti Pro!`,
          html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 24px; color: #0f1f5c; margin: 0;">Paav<span style="color: #2563eb;">ti</span></h1>
              </div>
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 28px;">
                <div style="font-size: 28px; margin-bottom: 8px;">🎉</div>
                <div style="font-size: 18px; font-weight: 600; color: #16a34a;">You are now on ${planLabel}!</div>
              </div>
              <p style="font-size: 15px; color: #374151; line-height: 1.7; margin-bottom: 20px;">
                Thank you for upgrading. Your payment has been confirmed and your account is now unlocked with full Pro access.
              </p>
              <div style="background: #f8faff; border: 1px solid #e5e9f5; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Payment Details</div>
                <div style="display: flex; justify-content: space-between; font-size: 14px; color: #374151; margin-bottom: 8px;">
                  <span>Plan</span>
                  <span style="font-weight: 600;">${planLabel}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 14px; color: #374151; margin-bottom: 8px;">
                  <span>Amount</span>
                  <span style="font-weight: 600;">${amountLabel}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 14px; color: #374151;">
                  <span>Payment ID</span>
                  <span style="font-weight: 600; font-size: 12px; color: #6b7280;">${razorpay_payment_id}</span>
                </div>
              </div>
              <p style="font-size: 15px; color: #374151; line-height: 1.7; margin-bottom: 8px;">
                Here is what you now have access to:
              </p>
              <ul style="font-size: 14px; color: #374151; line-height: 2; padding-left: 20px; margin-bottom: 28px;">
                <li>Unlimited invoices and quotes</li>
                <li>Custom logo on invoices</li>
                <li>Expense tracker with net profit</li>
                <li>Unlimited clients</li>
                <li>WhatsApp sharing</li>
                <li>Business dashboard</li>
              </ul>
              <div style="text-align: center; margin-bottom: 28px;">
                <a href="https://paavti.com/dashboard" style="background: #2563eb; color: #fff; padding: 13px 36px; border-radius: 9px; font-size: 15px; font-weight: 600; text-decoration: none; display: inline-block;">Go to Dashboard</a>
              </div>
              <div style="border-top: 1px solid #f0f4ff; padding-top: 20px; text-align: center;">
                <p style="font-size: 12px; color: #9ca3af;">Questions? Just reply to this email.</p>
                <p style="font-size: 12px; color: #9ca3af; margin-top: 4px;">Paavti. Built for India.</p>
              </div>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      // Don't fail the payment verification if email fails
      console.error('Pro confirmation email failed:', emailErr);
    }

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: userId,
      event: 'payment_verified',
      properties: { plan, billing, payment_id: razorpay_payment_id, order_id: razorpay_order_id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
