import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getPortalIdentity } from '@/lib/server/identity';
import { getOrCreateStudent } from '@/lib/server/studentRepository';
import Student from '@/lib/server/models/Student';

const uploadKinds = {
  profile: { field: 'profile_pic', label: 'profile photo' },
  cv1: { field: 'cv.cv1', label: 'CV 1' },
  cv2: { field: 'cv.cv2', label: 'CV 2' },
  cv3: { field: 'cv.cv3', label: 'CV 3' },
} as const;

type UploadKind = keyof typeof uploadKinds;
type RouteContext = { params: Promise<{ kind: string }> };

function isUploadKind(kind: string): kind is UploadKind {
  return Object.prototype.hasOwnProperty.call(uploadKinds, kind);
}

function getUploadLocation(rollNumber: number, kind: UploadKind, extension: string) {
  const folder = path.join(process.env.UPLOAD_ROOT || path.join(process.cwd(), 'uploads'), 'students', String(rollNumber));
  const suffix = kind === 'profile' ? 'profile' : kind;
  return {
    folder,
    absolutePath: path.join(folder, `${rollNumber}_${suffix}${extension}`),
    relativePath: path.join('students', String(rollNumber), `${rollNumber}_${suffix}${extension}`),
  };
}

export async function POST(request: Request, { params }: RouteContext) {
  const identity = await getPortalIdentity();
  if (identity.role !== 'student' || !identity.rollNumber) {
    return NextResponse.json({ error: 'Student access required.' }, { status: 403 });
  }
  const { kind } = await params;
  if (!isUploadKind(kind)) return NextResponse.json({ error: 'Unknown upload type.' }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a file to upload.' }, { status: 400 });

  const isPhoto = kind === 'profile';
  const extension = path.extname(file.name).toLowerCase();
  const accepted = isPhoto
    ? (file.type === 'image/jpeg' && ['.jpg', '.jpeg'].includes(extension)) || (file.type === 'image/png' && extension === '.png')
    : file.type === 'application/pdf' && extension === '.pdf';
  const maxSize = isPhoto ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
  if (!accepted) {
    return NextResponse.json({ error: isPhoto ? 'Photo must be a JPEG or PNG.' : 'CV must be a PDF.' }, { status: 415 });
  }
  if (file.size === 0 || file.size > maxSize) {
    return NextResponse.json({ error: `File must be smaller than ${isPhoto ? '5 MB' : '10 MB'}.` }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const validSignature = isPhoto
    ? extension === '.png'
      ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
    : bytes.subarray(0, 5).toString('ascii') === '%PDF-';
  if (!validSignature) return NextResponse.json({ error: 'File contents do not match the selected file type.' }, { status: 415 });

  let savedPath = '';
  try {
    const student = await getOrCreateStudent(identity);
    if (kind !== 'profile' && student.cv_flagged && !student.cv_reupload_allowed) {
      return NextResponse.json({ error: 'CV re-upload is disabled until CCD allows it.' }, { status: 403 });
    }

    const location = getUploadLocation(identity.rollNumber, kind, isPhoto ? extension : '.pdf');
    await mkdir(location.folder, { recursive: true });
    await writeFile(location.absolutePath, bytes);
    savedPath = location.absolutePath;

    const updatePath = uploadKinds[kind].field;
    const studentUpdate: Record<string, unknown> = { [updatePath]: location.relativePath };
    if (kind !== 'profile') {
      studentUpdate.cv_verified = false;
      studentUpdate.cv_flagged = false;
      studentUpdate.cv_flag_note = '';
      studentUpdate.cv_verified_by = '';
      studentUpdate.cv_verified_at = null;
    }
    const updatedStudent = await Student.findOneAndUpdate(
      { roll_number: identity.rollNumber },
      { $set: studentUpdate },
      { returnDocument: 'after', runValidators: true },
    );
    return NextResponse.json({
      fileName: path.basename(location.absolutePath),
      student: updatedStudent,
      url: `/phdplacement/api/students/me/uploads/${kind}`,
    }, { status: 201 });
  } catch (error) {
    if (savedPath) {
      const { rm } = await import('node:fs/promises');
      await rm(savedPath, { force: true }).catch(() => undefined);
    }
    console.error('Unable to store student upload:', error);
    return NextResponse.json({ error: 'Unable to store this file.' }, { status: 500 });
  }
}

export async function GET(_request: Request, { params }: RouteContext) {
  const identity = await getPortalIdentity();
  if (identity.role !== 'student' || !identity.rollNumber) {
    return NextResponse.json({ error: 'Student access required.' }, { status: 403 });
  }
  const { kind } = await params;
  if (!isUploadKind(kind)) return NextResponse.json({ error: 'Unknown upload type.' }, { status: 404 });

  try {
    const student = await getOrCreateStudent(identity);
    const relativePath = kind === 'profile' ? student.profile_pic : student.cv?.[kind];
    if (!relativePath) return NextResponse.json({ error: 'File not found.' }, { status: 404 });

    const uploadRoot = path.resolve(process.env.UPLOAD_ROOT || path.join(process.cwd(), 'uploads'));
    const absolutePath = path.resolve(uploadRoot, relativePath);
    if (!absolutePath.startsWith(`${uploadRoot}${path.sep}`)) {
      return NextResponse.json({ error: 'Invalid file path.' }, { status: 400 });
    }

    const contents = await readFile(absolutePath);
    const contentType = kind === 'profile'
      ? path.extname(absolutePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg'
      : 'application/pdf';
    return new Response(new Uint8Array(contents), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${path.basename(absolutePath)}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found.' }, { status: 404 });
    }
    console.error('Unable to read student upload:', error);
    return NextResponse.json({ error: 'Unable to retrieve this file.' }, { status: 500 });
  }
}
