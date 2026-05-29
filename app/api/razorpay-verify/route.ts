import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan, billing } = await req.json();

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Save subscription to Firestore
    await setDoc(doc(db, 'subscriptions', userId), {
      plan,
      billing,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      activatedAt: new Date().toISOString(),
      status: 'active',
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
