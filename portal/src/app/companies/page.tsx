'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserRole } from '@/lib/auth';

type Company = { _id: string; company_name: string; email: string; organization_type?: string; industry_sec?: string; first_point?: { full_name?: string; contact?: string; email?: string } };

export default function RegisteredCompaniesPage() {
  const { isCoordinator } = useUserRole();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isCoordinator) return;
    let active = true;
    fetch('/phdplacement/api/companies', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || 'Unable to load registered companies.'); if (active) setCompanies(Array.isArray(data.data) ? data.data : []); })
      .catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : 'Unable to load registered companies.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [isCoordinator]);

  const filteredCompanies = companies.filter((company) => `${company.company_name} ${company.email} ${company.organization_type || ''} ${company.industry_sec || ''} ${company.first_point?.full_name || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  if (!isCoordinator) return <DashboardLayout><p className="rounded-lg bg-white p-6 text-sm text-slate-700">Coordinator access is required to view registered companies.</p></DashboardLayout>;

  return <DashboardLayout>
    <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Coordinator directory</p><h1 className="mt-1 text-3xl font-bold text-[#172b4d]">Registered Companies</h1><p className="mt-1 text-sm text-slate-500">Organisation profiles are loaded directly from registered recruiter accounts.</p></div>
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by company, contact, email, type or sector..." className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1b2a4a] focus:ring-2 focus:ring-[#1b2a4a]/15" /><span className="text-xs font-medium text-slate-500">{filteredCompanies.length} compan{filteredCompanies.length === 1 ? 'y' : 'ies'}</span></div>
      {error ? <p role="alert" className="m-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Organisation type</th><th className="px-4 py-3">Industry sector</th><th className="px-4 py-3">1st POC name</th><th className="px-4 py-3">1st POC contact</th><th className="px-4 py-3 text-right">Details</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={7} className="px-4 py-14 text-center text-slate-500">Loading registered companies…</td></tr> : filteredCompanies.length === 0 ? <tr><td colSpan={7} className="px-4 py-14 text-center text-slate-500">No companies match this search.</td></tr> : filteredCompanies.map((company, index) => <tr key={company._id} className="hover:bg-slate-50"><td className="px-4 py-3 text-slate-500">{index + 1}</td><td className="px-4 py-3"><p className="font-semibold text-slate-800">{company.company_name}</p><p className="mt-0.5 text-xs text-slate-500">{company.email}</p></td><td className="px-4 py-3 text-slate-700">{company.organization_type || '—'}</td><td className="px-4 py-3 text-slate-700">{company.industry_sec || '—'}</td><td className="px-4 py-3 text-slate-700">{company.first_point?.full_name || '—'}</td><td className="px-4 py-3 text-slate-700">{company.first_point?.contact || '—'}</td><td className="px-4 py-3 text-right"><Link href={`/companies/${company._id}`} className="inline-flex rounded-md bg-[#1b2a4a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#263b60]">Details</Link></td></tr>)}</tbody></table></div>}
    </section>
  </DashboardLayout>;
}
