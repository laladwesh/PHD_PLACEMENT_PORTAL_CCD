import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Jobs } from '@/models';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

const statuses = new Set(['Complete', 'Incomplete', 'Approved', 'Unapproved', 'Changes Requested', 'Rejected']);

function jobDto(job: any) {
  const company = job.company && typeof job.company === 'object' ? job.company : null;
  return {
    _id: String(job._id), status: job.status, application_deadline: job.application_deadline,
    job_designation: job.job_designation, job_description: job.job_description,
    place_of_posting: job.place_of_posting, num_openings: job.num_openings,
    bond: job.bond, bond_details: job.bond_details, eligibility: job.eligibility,
    eligible_programmes: job.eligible_programmes, salary: job.salary,
    selection_process: job.selection_process, feedback: job.feedback,
    cvs: job.cvs, createdAt: job.createdAt, updatedAt: job.updatedAt,
    company: company ? {
      _id: String(company._id), company_name: company.company_name, email: company.email,
      website_url: company.website_url, first_point: company.first_point, second_point: company.second_point,
    } : null,
  };
}

export async function GET(request: NextRequest) {
  const actor = await requireRole('coordinator', 'company');
  if (isAuthorizationError(actor)) return actor;
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 25)));
    const query: Record<string, unknown> = {};
    if (status && statuses.has(status) && status !== 'all') query.status = status;
    if (search) query.$or = [
      { job_designation: { $regex: search, $options: 'i' } },
      { job_description: { $regex: search, $options: 'i' } },
      { place_of_posting: { $regex: search, $options: 'i' } },
    ];
    if (actor.role === 'company' && actor.companyId) query.company = actor.companyId;
    const [jobs, count] = await Promise.all([
      Jobs.find(query).populate('company').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Jobs.countDocuments(query),
    ]);
    return NextResponse.json({ success: true, count, page, limit, data: jobs.map(jobDto) });
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json({ success: false, error: 'Unable to load job applications.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const actor = await requireRole('company');
  if (isAuthorizationError(actor)) return actor;
  if (!actor.companyId) return NextResponse.json({ error: 'Your recruiter account is not linked to a company.' }, { status: 403 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const designation = typeof body.job_designation === 'string' ? body.job_designation.trim() : '';
    const description = typeof body.job_description === 'string' ? body.job_description.trim() : '';
    const place = typeof body.place_of_posting === 'string' ? body.place_of_posting.trim() : '';
    const openings = Number(body.num_openings);
    if (!designation || !description || !place || !Number.isSafeInteger(openings) || openings < 1) {
      return NextResponse.json({ error: 'Designation, description, posting location, and a positive number of openings are required.' }, { status: 400 });
    }
    await connectToDatabase();
    const job = await Jobs.create({
      company: actor.companyId, job_designation: designation, job_description: description,
      place_of_posting: place, num_openings: openings, application_deadline: body.application_deadline,
      eligibility: body.eligibility, eligible_programmes: body.eligible_programmes,
      salary: body.salary, selection_process: body.selection_process, bond: body.bond,
      bond_details: body.bond_details, additional: body.additional, status: 'Unapproved',
    });
    const populated = await Jobs.findById(job._id).populate('company').lean();
    return NextResponse.json({ success: true, data: jobDto(populated) }, { status: 201 });
  } catch (error) {
    console.error('Failed to create job:', error);
    return NextResponse.json({ success: false, error: 'Unable to create job application.' }, { status: 400 });
  }
}
