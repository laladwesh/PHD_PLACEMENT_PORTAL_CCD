import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import Job from '@/lib/server/models/Job';
import Student from '@/lib/server/models/Student';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';
import Programme from '@/lib/server/models/Programme';
import { ELIGIBILITY_STUDENT_FIELDS, evaluateJafEligibility } from '@/lib/server/jafEligibility';

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
        let student: any = null;
        if (role === 'company') {
          if (!companyId) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
          query.companyId = companyId;
        }
        // Students only ever see approved JAFs for their own programme.
        if (role === 'student') {
          if (!actor.rollNumber) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
          student = await Student.findOne({ roll_number: actor.rollNumber })
            .select(`${ELIGIBILITY_STUDENT_FIELDS} jobs_applied`)
            .lean();
          if (!student) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
          const appliedJobIds = (student.jobs_applied || []).map((application: { job?: unknown }) => application.job);
          query.status = 'Approved';
          query.$or = [
            { applicationDeadline: { $gt: new Date() } },
            { _id: { $in: appliedJobIds } },
          ];
        }
        void Programme; // make sure the `programmes` model is registered for populate
        job = await Job.findOne(query)
          .populate('companyId', 'company_name email website_url')
          .populate({ path: 'eligible_programmes.programme', select: 'programme discipline department major minor' });

        if (job && role === 'student') {
          const hasApplied = (student.jobs_applied || []).some(
            (application: { job?: unknown }) => String(application.job) === String(job._id),
          );
          if (!hasApplied && !evaluateJafEligibility(job.toObject(), student).eligible) job = null;
        }
      } catch (dbErr) {
        console.warn('DB error fetching job:', dbErr);
      }
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status === 'Changes Requested') job.status = 'Unapproved';
    if (job.status === 'Complete') job.status = 'Incomplete';

    const jobResponse = job.toObject();
    // Intake targets are internal recruitment information and are not disclosed to students.
    if (role === 'student') delete jobResponse.numOpenings;

    return NextResponse.json({ job: jobResponse });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
