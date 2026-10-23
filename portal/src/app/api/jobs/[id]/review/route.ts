import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Jobs } from '@/models';
import AuditEvent from '@/lib/server/models/AuditEvent';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

type RouteContext = { params: Promise<{ id: string }> };
const transitions: Record<string, Set<string>> = {
  Unapproved: new Set(['Approved', 'Rejected']),
  Incomplete: new Set(['Approved', 'Rejected']),
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const actor = await requireRole('coordinator');
  if (isAuthorizationError(actor)) return actor;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid job id.' }, { status: 400 });
  let body: { action?: string; feedback?: string; applicationDeadline?: string };
  try {
    body = await request.json() as { action?: string; feedback?: string; applicationDeadline?: string };
  } catch {
    return NextResponse.json({ error: 'Review data must be valid JSON.' }, { status: 400 });
  }
  const status = body.action === 'approve' ? 'Approved' : body.action === 'reject' ? 'Rejected' : null;
  const feedback = typeof body.feedback === 'string' ? body.feedback.trim() : '';
  if (!status) return NextResponse.json({ error: 'Choose approve or reject.' }, { status: 400 });
  if (status === 'Rejected' && !feedback) return NextResponse.json({ error: 'Feedback is required for this review decision.' }, { status: 400 });
  if (feedback.length > 2000) return NextResponse.json({ error: 'Feedback must be 2000 characters or fewer.' }, { status: 400 });

  let applicationDeadline: Date | undefined;
  if (status === 'Approved') {
    const dateOnly = typeof body.applicationDeadline === 'string' ? body.applicationDeadline.trim() : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      return NextResponse.json({ error: 'An application closing date is required to approve a JAF.' }, { status: 400 });
    }
    const [year, month, day] = dateOnly.split('-').map(Number);
    applicationDeadline = new Date(year, month - 1, day, 23, 59, 59, 999);
    if (
      applicationDeadline.getFullYear() !== year ||
      applicationDeadline.getMonth() !== month - 1 ||
      applicationDeadline.getDate() !== day ||
      applicationDeadline <= new Date()
    ) {
      return NextResponse.json({ error: 'The application closing date must be a valid future date.' }, { status: 400 });
    }
  }
  await connectToDatabase();
  const job = await Jobs.findById(id).select('status feedback').lean();
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  const currentStatus = job.status === 'Changes Requested'
    ? 'Unapproved'
    : job.status === 'Complete'
      ? 'Incomplete'
      : job.status;
  if (!transitions[currentStatus]?.has(status)) return NextResponse.json({ error: `A ${currentStatus} JAF cannot be moved to ${status}.` }, { status: 409 });
  const update = {
    status,
    feedback: status === 'Approved' ? '' : feedback,
    ...(applicationDeadline ? { applicationDeadline, application_deadline: applicationDeadline } : {}),
  };
  const updated = await Jobs.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
  await AuditEvent.create({ actor_email: actor.email, action: `job.review.${body.action}`, entity_type: 'job', entity_id: id, before: { status: job.status, feedback: job.feedback }, after: { status: updated?.status, feedback: updated?.feedback, applicationDeadline: updated?.applicationDeadline } });
  return NextResponse.json({ success: true, data: updated });
}
