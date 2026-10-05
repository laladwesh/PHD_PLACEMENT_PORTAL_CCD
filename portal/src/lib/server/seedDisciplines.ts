import { connectToDatabase } from './mongodb';
import Discipline from './models/Discipline';

const departments = [
  'Computer Science and Engineering',
  'Electronics and Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Design',
  'Biosciences and Bioengineering',
  'Chemical Engineering',
  'Physics',
  'Chemistry',
  'Mathematics',
  'Humanities and Social Sciences',
];

const schools = [
  'Agro and Rural Technology',
  'Business',
  'Energy Science and Engineering',
  'Health Sciences and Technology',
  'Data Science and Artificial Intelligence',
];

const centres = [
  'Indian Knowledge Systems',
  'Linguistic Science and Technology',
  'Nanotechnology',
  'National Security Studies and Research',
  'Interdisciplinary Studies and Sustainability',
];

export async function seedDisciplines() {
  await connectToDatabase();
  
  const count = await Discipline.countDocuments();
  if (count > 0) {
    console.log('Disciplines already seeded.');
    return;
  }

  const docs = [
    ...departments.map((name) => ({ name, category: 'department' })),
    ...schools.map((name) => ({ name, category: 'school' })),
    ...centres.map((name) => ({ name, category: 'centre' })),
  ];

  await Discipline.insertMany(docs);
  console.log('Seeded 21 Disciplines successfully.');
}
