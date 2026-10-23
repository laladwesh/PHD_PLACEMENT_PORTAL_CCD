'use client';

import { ChangeEvent, FormEvent, Fragment, useEffect, useState } from 'react';
import Image from 'next/image';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserRole } from '@/lib/auth';
import { REGISTRATION_FEE } from '@/lib/fees';
import {
  loadStudentRecord,
  saveStudentRecord,
  uploadStudentFile,
  StudentRecord,
} from '@/lib/studentRegistration';

type RegistrationStep = 'profile' | 'cv' | 'fee';
type ProfileSection = 'Basic Information' | 'Address' | 'Profile Links' | 'Research Profile' | 'Previous Education Details' | 'Entrance Exam' | 'Academics';
type FieldDefinition = {
  label: string;
  path: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'url' | 'select' | 'textarea';
  required?: boolean;
  readOnly?: boolean;
  options?: string[];
  placeholder?: string;
  heading?: string;
};

const sections: ProfileSection[] = [
  'Basic Information',
  'Address',
  'Profile Links',
  'Research Profile',
  'Previous Education Details',
  'Entrance Exam',
  'Academics',
];

const numericPaths = new Set([
  'roll_number', 'mobile_campus', 'mobile_campus_alt', 'mobile_home', 'pincode',
  'schooling.x_percentage', 'schooling.x_pass_year', 'schooling.xii_percentage',
  'schooling.xii_pass_year', 'schooling.gap', 'year_of_admission',
  'backlogs', 'jee_ma_gate_rank', 'major_cpi', 'schooling.ug_cpi', 'schooling.pg_cpi',
]);

