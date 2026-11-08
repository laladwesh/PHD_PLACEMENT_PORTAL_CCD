import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import Company from '@/lib/server/models/Company';
import PortalUser from '@/lib/server/models/PortalUser';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { email, password, company, primaryContact, secondaryContact, agreedToPolicy } = body;
    
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !password || !company?.name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (normalizedEmail.endsWith('@iitg.ac.in')) {
      return NextResponse.json({
        error: 'IIT Guwahati email addresses (@iitg.ac.in) cannot be registered as corporate recruiter accounts.',
      }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    if (!agreedToPolicy) {
      return NextResponse.json({ error: 'You must agree to the placement policy to complete registration.' }, { status: 400 });
    }
    
    const existingCompany = await Company.findOne({
      $or: [{ email: normalizedEmail }, { company_name: company.name.trim() }],
    });
    if (existingCompany) {
      return NextResponse.json({
        error: existingCompany.email === normalizedEmail
          ? 'A company is already registered with this email address.'
          : 'A company with this name is already registered.',
      }, { status: 409 });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const newCompany = await Company.create({
      email: normalizedEmail,
      password: passwordHash,
      company_name: company.name.trim(),
      company_desc: company.description || '',
      company_desc_path: company.descriptionFile || '',
      industry_sec: company.industrySector || '',
      organization_type: company.organizationType || '',
      postal_address: company.postalAddress || '',
      website_url: company.website || '',
      first_point: primaryContact || {},
      second_point: secondaryContact || {},
    });

    await PortalUser.findOneAndUpdate(
      { email: normalizedEmail },
      { email: normalizedEmail, name: company.name.trim(), role: 'company', company: newCompany._id, active: true },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ message: 'Registration successful', companyId: newCompany._id }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
