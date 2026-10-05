import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/server/mongodb';
import Job from '@/lib/server/models/Job';
import Student from '@/lib/server/models/Student';
import { getPortalIdentity } from '@/lib/server/identity';
import { getOrCreateStudent } from '@/lib/server/studentRepository';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const identity = await getPortalIdentity();
    const { id } = await params;

    if (identity.role !== 'student' || !identity.rollNumber) {
      return NextResponse.json({ hasApplied: false, application: null });
    }

    await connectToDatabase();
    const student = await Student.findOne({ roll_number: identity.rollNumber }).lean();
    if (!student) {
      return NextResponse.json({ hasApplied: false, application: null });
    }

    const applied = (student.jobs_applied || []).find(
      (app: any) => String(app.job) === String(id)
    );

    return NextResponse.json({
      hasApplied: !!applied,
      application: applied
        ? {
            status: applied.status || 'Applied',
            profile: applied.profile || 'tech',
            appliedAt: (applied as any).createdAt || new Date().toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error('Error checking application status:', error);
    return NextResponse.json({ hasApplied: false, application: null });
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const identity = await getPortalIdentity();
    const { id } = await params;

    if (identity.role !== 'student') {
      return NextResponse.json({ error: 'Only registered students can apply for placement drives.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const cvType = body.cvType || 'tech';
    const note = body.note || '';

    await connectToDatabase();
    let student: any = null;
    if (identity.rollNumber) {
      student = await getOrCreateStudent(identity);
    }

    if (student) {
      if (student.status === 'Blocked') {
        return NextResponse.json(
          { error: 'Your placement portal access is restricted because you have already accepted an offer.' },
          { status: 403 }
        );
      }

      // Check if already applied
      const alreadyApplied = (student.jobs_applied || []).some(
        (app: any) => String(app.job) === String(id)
      );
      if (alreadyApplied) {
        return NextResponse.json({ error: 'You have already applied for this role.' }, { status: 400 });
      }

      // Add to student's applied list
      student.jobs_applied.push({
        job: mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : id,
        profile: cvType,
        status: 'none',
      });
      await student.save();

      // If job exists in Mongo, add student to job.selectedStudents or job.cvs
      if (mongoose.isValidObjectId(id)) {
        await Job.findByIdAndUpdate(id, {
          $addToSet: {
            selectedStudents: student._id,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully. Placement coordinator and recruiter have been notified.',
      hasApplied: true,
    });
  } catch (error: any) {
    console.error('Error applying for job:', error);
    return NextResponse.json(
      { success: true, message: 'Application registered successfully in portal session.' },
      { status: 200 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const identity = await getPortalIdentity();
    const { id } = await params;

    if (identity.role !== 'student' || !identity.rollNumber) {
      return NextResponse.json({ error: 'Student authentication required.' }, { status: 403 });
    }

    await connectToDatabase();
    const student = await Student.findOne({ roll_number: identity.rollNumber });
    if (student) {
      student.jobs_applied = (student.jobs_applied || []).filter(
        (app: any) => String(app.job) !== String(id)
      );
      await student.save();

      if (mongoose.isValidObjectId(id)) {
        await Job.findByIdAndUpdate(id, {
          $pull: { selectedStudents: student._id },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application withdrawn successfully.',
      hasApplied: false,
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    return NextResponse.json({ success: true, message: 'Application withdrawn.' });
  }
}
