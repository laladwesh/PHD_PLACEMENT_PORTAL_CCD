import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Company } from '@/models';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

export async function GET() {
  const actor = await requireRole('coordinator', 'company');
  if (isAuthorizationError(actor)) return actor;
  try {
    await connectToDatabase();
    const query = actor.role === 'company' && actor.companyId ? { _id: actor.companyId } : {};
    const companies = await Company.find(query)
      .select('company_name email company_desc postal_address website_url office_contact organization_type industry_sec first_point second_point createdAt updatedAt')
      .sort({ company_name: 1 })
      .lean();
    return NextResponse.json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'Company accounts are provisioned by a coordinator; public company registration is disabled.' },
    { status: 405 }
  );
}
