import mongoose, { Schema } from 'mongoose';

// A programme is a (degree, department) pair such as "Ph.D." + "Computer Science and Engineering".
// `major` / `minor` say whether students can hold it as a major or a minor; students and JAFs point at
// these documents by _id.
const programmeSchema = new Schema({
  displayName: { type: String },
  programme: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  major: { type: Boolean, default: false },
  minor: { type: Boolean, default: false },
}, { timestamps: true });

programmeSchema.index({ programme: 1, department: 1 }, { unique: true });

programmeSchema.pre('save', function () {
  this.displayName = `${this.programme}-${this.department}`;
});

// The model name `programmes` is what Student.major/minor and Job.eligible_programmes reference.
const Programme = mongoose.models.programmes || mongoose.model('programmes', programmeSchema);

export default Programme;
