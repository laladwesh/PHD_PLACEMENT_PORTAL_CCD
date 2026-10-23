import { NextResponse } from 'next/server';
import { getPortalIdentity } from '@/lib/server/identity';
import { getOrCreateStudent } from '@/lib/server/studentRepository';
import Student from '@/lib/server/models/Student';

const editableFields = new Set([
  'name', 'gender', 'dob', 'nationality', 'alt_email', 'mobile_campus',
  'mobile_campus_alt', 'mobile_home', 'disability', 'flat_no',
  'address', 'city', 'state', 'pincode', 'hostel', 'room_number', 'category',
  'entrance_examination', 'jee_ma_gate_rank', 'rank_category', 'major_cpi', 'thesis_title',
]);
const profileLinkFields = ['linkedin_url', 'portfolio_url', 'google_scholar_url', 'orcid_id'] as const;
const schoolingFields = new Set([
  'x_percentage', 'x_pass_year', 'x_board', 'x_exam_medium', 'xii_percentage',
  'xii_pass_year', 'xii_exam_board', 'xii_exam_medium', 'ug_major_discipline', 'ug_cpi',
  'pg_major_discipline', 'pg_cpi',
  'gap', 'reason_gap',
]);
const linkFields = new Set(['drive_Link']);

// LinkedIn is mandatory when submitted. Portfolio, Google Scholar, ORCID iD and the Google Drive folder are
// optional: a blank value is accepted and clears the field.
const urlFields = new Set(['linkedin_url', 'portfolio_url', 'google_scholar_url', 'cv.drive_Link']);
const maxLength: Record<string, number> = { orcid_id: 60, thesis_title: 300 };

// Up to 10 free-text keywords, each up to 60 characters. Blanks and repeats are dropped.
function cleanKeywords(raw: unknown): string[] | string {
  if (!Array.isArray(raw)) return 'Keywords must be a list.';
  const seen = new Set<string>();
  const keywords: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') return 'Each keyword must be text.';
    const keyword = item.trim().replace(/\s+/g, ' ');
    if (!keyword) continue;
    if (keyword.length > 60) return 'Each keyword can be at most 60 characters.';
    if (seen.has(keyword.toLowerCase())) continue;
    seen.add(keyword.toLowerCase());
    keywords.push(keyword);
  }
  if (keywords.length > 10) return 'You can add at most 10 keywords.';
  return keywords;
}

function validateOptionalFields(update: Record<string, unknown>): string | null {
  for (const [key, raw] of Object.entries(update)) {
    if (!urlFields.has(key) && !(key in maxLength)) continue;
    if (raw === undefined || raw === null) { update[key] = ''; continue; }
    if (typeof raw !== 'string') return `${key} must be text.`;
    const value = raw.trim();
    update[key] = value;
    if (!value) continue;
    if (value.length > (maxLength[key] ?? 300)) return `${key} is too long.`;
    if (urlFields.has(key)) {
      try {
        const url = new URL(value);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return 'Links must start with http:// or https://';
      } catch {
        return 'Enter a valid link, for example https://scholar.google.com/...';
      }
    }
  }
  return null;
}

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

    for (const field of profileLinkFields) {
      if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
      const value = typeof body[field] === 'string' ? (body[field] as string).trim() : '';
      if (!value && field === 'linkedin_url') {
        return NextResponse.json({ error: 'linkedin url is required.' }, { status: 400 });
      }
      update[field] = value;
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

    if (Object.prototype.hasOwnProperty.call(body, 'keywords')) {
      const keywords = cleanKeywords(body.keywords);
      if (typeof keywords === 'string') return NextResponse.json({ error: keywords }, { status: 400 });
      update.keywords = keywords;
    }

    const invalid = validateOptionalFields(update);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    // CPI: a number from 0 to 10. Remember when it actually changed.
    const current = await getOrCreateStudent(identity);
    if ('major_cpi' in update) {
      const cpi = typeof update.major_cpi === 'string' && update.major_cpi.trim() === '' ? NaN : Number(update.major_cpi);
      if (!Number.isFinite(cpi) || cpi < 0 || cpi > 10) {
        return NextResponse.json({ error: 'CPI must be a number between 0 and 10.' }, { status: 400 });
      }
      update.major_cpi = Math.round(cpi * 100) / 100;
      if (update.major_cpi !== current.major_cpi) update.cpi_updated_at = new Date();
    }

    if (!Object.keys(update).length) {
      return NextResponse.json({ error: 'No editable registration fields provided.' }, { status: 400 });
    }

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
