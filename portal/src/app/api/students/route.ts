import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Student from '@/lib/server/models/Student';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

export async function GET(request: NextRequest) {
  const actor = await requireRole('coordinator');
  if (isAuthorizationError(actor)) return actor;
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const review = searchParams.get('review');
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 25)));
    const query: Record<string, unknown> = {};
    if (review === 'pending') query.cv_verified = false;
    if (review === 'flagged') query.cv_flagged = true;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { roll_number: Number(search) || -1 }];
    const [students, count] = await Promise.all([
      Student.find(query).select('roll_number name email major_cpi academic_details status cv_verified cv_flagged fee_paid fee_remaining registration_complete cv').sort({ roll_number: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Student.countDocuments(query),
    ]);
    return NextResponse.json({ count, page, limit, students });
  } catch (error) {
    console.error('Unable to load students:', error);
    return NextResponse.json({ error: 'Student service is unavailable.' }, { status: 503 });
  }
}
