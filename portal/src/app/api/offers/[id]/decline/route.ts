import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
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
  const offer = await Offer.findOneAndUpdate({ _id: id, status: 'received' }, { $set: { status: 'declined', declined_by: actor.email, declined_at: new Date(), coordinator_notes: notes } }, { new: true }).lean();
  if (!offer) return NextResponse.json({ error: 'Offer is not available to decline.' }, { status: 409 });
  await AuditEvent.create({ actor_email: actor.email, action: 'offer.decline', entity_type: 'offer', entity_id: id, after: { notes } });
  return NextResponse.json({ offer });
}
