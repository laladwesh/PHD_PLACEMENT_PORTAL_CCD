import mongoose from 'mongoose';
import validator from 'validator';

const { Schema } = mongoose;

/**
 * Administrator/coordinator profile for the placement portal.
 *
 * Authentication is handled by IIT Guwahati Azure SSO, so this model stores
 * portal access and contact data only—never a password or an SSO token.
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
        validator: (value) => !value || /^[0-9+()\-\s]{7,20}$/.test(value),
        message: 'Enter a valid contact number.',
      },
    },
    role: {
      type: String,
      enum: ['super_admin', 'placement_admin', 'coordinator'],
      default: 'coordinator',
      required: true,
    },
    active: { type: Boolean, default: true },
    last_login_at: { type: Date, default: null },
  },
  { timestamps: true },
);

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

export default Admin;
