import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Jobs } from '@/models';
import Offer from '@/lib/server/models/Offer';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

export async function GET(request: NextRequest) {
  const actor = await requireRole('coordinator', 'company');
  if (isAuthorizationError(actor)) return actor;
  await connectToDatabase();
  const status = new URL(request.url).searchParams.get('status');
  const query: Record<string, unknown> = status ? { status } : {};
  if (actor.role === 'company' && actor.companyId) query.company = actor.companyId;
  const offers = await Offer.find(query).populate('student', 'roll_number name academic_details major_cpi').populate('company', 'company_name').populate('job', 'job_designation').sort({ createdAt: -1 }).lean();
  return NextResponse.json({ offers });
}

export async function POST(request: NextRequest) {
  const actor = await requireRole('company');
  if (isAuthorizationError(actor)) return actor;
  if (!actor.companyId) return NextResponse.json({ error: 'Your recruiter account is not linked to a company.' }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const jobId = typeof body.job_id === 'string' ? body.job_id : '';
  const studentId = typeof body.student_id === 'string' ? body.student_id : '';
  const ctc = typeof body.ctc === 'string' ? body.ctc.trim() : '';
  const deadline = body.response_deadline ? new Date(String(body.response_deadline)) : null;
  if (!mongoose.isValidObjectId(jobId) || !mongoose.isValidObjectId(studentId) || !ctc || !deadline || Number.isNaN(deadline.getTime())) return NextResponse.json({ error: 'Job, student, CTC, and a valid response deadline are required.' }, { status: 400 });
  await connectToDatabase();
  // companyId is not in the Jobs schema, so Mongoose will not cast it for us.
  const companyObjectId = new mongoose.Types.ObjectId(actor.companyId);
  const job: any = await Jobs.findOne({ _id: jobId, $or: [{ company: companyObjectId }, { companyId: companyObjectId }], 'cvs.student': studentId }).lean();
  if (!job) return NextResponse.json({ error: 'The selected student is not an applicant for your job.' }, { status: 403 });
  try {
    const offer = await Offer.create({ job: jobId, company: actor.companyId, student: studentId, designation: job.job_designation || job.jobDesignation || 'Role', ctc, base_salary: typeof body.base_salary === 'string' ? body.base_salary.trim() : '', offered_at: body.offered_at ? new Date(String(body.offered_at)) : new Date(), response_deadline: deadline });
    return NextResponse.json({ offer }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) return NextResponse.json({ error: 'An offer already exists for this student and job.' }, { status: 409 });
    return NextResponse.json({ error: 'Unable to create offer.' }, { status: 400 });
  }
}
