import mongoose, { Schema } from 'mongoose';
import 'mongoose-type-url';

const cvSchema = new Schema(
  {
    type: {
      type: String,
      enum: {
        values: ['tech', 'non_tech', 'core'],
        message: '{VALUE} is not supported in type field',
      },
      required: true,
    },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'student', required: true },
    status: {
      type: String,
      enum: {
        values: ['none', 'shortlist', 'waitlist', 'selected', 'rejected'],
      },
      default: 'none',
    },
  },
  {
    timestamps: true,
  }
);

const salaryDetailSchema = new Schema({
  programme: {
    type: String,
    required: true,
  },
  monthly: { type: Number, default: 0 },
});

const eligibilitySchema = new Schema({
  percentage_in_X: {
    type: Number,
    default: 0,
    required: true,
    min: [0, 'Percentage X can not be lower than 0'],
    max: [100, 'Percentage X can not be more than 100'],
  },
  percentage_in_XII: {
    type: Number,
    default: 0,
    required: true,
    min: [0, 'Percentage XII can not be lower than 0'],
    max: [100, 'Percentage XII can not be more than 100'],
  },
  allow_backlog: {
    type: Boolean,
    default: false,
  },
});

const salarySchema = new Schema({
  currency: {
    type: String,
  },
  details: [
    {
      type: salaryDetailSchema,
    },
  ],
  additional: {
    type: String,
  },
  is_accomodation_available: {
    type: Boolean,
    default: false,
  },
  provide_PPO: {
    type: Boolean,
    default: false,
  },
});

const selectionSchema = new Schema({
  ppt: {
    type: Boolean,
  },
  resume_shortlist: {
    type: Boolean,
  },
  technical_test: {
    type: Boolean,
  },
  aptitude_test: {
    type: Boolean,
  },
  offline_test: {
    type: Boolean,
  },
  online_test: {
    type: Boolean,
  },
  test_duration: {
    type: String,
  },
  test_requirements: {
    type: String,
  },
  group_discussion: {
    type: Boolean,
  },
  in_person_interview: {
    type: Boolean,
  },
  telephonic_interview: {
    type: Boolean,
  },
  video_conferencing_interview: {
    type: Boolean,
  },
});

const bondSchema = new Schema({
  bond_document: {
    type: String,
  },
  bond_duration_years: {
    type: Number,
  },
  bond_duration_months: {
    type: Number,
  },
  bond_details: {
    type: String,
  },
});

const programmeCriteriaSchema = new Schema({
  allowed: {
    type: Boolean,
    default: false,
  },
  cpi_cutoff: {
    type: Number,
    default: 0,
  },
});

const additionalSchema = new Schema({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
});

const oaRoomSchema = new Schema(
  {
    name: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const uploaderSchema = new Schema(
  {
    role: { type: String, default: '' },
    name: { type: String, default: '' },
  },
  { _id: false }
);

const oaCandidateSchema = new Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'student', required: true },
    email: { type: String, default: '' },
    roll_number: { type: String, default: '' },
    room_name: { type: String, default: '' },
    attendance: {
      type: String,
      enum: { values: ['not_marked', 'present', 'absent'] },
      default: 'not_marked',
    },
    mail_sent: { type: Boolean, default: false },
    admit_time: { type: String, default: '' },
  },
  { _id: false }
);

const interviewCoordinatorSchema = new Schema(
  {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  { _id: false }
);

const interviewCandidateSchema = new Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'student', required: true },
    email: { type: String, default: '' },
    roll_number: { type: String, default: '' },
  },
  { _id: false }
);

const interviewRoundSchema = new Schema(
  {
    coordinator: { type: interviewCoordinatorSchema, default: () => ({}) },
    whatsapp_group_id: { type: String, default: '' },
    whatsapp_group_link: { type: String, default: '' },
    shortlisted_candidates: { type: [interviewCandidateSchema], default: [] },
    pending_notification_candidates: { type: [interviewCandidateSchema], default: [] },
    uploaded_at: { type: Date, default: null },
    uploaded_by: { type: uploaderSchema, default: () => ({}) },
    notification_sent_at: { type: Date, default: null },
  },
  { _id: false }
);

const stepStatusSchema = new Schema(
  {
    finalized: { type: Boolean, default: false },
    finalized_at: { type: Date, default: null },
    unselected_count: { type: Number, default: 0 },
  },
  { _id: false }
);

const finalSelectionCandidateSchema = new Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'student', required: true },
    email: { type: String, default: '' },
    roll_number: { type: String, default: '' },
  },
  { _id: false }
);

