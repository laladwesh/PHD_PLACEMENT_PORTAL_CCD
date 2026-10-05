import { NextResponse } from 'next/server';
import { getPortalIdentity } from '@/lib/server/identity';
import { connectToDatabase } from '@/lib/server/mongodb';
import Student from '@/lib/server/models/Student';
import AuditEvent from '@/lib/server/models/AuditEvent';

type RouteContext = { params: Promise<{ rollNumber: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const identity = await getPortalIdentity();
  if (identity.role !== 'coordinator') {
    return NextResponse.json({ error: 'Coordinator access required.' }, { status: 403 });
  }

  const { rollNumber: rawRollNumber } = await params;
  const rollNumber = Number(rawRollNumber);
  if (!Number.isSafeInteger(rollNumber) || rollNumber <= 0) {
    return NextResponse.json({ error: 'Enter a valid roll number.' }, { status: 400 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    const hasVerification = typeof body.cv_verified === 'boolean';
    const hasFlag = typeof body.cv_flagged === 'boolean';

    if (body.cv_verified === true && body.cv_flagged === true) {
      return NextResponse.json({ error: 'A CV cannot be verified and flagged at the same time.' }, { status: 400 });
    }
    await connectToDatabase();
    const existingStudent = await Student.findOne({ roll_number: rollNumber });
    if (!existingStudent) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });

    if (body.cv_verified === true) {
      const hasUploadedCv = Boolean(
        existingStudent.cv?.cv1 ||
        existingStudent.cv?.cv2 ||
        existingStudent.cv?.cv3
      );
      if (!hasUploadedCv) {
        return NextResponse.json({ error: 'Cannot verify student CV because no CV files have been uploaded.' }, { status: 400 });
      }
      update.cv_flagged = false;
      update.cv_flag_note = '';
    }

    if (hasVerification) {
      update.cv_verified = body.cv_verified;
      update.cv_verified_by = body.cv_verified ? identity.email : '';
      update.cv_verified_at = body.cv_verified ? new Date() : null;
    }
    if (hasFlag) update.cv_flagged = body.cv_flagged;
    if (typeof body.cv_flag_note === 'string') {
      if (body.cv_flag_note.length > 1000) return NextResponse.json({ error: 'Review notes must be 1000 characters or fewer.' }, { status: 400 });
      update.cv_flag_note = body.cv_flag_note.trim();
    }
    if (typeof body.cv_reupload_allowed === 'boolean') update.cv_reupload_allowed = body.cv_reupload_allowed;
    if (typeof body.fee_paid === 'boolean') update.fee_paid = body.fee_paid;
    if (body.fee_remaining !== undefined) {
      const remaining = Number(body.fee_remaining);
      if (!Number.isFinite(remaining) || remaining < 0) return NextResponse.json({ error: 'Fee remaining must be a non-negative amount.' }, { status: 400 });
      update.fee_remaining = remaining;
    }
    if (!Object.keys(update).length) return NextResponse.json({ error: 'No review fields provided.' }, { status: 400 });
    if (body.cv_flagged === false) update.cv_flag_note = '';
    if (body.fee_paid === true) update.fee_remaining = 0;

    const student = await Student.findOneAndUpdate(
      { roll_number: rollNumber },
      { $set: update },
      { returnDocument: 'after', runValidators: true },
    );
    await AuditEvent.create({
      actor_email: identity.email,
      action: 'student.review.update',
      entity_type: 'student',
      entity_id: String(student._id),
      after: update,
    });
    return NextResponse.json({ student });
  } catch (error) {
    console.error('Unable to update student review status:', error);
    return NextResponse.json({ error: 'Unable to update this student record.' }, { status: 400 });
  }
}
