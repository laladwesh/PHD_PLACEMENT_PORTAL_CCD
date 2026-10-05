import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import Student from '@/lib/server/models/Student';
import Company from '@/lib/server/models/Company';
import PortalUser from '@/lib/server/models/PortalUser';
import { getSession } from '@/lib/server/session';
import { getUserFromToken } from '@/lib/server/auth';

export async function GET() {
  try {
    const session = await getSession();
    const userFromToken = await getUserFromToken();

    const role = session?.role || userFromToken?.role;
    const email = session?.email || (userFromToken?.user as any)?.email;
    const rollNumber = session?.rollNumber || (userFromToken?.user as any)?.rollNumber;
    const companyId = session?.companyId || userFromToken?.companyId;

    if (!role || (!email && !rollNumber && !companyId)) {
      return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
    }

    await connectToDatabase();

    // 1. Student Session: Fetch directly from MongoDB Student collection
    if (role === 'student') {
      const student = await Student.findOne({
        $or: [
          ...(email ? [{ email }] : []),
          ...(rollNumber ? [{ roll_number: rollNumber }] : []),
        ],
      }).lean();

      if (student) {
        return NextResponse.json({
          user: {
            email: student.email,
            name: student.name,
            role: 'student',
            rollNumber: student.roll_number,
            organization: student.academic_details?.major_department || 'IIT Guwahati',
            department: student.academic_details?.major_department || '',
            title: 'PhD Scholar',
            cpi: student.major_cpi,
            status: student.status,
            fee_paid: student.fee_paid,
            cv_verified: student.cv_verified,
          },
        });
      }
    }

    // 2. Company Session: Fetch directly from MongoDB Company collection
    if (role === 'company') {
      const company = await Company.findOne({
        $or: [
          ...(email ? [{ email }] : []),
          ...(companyId ? [{ _id: companyId }] : []),
        ],
      }).lean();

      if (company) {
        return NextResponse.json({
          user: {
            email: company.email,
            name: company.company_name,
            role: 'company',
            title: 'Company Recruiter',
            organization: company.company_name,
            companyId: String(company._id),
            rollNumber: null,
          },
        });
      }
    }

    // 3. Coordinator Session: Fetch directly from MongoDB PortalUser collection
    if (role === 'coordinator') {
      const portalUser = await PortalUser.findOne({ email }).lean();
      return NextResponse.json({
        user: {
          email: portalUser?.email || email || 'placement.head@iitg.ac.in',
          name: portalUser?.name || 'Placement Coordinator',
          role: 'coordinator',
          title: 'Placement Coordinator',
          organization: 'CCD - IIT Guwahati',
          rollNumber: null,
        },
      });
    }

    return NextResponse.json({ error: 'User record not found in database.' }, { status: 404 });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json({ error: 'Database session lookup failed.' }, { status: 500 });
  }
}
