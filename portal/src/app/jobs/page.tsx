'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserRole } from '@/lib/auth';
import { DetailedJAF, JAFStatus } from '@/lib/types';
import { JAFReviewModal } from '@/components/coordinator/JAFReviewModal';
import { EditJAFModal } from '@/components/coordinator/EditJAFModal';
import { toast } from '@/components/ui/Toast';

type TabKey = 'all' | 'unapproved' | 'changes' | 'approved' | 'incomplete' | 'eligible' | 'applied';

export default function JobsPage() {
  const { isCoordinator, isStudent, isCompany, profile } = useUserRole();
  const [jobs, setJobs] = useState<DetailedJAF[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [reviewJaf, setReviewJaf] = useState<DetailedJAF | null>(null);
  const [editJaf, setEditJaf] = useState<DetailedJAF | null>(null);

  const studentTabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All Approved Drives' },
    { key: 'eligible', label: 'Eligible for Me' },
    { key: 'applied', label: 'My Applications' },
  ];

  const companyTabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All Jobs' },
    { key: 'unapproved', label: 'Unapproved Jobs' },
    { key: 'incomplete', label: 'Incomplete JAFs' },
  ];

  const coordinatorTabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All Jobs' },
    { key: 'unapproved', label: 'Unapproved Jobs' },
    { key: 'changes', label: 'Changes Requested' },
    { key: 'approved', label: 'Approved Jobs' },
  ];

  const tabs = isStudent ? studentTabs : isCompany ? companyTabs : coordinatorTabs;

  useEffect(() => {
    try {
      const stored = localStorage.getItem('applied_jaf_ids');
      if (stored) {
        setAppliedJobIds(new Set(JSON.parse(stored)));
      }
    } catch {}

    async function fetchJobs() {
      try {
        const res = await fetch('/phdplacement/api/jaf');
        if (res.ok) {
          const data = await res.json();
          const mappedJobs = data.jobs.map((j: any) => ({
            id: j._id,
            company: j.company || j.companyId?.company_name || profile.name,
            designation: j.jobDesignation || j.job_designation || 'Untitled Draft',
            status: j.status,
            createdAt: j.createdAt,
            deadline: j.applicationDeadline ? new Date(j.applicationDeadline).toLocaleDateString() : 'TBD',
            registeredStudents: j.selectedStudents?.length || (j.cvs ? j.cvs.length : 0),
            description: j.jobDescription?.content || j.job_description || '',
            placeOfPosting: j.placeOfPosting || j.place_of_posting || '',
            expectedRecruitments: j.numOpenings || j.num_openings || 0,
            salary: {
              currency: j.salary?.currency || 'INR',
              programmes: j.salary?.programmes || [],
              accommodationAvailable: j.salary?.accommodationAvailable || false,
              ppoExtension: j.salary?.ppoExtension || false,
              additionalInfo: j.salary?.additionalInfo || '',
            },
            eligibility: j.eligibility || [],
            selectionProcess: {
              ppt: j.selectionProcess?.ppt || false,
              shortlistResume: j.selectionProcess?.shortlistResume || false,
              writtenTest: j.selectionProcess?.writtenTest || false,
              testRequirements: j.selectionProcess?.testRequirements || '',
              inPerson: j.selectionProcess?.inPerson || false,
              telephonic: j.selectionProcess?.telephonic || false,
              videoConferencing: j.selectionProcess?.videoConferencing || false,
            },
            poc: {
              name: profile.name,
              role: profile.title || 'Recruiter',
              email: profile.email,
              phone: 'N/A'
            }
          }));
          setJobs(mappedJobs);
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
      } finally {
        setLoadingJobs(false);
      }
    }

    fetchJobs();
  }, [isCompany, isCoordinator, isStudent, profile.name]);

  const handleApprove = async (id: number | string) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, status: 'Approved' as JAFStatus, feedback: undefined } : job))
    );
    if (reviewJaf?.id === id) {
      setReviewJaf((prev) => (prev ? { ...prev, status: 'Approved', feedback: undefined } : null));
    }
    toast.success(`Job Application #${id} approved successfully.`);
    try {
      const response = await fetch(`/phdplacement/api/jobs/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!response.ok) throw new Error('Unable to approve this JAF.');
    } catch {
      // Ignored
    }
  };

  const handleRequestChanges = async (id: number | string, feedback: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, status: 'Changes Requested' as JAFStatus, feedback } : job
      )
    );
    if (reviewJaf?.id === id) {
      setReviewJaf((prev) => (prev ? { ...prev, status: 'Changes Requested', feedback } : null));
    }
    toast.info(`Revision request sent to recruiter for #${id}.`);
    try {
      const response = await fetch(`/phdplacement/api/jobs/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_changes', feedback }),
      });
      if (!response.ok) throw new Error('Unable to request changes.');
    } catch {
      // Ignored
    }
  };

  const handleReject = async (id: number | string, reason: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, status: 'Rejected' as JAFStatus, feedback: reason } : job
      )
    );
    setReviewJaf(null);
    toast.error(`Job Application #${id} rejected.`);
    try {
      const response = await fetch(`/phdplacement/api/jobs/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', feedback: reason }),
      });
      if (!response.ok) throw new Error('Unable to reject this JAF.');
    } catch {
      // Ignored
    }
  };

  const handleSaveJaf = async (updated: DetailedJAF) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    if (reviewJaf?.id === updated.id) {
      setReviewJaf(updated);
    }
    setEditJaf(null);
    toast.success(`Job application #${updated.id} (${updated.designation}) updated successfully.`);

    try {
      await fetch(`/phdplacement/api/jobs/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_designation: updated.designation,
          place_of_posting: updated.placeOfPosting,
          num_openings: updated.expectedRecruitments,
          job_description: updated.description,
          status: updated.status,
          feedback: updated.feedback,
          'salary.additional': updated.salary?.additionalInfo || updated.salary?.ctc,
        }),
      });
    } catch {
      // Ignored
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (isStudent) {
      if (activeTab === 'all' && job.status !== 'Approved') return false;
      if (activeTab === 'eligible' && job.status !== 'Approved') return false;
      if (activeTab === 'applied' && !appliedJobIds.has(String(job.id))) return false;
    } else {
      if (activeTab === 'unapproved' && job.status !== 'Unapproved') return false;
      if (activeTab === 'changes' && job.status !== 'Changes Requested') return false;
      if (activeTab === 'approved' && job.status !== 'Approved') return false;
      if (activeTab === 'incomplete' && job.status !== 'Incomplete') return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        job.designation.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        (job.placeOfPosting && job.placeOfPosting.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const statusColor = (status: JAFStatus) => {
    if (status === 'Unapproved') return 'text-[#f59e0b]';
    if (status === 'Changes Requested') return 'text-blue-600';
    if (status === 'Incomplete') return 'text-[#ef4444]';
    if (status === 'Approved') return 'text-green-600';
    if (status === 'Rejected') return 'text-red-500';
    return 'text-gray-700';
  };

  if (isStudent) {
    const totalApplied = appliedJobIds.size;
    const totalOpen = jobs.filter((j) => j.status === 'Approved').length;

    return (
      <DashboardLayout>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Job Applications & Drives</h1>
            <p className="text-xs text-gray-500 mt-1">
              Browse approved PhD recruitment drives, check role details and compensation, and submit applications.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-2xs self-start sm:self-auto">
            <span className="text-gray-500">
              Open Drives: <strong className="text-[#1B2A4A] font-bold">{totalOpen}</strong>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">
              Applied: <strong className="text-emerald-700 font-bold">{totalApplied}</strong>
            </span>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-6 border-b border-gray-200 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'text-[#1B2A4A] border-b-[3px] border-[#1B2A4A]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.key === 'applied' && totalApplied > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {totalApplied}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Toolbar */}
        <div className="flex justify-between items-center mt-5 mb-4 gap-3">
          <input
            type="text"
            placeholder="Search by role, company, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-xs w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white text-gray-800"
          />
          <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
            Showing <strong className="text-gray-800">{filteredJobs.length}</strong> {filteredJobs.length === 1 ? 'drive' : 'drives'}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-gray-200">
                  <th className="text-center text-xs uppercase font-semibold text-gray-500 px-2.5 py-2.5 whitespace-nowrap w-8">#</th>
                  <th className="text-left text-xs uppercase font-semibold text-gray-500 px-3.5 py-2.5 whitespace-nowrap max-w-[200px]">Designation & Company</th>
                  <th className="text-left text-xs uppercase font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap w-28">Offered CTC</th>
                  <th className="text-left text-xs uppercase font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap w-28">Location</th>
                  <th className="text-left text-xs uppercase font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap w-28">Deadline</th>
                  <th className="text-center text-xs uppercase font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap w-28">Status</th>
                  <th className="text-right text-xs uppercase font-semibold text-gray-500 px-3.5 py-2.5 whitespace-nowrap w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingJobs ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center font-medium text-xs text-gray-500">
                      Loading placement drives...
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <p className="font-semibold text-gray-700 text-sm">No placement drives found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activeTab === 'applied'
                          ? "You haven't submitted any job applications yet."
                          : 'Try changing your search keywords or filter tab.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job, index) => {
                    const isApplied = appliedJobIds.has(String(job.id));
                    return (
                      <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-2.5 py-2.5 text-xs text-gray-500 text-center whitespace-nowrap">{index + 1}</td>
                        <td className="px-3.5 py-2.5 text-xs text-gray-800 max-w-[200px]">
                          <span className="font-semibold block truncate" title={job.designation}>
                            {job.designation}
                          </span>
                          <span className="text-[11px] font-medium text-[#1B2A4A] block truncate" title={job.company}>
                            {job.company}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-900 font-semibold whitespace-nowrap">
                          {job.salary?.additionalInfo || job.salary?.ctc || 'Competitive'}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-700 whitespace-nowrap">
                          {job.placeOfPosting || 'Pan-India'}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-amber-800 font-medium whitespace-nowrap">
                          {job.deadline}
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          {isApplied ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Applied
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                              Open
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                          <Link
                            href={`/jaf/${job.id}/details`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#1B2A4A] rounded-md hover:bg-[#2D3F5E] transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                          >
                            {isApplied ? 'View Details' : 'View JAF & Apply'}
                            <span aria-hidden="true">&rarr;</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>

      {/* Tab Bar */}
      <div className="flex gap-6 border-b border-gray-200 mt-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2 text-sm transition-colors ${
              activeTab === tab.key
                ? 'text-gray-900 font-semibold border-b-[3px] border-[#1B2A4A]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + New JAF */}
      <div className="flex justify-between items-center mt-5 mb-4">
        <input
          type="text"
          placeholder="Search by profile or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-xs w-[240px] focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white text-gray-800"
        />
        {isCompany && (
          <Link
            href="/jaf/new"
            className="bg-[#1B2A4A] text-white text-xs px-3.5 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-[#2D3F5E] transition-colors font-medium shadow-2xs"
          >
            + New JAF
          </Link>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-200">
                <th className="text-center text-xs uppercase font-semibold text-gray-500 px-2.5 py-2.5 whitespace-nowrap w-8">#</th>
                <th className="text-left text-xs uppercase font-semibold text-gray-500 px-3.5 py-2.5 whitespace-nowrap max-w-[200px]">Designation (Profile)</th>
                <th className="text-left text-xs uppercase font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap w-28">Created</th>
                <th className="text-left text-xs uppercase font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap w-28">Deadline</th>
                <th className="text-left text-xs uppercase font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap w-28">Status</th>
                <th className="text-left text-xs uppercase font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap w-28">JAF Details</th>
                <th className="text-right text-xs uppercase font-semibold text-gray-500 px-3.5 py-2.5 whitespace-nowrap w-48">{isCompany ? 'View | Edit' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingJobs ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center font-medium text-xs text-gray-500">
                    Loading your applications...
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center font-medium text-xs text-gray-500">
                    No data to display
                  </td>
                </tr>
              ) : filteredJobs.map((job, index) => (
                <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-2.5 py-2.5 text-xs text-gray-500 text-center whitespace-nowrap">{index + 1}</td>
                  <td className="px-3.5 py-2.5 text-xs text-gray-800 max-w-[200px]">
                    <span className="font-semibold block truncate" title={job.designation}>
                      {job.designation}
                    </span>
                    <span className="text-[11px] text-gray-400 block truncate" title={job.company}>
                      {job.company}
                    </span>
                    {job.feedback && (
                      <span className="text-[10px] text-blue-600 block truncate" title={job.feedback}>
                        Note: {job.feedback}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-700 whitespace-nowrap">{job.createdAt}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-700 whitespace-nowrap">{job.deadline}</td>
                  <td className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap ${statusColor(job.status)}`}>
                    {job.status}
                  </td>
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                    {isCompany ? (
                      job.status === 'Incomplete' ? (
                        <span className="text-gray-400 font-medium text-xs">NA</span>
                      ) : (
                        <div className="flex items-center gap-2 text-xs">
                          <Link
                            href={`/jaf/${job.id}/details`}
                            className="text-[#1B2A4A] hover:underline font-medium"
                          >
                            Details
                          </Link>
                          <span className="text-gray-300">|</span>
                          <Link
                            href={`/jaf/new?edit=${job.id}`}
                            className="text-gray-600 hover:text-black hover:underline font-medium"
                          >
                            Edit
                          </Link>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => setReviewJaf(job)}
                          className="text-blue-600 hover:underline cursor-pointer font-medium"
                        >
                          Inspect
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => setEditJaf(job)}
                          className="text-gray-600 hover:text-[#1B2A4A] hover:underline cursor-pointer font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                    {isCompany ? (
                      job.status === 'Incomplete' ? (
                        <Link
                          href={`/jaf/${job.id}/details`}
                          className="inline-flex items-center justify-center bg-[#0f172a] text-white text-xs px-3 py-1 rounded-md font-medium hover:bg-black transition-colors"
                        >
                          Complete <span className="ml-1">→</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/jaf/${job.id}/applicants`}
                          className={`inline-flex items-center justify-center text-xs px-3 py-1 rounded-md font-medium transition-colors ${job.status === 'Approved' ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-gray-100 text-[#a3a3a3] cursor-not-allowed pointer-events-none'}`}
                        >
                          Students
                        </Link>
                      )
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        {isCoordinator && job.status === 'Unapproved' && (
                          <button
                            onClick={() => handleApprove(job.id)}
                            className="bg-[#1B2A4A] text-white text-xs px-2.5 py-1 rounded-md hover:bg-[#2D3F5E] transition-colors whitespace-nowrap font-medium cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        <Link
                          href={`/jaf/${job.id}/applicants`}
                          className="border border-gray-300 text-gray-700 text-xs px-2.5 py-1 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap font-medium inline-block cursor-pointer"
                        >
                          Students
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <button className="border border-gray-300 rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">{'< Previous'}</button>
        <span className="bg-[#1B2A4A] text-white rounded px-2.5 py-1 text-sm">1</span>
        <button className="border border-gray-300 rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">{'Next >'}</button>
      </div>

      {/* Contact us link */}
      {activeTab === 'unapproved' && (
        <div className="mt-3 text-sm">
          <span className="font-bold text-gray-700">Is the status not updated?</span>{' '}
          <Link href="/help" className="text-gray-700 underline hover:text-gray-900">Contact us</Link>
        </div>
      )}

      {/* JAF Review & Moderation Modal */}
      <JAFReviewModal
        jaf={reviewJaf}
        isOpen={!!reviewJaf}
        onClose={() => setReviewJaf(null)}
        onApprove={handleApprove}
        onRequestChanges={handleRequestChanges}
        onReject={handleReject}
        onEdit={(jaf) => setEditJaf(jaf)}
      />

      {/* Edit JAF Modal */}
      <EditJAFModal
        jaf={editJaf}
        isOpen={!!editJaf}
        onClose={() => setEditJaf(null)}
        onSave={handleSaveJaf}
      />
    </DashboardLayout>
  );
}
