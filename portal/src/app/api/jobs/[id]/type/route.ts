import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Jobs } from '@/models';
import AuditEvent from '@/lib/server/models/AuditEvent';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/jobs/<id>/type  { "is_placement_job": true | false }
// Only a coordinator decides whether a JAF is a placement job or an internship job. Companies cannot.
// Applications already made are not touched; the rule applies to new applications and to who can see the JAF.
export async function PATCH(request: Request, { params }: RouteContext) {
  const actor = await requireRole('coordinator');
  if (isAuthorizationError(actor)) return actor;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid job id.' }, { status: 400 });

  const body = await request.json().catch(() => null) as { is_placement_job?: unknown } | null;
  if (!body || typeof body.is_placement_job !== 'boolean') {
    return NextResponse.json({ error: 'Send is_placement_job as true (placement job) or false (internship job).' }, { status: 400 });
  }

  await connectToDatabase();
  const before = await Jobs.findById(id).select('is_placement_job').lean() as { is_placement_job?: boolean } | null;
  if (!before) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

  const updated = await Jobs.findByIdAndUpdate(id, { $set: { is_placement_job: body.is_placement_job } }, { new: true }).lean() as { is_placement_job?: boolean } | null;
  await AuditEvent.create({
    actor_email: actor.email, action: 'job.type.update', entity_type: 'job', entity_id: id,
    before: { is_placement_job: Boolean(before.is_placement_job) }, after: { is_placement_job: Boolean(updated?.is_placement_job) },
  });
  return NextResponse.json({ success: true, is_placement_job: Boolean(updated?.is_placement_job) });
}
