import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';
import { getPostHogClient } from '@/lib/posthog-server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { plan, billing } = await req.json();

    const amounts: Record<string, number> = {
      'pro-monthly': 29900,   // Rs. 299 in paise
      'pro-yearly': 249900,   // Rs. 2,499 in paise
      'lifetime': 599900,     // Rs. 5,999 in paise
    };

    const key = billing === 'lifetime' ? 'lifetime' : `pro-${billing}`;
    const amount = amounts[key];

    if (!amount) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { plan, billing },
    });

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: order.id,
      event: 'payment_order_created',
      properties: { plan, billing, amount_paise: amount, order_id: order.id },
    });

    return NextResponse.json({ orderId: order.id, amount, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
