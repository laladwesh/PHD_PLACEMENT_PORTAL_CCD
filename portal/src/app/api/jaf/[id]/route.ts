import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import Job from '@/lib/server/models/Job';
import { getUserFromToken } from '@/lib/server/auth';
import { getSession } from '@/lib/server/session';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const user = await getUserFromToken();

    const role = session?.role || user?.role || 'coordinator';
    const companyId = session?.companyId || user?.companyId;

    let job: any = null;

    if (mongoose.isValidObjectId(id)) {
      try {
        await connectToDatabase();
        let query: Record<string, any> = { _id: id };
        if (role === 'company' && companyId) {
          query.companyId = companyId;
        }
        job = await Job.findOne(query).populate('companyId', 'company_name email website_url');
      } catch (dbErr) {
        console.warn('DB error fetching job:', dbErr);
      }
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
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
