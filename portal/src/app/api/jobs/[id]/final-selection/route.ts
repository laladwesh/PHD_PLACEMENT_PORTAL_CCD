import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Jobs, Student } from '@/models';
import AuditEvent from '@/lib/server/models/AuditEvent';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const actor = await requireRole('coordinator');
  if (isAuthorizationError(actor)) return actor;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid job id.' }, { status: 400 });
  await connectToDatabase();
  const job = await Jobs.findById(id).select('oa_round.final_selection').populate('oa_round.final_selection.selected_candidates.student', 'roll_number name email').lean();
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  return NextResponse.json({ final_selection: job.oa_round?.final_selection || {} });
}

export async function POST(request: Request, { params }: RouteContext) {
  const actor = await requireRole('coordinator');
  if (isAuthorizationError(actor)) return actor;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid job id.' }, { status: 400 });
  const body = await request.json() as { student_ids?: unknown };
  const ids = Array.isArray(body.student_ids) ? body.student_ids.map(String) : [];
  if (!ids.length || new Set(ids).size !== ids.length || ids.some((value) => !mongoose.isValidObjectId(value))) return NextResponse.json({ error: 'Provide unique valid applicant IDs.' }, { status: 400 });
  await connectToDatabase();
  // Read lean and write with an atomic update: JAFs created through the multi-step form store some
  // fields (e.g. eligibility) in a shape this schema cannot hydrate, so loading a full document throws.
  const job = await Jobs.findById(id).select('cvs oa_round.final_selection').lean() as any;
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  const applicantIds = new Set((job.cvs || []).map((item: any) => String(item.student)));
  if (ids.some((studentId) => !applicantIds.has(studentId))) return NextResponse.json({ error: 'Every selected student must be an applicant.' }, { status: 400 });
  const students = await Student.find({ _id: { $in: ids } }).select('_id email roll_number status').lean();
  if (students.length !== ids.length) return NextResponse.json({ error: 'Every selected student must be an applicant.' }, { status: 400 });
  if (students.some((student: any) => student.status === 'Blocked' || student.status === 'Placed_Intern')) return NextResponse.json({ error: 'Placed or blocked students cannot be selected.' }, { status: 409 });
  const candidates = students.map((student: any) => ({ student: student._id, email: student.email, roll_number: String(student.roll_number) }));
  const finalSelection = { ...(job.oa_round?.final_selection || {}), selected_candidates: candidates, uploaded_at: new Date(), uploaded_by: { role: 'coordinator', name: actor.name } };
  await Jobs.updateOne({ _id: id }, { $set: { 'oa_round.final_selection': finalSelection } });
  await AuditEvent.create({ actor_email: actor.email, action: 'job.final_selection.submit', entity_type: 'job', entity_id: id, after: { student_ids: ids } });
  return NextResponse.json({ success: true, count: candidates.length, final_selection: finalSelection });
}
