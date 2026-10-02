import { cookies } from 'next/headers';
import crypto from 'crypto';

export type AuthRole = 'public' | 'team_rep' | 'scheduler';

export interface SessionPayload {
  role: AuthRole;
  teamId?: string;
  leagueId?: string;
  expiresAt: number;
}

export const COOKIE_NAME = 'powerschedule_session';
export const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function getSecretKey(): string {
  const secret = process.env.AUTH_SECRET;
  // Reject the placeholder from .env.example: it's long enough but publicly known.
  const isPlaceholder = secret?.startsWith('replace-with');
  if (secret && secret.length >= 32 && !isPlaceholder) return secret;
  // A publicly known fallback secret would let anyone forge an admin session cookie.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be set to a random string of at least 32 characters in production.');
  }
  return 'powerschedule-dev-only-secret-key-not-for-production';
}

/** Constant-time string comparison for passcodes / PINs. */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function sign(message: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(message).digest('base64url');
}

function verify(message: string, signature: string, secret: string): boolean {
  const expectedSignature = sign(message, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function createSessionToken(payload: Omit<SessionPayload, 'expiresAt'>): Promise<string> {
  const fullPayload: SessionPayload = {
    ...payload,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  const jsonStr = JSON.stringify(fullPayload);
  const payloadB64 = Buffer.from(jsonStr).toString('base64url');
  const signature = sign(payloadB64, getSecretKey());
  return `${payloadB64}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;
    const isValid = verify(payloadB64, signature, getSecretKey());
    if (!isValid) return null;

    const jsonStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload: SessionPayload = JSON.parse(jsonStr);

    if (!payload.expiresAt || payload.expiresAt < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
