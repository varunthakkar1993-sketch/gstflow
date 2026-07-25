// Server-side auth + basic rate limiting for API routes.
// Verifies a Firebase ID token from the Authorization: Bearer <token> header
// and returns the caller's uid. Throws 'UNAUTHENTICATED' if the token is
// missing or invalid.

import * as admin from 'firebase-admin';
import { NextRequest } from 'next/server';

export function getAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return admin;
}

export async function verifyAuth(req: NextRequest): Promise<string> {
  const header = req.headers.get('authorization') || '';
  const match = header.match(/^Bearer (.+)$/i);
  if (!match) throw new Error('UNAUTHENTICATED');
  try {
    const decoded = await getAdmin().auth().verifyIdToken(match[1].trim());
    return decoded.uid;
  } catch {
    throw new Error('UNAUTHENTICATED');
  }
}

// Best-effort in-memory rate limiter. NOTE: serverless instances each have
// their own memory, so this throttles per-instance bursts rather than global
// traffic. It is a cheap first line of defence; move to Upstash/Redis or
// Vercel rate limiting if abuse becomes a real problem.
const hits = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}
