import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import Programme from '@/lib/server/models/Programme';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

export async function GET() {
  const actor = await requireRole('coordinator', 'company', 'student');
  if (isAuthorizationError(actor)) return actor;
  try {
    await connectToDatabase();
    const programmes = await Programme.find({}).sort({ programme: 1, department: 1 }).lean();
    return NextResponse.json({ status: 'success', data: programmes });
  } catch (error) {
    console.error('Unable to load programmes:', error);
    return NextResponse.json({ error: 'Unable to load programmes.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const actor = await requireRole('coordinator');
  if (isAuthorizationError(actor)) return actor;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
  const programme = text(body.programme);
  const department = text(body.department);
  if (!programme || !department) {
    return NextResponse.json({ error: 'Programme and department are required.' }, { status: 400 });
  }
  if (!body.major && !body.minor) {
    return NextResponse.json({ error: 'A programme must be available as a major, a minor, or both.' }, { status: 400 });
  }
  try {
    await connectToDatabase();
    const created = await Programme.create({ programme, department, major: Boolean(body.major), minor: Boolean(body.minor) });
    return NextResponse.json({ status: 'success', data: created }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) return NextResponse.json({ error: 'That programme and department already exist.' }, { status: 409 });
    console.error('Unable to add programme:', error);
    return NextResponse.json({ error: 'Unable to add programme.' }, { status: 400 });
  }
}
