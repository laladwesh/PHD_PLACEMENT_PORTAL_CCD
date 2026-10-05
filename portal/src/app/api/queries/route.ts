import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import { getPortalIdentity } from '@/lib/server/identity';
import SupportQuery from '@/lib/server/models/SupportQuery';
import AuditEvent from '@/lib/server/models/AuditEvent';

export async function GET(request: NextRequest) {
  try {
    const identity = await getPortalIdentity();
    if (!identity.role || !identity.email) {
      return NextResponse.json({ error: 'Authentication required to view queries.' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const filter: Record<string, unknown> = {};

    // Coordinators see all queries; students and companies only see their own
    if (identity.role !== 'coordinator') {
      filter.user_email = identity.email.toLowerCase();
    }

    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    const roleParam = searchParams.get('user_role') || searchParams.get('role');
    if (roleParam && roleParam !== 'all' && identity.role === 'coordinator') {
      filter.user_role = roleParam;
    }

    const queries = await SupportQuery.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ queries });
  } catch (error) {
    console.error('Error fetching support queries:', error);
    return NextResponse.json({ error: 'Unable to load queries from database.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await getPortalIdentity();
    if (!identity.role || !identity.email) {
      return NextResponse.json({ error: 'Authentication required to submit queries.' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const category = typeof body.category === 'string' ? body.category.trim() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const query = typeof body.query === 'string' ? body.query.trim() : '';

    if (!category || !subject || !query) {
      return NextResponse.json(
        { error: 'Category, subject, and query description are required.' },
        { status: 400 }
      );
    }

    if (subject.length > 200) {
      return NextResponse.json(
        { error: 'Subject must be 200 characters or fewer.' },
        { status: 400 }
      );
    }

    if (query.length > 3000) {
      return NextResponse.json(
        { error: 'Query description must be 3000 characters or fewer.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Generate unique human-readable ticket ID
    const year = new Date().getFullYear();
    const count = await SupportQuery.countDocuments();
    const sequence = String(count + 1).padStart(4, '0');
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    const ticketId = `QRY-${year}-${sequence}-${randomSuffix}`;

    const newQuery = await SupportQuery.create({
      ticket_id: ticketId,
      user_email: identity.email.toLowerCase(),
      user_name: identity.name || (identity.role === 'coordinator' ? 'Coordinator' : identity.role === 'company' ? 'Recruiter' : 'PhD Scholar'),
      user_role: identity.role,
      category,
      subject,
      query,
      status: 'Pending',
    });

    await AuditEvent.create({
      actor_email: identity.email,
      action: 'query.create',
      entity_type: 'support_query',
      entity_id: String(newQuery._id),
      after: {
        ticket_id: ticketId,
        category,
        subject,
      },
    }).catch(() => {});

    return NextResponse.json({ query: newQuery }, { status: 201 });
  } catch (error) {
    console.error('Error submitting support query:', error);
    return NextResponse.json({ error: 'Failed to save query to database.' }, { status: 500 });
  }
}
