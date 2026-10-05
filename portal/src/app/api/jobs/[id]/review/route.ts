import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Jobs } from '@/models';
import AuditEvent from '@/lib/server/models/AuditEvent';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

type RouteContext = { params: Promise<{ id: string }> };
const transitions: Record<string, Set<string>> = {
  Unapproved: new Set(['Approved', 'Changes Requested', 'Rejected']),
  'Changes Requested': new Set(['Approved', 'Rejected', 'Changes Requested']),
  Incomplete: new Set(['Approved', 'Changes Requested', 'Rejected']),
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const actor = await requireRole('coordinator');
  if (isAuthorizationError(actor)) return actor;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid job id.' }, { status: 400 });
  const body = await request.json() as { action?: string; feedback?: string };
  const status = body.action === 'approve' ? 'Approved' : body.action === 'request_changes' ? 'Changes Requested' : body.action === 'reject' ? 'Rejected' : null;
  const feedback = typeof body.feedback === 'string' ? body.feedback.trim() : '';
  if (!status) return NextResponse.json({ error: 'Choose approve, request_changes, or reject.' }, { status: 400 });
  if ((status === 'Changes Requested' || status === 'Rejected') && !feedback) return NextResponse.json({ error: 'Feedback is required for this review decision.' }, { status: 400 });
  if (feedback.length > 2000) return NextResponse.json({ error: 'Feedback must be 2000 characters or fewer.' }, { status: 400 });
  await connectToDatabase();
  const job = await Jobs.findById(id).select('status feedback').lean();
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  if (!transitions[job.status]?.has(status)) return NextResponse.json({ error: `A ${job.status} JAF cannot be moved to ${status}.` }, { status: 409 });
  const updated = await Jobs.findByIdAndUpdate(id, { $set: { status, feedback: status === 'Approved' ? '' : feedback } }, { new: true, runValidators: true }).lean();
  await AuditEvent.create({ actor_email: actor.email, action: `job.review.${body.action}`, entity_type: 'job', entity_id: id, before: { status: job.status, feedback: job.feedback }, after: { status: updated?.status, feedback: updated?.feedback } });
  return NextResponse.json({ success: true, data: updated });
}
