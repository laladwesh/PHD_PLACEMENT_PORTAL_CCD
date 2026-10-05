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
        year_of_minor_admission: 2025,
        major_cpi: 7.4,
        semester_wise_spi: {
          spi_1: '7.2',
          spi_2: '7.4',
          spi_3: '7.6',
          spi_4: '7.1',
          spi_5: '7.8',
          spi_6: '7.4',
          spi_7: '7.6',
          spi_8: '7.5',
        },
        academic_details: {
          major_department: 'Chemical Engineering',
          major_programme: 'B.Tech',
          major_discipline: 'Chemical Engineering',
          minor_department: '',
          minor_programme: '',
          minor_discipline: '',
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