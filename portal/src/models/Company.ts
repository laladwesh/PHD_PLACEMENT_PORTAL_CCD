import mongoose, { Schema } from 'mongoose';

const querySchema = new Schema(
  {
    subject: {
      type: String,
      required: false,
    },
    query: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'student',
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const companySchema = new Schema(
  {
    company_name: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    company_desc: { type: String, default: '' },
    company_desc_path: { type: String, default: '' },
    postal_address: { type: String, required: false },
    website_url: { type: String, required: true },
    office_contact: { type: String, required: false },
    organization_type: { type: String, required: false },
    industry_sec: { type: String, required: false },

    first_point: {
      email: { type: String, required: false },
      full_name: { type: String, required: false },
      alt_email: { type: String, default: '' },
      contact: { type: String, required: false },
    },

    second_point: {
      email: { type: String, required: false },
      full_name: { type: String, required: false },
      alt_email: { type: String, default: '' },
      contact: { type: String, required: false },
    },

    token: { type: String, required: false },
    seckey: { type: String, required: false },
    queries: {
      type: [querySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Company = mongoose.models.Company || mongoose.model('Company', companySchema);

export default Company;
