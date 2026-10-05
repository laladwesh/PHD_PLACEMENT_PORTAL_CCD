import { NextResponse } from 'next/server';
import { seedAllDatabaseData } from '@/lib/server/seedDatabase';

export async function POST() {
  // Seeding wipes students, companies, jobs, offers, users and announcements and loads demo data.
  // It must never run against a production database, whoever is signed in.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Seeding is disabled in production.' }, { status: 403 });
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
