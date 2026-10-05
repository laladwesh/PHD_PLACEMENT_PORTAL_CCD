import mongoose, { type ClientSession } from 'mongoose';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Jobs } from '@/models';
import Student from '@/lib/server/models/Student';
import Offer from '@/lib/server/models/Offer';
import AuditEvent from '@/lib/server/models/AuditEvent';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

type RouteContext = { params: Promise<{ id: string }> };

class ApprovalError extends Error {}

// Approve the offer, mark the student placed, and reject their other applications.
// Runs inside a transaction when MongoDB supports it (replica set); on a standalone
// mongod it runs the same steps one by one and undoes them if a later step fails.
async function approve(id: string, actorEmail: string, notes: string, session?: ClientSession) {
  const opts = session ? { session } : {};
  const offer = await Offer.findOneAndUpdate(
    { _id: id, status: 'received' },
    { $set: { status: 'approved_restricted', approved_by: actorEmail, approved_at: new Date(), coordinator_notes: notes } },
    { new: true, ...opts },
  );
  if (!offer) throw new ApprovalError('Offer is not available for approval.');

  const undoOffer = () => Offer.updateOne({ _id: id }, { $set: { status: 'received', approved_by: '', coordinator_notes: '' }, $unset: { approved_at: 1 } });

  try {
    const student = await Student.findOneAndUpdate(
      { _id: offer.student, status: { $ne: 'Placed_Intern' } },
      { $set: { status: 'Placed_Intern', job_placed: offer.job }, $pull: { shortListedCompanies: { $ne: offer.job } } },
      { new: true, ...opts },
    );
    if (!student) throw new ApprovalError('Student is already placed or unavailable.');

    await Jobs.updateMany(
      { _id: { $ne: offer.job }, 'cvs.student': student._id },
      { $set: { 'cvs.$[application].status': 'rejected' } },
      { arrayFilters: [{ 'application.student': student._id }], ...opts },
    );
    await AuditEvent.create(
      [{ actor_email: actorEmail, action: 'offer.approve_and_restrict', entity_type: 'offer', entity_id: id, after: { student_id: String(student._id), job_id: String(offer.job) } }],
      opts,
    );
  } catch (error) {
    if (!session) await undoOffer();
    throw error;
  }
  return offer;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const actor = await requireRole('coordinator');
  if (isAuthorizationError(actor)) return actor;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid offer id.' }, { status: 400 });
  const body = await request.json().catch(() => ({})) as { notes?: unknown };
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  await connectToDatabase();

  try {
    let approved: any;
    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        approved = await approve(id, actor.email, notes, dbSession);
      });
    } catch (error) {
      // Standalone MongoDB (no replica set) cannot run transactions.
      const message = error instanceof Error ? error.message : '';
      if (error instanceof ApprovalError || !/Transaction numbers|replica set|retryable writes|not supported/i.test(message)) throw error;
      approved = await approve(id, actor.email, notes);
    } finally {
      await dbSession.endSession();
    }
    return NextResponse.json({ offer: approved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to approve offer.';
    console.error('Offer approval failed:', error);
    return NextResponse.json({ error: message }, { status: error instanceof ApprovalError ? 409 : 500 });
  }
}