const finalSelectionSchema = new Schema(
  {
    selected_candidates: { type: [finalSelectionCandidateSchema], default: [] },
    uploaded_at: { type: Date, default: null },
    uploaded_by: { type: uploaderSchema, default: () => ({}) },
    notification_sent_at: { type: Date, default: null },
    offer_pool_at: { type: Date, default: null },
    offers_generated_at: { type: Date, default: null },
  },
  { _id: false }
);

const jafConfirmationSchema = new Schema(
  {
    token: { type: String, default: '' },
    sent_at: { type: Date, default: null },
    agreed_to_terms: { type: Boolean, default: false },
    confirmed_at: { type: Date, default: null },
    confirmed_ip: { type: String, default: '' },
  },
  { _id: false }
);

const oaRoundSchema = new Schema(
  {
    rooms: { type: [oaRoomSchema], default: [] },
    candidates: { type: [oaCandidateSchema], default: [] },
    uploaded_at: { type: Date, default: null },
    uploaded_by: { type: uploaderSchema, default: () => ({}) },
    attendance_uploaded_at: { type: Date, default: null },
    attendance_uploaded_by: { type: uploaderSchema, default: () => ({}) },
    allocation_mail_sent_at: { type: Date, default: null },
    interview_round: { type: interviewRoundSchema, default: () => ({}) },
    final_selection: { type: finalSelectionSchema, default: () => ({}) },
    step_status: {
      registration: { type: stepStatusSchema, default: () => ({}) },
      oa_appearing: { type: stepStatusSchema, default: () => ({}) },
      oa_attendance: { type: stepStatusSchema, default: () => ({}) },
      interview_shortlist: { type: stepStatusSchema, default: () => ({}) },
      final_selection: { type: stepStatusSchema, default: () => ({}) },
    },
    closed_at_step: { type: String, default: null },
    closed_at: { type: Date, default: null },
    closure_note: { type: String, default: '' },
  },
  { _id: false }
);

const eligibleProgrammeSchema = new Schema({
  programme: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'programmes',
  },
  major: {
    type: programmeCriteriaSchema,
  },
  minor: {
    type: programmeCriteriaSchema,
  },
});

const jobSchema = new Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    status: {
      type: String,
      enum: {
        values: ['Complete', 'Incomplete', 'Approved', 'Unapproved', 'Changes Requested', 'Rejected'],
        message: '{VALUE} is not supported in type field',
      },
      default: 'Incomplete',
    },
    application_deadline: {
      type: Date,
      required: false,
    },
    job_designation: {
      type: String,
    },
    job_description: {
      type: String,
    },
    place_of_posting: {
      type: String,
    },
    num_openings: {
      type: Number,
      min: [1, 'Openings cannot be less than One!'],
    },
    bond: {
      type: Boolean,
    },
    bond_details: {
      type: bondSchema,
      required: false,
    },
    eligibility: {
      type: eligibilitySchema,
    },
    eligible_programmes: [
      {
        type: eligibleProgrammeSchema,
        required: false,
      },
    ],
    additional: {
      type: [additionalSchema],
    },
    salary: {
      type: salarySchema,
    },
    testDate: {
      type: Date,
      required: false,
    },
    selection_process: {
      type: selectionSchema,
    },
    job_description_file: {
      type: String,
    },
    cvs: {
      type: [cvSchema],
      default: [],
    },
    is_job_details_done: {
      type: Boolean,
    },
    is_eligibility_done: {
      type: Boolean,
    },
    is_salary_details_done: {
      type: Boolean,
    },
    is_selection_process_done: {
      type: Boolean,
    },
    is_bond_contract_done: {
      type: Boolean,
    },
    is_spot_slot_done: {
      type: Boolean,
    },
    is_additional_details_done: {
      type: Boolean,
    },
    is_portfolio_required: {
      type: Boolean,
    },
    tag: {
      type: String,
      enum: {
        values: ['SDE', 'DS', 'Design', 'Core', 'Consulting', 'Finance', 'Other'],
        message: '{VALUE} is not supported in type field',
      },
    },
    spot_slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'slotspot',
    },
    shortListedStudents: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'student',
      default: [],
    },
    oa_round: {
      type: oaRoundSchema,
      default: () => ({ rooms: [], candidates: [] }),
    },
    jaf_confirmation: {
      type: jafConfirmationSchema,
      default: () => ({}),
    },
    is_ghost_oa: { type: Boolean, default: false },
    linked_jaf_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'jobs' }],
    ghost_oa_completed_at: { type: Date, default: null },
    ghost_oa_deleted: { type: Boolean, default: false },
    feedback: { type: String },
  },
  {
    timestamps: true,
  }
);

jobSchema.virtual('registeredStudents').get(function () {
  return this.cvs ? this.cvs.filter((el: any) => el && el.student).length : 0;
});

const Jobs = mongoose.models.jobs || mongoose.model('jobs', jobSchema);

export default Jobs;
