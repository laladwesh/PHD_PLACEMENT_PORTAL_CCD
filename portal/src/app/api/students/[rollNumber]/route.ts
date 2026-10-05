import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Student from '@/lib/server/models/Student';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

type RouteContext = { params: Promise<{ rollNumber: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const actor = await requireRole('coordinator');
  if (isAuthorizationError(actor)) return actor;
  const rollNumber = Number((await params).rollNumber);
  if (!Number.isSafeInteger(rollNumber) || rollNumber <= 0) return NextResponse.json({ error: 'Invalid roll number.' }, { status: 400 });
  await connectToDatabase();
  const student = await Student.findOne({ roll_number: rollNumber }).lean();
  if (!student) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
  return NextResponse.json({ student });
}
