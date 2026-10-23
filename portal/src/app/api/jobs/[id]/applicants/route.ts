import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import Job from '@/lib/server/models/Job';
import Student from '@/lib/server/models/Student';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const actor = await requireRole('coordinator', 'company');
  if (isAuthorizationError(actor)) return actor;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid job id.' }, { status: 400 });
  }

  const search = new URL(request.url).searchParams.get('search')?.trim().toLowerCase();
  await connectToDatabase();

  // `selectedStudents` is the canonical application relationship for JAFs
  // created through the multi-step form. Populate it explicitly with the
  // registered lowercase model name; the older Job schema used a different
  // legacy `cvs` structure and was the source of missing company applicants.
  const job = await Job.findById(id)
    .populate('companyId', 'company_name email')
    .populate({
      path: 'selectedStudents',
      model: 'student',
      select: 'roll_number name email major_cpi academic_details status cv_verified cv_flagged registration_complete jobs_applied linkedin_url portfolio_url google_scholar_url orcid_id cv.cv1 cv.cv2 cv.drive_Link thesis_title keywords',
    })
    .lean() as any;

  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

  const jobCompanyId = String(job.companyId?._id || job.companyId || '');
  if (actor.role === 'company') {
    if (!actor.companyId || jobCompanyId !== actor.companyId) {
      return NextResponse.json({ error: 'You do not have access to this job.' }, { status: 403 });
    }
  }

  // Student-side application records are included as a recovery path for
  // applications saved before the selectedStudents link was introduced or if
  // an earlier partial write left that array out of sync.
  const studentsWithApplication = await Student.find({ 'jobs_applied.job': job._id })
    .select('roll_number name email major_cpi academic_details status cv_verified cv_flagged registration_complete jobs_applied linkedin_url portfolio_url google_scholar_url orcid_id cv.cv1 cv.cv2 cv.drive_Link thesis_title keywords')
    .lean() as any[];

  const applicantsById = new Map<string, any>();
  for (const student of job.selectedStudents || []) {
    if (student?._id) applicantsById.set(String(student._id), student);
  }
  for (const student of studentsWithApplication) {
    applicantsById.set(String(student._id), student);
  }

  const applicants = [...applicantsById.values()].map((student) => {
    const application = (student.jobs_applied || []).find(
      (item: { job?: unknown }) => String(item.job) === String(job._id),
    );
    return {
      application_status: application?.status || 'none',
      profile: application?.profile || 'tech',
      student: {
        id: String(student._id),
        roll_number: student.roll_number,
        name: student.name,
        email: student.email,
        cpi: student.major_cpi,
        department: student.academic_details?.major_department || student.academic_details?.major_discipline || 'Not recorded',
        researchArea: student.academic_details?.major_discipline || 'Not recorded',
        thesisStatus: 'In progress',
        status: student.status,
        cv_verified: student.cv_verified,
        cv_flagged: student.cv_flagged,
        registration_complete: student.registration_complete,
        linkedin_url: student.linkedin_url || '',
        portfolio_url: student.portfolio_url || '',
        google_scholar_url: student.google_scholar_url || '',
        orcid_id: student.orcid_id || '',
        drive_link: student.cv?.drive_Link || '',
        thesis_title: student.thesis_title || '',
        keywords: student.keywords || [],
        // The two CVs. Open them with GET /api/students/<roll>/uploads/cv1 or cv2.
        has_one_page_cv: Boolean(student.cv?.cv1),
        has_detailed_cv: Boolean(student.cv?.cv2),
      },
    };
  });

  const filtered = search
    ? applicants.filter((item) =>
        `${item.student.name} ${item.student.roll_number} ${item.student.department}`.toLowerCase().includes(search),
      )
    : applicants;

  return NextResponse.json({
    job: {
      id: String(job._id),
      designation: job.jobDesignation || 'Research Scientist',
      company: job.companyId?.company_name || 'Organization',
      placeOfPosting: job.placeOfPosting || 'N/A',
      numOpenings: job.numOpenings || 0,
      salary: job.salary,
      status: job.status,
      applicationDeadline: job.applicationDeadline,
    },
    count: filtered.length,
    applicants: filtered,
  });
}
