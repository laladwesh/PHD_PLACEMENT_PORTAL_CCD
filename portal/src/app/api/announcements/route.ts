import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import { getPortalIdentity } from '@/lib/server/identity';
import { getOrCreateStudent } from '@/lib/server/studentRepository';
import Announcement from '@/lib/server/models/Announcement';

const categories = new Set(['Job Alert', 'General', 'Important', 'Event']);
const audiences = new Set(['all_students', 'eligible_students']);
export async function GET() {
  const identity = await getPortalIdentity();
  if (identity.role !== 'student' && identity.role !== 'coordinator') {
    return NextResponse.json({ error: 'Portal access required.' }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const now = new Date();
    const student = identity.role === 'student' ? await getOrCreateStudent(identity) : null;
    const query = student
      ? {
          status: 'published',
          publish_at: { $lte: now },
          $and: [
            { $or: [{ expires_at: null }, { expires_at: { $gt: now } }] },
            { $or: [{ audience: 'all_students' }, { audience: 'eligible_students', min_cpi: { $lte: student.major_cpi ?? 0 } }] },
          ],
        }
      : {};
    const announcements = await Announcement.find(query).sort({ publish_at: -1, createdAt: -1 }).lean();

    if (!student) return NextResponse.json({ announcements });
    const saved = new Set((student.savedAnnouncements ?? []).map(String));
    const read = new Set((student.readAnnouncements ?? []).map(String));
    return NextResponse.json({
      announcements: announcements.map((announcement) => ({
        ...announcement,
        is_saved: saved.has(String(announcement._id)),
        is_read: read.has(String(announcement._id)),
      })),
    });
  } catch (error) {
    console.error('Unable to load announcements:', error);
    return NextResponse.json({ error: 'Announcement service is unavailable.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const identity = await getPortalIdentity();
  if (identity.role !== 'coordinator') {
    return NextResponse.json({ error: 'Coordinator access required.' }, { status: 403 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const category = typeof body.category === 'string' ? body.category : 'General';
    const audience = typeof body.audience === 'string' ? body.audience : 'all_students';
    const minCpi = body.min_cpi === undefined || body.min_cpi === '' ? undefined : Number(body.min_cpi);
    const link = typeof body.link === 'string' ? body.link.trim() : '';
    const linkLabel = typeof body.link_label === 'string' ? body.link_label.trim() : '';
    const status = body.status === 'draft' ? 'draft' : 'published';
    const publishAt = body.publish_at ? new Date(String(body.publish_at)) : new Date();
    const expiresAt = body.expires_at ? new Date(String(body.expires_at)) : undefined;

    if (!title || title.length > 120 || !message || message.length > 3000) {
      return NextResponse.json({ error: 'Enter a title (max 120 characters) and message (max 3000 characters).' }, { status: 400 });
    }
    if (!categories.has(category) || !audiences.has(audience)) {
      return NextResponse.json({ error: 'Choose a valid category and audience.' }, { status: 400 });
    }
    if (audience === 'eligible_students' && (!Number.isFinite(minCpi) || minCpi! < 0 || minCpi! > 10)) {
      return NextResponse.json({ error: 'Set a minimum CPI from 0 to 10 for eligible-student announcements.' }, { status: 400 });
    }
    if (Number.isNaN(publishAt.getTime()) || (expiresAt && Number.isNaN(expiresAt.getTime()))) {
      return NextResponse.json({ error: 'Enter valid publication and expiry dates.' }, { status: 400 });
    }
    if (expiresAt && expiresAt <= publishAt) {
      return NextResponse.json({ error: 'Expiry must be after the publication date.' }, { status: 400 });
    }
    if (link) {
      try {
        const parsedLink = new URL(link);
        if (parsedLink.protocol !== 'https:' && parsedLink.protocol !== 'http:') throw new Error('Unsupported link protocol.');
      } catch {
        return NextResponse.json({ error: 'Enter a valid http or https link.' }, { status: 400 });
      }
    }

    await connectToDatabase();
    const announcement = await Announcement.create({
      title,
      message,
      category,
      audience,
      min_cpi: minCpi,
      link,
      link_label: linkLabel,
      publish_at: publishAt,
      expires_at: expiresAt,
      status,
      created_by: identity.email,
    });
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error('Unable to create announcement:', error);
    return NextResponse.json({ error: 'Unable to create announcement.' }, { status: 500 });
  }
}
