export type JAFStatus = 'Approved' | 'Unapproved' | 'Changes Requested' | 'Incomplete' | 'Rejected';

export interface JobApplication {
  id: number | string;
  company: string;
  designation: string;
  createdAt: string;
  deadline: string;
  status: JAFStatus;
  feedback?: string;
  registeredStudents?: number;
}

export interface DetailedJAF extends JobApplication {
  description: string;
  placeOfPosting: string;
  dateOfJoining?: string;
  expectedRecruitments: number;
  salary: {
    ctc?: string;
    base?: string;
    variable?: string;
    bondDuration?: string;
    medicalInsurance?: string;
    currency?: string;
    salaryStructureFile?: string;
    oneTimeBonus?: number;
    programmes?: Array<{ programme: string; amount?: number; ctc?: number; base?: number; monthlyFixed?: number }>;
    accommodationAvailable?: boolean;
    ppoExtension?: boolean;
    additionalInfo?: string;
  };
  eligibility: {
    departments?: string[];
    minCpi?: number;
    specializations?: string[];
    programmes?: string[];
  } | Array<{ department?: string; programme?: string; cpiCutoff: number }>;
  academicEligibility?: {
    tenthPercentage?: number;
    twelfthPercentage?: number;
    bachelorsCPI?: number;
    mastersCPI?: number;
  };
  selectionProcess: {
    rounds?: string[];
    oaDate?: string;
    interviewMode?: string;
    prePlacementTalkDate?: string;
    ppt?: boolean;
    shortlistResume?: boolean;
    writtenTest?: boolean;
    testRequirements?: string;
    inPerson?: boolean;
    telephonic?: boolean;
    videoConferencing?: boolean;
  };
  bondDetails?: {
    hasBond?: boolean;
    durationYears?: number;
    durationMonths?: number;
    description?: string;
    documentUrl?: string;
  };
  poc: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
}

export interface Department {
  id: string;
  name: string;
}

export type CandidatePlacementStatus = 
  | 'Applied' 
  | 'Shortlisted' 
  | 'Interviewing'
  | 'Offer Extended' 
  | 'Offer Accepted' 
  | 'Blocked (One-Offer Rule)';

export interface Applicant {
  id: number;
  name: string;
  rollNumber: string;
  email: string;
  department: string;
  appliedAt: string;
  status: CandidatePlacementStatus | 'Selected';
}

export interface PhDApplicant {
  id: number;
  name: string;
  rollNumber: string;
  email: string;
  department: string;
  researchArea: string;
  thesisStatus: 'Synopsis Submitted' | 'Pre-Synopsis Complete' | 'Thesis Defended' | 'In-Progress';
  expectedGraduation: string;
  cpi: number;
  supervisor: string;
  supervisorNoc: boolean;
  status: CandidatePlacementStatus;
  applications: {
    jafId: number;
    company: string;
    designation: string;
    status: 'Applied' | 'Shortlisted' | 'Selected' | 'Offer Extended' | 'Auto-Withdrawn (One-Offer Rule)';
  }[];
  placedAt?: {
    company: string;
    designation: string;
    ctc: string;
    acceptedAt: string;
  };
}

export type OfferStatus = 'Offer Received' | 'Approved & Restricted' | 'Declined';

export interface Offer {
  id: string | number;
  candidateName: string;
  rollNumber: string;
  department: string;
  cpi: number;
  thesisStatus: string;
  company: string;
  designation: string;
  ctc: string;
  baseSalary: string;
  status: OfferStatus;
  offeredAt: string;
  responseDeadline: string;
  portalAccessRestricted: boolean;
  blockedApplicationsCount: number;
  approvedAt?: string;
  coordinatorNotes?: string;
}

export interface PlacementCoordinator {
  name: string;
  role: string;
  phone: string;
  email: string;
}

export type UserRole = 'coordinator' | 'student' | 'company';

export interface UserProfile {
  role: UserRole;
  name: string;
  title: string;
  email: string;
  organization?: string;
  rollNumber?: string | number | null;
  companyId?: string | null;
}
