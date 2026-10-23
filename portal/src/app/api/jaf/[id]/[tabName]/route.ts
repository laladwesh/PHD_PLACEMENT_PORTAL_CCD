import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import Job from '@/lib/server/models/Job';
import Discipline from '@/lib/server/models/Discipline';
import { buildEligibleProgrammes } from '@/lib/server/eligibleProgrammes';
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

    if (role === 'company' && job.status === 'Approved') {
      return NextResponse.json({ error: 'Approved JAFs can only be edited by a coordinator.' }, { status: 409 });
    }

    // Legacy records used this retired status. Saving them now brings them into
    // the current workflow without exposing a fifth status in the UI.
    if ((job.status as string) === 'Changes Requested') job.status = 'Unapproved';

    // Update specific section based on tabName
    switch (tabName) {
      case 'job-details':
        if (body.jobDesignation !== undefined) job.jobDesignation = body.jobDesignation;
        if (body.jobDescription !== undefined) job.jobDescription = body.jobDescription;
        if (body.placeOfPosting !== undefined) job.placeOfPosting = body.placeOfPosting;
        if (body.numOpenings !== undefined) job.numOpenings = body.numOpenings;
        if (body.dateOfJoining !== undefined) job.dateOfJoining = body.dateOfJoining;
        // The coordinator sets the application closing date while approving the JAF.
        // Recruiters may set the date of joining, but cannot open or close applications.
        break;

      case 'eligibility':
        // Programme rules (major/minor allowed + CPI cut-off per programme), as in the placement portal.
        if (body.eligible_programmes !== undefined) {
          const built = await buildEligibleProgrammes(body.eligible_programmes);
          if ('error' in built) return NextResponse.json({ error: built.error }, { status: 400 });
          job.eligible_programmes = built.rows as any;
          job.eligibility = built.legacy; // keeps the department list used by older screens in step
        } else if (body.eligibility !== undefined) {
          if (!Array.isArray(body.eligibility) || body.eligibility.length === 0) {
            return NextResponse.json({ error: 'Select at least one eligible programme.' }, { status: 400 });
          }

          const knownProgrammes = new Set(
            (await Discipline.find({}).select('name').lean()).map((discipline) => discipline.name),
          );
          const eligibility: Array<{ department: string; cpiCutoff: number }> = (body.eligibility as Array<{ department?: unknown; cpiCutoff?: unknown }>).map((criterion) => ({
            department: typeof criterion?.department === 'string' ? criterion.department.trim() : '',
            cpiCutoff: Number(criterion?.cpiCutoff),
          }));
          const invalid = eligibility.some(
            (criterion: { department: string; cpiCutoff: number }) =>
              !knownProgrammes.has(criterion.department) ||
              !Number.isFinite(criterion.cpiCutoff) ||
              criterion.cpiCutoff < 0 ||
              criterion.cpiCutoff > 10,
          );
          if (invalid) {
            return NextResponse.json({ error: 'Eligible programmes or CPI cut-offs are invalid.' }, { status: 400 });
          }
          job.eligibility = eligibility;
        }
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
          if (role === 'company' && body.agreedToTerms === true && job.status !== 'Approved') {
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
