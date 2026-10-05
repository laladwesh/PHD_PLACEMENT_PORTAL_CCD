import mongoose, { Schema } from 'mongoose';

const announcementSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 3000 },
  category: { type: String, enum: ['Job Alert', 'General', 'Important', 'Event'], default: 'General' },
  audience: { type: String, enum: ['all_students', 'eligible_students'], default: 'all_students' },
  min_cpi: { type: Number, min: 0, max: 10 },
  link: { type: String, trim: true, default: '' },
  link_label: { type: String, trim: true, default: '' },
  publish_at: { type: Date, default: Date.now },
  expires_at: { type: Date },
  status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
  created_by: { type: String, required: true },
}, { timestamps: true });

announcementSchema.index({ status: 1, publish_at: -1 });

const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);

export default Announcement;