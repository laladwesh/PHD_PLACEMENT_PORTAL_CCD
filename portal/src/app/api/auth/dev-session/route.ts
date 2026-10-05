import { publicUrl } from '@/lib/server/publicUrl';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import Student from '@/lib/server/models/Student';
import Company from '@/lib/server/models/Company';
import PortalUser from '@/lib/server/models/PortalUser';
import { createSessionCookie } from '@/lib/server/session';
import type { UserRole } from '@/lib/types';
import jwt from 'jsonwebtoken';
import { jwtSecret } from '@/lib/server/secrets';

type DevProfile = {
  role: UserRole;
  name: string;
  title: string;
  email: string;
  organization: string;
  rollNumber: number | null;
  companyId: string | null;
};

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Development session helper is disabled in production.' }, { status: 403 });
  }

  const role = (request.nextUrl.searchParams.get('role') || 'student') as UserRole;
  const requestedEmail = request.nextUrl.searchParams.get('email');
  const requestedRoll = request.nextUrl.searchParams.get('rollNumber');

  await connectToDatabase();

  let profile: DevProfile | null = null;

  if (role === 'student') {
    const studentQuery: Record<string, unknown> = {};
    if (requestedRoll) studentQuery.roll_number = parseInt(requestedRoll, 10);
    else if (requestedEmail) studentQuery.email = requestedEmail.toLowerCase();

    const student = await Student.findOne(studentQuery).sort({ roll_number: 1 }).lean();
    if (!student) {
      return NextResponse.json({ error: 'No student record found in database.' }, { status: 404 });
    }

    profile = {
      role: 'student',
      name: student.name,
      title: 'PhD Scholar',
      email: student.email,
      organization: student.academic_details?.major_department || 'IIT Guwahati',
      rollNumber: student.roll_number,
      companyId: null,
    };
  } else if (role === 'company') {
    const companyQuery: Record<string, unknown> = {};
    if (requestedEmail) companyQuery.email = requestedEmail.toLowerCase();

    const company = await Company.findOne(companyQuery).sort({ createdAt: 1 }).lean();
    if (!company) {
      return NextResponse.json({ error: 'No company record found in database.' }, { status: 404 });
    }

    profile = {
      role: 'company',
      name: company.company_name,
      title: 'Company Recruiter',
      email: company.email,
      organization: company.company_name,
      rollNumber: null,
      companyId: String(company._id),
    };
  } else if (role === 'coordinator') {
    const coordQuery: Record<string, unknown> = { role: 'coordinator' };
    if (requestedEmail) coordQuery.email = requestedEmail.toLowerCase();

    const coordinator = await PortalUser.findOne(coordQuery).lean();
    profile = {
      role: 'coordinator',
      name: coordinator?.name || 'Placement Coordinator',
      title: 'Placement Coordinator',
      email: coordinator?.email || 'placement.head@iitg.ac.in',
      organization: 'CCD - IIT Guwahati',
      rollNumber: null,
      companyId: null,
    };
  }

  if (!profile) {
    return NextResponse.json({ error: 'Invalid role requested.' }, { status: 400 });
  }

  const isProduction = false;
  const cookieOptions = {
    path: '/',
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60,
  };

  const response = NextResponse.redirect(publicUrl(request, '/phdplacement/dashboard'));

  // 1. HMAC-signed server session cookie
  response.cookies.set(createSessionCookie({
    email: profile.email,
    name: profile.name,
    role: profile.role,
    rollNumber: profile.rollNumber,
    companyId: profile.companyId,
  }));

  // 2. Client-side readable role & profile
  response.cookies.set('user_role', profile.role, { ...cookieOptions, httpOnly: false });
  response.cookies.set('user_profile', JSON.stringify(profile), { ...cookieOptions, httpOnly: false });

  // 3. JWT token cookie
  const token = jwt.sign(
    { role: profile.role, email: profile.email, user: profile, companyId: profile.companyId },
    jwtSecret(),
    { expiresIn: '30d' }
  );
  response.cookies.set('token', token, { ...cookieOptions, httpOnly: true });

  return response;
}
