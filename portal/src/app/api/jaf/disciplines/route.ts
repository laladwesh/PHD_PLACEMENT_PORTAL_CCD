import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import Discipline from '@/lib/server/models/Discipline';

export async function GET() {
  try {
    await connectToDatabase();
    const disciplines = await Discipline.find({}).sort({ category: 1, name: 1 }).lean();
    return NextResponse.json({ data: disciplines });
  } catch (error) {
    console.error('Error fetching disciplines:', error);
    return NextResponse.json({ error: 'Failed to fetch disciplines' }, { status: 500 });
  }
}
