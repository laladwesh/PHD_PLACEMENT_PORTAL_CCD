import mongoose, { Schema } from 'mongoose';

const offerSchema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: 'jobs', required: true, index: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'student', required: true, index: true },
  designation: { type: String, required: true, trim: true },
  ctc: { type: String, required: true, trim: true },
  base_salary: { type: String, default: '', trim: true },
  offered_at: { type: Date, required: true, default: Date.now },
  response_deadline: { type: Date, required: true },
  status: { type: String, enum: ['received', 'approved_restricted', 'declined', 'revoked'], default: 'received', index: true },
  coordinator_notes: { type: String, default: '', maxlength: 1000 },
  approved_by: { type: String, default: '' },
  approved_at: Date,
  declined_by: { type: String, default: '' },
  declined_at: Date,
  restriction_reversed_by: { type: String, default: '' },
  restriction_reversed_at: Date,
}, { timestamps: true });

offerSchema.index({ job: 1, student: 1 }, { unique: true });

const Offer = mongoose.models.Offer || mongoose.model('Offer', offerSchema);

export default Offer;
