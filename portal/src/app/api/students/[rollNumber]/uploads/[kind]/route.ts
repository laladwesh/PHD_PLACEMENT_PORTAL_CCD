import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Student from '@/lib/server/models/Student';
import Job from '@/lib/server/models/Job';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

type RouteContext = { params: Promise<{ rollNumber: string; kind: string }> };
const kinds = new Set(['profile', 'cv1', 'cv2']);

export async function GET(_request: Request, { params }: RouteContext) {
  const actor = await requireRole('coordinator', 'company');
  if (isAuthorizationError(actor)) return actor;
  const { rollNumber: rawRollNumber, kind } = await params;
  const rollNumber = Number(rawRollNumber);
  if (!Number.isSafeInteger(rollNumber) || !kinds.has(kind)) return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 });
  await connectToDatabase();
  const student = await Student.findOne({ roll_number: rollNumber }).select('profile_pic cv jobs_applied').lean();

  // A recruiter may open the two CVs of students who applied to one of THEIR jobs, and nothing else.
  if (actor.role === 'company') {
    if (kind === 'profile') return NextResponse.json({ error: 'You do not have access to this file.' }, { status: 403 });
    const appliedJobIds = (student?.jobs_applied || []).map((application: { job?: unknown }) => application.job);
    const isApplicant = Boolean(actor.companyId && appliedJobIds.length && await Job.exists({ companyId: actor.companyId, _id: { $in: appliedJobIds } }));
    if (!isApplicant) return NextResponse.json({ error: 'You do not have access to this file.' }, { status: 403 });
  }

  const relativePath = kind === 'profile' ? student?.profile_pic : student?.cv?.[kind as 'cv1' | 'cv2'];
  if (!relativePath) return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  const uploadRoot = path.resolve(process.env.UPLOAD_ROOT || path.join(process.cwd(), 'uploads'));
  const absolutePath = path.resolve(uploadRoot, relativePath);
  if (!absolutePath.startsWith(`${uploadRoot}${path.sep}`)) return NextResponse.json({ error: 'Invalid stored file path.' }, { status: 400 });
  try {
    const contents = await readFile(absolutePath);
    const contentType = kind === 'profile' ? (path.extname(absolutePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg') : 'application/pdf';
    return new Response(new Uint8Array(contents), { headers: { 'Content-Type': contentType, 'Content-Disposition': `inline; filename="${path.basename(absolutePath)}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  }
}
