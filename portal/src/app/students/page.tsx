'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserRole } from '@/lib/auth';

type Student = {
  roll_number: number;
  name: string;
  email: string;
  major_cpi?: number;
  academic_details?: { major_programme?: string; major_discipline?: string };
  registration_complete?: boolean;
  cv_verified?: boolean;
  fee_paid?: boolean;
  is_eligible_for_placement?: boolean;
  cv?: { cv1?: string; cv2?: string };
};

export default function RegisteredStudentsPage() {
  const { isCoordinator } = useUserRole();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isCoordinator) return;
    let active = true;
    fetch('/phdplacement/api/students?limit=100', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Unable to load registered students.');
        if (active) setStudents(Array.isArray(data.students) ? data.students : []);
      })
      .catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : 'Unable to load registered students.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [isCoordinator]);

  const [savingRoll, setSavingRoll] = useState<number | null>(null);

  // Only a coordinator can mark a scholar as eligible for placements (internship-only scholars cannot apply to placement JAFs).
  const togglePlacement = async (student: Student) => {
    const next = student.is_eligible_for_placement === false;
    setSavingRoll(student.roll_number);
    try {
      const response = await fetch(`/phdplacement/api/students/${student.roll_number}/review`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_eligible_for_placement: next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to update this scholar.');
      setStudents((current) => current.map((item) => (item.roll_number === student.roll_number ? { ...item, is_eligible_for_placement: next } : item)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update this scholar.');
    } finally {
      setSavingRoll(null);
    }
  };

  const filteredStudents = students.filter((student) => {
    const text = `${student.name} ${student.email} ${student.roll_number} ${student.academic_details?.major_programme || ''} ${student.academic_details?.major_discipline || ''}`.toLowerCase();
    return text.includes(search.trim().toLowerCase());
  });

  if (!isCoordinator) return <DashboardLayout><p className="rounded-lg bg-white p-6 text-sm text-slate-700">Coordinator access is required to view registered students.</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Coordinator directory</p>
        <h1 className="mt-1 text-3xl font-bold text-[#172b4d]">Registered Students</h1>
        <p className="mt-1 text-sm text-slate-500">All PhD placement scholars are loaded directly from the student registration records.</p>
      </div>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, roll number, programme or discipline..." className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1b2a4a] focus:ring-2 focus:ring-[#1b2a4a]/15" />
          <span className="text-xs font-medium text-slate-500">{filteredStudents.length} scholar{filteredStudents.length === 1 ? '' : 's'}</span>
        </div>
        {error ? <p role="alert" className="m-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">IITG webmail</th><th className="px-4 py-3">Roll number</th><th className="px-4 py-3">Programme</th><th className="px-4 py-3">Discipline</th><th className="px-4 py-3">CPI</th><th className="px-4 py-3">CV / Verification</th><th className="px-4 py-3">Eligible for placements</th><th className="px-4 py-3 text-right">Details</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <tr><td colSpan={10} className="px-4 py-14 text-center text-slate-500">Loading registered students…</td></tr> : filteredStudents.length === 0 ? <tr><td colSpan={10} className="px-4 py-14 text-center text-slate-500">No students match this search.</td></tr> : filteredStudents.map((student, index) => {
                  const uploaded = [student.cv?.cv1, student.cv?.cv2].filter(Boolean).length;
                  return <tr key={student.roll_number} className="hover:bg-slate-50"><td className="px-4 py-3 text-slate-500">{index + 1}</td><td className="px-4 py-3 font-semibold text-slate-800">{student.name}</td><td className="px-4 py-3 text-slate-600">{student.email}</td><td className="px-4 py-3 font-mono text-slate-700">{student.roll_number}</td><td className="px-4 py-3 text-slate-700">{student.academic_details?.major_programme || '—'}</td><td className="px-4 py-3 text-slate-700">{student.academic_details?.major_discipline || '—'}</td><td className="px-4 py-3 font-semibold text-slate-700">{student.major_cpi ?? '—'}</td><td className="px-4 py-3"><span className="font-medium text-slate-700">{uploaded}/2 uploaded</span><span className={`ml-2 rounded px-2 py-0.5 text-xs font-semibold ${student.cv_verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{student.cv_verified ? 'Verified' : 'Pending'}</span></td><td className="px-4 py-3"><label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" className="h-4 w-4 accent-[#1b2a4a]" checked={student.is_eligible_for_placement !== false} disabled={savingRoll === student.roll_number} onChange={() => togglePlacement(student)} aria-label={`${student.name} is eligible for placements`} />{student.is_eligible_for_placement !== false ? 'Placement' : 'Internship only'}</label></td><td className="px-4 py-3 text-right"><Link href={`/students/${student.roll_number}`} className="inline-flex rounded-md bg-[#1b2a4a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#263b60]">Details</Link></td></tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
