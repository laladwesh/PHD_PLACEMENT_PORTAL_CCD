import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDiscipline extends Document {
  name: string;
  category?: 'department' | 'school' | 'centre';
}

const DisciplineSchema = new Schema<IDiscipline>(
  {
    name: { type: String, required: true },
    category: { type: String, enum: ['department', 'school', 'centre'] },
  },
  { timestamps: true }
);

const Discipline: Model<IDiscipline> =
  mongoose.models.Discipline || mongoose.model<IDiscipline>('Discipline', DisciplineSchema);

export default Discipline;
