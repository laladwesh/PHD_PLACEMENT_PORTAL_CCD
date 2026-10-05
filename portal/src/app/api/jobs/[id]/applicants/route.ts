import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Jobs, Company } from '@/models';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const actor = await requireRole('coordinator', 'company');
  if (isAuthorizationError(actor)) return actor;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid job id.' }, { status: 400 });
  const search = new URL(request.url).searchParams.get('search')?.trim().toLowerCase();
  await connectToDatabase();
  const job = await Jobs.findById(id)
    .populate({
      path: 'cvs.student',
      select: 'roll_number name email major_cpi academic_details status cv_verified cv_flagged registration_complete research_area thesis_status placed_at',
    })
    .populate('company', 'company_name email')
    .lean();
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

  if (actor.role === 'company' && actor.companyId) {
    const jobCompanyId = String((job.company as any)?._id || (job as any).companyId || job.company);
    if (jobCompanyId !== actor.companyId) {
      return NextResponse.json({ error: 'You do not have access to this job.' }, { status: 403 });
    }
  }

  // JAFs created through the multi-step form store the owner as companyId, not company.
  let companyName = (job.company as any)?.company_name;
  if (!companyName && (job as any).companyId) {
    companyName = (await Company.findById((job as any).companyId).select('company_name').lean() as any)?.company_name;
  }

  const applicants = (job.cvs || []).map((application: any) => ({
    application_status: application.status,
    profile: application.type,
    student: application.student ? {
      id: String(application.student._id),
      roll_number: application.student.roll_number,
      name: application.student.name,
      email: application.student.email,
      cpi: application.student.major_cpi,
      department: application.student.academic_details?.major_department || 'Computer Science and Engineering',
      researchArea: application.student.research_area || application.student.academic_details?.major_discipline || 'Applied Machine Learning & Distributed Systems',
      thesisStatus: application.student.thesis_status || 'Pre-Synopsis Complete',
      status: application.student.status,
      cv_verified: application.student.cv_verified,
      cv_flagged: application.student.cv_flagged,
      registration_complete: application.student.registration_complete,
      placedAt: application.student.placed_at ? { company: application.student.placed_at } : undefined,
    } : null,
  })).filter((application: any) => application.student);

  const filtered = search ? applicants.filter((item: any) => `${item.student.name} ${item.student.roll_number} ${item.student.department}`.toLowerCase().includes(search)) : applicants;

  return NextResponse.json({
    job: {
      id: String(job._id),
      designation: job.job_designation || (job as any).jobDesignation || 'Research Scientist',
      company: companyName || 'Organization',
      placeOfPosting: job.place_of_posting || (job as any).placeOfPosting || 'N/A',
      numOpenings: job.num_openings || (job as any).numOpenings || 0,
      salary: job.salary,
      status: job.status,
      applicationDeadline: job.application_deadline || (job as any).applicationDeadline,
    },
    count: filtered.length,
    applicants: filtered,
  });
}
