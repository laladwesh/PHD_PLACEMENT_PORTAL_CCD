import mongoose, { Schema } from 'mongoose';

const supportQuerySchema = new Schema(
  {
    ticket_id: { type: String, required: true, unique: true, index: true },
    user_email: { type: String, required: true, lowercase: true, trim: true, index: true },
    user_name: { type: String, required: true, trim: true },
    user_role: { type: String, enum: ['student', 'company', 'coordinator'], required: true },
    category: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    query: { type: String, required: true, trim: true, maxlength: 3000 },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved', 'Closed'],
      default: 'Pending',
      index: true,
    },
    response: { type: String, trim: true, default: '' },
    resolved_by: { type: String, trim: true, default: '' },
    resolved_at: { type: Date, default: null },
  },
  { timestamps: true }
);

supportQuerySchema.index({ user_email: 1, createdAt: -1 });
supportQuerySchema.index({ status: 1, createdAt: -1 });

const SupportQuery =
  mongoose.models.SupportQuery || mongoose.model('SupportQuery', supportQuerySchema);

export default SupportQuery;
