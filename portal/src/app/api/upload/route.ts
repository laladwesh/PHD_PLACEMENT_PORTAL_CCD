import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { isAuthorizationError, requireRole } from '@/lib/server/authorization';

export async function POST(req: NextRequest) {
  const actor = await requireRole('company', 'coordinator');
  if (isAuthorizationError(actor)) return actor;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed.' }, { status: 400 });
    }

    // Limit size to 5MB for general PDFs (like job description)
    // The bond contract screenshot says 1MB limit, which we can enforce on frontend or here.
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds limit.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const prefix = type ? `${type}-` : '';
    const newFileName = `${prefix}${timestamp}-${cleanFileName}`;

    const uploadRoot = process.env.UPLOAD_ROOT || join(process.cwd(), 'uploads');
    const uploadDir = join(uploadRoot, 'jobs');
    
    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, newFileName);
    await writeFile(filePath, buffer);

    const fileUrl = `/phdplacement/api/jobs/uploads/${newFileName}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
