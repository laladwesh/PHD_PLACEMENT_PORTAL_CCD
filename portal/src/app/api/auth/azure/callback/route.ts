import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { exchangeAuthorizationCode, validateIdToken } from '@/lib/server/azureAd';
import { createSessionCookie } from '@/lib/server/session';
import { connectToDatabase } from '@/lib/server/mongodb';
import PortalUser from '@/lib/server/models/PortalUser';
import Student from '@/lib/server/models/Student';
import jwt from 'jsonwebtoken';

const OAUTH_COOKIE = 'azure_oauth';

function same(value: string, expected: string) {
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const returnUrl = new URL('/phdplacement/auth', request.url);
  const fail = (reason: string) => NextResponse.redirect(new URL(`?error=${encodeURIComponent(reason)}`, returnUrl));
  const error = request.nextUrl.searchParams.get('error');
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');

  if (error || !code || !state) return fail(error || 'Azure sign-in was cancelled.');

  try {
    const rawCookie = request.cookies.get(OAUTH_COOKIE)?.value;
    if (!rawCookie) return fail('Sign-in session expired. Please sign in again.');
    const oauth = JSON.parse(rawCookie) as { state: string; nonce: string; verifier: string };
    if (!same(state, oauth.state)) return fail('Invalid sign-in state. Please try again.');

    // Official Microsoft ID token validation
    const claims = await validateIdToken(await exchangeAuthorizationCode(code, oauth.verifier), oauth.nonce);
    const email = (claims.preferred_username || claims.email || '').trim().toLowerCase();
    let name = claims.name || email.split('@')[0];

    if (!email.endsWith('@iitg.ac.in')) return fail('Only official @iitg.ac.in Microsoft accounts are permitted.');

    await connectToDatabase();
    let user = await PortalUser.findOne({ email, active: true }).lean();
    const bootstrapCoordinators = (process.env.AZURE_COORDINATOR_EMAILS || 'placement.head@iitg.ac.in,amitk@iitg.ac.in')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    let role: 'coordinator' | 'student' = 'student';
    let rollNumber: number | null = null;

    // Determine if Coordinator or Student
    if (user?.role === 'coordinator' || bootstrapCoordinators.includes(email) || email.startsWith('placement')) {
      role = 'coordinator';
      if (!user) {
        user = await PortalUser.create({ email, name: name || 'Placement Coordinator', role: 'coordinator' });
      }
    } else {
      role = 'student';
      let student = await Student.findOne({ email }).lean();
      if (!student) {
        // Auto-provision student so legitimate IITG scholars can access the registration steps
        const digitsMatch = email.match(/\d{7,9}/);
        rollNumber = digitsMatch ? parseInt(digitsMatch[0], 10) : 216101001;
        student = await Student.create({
          roll_number: rollNumber,
          name: name,
          email: email,
          gender: 'Male',
          nationality: 'Indian',
          fee_paid: true,
          cv_verified: false,
          status: 'Sitting_Intern',
          registration_complete: false,
        });
      } else {
        rollNumber = student.roll_number;
        name = student.name || name;
      }

      if (!user) {
        user = await PortalUser.create({ email, name: student.name, role: 'student' });
      }
    }

    const profile = {
      role,
      name: user.name || name,
      title: role === 'coordinator' ? 'Placement Coordinator' : 'PhD Scholar',
      email: user.email,
      organization: role === 'coordinator' ? 'CCD - IIT Guwahati' : 'IIT Guwahati',
      rollNumber,
    };

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      path: '/',
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: 30 * 24 * 60 * 60,
    };

    const response = NextResponse.redirect(new URL('/phdplacement/dashboard', request.url));

    // 1. Server-side session cookie (tamper-proof HMAC)
    response.cookies.set(createSessionCookie({
      email: user.email,
      name: profile.name,
      role: profile.role,
      rollNumber: rollNumber,
      companyId: user.company ? String(user.company) : null,
    }));

    // 2. Client-side user_role cookie
    response.cookies.set('user_role', profile.role, { ...cookieOptions, httpOnly: false });

    // 3. Client-side user_profile cookie
    response.cookies.set('user_profile', JSON.stringify(profile), { ...cookieOptions, httpOnly: false });

    // 4. JWT token cookie
    const token = jwt.sign(
      { role: profile.role, email: user.email, user: profile },
      process.env.JWT_SECRET || 'secret-fallback',
      { expiresIn: '30d' }
    );
    response.cookies.set('token', token, { ...cookieOptions, httpOnly: true });

    response.cookies.delete(OAUTH_COOKIE);
    return response;
  } catch (caught) {
    console.error('Azure sign-in failed:', caught);
    return fail('Azure sign-in could not be completed.');
  }
}
