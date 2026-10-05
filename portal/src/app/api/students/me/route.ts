import { NextResponse } from 'next/server';
import { getPortalIdentity } from '@/lib/server/identity';
import { getOrCreateStudent } from '@/lib/server/studentRepository';
import Student from '@/lib/server/models/Student';

const editableFields = new Set([
  'name', 'gender', 'dob', 'nationality', 'alt_email', 'mobile_campus',
  'mobile_campus_alt', 'mobile_home', 'disability', 'linkedin_url', 'flat_no',
  'address', 'city', 'state', 'pincode', 'hostel', 'room_number', 'category',
  'entrance_examination', 'jee_ma_gate_rank', 'rank_category',
]);
const schoolingFields = new Set([
  'x_percentage', 'x_pass_year', 'x_board', 'x_exam_medium', 'xii_percentage',
  'xii_pass_year', 'xii_exam_board', 'xii_exam_medium', 'gap', 'reason_gap',
]);
const linkFields = new Set(['drive_Link', 'portfolio_Link']);

export async function GET() {
  const identity = await getPortalIdentity();
  if (identity.role !== 'student' || !identity.rollNumber) {
    return NextResponse.json({ error: 'Student access required.' }, { status: 403 });
  }

  try {
    const student = await getOrCreateStudent(identity);
    return NextResponse.json({ student });
  } catch (error) {
    console.error('Unable to load student registration record:', error);
    return NextResponse.json({ error: 'Student data service is unavailable.' }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const identity = await getPortalIdentity();
  if (identity.role !== 'student' || !identity.rollNumber) {
    return NextResponse.json({ error: 'Student access required.' }, { status: 403 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const update: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      if (editableFields.has(key)) update[key] = value;
    }

    if (body.schooling && typeof body.schooling === 'object' && !Array.isArray(body.schooling)) {
      const schooling = body.schooling as Record<string, unknown>;
      const cleanSchooling = Object.fromEntries(Object.entries(schooling).filter(([key]) => schoolingFields.has(key)));
      if (Object.keys(cleanSchooling).length) update.schooling = cleanSchooling;
    }

    if (body.cv && typeof body.cv === 'object' && !Array.isArray(body.cv)) {
      const cv = body.cv as Record<string, unknown>;
      const cleanLinks = Object.fromEntries(Object.entries(cv).filter(([key]) => linkFields.has(key)));
      if (Object.keys(cleanLinks).length) {
        for (const [key, value] of Object.entries(cleanLinks)) update[`cv.${key}`] = value;
      }
    }

    if (!Object.keys(update).length) {
      return NextResponse.json({ error: 'No editable registration fields provided.' }, { status: 400 });
    }

    await getOrCreateStudent(identity);
    const student = await Student.findOneAndUpdate(
      { roll_number: identity.rollNumber },
      { $set: update },
      { returnDocument: 'after', runValidators: true },
    );
    return NextResponse.json({ student });
  } catch (error) {
    console.error('Unable to save student registration record:', error);
    return NextResponse.json({ error: 'Unable to save student data.' }, { status: 400 });
  }
}