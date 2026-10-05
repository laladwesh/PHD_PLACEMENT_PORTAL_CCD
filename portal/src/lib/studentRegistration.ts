export interface StudentRecord {
  _id?: string;
  roll_number: number;
  name: string;
  gender?: 'Male' | 'Female' | 'Other';
  major_cpi?: number;
  minor_cpi?: number;
  dob?: string | Date;
  nationality?: string;
  hostel?: string;
  academic_details: {
    major_department?: string;
    major_programme?: string;
    major_discipline?: string;
    minor_department?: string;
    minor_programme?: string;
    minor_discipline?: string;
  };
  room_number?: string;
  email: string;
  alt_email?: string;
  mobile_campus?: number;
  mobile_campus_alt?: number;
  mobile_home?: number;
  disability?: string;
  linkedin_url?: string;
  flat_no?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: number;
  fee_paid: boolean;
  fee_remaining: number;
  schooling: {
    x_percentage?: number;
    x_pass_year?: number;
    x_board?: string;
    x_exam_medium?: string;
    xii_percentage?: number;
    xii_pass_year?: number;
    xii_exam_board?: string;
    xii_exam_medium?: string;
    gap?: number;
    reason_gap?: string;
  };
  profile_pic?: string;
  cv: {
    cv1?: string;
    cv2?: string;
    cv3?: string;
    drive_Link?: string;
    portfolio_Link?: string;
  };
  category?: string;
  backlogs: number;
  year_of_admission?: number;
  year_of_minor_admission?: number;
  jee_ma_gate_rank?: number;
  rank_category?: string;
  entrance_examination?: string;
  semester_wise_spi: Record<string, string | undefined>;
  cv_verified: boolean;
  cv_flagged: boolean;
  cv_flag_note: string;
  cv_verified_by: string;
  cv_verified_at?: string;
  cv_reupload_allowed: boolean;
  registration_complete: boolean;
  savedAnnouncements: string[];
  readAnnouncements: string[];
}

export type StudentUploadKind = 'profile' | 'cv1' | 'cv2' | 'cv3';
const API_ROOT = '/phdplacement/api';

async function readApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || 'Request failed.');
  return payload;
}

export async function loadStudentRecord(): Promise<StudentRecord> {
  const response = await fetch(`${API_ROOT}/students/me`, { credentials: 'include', cache: 'no-store' });
  const result = await readApiResponse<{ student: StudentRecord }>(response);
  return result.student;
}

export async function saveStudentRecord(student: StudentRecord): Promise<StudentRecord> {
  const response = await fetch(`${API_ROOT}/students/me`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student),
  });
  const result = await readApiResponse<{ student: StudentRecord }>(response);
  return result.student;
}

export async function uploadStudentFile(kind: StudentUploadKind, file: File): Promise<{ student: StudentRecord; fileName: string; url: string }> {
  const formData = new FormData();
  formData.set('file', file);
  const response = await fetch(`${API_ROOT}/students/me/uploads/${kind}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return readApiResponse(response);
}