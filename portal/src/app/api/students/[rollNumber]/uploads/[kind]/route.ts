import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Student from '@/lib/server/models/Student';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

type RouteContext = { params: Promise<{ rollNumber: string; kind: string }> };
const kinds = new Set(['profile', 'cv1', 'cv2', 'cv3']);

export async function GET(_request: Request, { params }: RouteContext) {
  const actor = await requireRole('coordinator');
  if (isAuthorizationError(actor)) return actor;
  const { rollNumber: rawRollNumber, kind } = await params;
  const rollNumber = Number(rawRollNumber);
  if (!Number.isSafeInteger(rollNumber) || !kinds.has(kind)) return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 });
  await connectToDatabase();
  const student = await Student.findOne({ roll_number: rollNumber }).select('profile_pic cv').lean();
  const relativePath = kind === 'profile' ? student?.profile_pic : student?.cv?.[kind as 'cv1' | 'cv2' | 'cv3'];
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
