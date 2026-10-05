import mongoose, { Schema } from 'mongoose';

const auditEventSchema = new Schema({
  actor_email: { type: String, required: true, lowercase: true, trim: true, index: true },
  action: { type: String, required: true, index: true },
  entity_type: { type: String, required: true, index: true },
  entity_id: { type: String, required: true, index: true },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

const AuditEvent = mongoose.models.AuditEvent || mongoose.model('AuditEvent', auditEventSchema);

export default AuditEvent;
