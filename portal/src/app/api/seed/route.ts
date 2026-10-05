import { NextResponse } from 'next/server';
import { seedAllDatabaseData } from '@/lib/server/seedDatabase';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    const actor = await requireRole('coordinator');
    if (isAuthorizationError(actor)) return actor;
  }
  try {
    const counts = await seedAllDatabaseData();
    return NextResponse.json({
      success: true,
      message: 'Database successfully seeded with disciplines, companies, students, jobs, offers, and announcements.',
      data: counts,
    });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to seed database',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Seeding via GET is disabled in production.' }, { status: 403 });
  }
  try {
    const counts = await seedAllDatabaseData();
    return NextResponse.json({
      success: true,
      message: 'Database successfully seeded in development environment.',
      data: counts,
    });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to seed database',
      },
      { status: 500 }
    );
  }
}