const fieldsBySection: Record<ProfileSection, FieldDefinition[]> = {
  'Basic Information': [
    { label: 'Full name', path: 'name', required: true, readOnly: true },
    { label: 'Webmail', path: 'email', type: 'email', required: true, readOnly: true },
    { label: 'Roll number', path: 'roll_number', readOnly: true },
    { label: 'Alternate email', path: 'alt_email', type: 'email', required: true },
    { label: 'Gender', path: 'gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
    { label: 'Date of birth', path: 'dob', type: 'date', required: true },
    { label: 'Mobile (Campus)', path: 'mobile_campus', type: 'tel', required: true },
    { label: 'Mobile (Alternative)', path: 'mobile_campus_alt', type: 'tel' },
    { label: 'Mobile (Home)', path: 'mobile_home', type: 'tel' },
    { label: 'Nationality', path: 'nationality', placeholder: 'Indian' },
    { label: 'Category', path: 'category', type: 'select', options: ['General', 'SC', 'ST', 'Gen-EWS', 'OBC-NCL', 'General-PwD', 'SC-PwD', 'ST-PwD', 'OBC-PwD', 'EWS-PwD'] },
    { label: 'Disability', path: 'disability', placeholder: 'If applicable' },
    { label: 'Hostel', path: 'hostel' },
    { label: 'Room number', path: 'room_number' },
  ],
  Address: [
    { label: 'Flat / house number', path: 'flat_no' },
    { label: 'Street address', path: 'address', type: 'textarea', required: true },
    { label: 'City', path: 'city', required: true },
    { label: 'State', path: 'state', required: true },
    { label: 'PIN code', path: 'pincode', type: 'number', required: true },
  ],
  'Profile Links': [
    { label: 'LinkedIn Profile', path: 'linkedin_url', type: 'url', required: true, placeholder: 'https://www.linkedin.com/in/your-profile' },
    { label: 'Portfolio Website (optional)', path: 'portfolio_url', type: 'url', placeholder: 'https://your-portfolio.example' },
    { label: 'Google Scholar Profile (optional)', path: 'google_scholar_url', type: 'url', placeholder: 'https://scholar.google.com/...' },
    { label: 'ORCID iD (optional)', path: 'orcid_id', placeholder: '0000-0000-0000-0000' },
  ],
  'Research Profile': [
    { label: 'Tentative thesis title (optional)', path: 'thesis_title', type: 'textarea', placeholder: 'You can change this at any time' },
  ],
  'Previous Education Details': [
    { label: 'Percentage', path: 'schooling.x_percentage', type: 'number', heading: 'Class X' },
    { label: 'Class X passing year', path: 'schooling.x_pass_year', type: 'number' },
    { label: 'Class X board', path: 'schooling.x_board' },
    { label: 'Class X exam medium', path: 'schooling.x_exam_medium' },
    { label: 'Percentage', path: 'schooling.xii_percentage', type: 'number', heading: 'Class XII' },
    { label: 'Class XII passing year', path: 'schooling.xii_pass_year', type: 'number' },
    { label: 'Class XII board', path: 'schooling.xii_exam_board' },
    { label: 'Class XII exam medium', path: 'schooling.xii_exam_medium' },
    { label: 'Major Discipline', path: 'schooling.ug_major_discipline', required: true, heading: 'Undergraduate' },
    { label: 'CPI', path: 'schooling.ug_cpi', type: 'number', required: true },
    { label: 'Major Discipline', path: 'schooling.pg_major_discipline', placeholder: 'Leave blank if you have no postgraduate degree', heading: 'Postgraduate (optional)' },
    { label: 'CPI', path: 'schooling.pg_cpi', type: 'number' },
    { label: 'Education gap (years)', path: 'schooling.gap', type: 'number', heading: 'Other information' },
    { label: 'Reason for gap', path: 'schooling.reason_gap', type: 'textarea' },
  ],
  'Entrance Exam': [
    { label: 'Entrance examination', path: 'entrance_examination', placeholder: 'GATE, JEE, etc.' },
    { label: 'JEE / MA / GATE rank', path: 'jee_ma_gate_rank', type: 'number' },
    { label: 'Rank category', path: 'rank_category' },
  ],
  Academics: [],
};

// Scholars keep their own CPI up to date; it is used for programme/CPI eligibility on every JAF.
const cpiFields: FieldDefinition[] = [
  { label: 'Current CPI (out of 10)', path: 'major_cpi', type: 'number', placeholder: 'e.g. 8.45', heading: 'CPI (you can update this at any time)' },
];

const academicFields = [
  { label: 'Year of Admission', path: 'year_of_admission' },
  { label: 'Active Backlogs', path: 'backlogs' },
  { label: 'Major Department', path: 'academic_details.major_department' },
  { label: 'Major Programme', path: 'academic_details.major_programme' },
  { label: 'Major Discipline', path: 'academic_details.major_discipline' },
  { label: 'Eligible for placements (set by CCD)', path: 'is_eligible_for_placement' },
];

function emptyStudentRecord(): StudentRecord {
  return {
    roll_number: 240101010,
    name: '',
    email: '',
    fee_paid: true,
    fee_remaining: 0,
    academic_details: {},
    schooling: {},
    cv: {},
    backlogs: 0,
    cv_verified: false,
    cv_flagged: false,
    cv_flag_note: '',
    cv_verified_by: '',
    cv_reupload_allowed: false,
    registration_complete: false,
    savedAnnouncements: [],
    readAnnouncements: [],
  };
}

function readPath(record: StudentRecord, path: string): string {
  const value = path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object') return (current as Record<string, unknown>)[key];
    return undefined;
  }, record);
  if (value === undefined || value === null) return '';
  if (path === 'dob') return new Date(value as string | Date).toISOString().slice(0, 10);
  return String(value);
}

function updatePath(record: StudentRecord, path: string, rawValue: string): StudentRecord {
  const next = structuredClone(record);
  const keys = path.split('.');
  let target: Record<string, unknown> = next as unknown as Record<string, unknown>;
  for (const key of keys.slice(0, -1)) {
    target[key] = { ...(target[key] as Record<string, unknown> | undefined) };
    target = target[key] as Record<string, unknown>;
  }
  const value = numericPaths.has(path) ? (rawValue === '' ? undefined : Number(rawValue)) : rawValue;
  target[keys[keys.length - 1]] = value;
  return next;
}

