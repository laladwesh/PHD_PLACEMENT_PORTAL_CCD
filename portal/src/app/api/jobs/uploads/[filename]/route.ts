import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import * as path from 'path';
import * as fs from 'fs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const uploadRoot = path.resolve(process.env.UPLOAD_ROOT || path.join(process.cwd(), 'uploads'));
    const uploadDir = path.join(uploadRoot, 'jobs');
    const absolutePath = path.resolve(uploadDir, filename);

    // Prevent directory traversal
    if (!absolutePath.startsWith(`${uploadDir}${path.sep}`)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(absolutePath);
    
    // Determine content type
    let contentType = 'application/octet-stream';
    if (filename.endsWith('.pdf')) contentType = 'application/pdf';
    else if (filename.endsWith('.png')) contentType = 'image/png';
    else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) contentType = 'image/jpeg';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
