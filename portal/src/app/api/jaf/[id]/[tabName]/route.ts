import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import Job from '@/lib/server/models/Job';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tabName: string }> }
) {
  const actor = await requireRole('company', 'coordinator');
  if (isAuthorizationError(actor)) return actor;
  try {
    await connectToDatabase();
    const role = actor.role;
    const companyId = actor.companyId;

    const { id, tabName } = await params;
    const body = await req.json();

    let query: Record<string, any> = { _id: id };
    if (role === 'company') {
      if (!companyId) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      query.companyId = companyId;
    }

    const job = await Job.findOne(query);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Update specific section based on tabName
    switch (tabName) {
      case 'job-details':
        if (body.jobDesignation !== undefined) job.jobDesignation = body.jobDesignation;
        if (body.jobDescription !== undefined) job.jobDescription = body.jobDescription;
        if (body.placeOfPosting !== undefined) job.placeOfPosting = body.placeOfPosting;
        if (body.numOpenings !== undefined) job.numOpenings = body.numOpenings;
        if (body.dateOfJoining !== undefined) job.dateOfJoining = body.dateOfJoining;
        if (body.applicationDeadline !== undefined) job.applicationDeadline = body.applicationDeadline;
        break;

      case 'eligibility':
        if (body.eligibility !== undefined) job.eligibility = body.eligibility;
        if (body.allowBacklog !== undefined) job.allowBacklog = body.allowBacklog;
        if (body.academicEligibility !== undefined) job.academicEligibility = body.academicEligibility;
        break;

      case 'salary':
        if (body.salary !== undefined) job.salary = body.salary;
        break;

      case 'selection':
        if (body.selectionProcess !== undefined) job.selectionProcess = body.selectionProcess;
        break;

      case 'bond':
        if (body.bondDetails !== undefined) job.bondDetails = body.bondDetails;
        break;

      case 'additional':
        if (body.additionalRequirements !== undefined) job.additionalRequirements = body.additionalRequirements;
        if (body.agreedToTerms !== undefined) {
          job.agreedToTerms = body.agreedToTerms;
          if (body.agreedToTerms === true) {
            job.status = 'Unapproved';
          }
        }
        if (body.policyVersion !== undefined) job.policyVersion = body.policyVersion;
        break;

      default:
        return NextResponse.json({ error: 'Invalid tab name' }, { status: 400 });
    }

    await job.save();

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error updating job tab:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
