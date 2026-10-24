import { NextRequest, NextResponse } from 'next/server';
import Admin, { ADMIN_ROLES } from '@/lib/server/models/Admin';
import AuditEvent from '@/lib/server/models/AuditEvent';
import { adminDto, adminErrorResponse, isActorError, pickAdminFields, requireAdminActor } from '@/lib/server/adminAccess';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/administrators?search=&role=&active=true|false&page=&limit=
// Any signed-in coordinator may read the administrator directory.
export async function GET(request: NextRequest) {
  const actor = await requireAdminActor();
  if (isActorError(actor)) return actor;

  const params = new URL(request.url).searchParams;
  const query: Record<string, unknown> = {};

  const role = params.get('role');
  if (role) {
    if (!(ADMIN_ROLES as readonly string[]).includes(role)) return NextResponse.json({ error: 'Unknown role.' }, { status: 400 });
    query.role = role;
  }
  const active = params.get('active');
  if (active === 'true' || active === 'false') query.active = active === 'true';

  const search = params.get('search')?.trim();
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ name: pattern }, { email: pattern }, { employee_id: pattern }];
  }

  const page = Math.max(1, Number(params.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(params.get('limit') || 50)));

  try {
    const [admins, count] = await Promise.all([
      Admin.find(query).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Admin.countDocuments(query),
    ]);
    return NextResponse.json({ count, page, limit, admins: admins.map(adminDto) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

// POST /api/administrators: add an administrator. Super admins only.
export async function POST(request: NextRequest) {
  const actor = await requireAdminActor({ superOnly: true });
  if (isActorError(actor)) return actor;

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Send the administrator details as JSON.' }, { status: 400 });

  const { set } = pickAdminFields(body, true);
  if (!set.name || !set.email) return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });

  try {
    const created = await Admin.create(set);
    await AuditEvent.create({ actor_email: actor.email, action: 'admin.create', entity_type: 'admin', entity_id: String(created._id), after: adminDto(created.toObject()) });
    return NextResponse.json({ admin: adminDto(created.toObject()) }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
