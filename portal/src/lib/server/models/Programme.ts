import mongoose, { Schema } from 'mongoose';

// Same shape as the placement portal's `programmes` collection. A programme is a
// (degree, discipline) pair such as "Ph.D." + "Computer Science and Engineering".
// `major` / `minor` say whether students can hold it as a major or a minor;
// students and JAFs point at these documents by _id.
const programmeSchema = new Schema({
  displayName: { type: String },
  discipline: { type: String, trim: true },
  programme: { type: String, required: true, trim: true },
  department: { type: String, trim: true },
  major: { type: Boolean, default: false },
  minor: { type: Boolean, default: false },
}, { timestamps: true });

programmeSchema.index({ programme: 1, discipline: 1 }, { unique: true });

programmeSchema.pre('save', function () {
  this.displayName = `${this.programme}-${this.discipline}`;
});

// The model name `programmes` is what Student.major/minor and Job.eligible_programmes reference.
const Programme = mongoose.models.programmes || mongoose.model('programmes', programmeSchema);

export default Programme;
