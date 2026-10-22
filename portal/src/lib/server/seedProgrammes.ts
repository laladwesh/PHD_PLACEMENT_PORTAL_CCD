import { connectToDatabase } from './mongodb';
import Discipline from './models/Discipline';
import Programme from './models/Programme';
import { seedDisciplines } from './seedDisciplines';

// On a fresh database there are no programmes, so create one Ph.D. programme per discipline
// (department, school or centre). Safe to call repeatedly: it does nothing once programmes exist,
// and the upserts cannot create duplicates if two requests race.
export async function ensureProgrammes() {
  await connectToDatabase();
  if (await Programme.countDocuments() > 0) return;

  await seedDisciplines();
  const disciplines = await Discipline.find({}).select('name').lean();
  if (!disciplines.length) return;

  await Programme.bulkWrite(disciplines.map((discipline: { name: string }) => ({
    updateOne: {
      filter: { programme: 'Ph.D.', discipline: discipline.name },
      update: {
        $setOnInsert: {
          programme: 'Ph.D.',
          discipline: discipline.name,
          department: discipline.name,
          displayName: `Ph.D.-${discipline.name}`,
          major: true,
          minor: false,
        },
      },
      upsert: true,
    },
  })));
}
