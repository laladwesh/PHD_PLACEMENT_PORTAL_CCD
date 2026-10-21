import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import Job from '@/lib/server/models/Job';
import Student from '@/lib/server/models/Student';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';
import { isStudentInEligibleProgramme } from '@/lib/server/jafEligibility';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await requireRole('coordinator', 'company', 'student');
  if (isAuthorizationError(actor)) return actor;
  try {
    const { id } = await params;
    const role = actor.role;
    const companyId = actor.companyId;

    let job: any = null;

    if (mongoose.isValidObjectId(id)) {
      try {
        await connectToDatabase();
        let query: Record<string, any> = { _id: id };
        if (role === 'company') {
          if (!companyId) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
          query.companyId = companyId;
        }
        // Students only ever see approved JAFs for their own programme.
        if (role === 'student') {
          query.status = 'Approved';
          query.applicationDeadline = { $gt: new Date() };
        }
        job = await Job.findOne(query).populate('companyId', 'company_name email website_url');

        if (job && role === 'student') {
          if (!actor.rollNumber) job = null;
          else {
            const student = await Student.findOne({ roll_number: actor.rollNumber })
              .select('academic_details')
              .lean();
            if (!student || !isStudentInEligibleProgramme(job.toObject(), student)) job = null;
          }
        }
      } catch (dbErr) {
        console.warn('DB error fetching job:', dbErr);
      }
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
