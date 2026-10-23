import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import Admin from '@/lib/server/models/Admin';
import AuditEvent from '@/lib/server/models/AuditEvent';
import { adminDto, adminErrorResponse, isActorError, pickAdminFields, requireAdminActor } from '@/lib/server/adminAccess';

type RouteContext = { params: Promise<{ id: string }> };

async function loadTarget(id: string) {
  if (!mongoose.isValidObjectId(id)) return { error: NextResponse.json({ error: 'Invalid administrator id.' }, { status: 400 }) };
  const admin = await Admin.findById(id).lean();
  if (!admin) return { error: NextResponse.json({ error: 'Administrator not found.' }, { status: 404 }) };
  return { admin };
}

// GET /api/admin/:id
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const actor = await requireAdminActor();
  if (isActorError(actor)) return actor;
  const target = await loadTarget((await params).id);
  if ('error' in target) return target.error;
  return NextResponse.json({ admin: adminDto(target.admin as never) });
}

// PATCH /api/admin/:id: edit details, role or access. Super admins only.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const actor = await requireAdminActor({ superOnly: true });
  if (isActorError(actor)) return actor;
  const target = await loadTarget((await params).id);
  if ('error' in target) return target.error;

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Send the changes as JSON.' }, { status: 400 });

  const { set, unset } = pickAdminFields(body, true);
  if (!Object.keys(set).length && !Object.keys(unset).length) {
    return NextResponse.json({ error: 'No editable administrator fields were provided.' }, { status: 400 });
  }

  // A super admin cannot cut off or downgrade their own access (they could lock themselves out of this API).
  const isSelf = String(target.admin.email).toLowerCase() === actor.email;
  if (isSelf && (set.active === false || (set.role && set.role !== target.admin.role) || (set.email && set.email !== target.admin.email))) {
    return NextResponse.json({ error: 'You cannot deactivate, demote or re-email your own administrator account.' }, { status: 400 });
  }

  try {
    const update: Record<string, unknown> = {};
    if (Object.keys(set).length) update.$set = set;
    if (Object.keys(unset).length) update.$unset = unset;
    const updated = await Admin.findByIdAndUpdate(target.admin._id, update, { new: true, runValidators: true }).lean();
    await AuditEvent.create({ actor_email: actor.email, action: 'admin.update', entity_type: 'admin', entity_id: String(target.admin._id), before: adminDto(target.admin as never), after: adminDto(updated as never) });
    return NextResponse.json({ admin: adminDto(updated as never) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

// DELETE /api/admin/:id: deactivate (the record is kept so history and audit trails stay intact). Super admins only.
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const actor = await requireAdminActor({ superOnly: true });
  if (isActorError(actor)) return actor;
  const target = await loadTarget((await params).id);
  if ('error' in target) return target.error;

  if (String(target.admin.email).toLowerCase() === actor.email) {
    return NextResponse.json({ error: 'You cannot deactivate your own administrator account.' }, { status: 400 });
  }

  const updated = await Admin.findByIdAndUpdate(target.admin._id, { $set: { active: false } }, { new: true }).lean();
  await AuditEvent.create({ actor_email: actor.email, action: 'admin.deactivate', entity_type: 'admin', entity_id: String(target.admin._id), before: adminDto(target.admin as never), after: adminDto(updated as never) });
  return NextResponse.json({ admin: adminDto(updated as never) });
}
