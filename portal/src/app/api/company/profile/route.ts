import { jwtSecret } from '@/lib/server/secrets';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/server/mongodb';
import Company from '@/lib/server/models/Company';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded: any = jwt.verify(token, jwtSecret());
    
    if (!decoded || !decoded.companyId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const company = await Company.findById(decoded.companyId);
    
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    // Omit password and sensitive keys before returning
    const profile = company.toObject();
    delete profile.password;
    delete profile.token;
    delete profile.seckey;
    
    return NextResponse.json({ profile }, { status: 200 });
  } catch (error: any) {
    console.error('Profile error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
