import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import Job from '@/lib/server/models/Job';
import Company from '@/lib/server/models/Company';
import { getUserFromToken } from '@/lib/server/auth';
import { getSession } from '@/lib/server/session';

export async function GET() {
  try {
    await connectToDatabase();
    const session = await getSession();
    const userFromToken = await getUserFromToken();

    const role = session?.role || userFromToken?.role || 'coordinator';
    const companyId = session?.companyId || userFromToken?.companyId;

    let jobs: any[] = [];
    if (role === 'coordinator') {
      // Coordinator sees all jobs
      jobs = await Job.find({}).populate('companyId', 'company_name email website_url').sort({ createdAt: -1 });
    } else if (role === 'company') {
      if (companyId) {
        jobs = await Job.find({ companyId }).populate('companyId', 'company_name email website_url').sort({ createdAt: -1 });
      } else {
        // Fallback for demo company
        const defaultCompany = await Company.findOne({ email: 'recruiter@videotesting.com' });
        if (defaultCompany) {
          jobs = await Job.find({ companyId: defaultCompany._id }).populate('companyId', 'company_name email website_url').sort({ createdAt: -1 });
        } else {
          jobs = await Job.find({}).populate('companyId', 'company_name email website_url').sort({ createdAt: -1 });
        }
      }
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
  try {
    await connectToDatabase();
    const session = await getSession();
    const userFromToken = await getUserFromToken();
    const role = session?.role || userFromToken?.role;

    if (role === 'coordinator') {
      return NextResponse.json(
        { error: 'Coordinators cannot create Job Application Forms. JAF creation is restricted to recruiting companies.' },
        { status: 403 }
      );
    }

    if (role === 'student') {
      return NextResponse.json(
        { error: 'Students cannot create Job Application Forms.' },
        { status: 403 }
      );
    }

    let companyId: any = session?.companyId || userFromToken?.companyId;

    if (!companyId) {
      const defaultComp = await Company.findOne({});
      companyId = defaultComp?._id;
    }

    if (!companyId) {
      return NextResponse.json({ error: 'No company account found for creating JAF.' }, { status: 400 });
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
