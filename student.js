import mongoose from "mongoose";
const { Schema } = mongoose;
import validator from "validator";
import "mongoose-type-url";

const jobAppSchema = new Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "jobs",
  },
  profile: {
    type: String,
    enum: {
      values: ["tech", "non_tech", "core"],
    },
  },
  status:{
    type: String,
    enum: {
      values: ["none", "shortlist", "waitlist","selected","rejected"],
    },
    default:"none"
  },
  oa_status: {
    type: String,
    enum: {
      values: ["not_updated", "shortlisted", "not_shortlisted"],
    },
    default: "not_updated",
  },
  oa_attendance: {
    type: String,
    enum: {
      values: ["not_marked", "present", "absent"],
    },
    default: "not_marked",
  },
  oa_room: {
    type: String,
    default: "",
  },
});

const studentSchema = new Schema({
  roll_number: {
    type: Number,
  },
  name: {
    type: String,
    required: false,
  },
  gender: {
    type: String,
    enum: {
      values: ["Male", "Female", "Other"],
      message: "{VALUE} is not supported in gender field",
    },
    required: false,
  },
  major_cpi: {
    type: Number,
    required: false,
    max: [10, "CPI can not be more than 10"],
  },
  minor_cpi: {
    type: Number,
    max: [10, "CPI can not be more than 10"],
  },
  max_profiles: {
    type: Number,
    default: 500,
    required: true,
  },
  dob: {
    type: Date,
    required: false,
  },
  nationality: {
    type: String,
    default: "Indian",
  },
  hostel: {
    type: String,
  },
  major: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "programmes",
    required: true,
  },
  minor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "programmes",
  },
  room_number: {
    type: String,
  },
  email: {
    type: String,
    validate: validator.isEmail,
    required: true,
    unique: true,
  },
  alt_email: {
    type: String,
  },
  mobile_campus: {
    type: Number,
    min: [1000000000, "Invalid mobile number."],
    max: [9999999999, "Invalid mobile number."],
    required: false,
  },
  mobile_campus_alt: {
    type: Number,
    min: [1000000000, "Invalid mobile number."],
    max: [9999999999, "Invalid mobile number."],
  },
  mobile_home: {
    type: Number,
    min: [1000000000, "Invalid mobile number."],
    max: [9999999999, "Invalid mobile number."],
  },
  disability: {
    type: String,
  },
  linkedin_url: {
    type: mongoose.SchemaTypes.Url,
  },
  flat_no: {
    type: String,
  },
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  pincode: {
    type: Number,
  },
  fee_paid: {
    type: Boolean,
    default: true,
    required: true,
  },
  fee_remaining: {
    type: Number,
    default : 0,
  },
  schooling: {
    x_percentage: {
      type: Number,
      default: 0.0,
      min: [0, "Percentage X can not be lower than 0"],
      max: [100, "Percentage X can not be more than 100"],
    },
    x_pass_year: {
      type: Number,
    },
    x_board: {
      type: String,
    },
    x_exam_medium: {
      type: String,
    },
    xii_percentage: {
      type: Number,
      default: 0.0,
      min: [0, "Percentage XII can not be lower than 0"],
      max: [100, "Percentage XII can not be more than 100"],
    },
    xii_pass_year: {
      type: Number,
    },
    xii_exam_board: {
      type: String,
    },
    xii_exam_medium: {
      type: String,
    },
    gap: {
      type: Number,
    },
    reason_gap: {
      type: String,
    },
  },
  profile_pic: String,
  cv: {
    tech: String,
    non_tech: String,
    core: String,
    drive_Link: String,
    portfolio_Link: String,
  },
  category: {
    type: String,
    enum: {
      values: [
        "General",
        "SC",
        "ST",
        "Gen-EWS",
        "OBC-NCL",
        "General-PwD",
        "SC-PwD",
        "ST-PwD",
        "OBC-PwD",
        "EWS-PwD",
      ],
      message: "{VALUE} is not supported in category field",
    },
    required: false,
  },
  status: {
    type: String,
    enum: {
      values: [
        "Placed_Intern",
        "Sitting_Intern",
        "Blocked",
      ],
      message: "{VALUE} is not supported in status field",
    },
    required: true,
    default:"Sitting_Intern"
  },
  backlogs: {
    type: Number,
    required: true,
    default: 0,
  },
  year_of_admission: {
    type: Number,
  },
  year_of_minor_admission: {
    type: Number,
  },
  jobs_applied: {
    type: [jobAppSchema],
    ref: "jobs",
    default: [],
  },
  preference_list: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "jobs",
    default: [],
  },
  shortListedCompanies: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "jobs",
    default: [],
  },
  job_placed:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "jobs",
  },
  off_campus_company: { type: String },
  off_campus_role: { type: String },
  off_campus_placed_at: { type: Date },
  jee_ma_gate_rank: {
    type: Number,
    required: false,
  },
  rank_category: {
    type: String,
    required: false,
  },
  entrance_examination: {
    type: String,
  },
  semester_wise_spi: {
    spi_1: {
      type: String,
    },
    spi_2: {
      type: String,
    },
    spi_3: {
      type: String,
    },
    spi_4: {
      type: String,
    },
    spi_5: {
      type: String,
    },
    spi_6: {
      type: String,
    },
    spi_7: {
      type: String,
    },
    spi_8: {
      type: String,
    },
    spi_9: {
      type: String,
    },
    spi_10: {
      type: String,
    },
    spi_11: {
      type: String,
    },
    spi_12: {
      type: String,
    },
  },
  savedAnnouncements: [
    {
      type: mongoose.Types.ObjectId,
      ref: "announcements",
      default: [],
    },
  ],
  personalAnnouncements: [
    {
      type: mongoose.Types.ObjectId,
      ref: "announcements",
      default: [],
    },
  ],
  cv_verified: {
    type: Boolean,
    default: false,
    required: true,
  },
  // CV verification workflow (verifier role)
  verifier_assigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Verifier",
    default: null,
  },
  cv_flagged: { type: Boolean, default: false },
  cv_flag_note: { type: String, default: "" },
  cv_verified_by: { type: String, default: "" },
  cv_verified_at: { type: Date, default: null },
  cv_reupload_allowed: { type: Boolean, default: false },
  registration_complete: {
    type: Boolean,
    default: false,
  },
  mock_absence_count: { type: Number, default: 0 },
  mock_blocked: { type: Boolean, default: false },
});

const Student = mongoose.model("student", studentSchema);
export default Student;
