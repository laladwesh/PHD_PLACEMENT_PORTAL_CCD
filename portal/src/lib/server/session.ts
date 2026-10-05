import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { sessionSecret } from './secrets';
import type { UserRole } from '@/lib/types';

export const SESSION_COOKIE = 'portal_session';

export type PortalSession = {
  email: string;
  name: string;
  role: UserRole;
  rollNumber: number | null;
  companyId: string | null;
  exp: number;
};


function encode(value: PortalSession) {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
  const signature = createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function decode(value: string): PortalSession | null {
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
  const supplied = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (supplied.length !== expectedBuffer.length || !timingSafeEqual(supplied, expectedBuffer)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as PortalSession;
    if (session.exp <= Date.now() || !session.email || !session.role) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<PortalSession | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  return value ? decode(value) : null;
}

export function createSessionCookie(session: Omit<PortalSession, 'exp'>) {
  const maxAge = 8 * 60 * 60;
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
  return {
    name: SESSION_COOKIE,
    value: encode({ ...session, exp: Date.now() + maxAge * 1000 }),
    ...cookieOpts,
    options: cookieOpts,
  };
}

export function clearSessionCookie() {
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
  return {
    name: SESSION_COOKIE,
    value: '',
    ...cookieOpts,
    options: cookieOpts,
  };
}
