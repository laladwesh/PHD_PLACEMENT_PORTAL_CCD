import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Jobs } from '@/models';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

type RouteContext = { params: Promise<{ id: string }> };
const editable = new Set(['job_designation', 'job_description', 'place_of_posting', 'num_openings', 'application_deadline', 'eligibility', 'eligible_programmes', 'salary', 'selection_process', 'bond', 'bond_details', 'additional']);

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const actor = await requireRole('coordinator', 'company');
  if (isAuthorizationError(actor)) return actor;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid job id.' }, { status: 400 });
  await connectToDatabase();
  const job = await Jobs.findById(id).populate('company').lean();
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  if (actor.role === 'company' && String((job.company as any)?._id) !== actor.companyId) return NextResponse.json({ error: 'You do not have access to this job.' }, { status: 403 });
  return NextResponse.json({ success: true, data: job });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const actor = await requireRole('coordinator', 'company');
  if (isAuthorizationError(actor)) return actor;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid job id.' }, { status: 400 });
  const body = await request.json() as Record<string, unknown>;
  const update = Object.fromEntries(Object.entries(body).filter(([key]) => editable.has(key)));
  if (!Object.keys(update).length) return NextResponse.json({ error: 'No editable job fields were supplied.' }, { status: 400 });
  await connectToDatabase();
  const existing = await Jobs.findById(id).select('company status').lean();
  if (!existing) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  if (actor.role === 'company' && String(existing.company) !== actor.companyId) return NextResponse.json({ error: 'You do not have access to this job.' }, { status: 403 });
  if (actor.role === 'company' && existing.status === 'Approved') return NextResponse.json({ error: 'Approved JAFs can only be changed through CCD review.' }, { status: 409 });
  const job = await Jobs.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).populate('company').lean();
  return NextResponse.json({ success: true, data: job });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const actor = await requireRole('coordinator');
  if (isAuthorizationError(actor)) return actor;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid job id.' }, { status: 400 });
  await connectToDatabase();
  const deleted = await Jobs.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  return NextResponse.json({ success: true });
}
