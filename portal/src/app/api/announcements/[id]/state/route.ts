import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { getPortalIdentity } from '@/lib/server/identity';
import { getOrCreateStudent } from '@/lib/server/studentRepository';
import Student from '@/lib/server/models/Student';
import Announcement from '@/lib/server/models/Announcement';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const identity = await getPortalIdentity();
  if (identity.role !== 'student' || !identity.rollNumber) {
    return NextResponse.json({ error: 'Student access required.' }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid announcement.' }, { status: 400 });

  try {
    const student = await getOrCreateStudent(identity);
    const announcement = await Announcement.findOne({ _id: id, status: 'published' }).select('_id').lean();
    if (!announcement) return NextResponse.json({ error: 'Announcement not found.' }, { status: 404 });
    const body = await request.json() as { saved?: unknown; read?: unknown };
    const addToSet: Record<string, unknown> = {};
    const pull: Record<string, unknown> = {};

    if (typeof body.saved === 'boolean') (body.saved ? addToSet : pull).savedAnnouncements = announcement._id;
    if (typeof body.read === 'boolean') (body.read ? addToSet : pull).readAnnouncements = announcement._id;
    const update: Record<string, unknown> = {};
    if (Object.keys(addToSet).length) update.$addToSet = addToSet;
    if (Object.keys(pull).length) update.$pull = pull;
    if (!Object.keys(update).length) return NextResponse.json({ error: 'Provide saved or read state.' }, { status: 400 });

    await Student.updateOne({ _id: student._id }, update);
    return NextResponse.json({ saved: body.saved, read: body.read });
  } catch (error) {
    console.error('Unable to update announcement state:', error);
    return NextResponse.json({ error: 'Unable to update announcement.' }, { status: 500 });
  }
}