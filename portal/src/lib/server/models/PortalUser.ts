import mongoose, { Schema } from 'mongoose';

const portalUserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  name: { type: String, trim: true, default: '' },
  role: { type: String, enum: ['coordinator', 'student', 'company'], required: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const PortalUser = mongoose.models.PortalUser || mongoose.model('PortalUser', portalUserSchema);

export default PortalUser;
