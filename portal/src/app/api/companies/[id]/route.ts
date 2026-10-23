import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Company from '@/lib/server/models/Company';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const actor = await requireRole('coordinator');
  if (isAuthorizationError(actor)) return actor;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid company id.' }, { status: 400 });

  await connectToDatabase();
  const company = await Company.findById(id)
    .select('company_name email company_desc postal_address website_url organization_type industry_sec first_point.full_name first_point.email first_point.contact second_point.full_name second_point.email second_point.contact createdAt updatedAt')
    .lean();
  if (!company) return NextResponse.json({ error: 'Company not found.' }, { status: 404 });

  return NextResponse.json({ company });
}
