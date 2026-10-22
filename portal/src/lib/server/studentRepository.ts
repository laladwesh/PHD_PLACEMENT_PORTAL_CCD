import type { PortalIdentity } from '@/lib/server/identity';
import { connectToDatabase } from '@/lib/server/mongodb';
import Student from '@/lib/server/models/Student';

export async function getOrCreateStudent(identity: PortalIdentity) {
  if (identity.role !== 'student' || !identity.rollNumber) {
    throw new Error('Student identity required.');
  }

  await connectToDatabase();
  return Student.findOneAndUpdate(
    { roll_number: identity.rollNumber },
    {
      $setOnInsert: {
        roll_number: identity.rollNumber,
        name: identity.name,
        email: identity.email,
        gender: 'Male',
        nationality: 'Indian',
        fee_paid: true,
        fee_remaining: 0,
        backlogs: 0,
        year_of_admission: 2024,
        major_cpi: 7.4,
        academic_details: {
          major_department: 'Chemical Engineering',
          major_programme: 'B.Tech',
          major_discipline: 'Chemical Engineering',
        },
        cv_verified: false,
        cv_flagged: false,
        cv_flag_note: '',
        cv_verified_by: '',
        cv_reupload_allowed: false,
        schooling: {},
        cv: {},
      },
    },
    { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
}
