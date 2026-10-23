import mongoose, { Schema } from 'mongoose';
import validator from 'validator';

export const ADMIN_ROLES = ['super_admin', 'placement_admin', 'coordinator'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/**
 * Administrator/coordinator profile for the placement portal.
 *
 * Authentication is handled by Azure SSO, so this model stores portal access and contact data only:
 * never a password or an SSO token. An active record here grants coordinator access at sign-in.
 */
const adminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'A valid administrator email is required.'],
    },
    employee_id: { type: String, trim: true, unique: true, sparse: true },
    designation: { type: String, trim: true, default: 'Placement Coordinator' },
    department: { type: String, trim: true, default: 'CCD, IIT Guwahati' },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: (value: string) => !value || /^[0-9+()\-\s]{7,20}$/.test(value),
        message: 'Enter a valid contact number.',
      },
    },
    role: { type: String, enum: ADMIN_ROLES, default: 'coordinator', required: true },
    active: { type: Boolean, default: true },
    last_login_at: { type: Date, default: null },
  },
  { timestamps: true },
);

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

export default Admin;
