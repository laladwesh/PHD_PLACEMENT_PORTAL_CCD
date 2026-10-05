import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import Job from '@/lib/server/models/Job';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

export async function GET() {
  const actor = await requireRole('coordinator', 'company', 'student');
  if (isAuthorizationError(actor)) return actor;
  try {
    await connectToDatabase();
    const role = actor.role;
    const companyId = actor.companyId;

    let jobs: any[] = [];
    if (role === 'coordinator') {
      // Coordinator sees all jobs
      jobs = await Job.find({}).populate('companyId', 'company_name email website_url').sort({ createdAt: -1 });
    } else if (role === 'company') {
      jobs = companyId
        ? await Job.find({ companyId }).populate('companyId', 'company_name email website_url').sort({ createdAt: -1 })
        : [];
    } else if (role === 'student') {
      // Student sees approved jobs
      jobs = await Job.find({ status: 'Approved' }).populate('companyId', 'company_name email website_url').sort({ createdAt: -1 });
    } else {
      jobs = await Job.find({ status: 'Approved' }).populate('companyId', 'company_name email website_url').sort({ createdAt: -1 });
    }



    // Attach company name to each job object for frontend mapping
    const enrichedJobs = jobs.map((j) => {
      const doc = j.toObject ? j.toObject() : { ...j };
      const companyObj = doc.companyId && typeof doc.companyId === 'object' ? doc.companyId : null;
      return {
        ...doc,
        company: companyObj?.company_name || doc.companyName || 'Company',
      };
    });

    return NextResponse.json({ jobs: enrichedJobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST() {
  const actor = await requireRole('company');
  if (isAuthorizationError(actor)) return actor;
  try {
    await connectToDatabase();
    const companyId = actor.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Your recruiter account is not linked to a company.' }, { status: 403 });
    }

    const job = new Job({
      companyId: companyId as any,
      status: 'Incomplete',
    });

    await job.save();

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
