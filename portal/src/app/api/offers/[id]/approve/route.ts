import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Jobs } from '@/models';
import Student from '@/lib/server/models/Student';
import Offer from '@/lib/server/models/Offer';
import AuditEvent from '@/lib/server/models/AuditEvent';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const actor = await requireRole('coordinator');
  if (isAuthorizationError(actor)) return actor;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid offer id.' }, { status: 400 });
  const body = await request.json().catch(() => ({})) as { notes?: unknown };
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  await connectToDatabase();
  const dbSession = await mongoose.startSession();
  try {
    let approved: any;
    await dbSession.withTransaction(async () => {
      const offer = await Offer.findOneAndUpdate({ _id: id, status: 'received' }, { $set: { status: 'approved_restricted', approved_by: actor.email, approved_at: new Date(), coordinator_notes: notes } }, { new: true, session: dbSession });
      if (!offer) throw new Error('Offer is not available for approval.');
      const student = await Student.findOneAndUpdate({ _id: offer.student, status: { $ne: 'Placed_Intern' } }, { $set: { status: 'Placed_Intern', job_placed: offer.job }, $pull: { shortListedCompanies: { $ne: offer.job } } }, { new: true, session: dbSession });
      if (!student) throw new Error('Student is already placed or unavailable.');
      await Jobs.updateMany({ _id: { $ne: offer.job }, 'cvs.student': student._id }, { $set: { 'cvs.$[application].status': 'rejected' } }, { arrayFilters: [{ 'application.student': student._id }], session: dbSession });
      await AuditEvent.create([{ actor_email: actor.email, action: 'offer.approve_and_restrict', entity_type: 'offer', entity_id: id, after: { student_id: String(student._id), job_id: String(offer.job) } }], { session: dbSession });
      approved = offer;
    });
    return NextResponse.json({ offer: approved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to approve offer.';
    return NextResponse.json({ error: message }, { status: message.includes('transaction') ? 503 : 409 });
  } finally {
    await dbSession.endSession();
  }
}
