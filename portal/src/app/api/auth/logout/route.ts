import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clearSessionCookie } from '@/lib/server/session';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('token');
    cookieStore.delete('user_role');
    cookieStore.delete('user_profile');
    cookieStore.delete('portal_session');

    const accept = request.headers.get('accept') || '';
    const contentType = request.headers.get('content-type') || '';
    if (accept.includes('application/json') || contentType.includes('application/json')) {
      const res = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
      res.cookies.set(clearSessionCookie());
      return res;
    }

    const response = NextResponse.redirect(new URL('/phdplacement/auth', request.url), { status: 303 });
    response.cookies.set(clearSessionCookie());
    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