function RegistrationHeader({ step }: { step: RegistrationStep }) {
  const titles: Record<RegistrationStep, string> = {
    profile: 'Profile Update',
    cv: 'CV Upload',
    fee: 'Fee Payment',
  };
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Student registration</p>
        <h1 className="text-3xl font-bold text-[#172b4d]">{titles[step]}</h1>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Your changes are saved to your student record
      </div>
    </div>
  );
}

function FieldGrid({
  fields,
  student,
  onChange,
}: {
  fields: FieldDefinition[];
  student: StudentRecord;
  onChange: (path: string, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
      {fields.map((field) => (
        <Fragment key={field.path}>
          {field.heading && <h3 className="-mb-1 mt-2 text-base font-bold text-[#172b4d] md:col-span-2">{field.heading}</h3>}
          <label className={`block ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
          <span className="mb-1.5 block text-sm font-semibold text-slate-800">
            {field.label}{field.required && <span className="ml-1 text-red-500">*</span>}
          </span>
          {field.type === 'select' ? (
            <select
              required={field.required}
              disabled={field.readOnly}
              value={readPath(student, field.path)}
              onChange={(event) => onChange(field.path, event.target.value)}
              className="h-10 w-full rounded border border-slate-400 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#1b2a4a] focus:ring-2 focus:ring-[#1b2a4a]/15 disabled:bg-slate-100"
            >
              <option value="">Select {field.label.toLowerCase()}</option>
              {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              required={field.required}
              value={readPath(student, field.path)}
              onChange={(event) => onChange(field.path, event.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="w-full resize-y rounded border border-slate-400 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1b2a4a] focus:ring-2 focus:ring-[#1b2a4a]/15"
            />
          ) : (
            <input
              type={field.type ?? 'text'}
              required={field.required}
              readOnly={field.readOnly}
              min={field.type === 'number' ? 0 : undefined}
              max={field.path.includes('percentage') ? 100 : field.path.endsWith('_cpi') ? 10 : undefined}
              step={field.path.endsWith('_cpi') || field.path.includes('percentage') ? '0.01' : undefined}
              value={readPath(student, field.path)}
              onChange={(event) => onChange(field.path, event.target.value)}
              placeholder={field.placeholder}
              className="h-10 w-full rounded border border-slate-400 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1b2a4a] focus:ring-2 focus:ring-[#1b2a4a]/15 read-only:bg-slate-100"
            />
          )}
          </label>
        </Fragment>
      ))}
    </div>
  );
}

// Up to 10 free-text keywords (research areas, methods, skills: anything the scholar wants to show).
const MAX_KEYWORDS = 10;
function KeywordsInput({ keywords, onChange }: { keywords: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const full = keywords.length >= MAX_KEYWORDS;

  const add = (raw: string) => {
    const next = [...keywords];
    for (const part of raw.split(',').map((item) => item.trim().replace(/\s+/g, ' ')).filter(Boolean)) {
      if (next.length >= MAX_KEYWORDS) break;
      if (next.some((keyword) => keyword.toLowerCase() === part.toLowerCase())) continue;
      next.push(part.slice(0, 60));
    }
    onChange(next);
    setDraft('');
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-slate-800">Keywords (optional, up to {MAX_KEYWORDS})</span>
      {keywords.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <span key={keyword} className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 py-1 pl-3 pr-2 text-sm text-slate-800">
              {keyword}
              <button type="button" aria-label={`Remove ${keyword}`} onClick={() => onChange(keywords.filter((item) => item !== keyword))} className="rounded-full px-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900">&times;</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          disabled={full}
          maxLength={60}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); add(draft); } }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={full ? 'You have added 10 keywords' : 'Type a keyword and press Enter'}
          className="h-10 w-full rounded border border-slate-400 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1b2a4a] focus:ring-2 focus:ring-[#1b2a4a]/15 disabled:bg-slate-100"
        />
        <button type="button" disabled={full || !draft.trim()} onClick={() => add(draft)} className="rounded border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Add</button>
      </div>
      <p className="mt-1.5 text-xs text-slate-500">{keywords.length} of {MAX_KEYWORDS} added. Press Enter or a comma to add one. Coordinators and recruiters can see these.</p>
    </div>
  );
}

function ReadOnlyGrid({ student, fields }: { student: StudentRecord; fields: { label: string; path: string }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
      {fields.map((field) => {
        const value = readPath(student, field.path);
        return (
          <div key={field.path}>
            <dt className="text-sm font-semibold text-slate-700">{field.label}</dt>
            <dd className="mt-1 text-base text-slate-600">{field.path === 'is_eligible_for_placement' ? (value === 'false' ? 'No: internship jobs only' : 'Yes: placement and internship jobs') : field.path === 'backlogs' && value === '0' ? '—' : value || '—'}</dd>
          </div>
        );
      })}
    </dl>
  );
}

function ProfileRegistration() {
  const { isStudent } = useUserRole();
  const [student, setStudent] = useState<StudentRecord>(emptyStudentRecord);
  const [section, setSection] = useState<ProfileSection>('Basic Information');
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    if (!isStudent) return;
    let active = true;
    loadStudentRecord()
      .then((saved) => {
        if (active) setStudent(saved);
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Unable to load your student record.'))
      .finally(() => active && setReady(true));
    return () => { active = false; };
  }, [isStudent]);

  const handleChange = (path: string, value: string) => setStudent((current) => updatePath(current, path, value));
  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setStudent(await saveStudentRecord(student));
      setMessage('Profile saved');
    } catch {
      setMessage('Could not save your profile. Check the MongoDB connection and try again.');
    }
  };
  const currentIndex = sections.indexOf(section);

  if (!isStudent) {
    return <DashboardLayout><p className="bg-white p-6 text-sm text-slate-700">Switch to the student role to view student registration.</p></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <RegistrationHeader step="profile" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-red-100 bg-white px-5 py-3">
        <span className="text-sm font-semibold text-[#172b4d]">{student.name || 'Complete your student profile'}</span>
        <span className="text-sm text-red-600">Complete your profile before the CV verification deadline.</span>
      </div>
      <section className="bg-white px-5 pb-5 pt-2 shadow-sm sm:px-7">
        <div className="flex gap-6 overflow-x-auto border-b border-slate-200" role="tablist" aria-label="Profile sections">
          {sections.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={section === item}
              onClick={() => { setSection(item); setMessage(''); }}
              className={`shrink-0 border-b-2 px-1 py-4 text-sm font-medium ${section === item ? 'border-[#1b2a4a] text-[#1b2a4a]' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
            >
              {item}
            </button>
          ))}
        </div>
        <form onSubmit={handleSave} className="pt-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Registration profile</p>
              <h2 className="mt-1 text-xl font-bold text-[#172b4d]">{section}</h2>
            </div>
            {section === 'Basic Information' && student.name && (
              <p className="text-sm text-slate-500">Institute email: <span className="font-medium text-slate-700">{student.email}</span></p>
            )}
          </div>
          {section === 'Research Profile' ? (
            <div className="space-y-6">
              <FieldGrid fields={fieldsBySection[section]} student={student} onChange={handleChange} />
              <KeywordsInput keywords={student.keywords ?? []} onChange={(keywords) => setStudent((current) => ({ ...current, keywords }))} />
            </div>
          ) : section === 'Academics' ? (
            <div className="space-y-8">
              <ReadOnlyGrid student={student} fields={academicFields} />
              <FieldGrid fields={cpiFields} student={student} onChange={handleChange} />
            </div>
          ) : (
            <FieldGrid fields={fieldsBySection[section]} student={student} onChange={handleChange} />
          )}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <p role="status" className="min-h-5 text-sm text-slate-500">{ready ? message : 'Loading your profile...'}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setSection(sections[currentIndex - 1])}
                className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              {section !== 'Academics' && (
                <button type="submit" className="rounded bg-[#1b2a4a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#263b60]">
                  Save section
                </button>
              )}
              <button
                type="button"
                disabled={currentIndex === sections.length - 1}
                onClick={() => { setSection(sections[currentIndex + 1]); setMessage(''); }}
                className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next section
              </button>
            </div>
          </div>
        </form>
      </section>
    </DashboardLayout>
  );
}

type UploadSlot = 'profile' | 'cv1' | 'cv2';
const cvSlots: { key: 'cv1' | 'cv2'; title: string; description: string }[] = [
  { key: 'cv1', title: 'One-page CV', description: 'A concise one-page CV (PDF)' },
  { key: 'cv2', title: 'Detailed CV', description: 'Your full CV with publications, projects and experience (PDF)' },
];

function CvRegistration() {
  const { isStudent } = useUserRole();
  const [student, setStudent] = useState<StudentRecord>(emptyStudentRecord);
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isStudent) return;
    let active = true;
    loadStudentRecord()
      .then((saved) => {
        if (active) setStudent(saved);
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Unable to load student uploads.'))
      .finally(() => active && setReady(true));
    return () => { active = false; };
  }, [isStudent]);

  const handleUpload = async (slot: UploadSlot, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const isPhoto = slot === 'profile';
    const allowedType = isPhoto ? file.type.startsWith('image/') : file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const maxSize = isPhoto ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (!allowedType) {
      setMessage(isPhoto ? 'Choose a JPEG or PNG image.' : 'CV files must be PDF documents.');
      return;
    }
    if (file.size > maxSize) {
      setMessage(`${isPhoto ? 'Profile photos' : 'CVs'} must be smaller than ${isPhoto ? '5 MB' : '10 MB'}.`);
      return;
    }
    try {
      const result = await uploadStudentFile(slot, file);
      setStudent(result.student);
      setMessage(`${result.fileName} uploaded`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed. Check the MongoDB connection and try again.');
    }
  };

  const openUpload = (slot: UploadSlot) => {
    window.open(`/phdplacement/api/students/me/uploads/${slot}`, '_blank', 'noopener,noreferrer');
  };

  const getSlotStatus = (slotKey: 'cv1' | 'cv2') => {
    const filePath = student.cv?.[slotKey];
    if (!filePath) {
      return { text: 'Not uploaded', classes: 'text-slate-500 bg-slate-100 border border-slate-200' };
    }
    if (student.cv_flagged) {
      return { text: 'Flagged', classes: 'text-amber-700 bg-amber-50 border border-amber-200' };
    }
    if (student.cv_verified) {
      return { text: 'Verified', classes: 'text-emerald-700 bg-emerald-50 border border-emerald-200' };
    }
    return { text: 'Pending review', classes: 'text-blue-700 bg-blue-50 border border-blue-200' };
  };

  if (!isStudent) {
    return <DashboardLayout><p className="bg-white p-6 text-sm text-slate-700">Switch to the student role to manage student uploads.</p></DashboardLayout>;
  }

  const hasAnyCv = Boolean(student.cv?.cv1 || student.cv?.cv2);

  return (
    <DashboardLayout>
      <RegistrationHeader step="cv" />
      <div className="space-y-4">
        {/* CV Review Status Banner */}
        {student.cv_flagged ? (
          <div className="border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900 shadow-xs">
            <div className="font-semibold flex items-center gap-2">
              <span>⚠️</span> CV Flagged by CCD Coordinator
            </div>
            <p className="mt-1">
              <strong>Admin review note:</strong> {student.cv_flag_note || 'Your CV has been flagged for revisions. Please review the feedback and update your file.'}
            </p>
            <p className="mt-1 text-xs text-amber-700">You can upload a replacement CV at any time; it is verified automatically.</p>
          </div>
        ) : student.cv_verified ? (
          <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-xs">
            <div className="font-semibold flex items-center gap-2">
              <span>✓</span> CV Verified
            </div>
            <p className="mt-1 text-xs text-emerald-700">
              Your CV is verified automatically when you upload it, and you can upload or replace it at any time.
            </p>
          </div>
        ) : hasAnyCv ? (
          <div className="border-l-4 border-blue-500 bg-blue-50 p-4 text-sm text-blue-900 shadow-xs">
            <div className="font-semibold flex items-center gap-2">
              <span>⏳</span> Verification Pending
            </div>
            <p className="mt-1 text-xs text-blue-700">
              Your uploaded CV is submitted and awaiting review by the placement coordinator.
            </p>
          </div>
        ) : (
          <div className="border-l-4 border-slate-400 bg-slate-50 p-4 text-sm text-slate-800 shadow-xs">
            <div className="font-semibold flex items-center gap-2">
              <span>📄</span> CV Upload Required
            </div>
            <p className="mt-1 text-xs text-slate-600">
              No CV has been uploaded yet. Upload your PDF resume in CV1 (and CV2 for dual profiles) to submit for coordinator verification.
            </p>
          </div>
        )}

        <section className="grid gap-5 bg-white p-5 shadow-sm sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-7">
          <div className="flex items-center gap-4">
            {student.profile_pic ? (
              <Image src="/phdplacement/api/students/me/uploads/profile" alt="Student profile" width={56} height={56} unoptimized className="h-14 w-14 rounded-full border border-slate-200 object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-[#1b2a4a]">
                {student.name.slice(0, 1) || 'S'}
              </div>
            )}
            <div>
              <h2 className="font-bold text-slate-900">Profile photo</h2>
              <p className="text-sm text-slate-500">{student.profile_pic?.split(/[\\/]/).pop() || 'Not uploaded'}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">Upload a passport-size photo (JPEG or PNG, max 5 MB)</p>
          <div className="flex items-center gap-3">
            {student.profile_pic && <button type="button" onClick={() => openUpload('profile')} className="px-3 py-2 text-sm font-semibold text-[#1b2a4a] hover:underline">View</button>}
            <label className="cursor-pointer rounded bg-[#1b2a4a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#263b60]">
              {student.profile_pic ? 'Change photo' : 'Upload photo'}
              <input className="sr-only" type="file" accept="image/jpeg,image/png" onChange={(event) => handleUpload('profile', event)} />
            </label>
          </div>
        </section>

        <p className="text-sm font-semibold text-orange-700">Use a clear, recent photo. Photo changes are available during registration.</p>

        {cvSlots.map((slot) => {
          const isUploaded = Boolean(student.cv?.[slot.key]);
          const slotStatus = getSlotStatus(slot.key);
          return (
            <section key={slot.key} className="grid gap-4 bg-white p-5 shadow-sm sm:grid-cols-[minmax(190px,0.8fr)_minmax(200px,1fr)_minmax(180px,1fr)_auto] sm:items-center sm:px-7">
              <div className="flex items-center gap-3">
                <span className={`text-xl font-bold ${isUploaded ? 'text-emerald-600' : 'text-slate-300'}`} aria-hidden="true">{isUploaded ? '✓' : '○'}</span>
                <div>
                  <h2 className="font-bold text-slate-900">{slot.title}</h2>
                  <p className="text-sm text-slate-500">{isUploaded ? 'Uploaded' : 'Yet to upload'}</p>
                </div>
              </div>
              <div className="min-w-0">
                <p className={`truncate text-sm font-semibold ${isUploaded ? 'text-slate-800' : 'text-slate-400'}`}>{student.cv?.[slot.key] || 'No file uploaded yet'}</p>
                {isUploaded && <button type="button" onClick={() => openUpload(slot.key)} className="mt-1 text-sm text-[#1b2a4a] hover:underline">View PDF</button>}
              </div>
              <p className="text-sm text-slate-500">ⓘ &nbsp;{slot.description}</p>
              <div className="flex items-center gap-3 sm:justify-end">
                <span className={`whitespace-nowrap rounded px-2.5 py-1 text-xs font-semibold ${slotStatus.classes}`}>{slotStatus.text}</span>
                <label className="cursor-pointer rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  {isUploaded ? 'Replace' : 'Choose PDF'}
                  <input
                    className="sr-only"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(event) => handleUpload(slot.key, event)}
                  />
                </label>
              </div>
            </section>
          );
        })}
        <section className="bg-white p-5 shadow-sm sm:px-7">
          <h2 className="mb-4 font-bold text-[#172b4d]">Additional links</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-800 md:col-span-2">Google Drive folder link (publications &amp; proofs)
              <span className="mt-0.5 block text-xs font-normal text-slate-500">
                Optional. Share one folder and keep adding your latest publications and proof documents to it. Make sure anyone with the link can view it. You can change this link at any time.
              </span>
              <input type="url" value={student.cv.drive_Link ?? ''} onChange={(event) => setStudent((current) => ({ ...current, cv: { ...current.cv, drive_Link: event.target.value } }))} placeholder="https://drive.google.com/..." className="mt-1.5 h-10 w-full rounded border border-slate-400 px-3 font-normal outline-none focus:border-[#1b2a4a] focus:ring-2 focus:ring-[#1b2a4a]/15" />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p role="status" className="text-sm text-slate-500">{ready ? message : 'Loading your uploads...'}</p>
            <button type="button" onClick={async () => {
              try { setStudent(await saveStudentRecord(student)); setMessage('Links saved'); }
              catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save links.'); }
            }} className="rounded bg-[#1b2a4a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#263b60]">Save links</button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function FeeRegistration() {
  const { isStudent } = useUserRole();
  const [student, setStudent] = useState<StudentRecord>(emptyStudentRecord);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isStudent) return;
    let active = true;
    loadStudentRecord()
      .then((saved) => active && setStudent(saved))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Unable to load payment status.'))
      .finally(() => active && setReady(true));
    return () => { active = false; };
  }, [isStudent]);

  if (!isStudent) {
    return <DashboardLayout><p className="bg-white p-6 text-sm text-slate-700">Switch to the student role to view registration fees.</p></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <RegistrationHeader step="fee" />
      <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
        <div className="bg-white px-6 py-5 sm:px-7">
          <p className="text-sm font-medium text-slate-500">Registration fee</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">₹{REGISTRATION_FEE.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white px-6 py-5 sm:px-7">
          <p className="text-sm font-medium text-slate-500">Payment deadline</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">31/05/2026</p>
        </div>
        <div className="bg-white px-6 py-5 sm:px-7">
          <p className="text-sm font-medium text-slate-500">Payment status</p>
          <p className={`mt-1 text-2xl font-bold ${student.fee_paid ? 'text-emerald-600' : 'text-red-600'}`}>
            {!ready ? 'Loading' : student.fee_paid ? 'Paid' : 'Unpaid'}
          </p>
        </div>
      </div>
      {message && <p role="alert" className="mt-4 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>}
      {!student.fee_paid && ready && (
        <div className="mt-4 bg-white px-6 py-4 text-sm text-slate-700">
          <span className="font-semibold">Amount remaining:</span> ₹{student.fee_remaining.toLocaleString('en-IN')}. Payment status is updated by CCD after payment confirmation.
        </div>
      )}
      <section className="mt-5 bg-white px-6 py-5 sm:px-7">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Note</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700 sm:text-base">
          <li>Payment for participating in the internship process is made through the IITG Epay payment portal.</li>
          <li>If your payment status is not updated after payment, please allow 1–2 days for processing. If it is still not updated, contact the Technical Support Team, CCD, IIT Guwahati.</li>
        </ul>
      </section>
    </DashboardLayout>
  );
}

export default function RegistrationPage({ step }: { step: RegistrationStep }) {
  if (step === 'profile') return <ProfileRegistration />;
  if (step === 'cv') return <CvRegistration />;
  return <FeeRegistration />;
}

