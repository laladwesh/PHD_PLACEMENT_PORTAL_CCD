import { NextRequest, NextResponse } from 'next/server';
import Admin from '@/lib/server/models/Admin';
import AuditEvent from '@/lib/server/models/AuditEvent';
import { adminDto, adminErrorResponse, isActorError, pickAdminFields, requireAdminActor } from '@/lib/server/adminAccess';

// GET /api/administrators/me: the signed-in coordinator's own administrator profile (null if they have none yet).
export async function GET() {
  const actor = await requireAdminActor();
  if (isActorError(actor)) return actor;
  const admin = await Admin.findOne({ email: actor.email }).lean();
  return NextResponse.json({
    admin: admin ? adminDto(admin as never) : null,
    isSuperAdmin: actor.isSuper,
    session: { email: actor.session.email, name: actor.session.name },
  });
}

// PATCH /api/administrators/me: update your own contact details (name, designation, department, phone).
// Role, access and email can only be changed by a super admin through /api/administrators/:id.
export async function PATCH(request: NextRequest) {
  const actor = await requireAdminActor();
  if (isActorError(actor)) return actor;

  const existing = await Admin.findOne({ email: actor.email, active: true }).lean();
  if (!existing) {
    return NextResponse.json({ error: 'There is no administrator profile for your account yet. Ask a super admin to add one.' }, { status: 404 });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Send the changes as JSON.' }, { status: 400 });

  const { set, unset } = pickAdminFields(body, false);
  delete set.employee_id;
  delete unset.employee_id;
  if (!Object.keys(set).length && !Object.keys(unset).length) {
    return NextResponse.json({ error: 'No editable contact details were provided.' }, { status: 400 });
  }

  try {
    const update: Record<string, unknown> = {};
    if (Object.keys(set).length) update.$set = set;
    if (Object.keys(unset).length) update.$unset = unset;
    const updated = await Admin.findByIdAndUpdate(existing._id, update, { new: true, runValidators: true }).lean();
    await AuditEvent.create({ actor_email: actor.email, action: 'admin.update_self', entity_type: 'admin', entity_id: String(existing._id), before: adminDto(existing as never), after: adminDto(updated as never) });
    return NextResponse.json({ admin: adminDto(updated as never) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
