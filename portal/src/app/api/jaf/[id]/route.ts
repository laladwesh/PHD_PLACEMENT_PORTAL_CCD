import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import Job from '@/lib/server/models/Job';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

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
        if (role === 'company') {
          if (!companyId) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
          query.companyId = companyId;
        }
        // Students only ever see approved JAFs.
        if (role === 'student') query.status = 'Approved';
        job = await Job.findOne(query).populate('companyId', 'company_name email website_url');
      } catch (dbErr) {
        console.warn('DB error fetching job:', dbErr);
      }
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
