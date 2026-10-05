import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import Discipline from '@/lib/server/models/Discipline';
import { seedDisciplines } from '@/lib/server/seedDisciplines';

export async function GET() {
  try {
    await connectToDatabase();
    await seedDisciplines(); // no-op once the collection has data
    const disciplines = await Discipline.find({}).sort({ category: 1, name: 1 }).lean();
    return NextResponse.json({ data: disciplines });
  } catch (error) {
    console.error('Error fetching disciplines:', error);
    return NextResponse.json({ error: 'Failed to fetch disciplines' }, { status: 500 });
  }
}
