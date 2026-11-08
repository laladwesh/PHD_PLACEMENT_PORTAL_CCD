import { jwtSecret } from '@/lib/server/secrets';
import { publicUrl } from '@/lib/server/publicUrl';
import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { exchangeAuthorizationCode, iitgTenantId, validateIdToken } from '@/lib/server/azureAd';
import { createSessionCookie } from '@/lib/server/session';
import { connectToDatabase } from '@/lib/server/mongodb';
import PortalUser from '@/lib/server/models/PortalUser';
import Student from '@/lib/server/models/Student';
import Admin from '@/lib/server/models/Admin';
import { bootstrapCoordinatorEmails } from '@/lib/server/adminAccess';
import jwt from 'jsonwebtoken';

const OAUTH_COOKIE = 'azure_oauth';

function same(value: string, expected: string) {
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const returnUrl = publicUrl(request, '/phdplacement/auth');
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
    const isIitgAccount = (value: string) => value.endsWith('@iitg.ac.in');
    // preferred_username is the sign-in name Microsoft verified. The `email` claim is only used as a
    // fallback for IIT Guwahati accounts; it is never trusted for accounts from other domains.
    const verifiedName = (claims.preferred_username || '').trim().toLowerCase();
    const email = verifiedName || (claims.email || '').trim().toLowerCase();
    let name = claims.name || email.split('@')[0];
    const iitg = isIitgAccount(email);

    if (!email) return fail('Your Microsoft account did not return an email address.');
    // @iitg.ac.in addresses are only valid when the token really comes from the IIT Guwahati tenant.
    if (iitg && (claims.tid || '').toLowerCase() !== iitgTenantId()) {
      return fail('Only official @iitg.ac.in Microsoft accounts are permitted.');
    }
    if (!iitg && !verifiedName) return fail('Your Microsoft account could not be verified.');

    await connectToDatabase();
    let user = await PortalUser.findOne({ email, active: true }).lean();
    const bootstrapCoordinators = bootstrapCoordinatorEmails();
    // An active administrator record (see /api/administrators) also grants coordinator access.
    const admin = await Admin.findOne({ email, active: true }).lean() as { _id: unknown; name?: string; designation?: string } | null;

    const isCoordinator =
      user?.role === 'coordinator' ||
      Boolean(admin) ||
      bootstrapCoordinators.includes(email) ||
      (iitg && email.startsWith('placement'));

    // Students must be IIT Guwahati accounts; any other domain needs a coordinator registration.
    if (!iitg && !isCoordinator) {
      return fail('Only official @iitg.ac.in Microsoft accounts are permitted. Coordinators with other addresses must be registered by CCD.');
    }

    let role: 'coordinator' | 'student' = 'student';
    let rollNumber: number | null = null;

    // Determine if Coordinator or Student
    if (isCoordinator) {
      role = 'coordinator';
      if (!user) {
        user = await PortalUser.create({ email, name: admin?.name || name || 'Placement Coordinator', role: 'coordinator' });
      }
      if (admin) await Admin.updateOne({ _id: admin._id }, { $set: { last_login_at: new Date() } });
    } else {
      role = 'student';
      let student = await Student.findOne({ email }).lean();
      if (!student) {
        // Auto-provision student so legitimate IITG scholars can access the registration steps
        // The roll number can only be derived from emails that contain it. Never fall back to a
        // shared placeholder: every such scholar would collide on the same unique roll number.
        const digitsMatch = email.match(/\d{7,9}/);
        if (!digitsMatch) {
          return fail('Your account is not in the student database yet. Please contact CCD to be added.');
        }
        rollNumber = parseInt(digitsMatch[0], 10);
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
      name: (role === 'coordinator' && admin?.name) || user.name || name,
      title: role === 'coordinator' ? (admin?.designation || 'Placement Coordinator') : 'PhD Scholar',
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

    const response = NextResponse.redirect(publicUrl(request, '/phdplacement/dashboard'));

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
      jwtSecret(),
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
