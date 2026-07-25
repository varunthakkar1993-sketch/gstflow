import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, rateLimit } from '@/lib/verify-auth';

export async function POST(req: NextRequest) {
  try {
    let uid: string;
    try {
      uid = await verifyAuth(req);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!rateLimit(`scan:${uid}`, 20, 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
    }

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const mediaType = imageBase64.includes('image/png') ? 'image/png' : 'image/jpeg';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64Data },
              },
              {
                type: 'text',
                text: 'Extract the following fields from this bill/receipt/invoice image. Return ONLY a JSON object with these fields, nothing else:\n{\n  "vendor": "name of the shop/vendor/company",\n  "amount": "total amount as a number without currency symbol",\n  "date": "date in YYYY-MM-DD format, use today if not visible",\n  "category": "one of: Software, Travel, Office, Contractor, Marketing, Meals, Tax, Other",\n  "gstRate": "GST rate as a number (0, 5, 12, 18, or 28). Look for CGST/SGST/IGST on the bill. If both CGST and SGST are shown, the total GST rate is their sum. If no GST info visible, use 0",\n  "description": "brief 3-5 word description of what was purchased"\n}\n\nReturn ONLY the JSON object. No markdown, no backticks, no explanation.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Claude API error:', err);
      return NextResponse.json({ error: 'Failed to scan bill' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('Scan bill error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
