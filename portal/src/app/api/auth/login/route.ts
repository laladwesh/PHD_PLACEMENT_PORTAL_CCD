import { jwtSecret } from '@/lib/server/secrets';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/server/mongodb';
import Company from '@/lib/server/models/Company';
import { createSessionCookie, getSession } from '@/lib/server/session';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: rawEmail, password, role: requestedRole } = body;

    const email = (rawEmail || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Please enter an email address.' }, { status: 400 });
    }

    // Direct bypass prevention: IITG scholars and coordinators MUST use Azure SSO
    if (email.endsWith('@iitg.ac.in') || requestedRole === 'student' || requestedRole === 'coordinator') {
      return NextResponse.json({
        error: 'IIT Guwahati students and coordinators must sign in via the Microsoft Azure Single Sign-On button.',
      }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required for corporate recruiter accounts.' }, { status: 400 });
    }

    await connectToDatabase();
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      path: '/',
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    };

    // Check Company in database
    const company = await Company.findOne({ email });

    if (!company) {
      return NextResponse.json({ error: 'Recruiter account not found. Please register or contact CCD.' }, { status: 401 });
    }

    if (!company.password) {
      return NextResponse.json({ error: 'Recruiter account has no password set. Please contact CCD.' }, { status: 401 });
    }

    let isValid = false;
    try {
      isValid = await bcrypt.compare(password, company.password);
    } catch {
      isValid = false;
    }

    // Support legacy plaintext password upgrade
    if (!isValid && company.password === password) {
      isValid = true;
      try {
        const upgraded = await bcrypt.hash(password, 10);
        await Company.updateOne({ _id: company._id }, { $set: { password: upgraded } });
      } catch (upgradeErr) {
        console.error('Failed to upgrade plaintext password to bcrypt hash:', upgradeErr);
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid recruiter password.' }, { status: 401 });
    }

    const profile = {
      role: 'company' as const,
      name: company.company_name,
      title: 'Company Recruiter',
      email: company.email,
      organization: company.company_name,
      companyId: String(company._id),
    };

    const token = jwt.sign(
      { role: 'company', email: company.email, companyId: String(company._id), user: profile },
      jwtSecret(),
      { expiresIn: '30d' }
    );

    cookieStore.set('token', token, { ...cookieOptions, httpOnly: true });
    cookieStore.set('user_role', 'company', { ...cookieOptions, httpOnly: false });
    cookieStore.set('user_profile', JSON.stringify(profile), { ...cookieOptions, httpOnly: false });
    cookieStore.set(createSessionCookie({
      email: profile.email,
      name: profile.name,
      role: 'company',
      rollNumber: null,
      companyId: String(company._id),
    }));

    return NextResponse.json({
      message: 'Login successful',
      role: 'company',
      user: profile,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (session) {
      return NextResponse.json({
        activeRole: session.role,
        user: {
          email: session.email,
          name: session.name,
          role: session.role,
          rollNumber: session.rollNumber,
        },
      }, { status: 200 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
      try {
        const decoded = jwt.verify(token, jwtSecret()) as any;
        return NextResponse.json({
          activeRole: decoded.role,
          user: decoded.user,
        }, { status: 200 });
      } catch {}
    }

    return NextResponse.json({ activeRole: null, user: null }, { status: 401 });
  } catch (error: any) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
