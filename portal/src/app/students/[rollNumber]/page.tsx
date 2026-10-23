'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserRole } from '@/lib/auth';
import type { StudentRecord } from '@/lib/studentRegistration';

type Section = 'Basic Information' | 'Address' | 'Profile Links' | 'Research Profile' | 'Previous Education Details' | 'Entrance Exam' | 'Academics' | 'CV Info';
const sections: Section[] = ['Basic Information', 'Address', 'Profile Links', 'Research Profile', 'Previous Education Details', 'Entrance Exam', 'Academics', 'CV Info'];

function display(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

function DetailGrid({ items }: { items: Array<[string, unknown]> }) {
  return <dl className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">{items.map(([label, value]) => <div key={label}><dt className="text-sm font-semibold text-slate-700">{label}</dt><dd className="mt-1 break-words text-base text-slate-600">{display(value)}</dd></div>)}</dl>;
}

export default function CoordinatorStudentDetailsPage({ params }: { params: Promise<{ rollNumber: string }> }) {
  const { rollNumber } = use(params);
  const { isCoordinator } = useUserRole();
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [section, setSection] = useState<Section>('Basic Information');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isCoordinator) return;
    let active = true;
    fetch(`/phdplacement/api/students/${encodeURIComponent(rollNumber)}`, { credentials: 'include', cache: 'no-store' })
      .then(async (response) => { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || 'Unable to load student.'); if (active) setStudent(data.student); })
      .catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : 'Unable to load student.'));
    return () => { active = false; };
  }, [isCoordinator, rollNumber]);

  if (!isCoordinator) return <DashboardLayout><p className="rounded-lg bg-white p-6 text-sm text-slate-700">Coordinator access is required to view student details.</p></DashboardLayout>;
  if (error) return <DashboardLayout><Link href="/students" className="text-sm font-medium text-[#1b2a4a] hover:underline">← Back to registered students</Link><p role="alert" className="mt-4 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</p></DashboardLayout>;
  if (!student) return <DashboardLayout><p className="p-10 text-center text-sm text-slate-500">Loading student profile…</p></DashboardLayout>;

  const schooling = student.schooling || {};
  const academics = student.academic_details || {};
  const cvEntries: Array<[string, 'cv1' | 'cv2', string | undefined]> = [['One-page CV', 'cv1', student.cv?.cv1], ['Detailed CV', 'cv2', student.cv?.cv2]];
  const sectionContent: Record<Section, React.ReactNode> = {
    'Basic Information': <div className="grid gap-8 md:grid-cols-[160px_minmax(0,1fr)]"><div>{student.profile_pic ? <Image src={`/phdplacement/api/students/${student.roll_number}/uploads/profile`} alt={`${student.name} profile`} width={128} height={128} unoptimized className="h-28 w-28 rounded-full border border-slate-200 object-cover" /> : <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-100 text-4xl font-bold text-[#1b2a4a]">{student.name.slice(0, 1)}</div>}</div><DetailGrid items={[["Full name", student.name], ["Webmail", student.email], ["Roll number", student.roll_number], ["Alternate email", student.alt_email], ["Gender", student.gender], ["Date of birth", student.dob ? new Date(student.dob).toLocaleDateString() : ''], ["Campus mobile", student.mobile_campus], ["Alternative mobile", student.mobile_campus_alt], ["Home mobile", student.mobile_home], ["Nationality", student.nationality], ["Category", student.category], ["Disability", student.disability], ["Hostel", student.hostel], ["Room number", student.room_number]]} /></div>,
    Address: <DetailGrid items={[["Flat / house number", student.flat_no], ["Street address", student.address], ["City", student.city], ["State", student.state], ["PIN code", student.pincode]]} />,
    'Profile Links': <DetailGrid items={[["LinkedIn profile", student.linkedin_url], ["Portfolio website", student.portfolio_url], ["Google Scholar profile", student.google_scholar_url], ["ORCID iD", student.orcid_id]]} />,
    'Research Profile': <DetailGrid items={[["Tentative thesis title", student.thesis_title], ["Keywords", (student.keywords || []).join(', ')]]} />,
    'Previous Education Details': <div className="space-y-8"><div><h3 className="mb-4 text-base font-bold text-[#172b4d]">Class X</h3><DetailGrid items={[["Percentage", schooling.x_percentage], ["Passing year", schooling.x_pass_year], ["Board", schooling.x_board], ["Examination medium", schooling.x_exam_medium]]} /></div><div><h3 className="mb-4 text-base font-bold text-[#172b4d]">Class XII</h3><DetailGrid items={[["Percentage", schooling.xii_percentage], ["Passing year", schooling.xii_pass_year], ["Board", schooling.xii_exam_board], ["Examination medium", schooling.xii_exam_medium]]} /></div><div><h3 className="mb-4 text-base font-bold text-[#172b4d]">Undergraduate</h3><DetailGrid items={[["Major discipline", schooling.ug_major_discipline], ["CPI", schooling.ug_cpi]]} /></div><div><h3 className="mb-4 text-base font-bold text-[#172b4d]">Postgraduate (optional)</h3><DetailGrid items={[["Major discipline", schooling.pg_major_discipline], ["CPI", schooling.pg_cpi]]} /></div><div><h3 className="mb-4 text-base font-bold text-[#172b4d]">Other information</h3><DetailGrid items={[["Education gap (years)", schooling.gap], ["Reason for gap", schooling.reason_gap]]} /></div></div>,
    'Entrance Exam': <DetailGrid items={[["Entrance examination", student.entrance_examination], ["JEE / MA / GATE rank", student.jee_ma_gate_rank], ["Rank category", student.rank_category]]} />,
    Academics: <DetailGrid items={[["Year of admission", student.year_of_admission], ["Active backlogs", student.backlogs === 0 ? '—' : student.backlogs], ["Major department", academics.major_department], ["Major programme", academics.major_programme], ["Major discipline", academics.major_discipline], ["Major CPI", student.major_cpi], ["Eligible for placements", student.is_eligible_for_placement !== false ? 'Yes (placement and internship jobs)' : 'No (internship jobs only)'], ["CPI last updated by the scholar", student.cpi_updated_at ? new Date(student.cpi_updated_at).toLocaleDateString('en-IN') : '—']]} />,
    'CV Info': <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2">{cvEntries.map(([label, key, file]) => <div key={key} className="rounded-lg border border-slate-200 p-4"><p className="font-semibold text-slate-800">{label}</p><p className="mt-1 text-sm text-slate-500">{file ? 'Uploaded' : 'Not uploaded'}</p>{file && <a href={`/phdplacement/api/students/${student.roll_number}/uploads/${key}`} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-[#1b2a4a] hover:underline">View PDF</a>}</div>)}</div><DetailGrid items={[["CV verification", student.cv_verified ? 'Verified' : 'Pending review'], ["Verification note", student.cv_flag_note], ["Google Drive folder", student.cv?.drive_Link], ["Registration complete", student.registration_complete ? 'Yes' : 'No'], ["Fee status", student.fee_paid ? 'Paid' : 'Unpaid']]} /></div>,
  };

  return <DashboardLayout>
    <Link href="/students" className="text-sm font-medium text-[#1b2a4a] hover:underline">← Back to registered students</Link>
    <section className="mt-4 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-3xl font-bold text-[#172b4d]">{student.name}</h1><p className="mt-1 text-sm text-slate-500">Roll no. {student.roll_number} · {student.email}</p></div><div className="flex gap-2 text-xs font-semibold"><span className={`rounded px-2 py-1 ${student.registration_complete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{student.registration_complete ? 'Profile complete' : 'Profile incomplete'}</span><span className={`rounded px-2 py-1 ${student.cv_verified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{student.cv_verified ? 'CV verified' : 'CV pending'}</span><span className={`rounded px-2 py-1 ${student.fee_paid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{student.fee_paid ? 'Fee paid' : 'Fee unpaid'}</span></div></div>
      <div className="flex gap-6 overflow-x-auto border-b border-slate-200" role="tablist" aria-label="Student profile sections">{sections.map((item) => <button key={item} type="button" role="tab" aria-selected={section === item} onClick={() => setSection(item)} className={`shrink-0 border-b-2 px-1 py-3 text-sm font-medium ${section === item ? 'border-[#1b2a4a] text-[#1b2a4a]' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>{item}</button>)}</div>
      <div className="pt-7"><p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Student profile</p><h2 className="mb-6 text-xl font-bold text-[#172b4d]">{section}</h2>{sectionContent[section]}</div>
    </section>
  </DashboardLayout>;
}
