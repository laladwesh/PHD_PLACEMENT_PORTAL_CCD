import { NextResponse } from 'next/server';
import { connectToDatabase } from './mongodb';
import Admin from './models/Admin';
import { isAuthorizationError, requireRole } from './authorization';
import type { PortalSession } from './session';

/** Coordinators named in AZURE_COORDINATOR_EMAILS. They always count as super admins, so the portal can never be locked out. */
export function bootstrapCoordinatorEmails(): string[] {
  return (process.env.AZURE_COORDINATOR_EMAILS || 'placement.head@iitg.ac.in,amitk@iitg.ac.in')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export type AdminActor = {
  session: PortalSession;
  email: string;
  isSuper: boolean;
  admin: { _id: unknown; role: string } | null;
};

/**
 * Everyone using /api/admin must be a signed-in coordinator. With `superOnly`, they must also be a
 * super admin (an active super_admin record, or listed in AZURE_COORDINATOR_EMAILS).
 */
export async function requireAdminActor(options: { superOnly?: boolean } = {}): Promise<AdminActor | NextResponse> {
  const session = await requireRole('coordinator');
  if (isAuthorizationError(session)) return session;

  await connectToDatabase();
  const email = session.email.trim().toLowerCase();
  const admin = await Admin.findOne({ email, active: true }).select('role').lean() as { _id: unknown; role: string } | null;
  const isSuper = bootstrapCoordinatorEmails().includes(email) || admin?.role === 'super_admin';

  if (options.superOnly && !isSuper) {
    return NextResponse.json({ error: 'Only a super admin can manage administrators.' }, { status: 403 });
  }
  return { session, email, isSuper, admin };
}

export function isActorError(value: AdminActor | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

type AdminLike = {
  _id?: unknown; name?: string; email?: string; employee_id?: string; designation?: string;
  department?: string; phone?: string; role?: string; active?: boolean; last_login_at?: Date | null;
  createdAt?: Date; updatedAt?: Date;
};

export function adminDto(doc: AdminLike) {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    employee_id: doc.employee_id ?? null,
    designation: doc.designation,
    department: doc.department,
    phone: doc.phone ?? null,
    role: doc.role,
    active: doc.active,
    last_login_at: doc.last_login_at ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : undefined);

/**
 * Picks the editable fields out of a request body. Optional text fields that arrive blank are cleared.
 * `access` fields (email, role, active) are only read when `allowAccess` is set.
 */
export function pickAdminFields(body: Record<string, unknown>, allowAccess: boolean) {
  const set: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};

  const name = text(body.name);
  if (name !== undefined) set.name = name;

  for (const key of ['employee_id', 'designation', 'department', 'phone'] as const) {
    const value = text(body[key]);
    if (value === undefined) continue;
    if (value === '') unset[key] = 1;
    else set[key] = value;
  }

  if (allowAccess) {
    const email = text(body.email);
    if (email !== undefined) set.email = email.toLowerCase();
    if (typeof body.role === 'string') set.role = body.role;
    if (typeof body.active === 'boolean') set.active = body.active;
  }
  return { set, unset };
}

/** Turns a Mongoose validation/duplicate error into a response. */
export function adminErrorResponse(error: unknown) {
  const e = error as { name?: string; code?: number; keyPattern?: Record<string, unknown>; errors?: Record<string, { message: string }> };
  if (e?.code === 11000) {
    const field = Object.keys(e.keyPattern || {})[0] || 'value';
    return NextResponse.json({ error: `An administrator with this ${field.replace('_', ' ')} already exists.` }, { status: 409 });
  }
  if (e?.name === 'ValidationError' && e.errors) {
    return NextResponse.json({ error: Object.values(e.errors).map((item) => item.message).join(' ') }, { status: 400 });
  }
  console.error('Admin API error:', error);
  return NextResponse.json({ error: 'Unable to process the administrator request.' }, { status: 500 });
}
