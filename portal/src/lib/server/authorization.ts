import { NextResponse } from 'next/server';
import type { UserRole } from '@/lib/types';
import { getSession, type PortalSession } from './session';
import { getUserFromToken } from './auth';

export async function requireRole(...roles: UserRole[]): Promise<PortalSession | NextResponse> {
  try {
    let session = await getSession();
    if (!session) {
      const userFromToken = await getUserFromToken();
      if (userFromToken && userFromToken.role !== 'guest') {
        session = {
          email: (userFromToken.user as any)?.email || `${userFromToken.role}@iitg.ac.in`,
          name: (userFromToken.user as any)?.name || userFromToken.role,
          role: userFromToken.role as UserRole,
          rollNumber: (userFromToken.user as any)?.rollNumber || null,
          companyId: userFromToken.companyId?.toString() || null,
          exp: Date.now() + 8 * 60 * 60 * 1000,
        };
      }
    }

    if (!session) {
      return NextResponse.json({ error: 'Sign in with your IIT Guwahati account.' }, { status: 401 });
    }

    if (!roles.includes(session.role)) {
      return NextResponse.json({ error: 'You do not have permission for this action.' }, { status: 403 });
    }

    return session;
  } catch (error) {
    console.error('Unable to verify portal session:', error);
    return NextResponse.json({ error: 'Portal authentication is not configured.' }, { status: 503 });
  }
}

export function isAuthorizationError(value: PortalSession | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
