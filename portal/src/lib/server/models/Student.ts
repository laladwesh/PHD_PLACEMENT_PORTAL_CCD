import mongoose, { Schema } from 'mongoose';

const schoolingSchema = new Schema({
  x_percentage: { type: Number, min: 0, max: 100, default: 0 },
  x_pass_year: Number,
  x_board: String,
  x_exam_medium: String,
  xii_percentage: { type: Number, min: 0, max: 100, default: 0 },
  xii_pass_year: Number,
  xii_exam_board: String,
  xii_exam_medium: String,
  ug_major_discipline: { type: String, trim: true },
  ug_cpi: { type: Number, min: 0, max: 10 },
  pg_major_discipline: { type: String, trim: true },
  pg_cpi: { type: Number, min: 0, max: 10 },
  gap: Number,
  reason_gap: String,
}, { _id: false });

const cvSchema = new Schema({
  cv1: String,   // one-page CV
  cv2: String,   // detailed CV
  drive_Link: String,
}, { _id: false });

const academicDetailsSchema = new Schema({
  major_department: String,
  major_programme: String,
  major_discipline: String,
}, { _id: false });

const jobApplicationSchema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: 'jobs', required: true },
  profile: { type: String, enum: ['tech', 'non_tech', 'core'] },
  status: { type: String, enum: ['none', 'shortlist', 'waitlist', 'selected', 'rejected'], default: 'none' },
  oa_status: { type: String, enum: ['not_updated', 'shortlisted', 'not_shortlisted'], default: 'not_updated' },
  oa_attendance: { type: String, enum: ['not_marked', 'present', 'absent'], default: 'not_marked' },
  oa_room: { type: String, default: '' },
}, { _id: false });

const studentSchema = new Schema({
  roll_number: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  dob: Date,
  nationality: { type: String, default: 'Indian' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  alt_email: { type: String, lowercase: true, trim: true },
  mobile_campus: Number,
  mobile_campus_alt: Number,
  mobile_home: Number,
  disability: String,
  linkedin_url: { type: String, trim: true },
  portfolio_url: { type: String, trim: true },
  google_scholar_url: { type: String, trim: true },
  orcid_id: { type: String, trim: true },
  thesis_title: { type: String, trim: true, maxlength: 300 },
  keywords: {
    type: [{ type: String, trim: true, maxlength: 60 }],
    default: [],
    validate: [(value: string[]) => value.length <= 10, 'You can add at most 10 keywords.'],
  },
  flat_no: String,
  address: String,
  city: String,
  state: String,
  pincode: Number,
  hostel: String,
  room_number: String,
  major: { type: Schema.Types.ObjectId, ref: 'programmes' },
  major_cpi: { type: Number, min: 0, max: 10 },
  cpi_updated_at: Date,   // set when the scholar changes their own CPI
  academic_details: { type: academicDetailsSchema, default: () => ({}) },
  schooling: { type: schoolingSchema, default: () => ({}) },
  entrance_examination: String,
  jee_ma_gate_rank: Number,
  rank_category: String,
  backlogs: { type: Number, min: 0, default: 0 },
  year_of_admission: Number,
  category: {
    type: String,
    enum: ['General', 'SC', 'ST', 'Gen-EWS', 'OBC-NCL', 'General-PwD', 'SC-PwD', 'ST-PwD', 'OBC-PwD', 'EWS-PwD'],
  },
  profile_pic: String,
  cv: { type: cvSchema, default: () => ({}) },
  fee_paid: { type: Boolean, default: true, required: true },
  fee_remaining: { type: Number, min: 0, default: 0 },
  cv_verified: { type: Boolean, default: false, required: true },
  cv_flagged: { type: Boolean, default: false },
  cv_flag_note: { type: String, default: '' },
  cv_verified_by: { type: String, default: '' },
  cv_verified_at: Date,
  cv_reupload_allowed: { type: Boolean, default: false },
  status: { type: String, enum: ['Placed_Intern', 'Sitting_Intern', 'Blocked'], default: 'Sitting_Intern' },
  jobs_applied: { type: [jobApplicationSchema], default: [] },
  preference_list: [{ type: Schema.Types.ObjectId, ref: 'jobs' }],
  shortListedCompanies: [{ type: Schema.Types.ObjectId, ref: 'jobs' }],
  job_placed: { type: Schema.Types.ObjectId, ref: 'jobs' },
  off_campus_company: String,
  off_campus_role: String,
  off_campus_placed_at: Date,
  savedAnnouncements: [{ type: Schema.Types.ObjectId, ref: 'Announcement' }],
  readAnnouncements: [{ type: Schema.Types.ObjectId, ref: 'Announcement' }],
  registration_complete: { type: Boolean, default: false },
}, { timestamps: true, minimize: false });

// `student` is the model name already referenced by the Job schema.  Keeping
// it stable lets existing populated application records continue to work.
const Student = mongoose.models.student || mongoose.model('student', studentSchema);

export default Student;
