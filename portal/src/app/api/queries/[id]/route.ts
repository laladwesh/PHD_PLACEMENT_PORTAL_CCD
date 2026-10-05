import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/server/mongodb';
import { getPortalIdentity } from '@/lib/server/identity';
import SupportQuery from '@/lib/server/models/SupportQuery';
import AuditEvent from '@/lib/server/models/AuditEvent';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const identity = await getPortalIdentity();
    if (identity.role !== 'coordinator') {
      return NextResponse.json({ error: 'Coordinator authorization required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    await connectToDatabase();

    const queryDoc = mongoose.isValidObjectId(id)
      ? await SupportQuery.findById(id)
      : await SupportQuery.findOne({ ticket_id: id });

    if (!queryDoc) {
      return NextResponse.json({ error: 'Query not found.' }, { status: 404 });
    }

    const allowedStatuses = new Set(['Pending', 'In Progress', 'Resolved', 'Closed']);
    const update: Record<string, unknown> = {};

    if (typeof body.status === 'string' && allowedStatuses.has(body.status)) {
      update.status = body.status;
      if (body.status === 'Resolved' || body.status === 'Closed') {
        update.resolved_by = identity.email;
        update.resolved_at = new Date();
      }
    }

    if (typeof body.response === 'string') {
      update.response = body.response.trim();
    }

    if (!Object.keys(update).length) {
      return NextResponse.json({ error: 'No valid update fields provided.' }, { status: 400 });
    }

    const updated = await SupportQuery.findByIdAndUpdate(
      queryDoc._id,
      { $set: update },
      { returnDocument: 'after' }
    );

    await AuditEvent.create({
      actor_email: identity.email,
      action: 'query.resolve',
      entity_type: 'support_query',
      entity_id: String(queryDoc._id),
      after: update,
    }).catch(() => {});

    return NextResponse.json({ query: updated });
  } catch (error) {
    console.error('Error updating support query:', error);
    return NextResponse.json({ error: 'Unable to update query.' }, { status: 500 });
  }
}
