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
  gap: Number,
  reason_gap: String,
}, { _id: false });

const semesterSpiSchema = new Schema({
  spi_1: String,
  spi_2: String,
  spi_3: String,
  spi_4: String,
  spi_5: String,
  spi_6: String,
  spi_7: String,
  spi_8: String,
  spi_9: String,
  spi_10: String,
  spi_11: String,
  spi_12: String,
}, { _id: false });

const cvSchema = new Schema({
  cv1: String,
  cv2: String,
  cv3: String,
  drive_Link: String,
  portfolio_Link: String,
}, { _id: false });

const academicDetailsSchema = new Schema({
  major_department: String,
  major_programme: String,
  major_discipline: String,
  minor_department: String,
  minor_programme: String,
  minor_discipline: String,
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
  linkedin_url: String,
  flat_no: String,
  address: String,
  city: String,
  state: String,
  pincode: Number,
  hostel: String,
  room_number: String,
  major: { type: Schema.Types.ObjectId, ref: 'programmes' },
  minor: { type: Schema.Types.ObjectId, ref: 'programmes' },
  major_cpi: { type: Number, min: 0, max: 10 },
  minor_cpi: { type: Number, min: 0, max: 10 },
  academic_details: { type: academicDetailsSchema, default: () => ({}) },
  schooling: { type: schoolingSchema, default: () => ({}) },
  entrance_examination: String,
  jee_ma_gate_rank: Number,
  rank_category: String,
  backlogs: { type: Number, min: 0, default: 0 },
  year_of_admission: Number,
  year_of_minor_admission: Number,
  semester_wise_spi: { type: semesterSpiSchema, default: () => ({}) },
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
