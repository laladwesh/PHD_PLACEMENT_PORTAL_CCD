import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IJob extends Document {
  companyId?: mongoose.Types.ObjectId;
  status: 'Incomplete' | 'Unapproved' | 'Approved' | 'Changes Requested' | 'Rejected';
  jobDesignation?: string;
  jobDescription?: { mode: 'html' | 'file'; content: string; fileUrl?: string };
  placeOfPosting?: string;
  dateOfJoining?: string;
  numOpenings?: number;
  applicationDeadline?: Date;
  eligibility?: Array<{ department?: string; cpiCutoff: number }>;
  allowBacklog?: boolean;
  academicEligibility?: {
    tenthPercentage?: number;
    twelfthPercentage?: number;
    bachelorsCPI?: number;
    mastersCPI?: number;
  };
  salary?: {
    currency?: string;
    salaryStructureFile?: string;
    programmes?: Array<{ programme: string; amount?: number; ctc?: number; base?: number; monthlyFixed?: number }>;
    accommodationAvailable?: boolean;
    ppoExtension?: boolean;
    additionalInfo?: string;
    oneTimeBonus?: number;
  };
  selectionProcess?: {
    ppt?: boolean;
    resumeShortlist?: boolean;
    writtenTest?: boolean;
    technicalInterview?: boolean;
    hrInterview?: boolean;
    groupDiscussion?: boolean;
    preInterviewGD?: boolean;
    medicalTest?: boolean;
    testDuration?: string;
    interviewDuration?: string;
    notes?: string;
  };
  bondDetails?: {
    hasBond?: boolean;
    durationYears?: number;
    durationMonths?: number;
    description?: string;
    documentUrl?: string;
  };
  additionalRequirements?: Array<{ title: string; description: string }>;
  agreedToTerms: boolean;
  policyVersion?: string;
  finalSelectionFile?: string;
  selectedStudents?: mongoose.Types.ObjectId[];
}

const JobSchema = new Schema<IJob>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
    status: {
      type: String,
      enum: ['Incomplete', 'Unapproved', 'Approved', 'Changes Requested', 'Rejected'],
      default: 'Incomplete',
    },
    jobDesignation: { type: String },
    jobDescription: {
      mode: { type: String, enum: ['html', 'file'] },
      content: { type: String },
      fileUrl: { type: String },
    },
    placeOfPosting: { type: String },
    dateOfJoining: { type: String },
    numOpenings: { type: Number },
    applicationDeadline: { type: Date },
    eligibility: [
      {
        department: { type: String },
        cpiCutoff: { type: Number },
      },
    ],
    academicEligibility: {
      tenthPercentage: { type: Number },
      twelfthPercentage: { type: Number },
      bachelorsCPI: { type: Number },
      mastersCPI: { type: Number },
    },
    allowBacklog: { type: Boolean },
    salary: {
      currency: { type: String },
      salaryStructureFile: { type: String },
      programmes: [
        {
          programme: { type: String },
          amount: { type: Number },
          ctc: { type: Number },
          base: { type: Number },
          monthlyFixed: { type: Number },
        },
      ],
      accommodationAvailable: { type: Boolean },
      ppoExtension: { type: Boolean },
      additionalInfo: { type: String },
      oneTimeBonus: { type: Number },
    },
    selectionProcess: {
      ppt: { type: Boolean },
      resumeShortlist: { type: Boolean },
      writtenTest: { type: Boolean },
      technicalInterview: { type: Boolean },
      hrInterview: { type: Boolean },
      groupDiscussion: { type: Boolean },
      preInterviewGD: { type: Boolean },
      medicalTest: { type: Boolean },
      testDuration: { type: String },
      interviewDuration: { type: String },
      notes: { type: String },
    },
    bondDetails: {
      hasBond: { type: Boolean },
      durationYears: { type: Number },
      durationMonths: { type: Number },
      description: { type: String },
      documentUrl: { type: String },
    },
    additionalRequirements: [
      {
        title: { type: String },
        description: { type: String },
      },
    ],
    agreedToTerms: { type: Boolean, default: false },
    policyVersion: { type: String },
    finalSelectionFile: { type: String },
    selectedStudents: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  },
  { timestamps: true }
);

const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);

export default Job;
