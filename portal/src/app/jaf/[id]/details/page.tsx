'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from '@/components/ui/Toast';
import { useUserRole } from '@/lib/auth';
import Link from 'next/link';

const PencilIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);

type TabKey = 
  | 'jobDetails' 
  | 'eligibleProgrammes' 
  | 'salaryDetails' 
  | 'selectionProcess' 
  | 'bondContract' 
  | 'additionalDetails' 
  | 'approvalStatus';

export default function JAFDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isCompany, isStudent, isCoordinator, profile } = useUserRole();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('jobDetails');

  // Student application state
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewMode, setReviewMode] = useState<'approve' | 'reject' | null>(null);
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewing, setReviewing] = useState(false);
  // Only a coordinator chooses whether a JAF is a placement job or an internship job.
  const [jobType, setJobType] = useState<'' | 'internship' | 'placement'>('');
  const [savingType, setSavingType] = useState(false);

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/phdplacement/api/jaf/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.job) {
            setJob(data.job);
            return;
          }
          toast.error('Job application not found.');
        }
      } catch (error) {
        console.error(error);
        toast.error('Could not load Job Application details.');
      } finally {
        setLoading(false);
      }
    }

    async function fetchApplicationStatus() {
      if (!isStudent) return;
      try {
        const response = await fetch(`/phdplacement/api/jobs/${id}/apply`);
        if (response.ok) {
          const data = await response.json();
          setHasApplied(Boolean(data.hasApplied));
        }
      } catch {
        // The job details still load if the application-status check is unavailable.
      }
    }

    fetchJob();
    fetchApplicationStatus();
  }, [id, isStudent]);

  const handleConfirmApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`/phdplacement/api/jobs/${id}/apply`, {
        method: 'POST',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Unable to submit your application.');

      setHasApplied(true);
      setShowApplyModal(false);
      toast.success(`Application submitted successfully for ${job?.jobDesignation || 'this position'}!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit your application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawApplication = async () => {
    if (!confirm('Are you sure you want to withdraw your application for this drive?')) return;

    try {
      const response = await fetch(`/phdplacement/api/jobs/${id}/apply`, { method: 'DELETE' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Unable to withdraw your application.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to withdraw your application.');
      return;
    }

    setHasApplied(false);
    toast.info('Your application has been withdrawn.');
  };

  const submitReview = async (action: 'approve' | 'reject') => {
    if (action === 'approve' && !applicationDeadline) {
      toast.error('Set an application closing date before approving this JAF.');
      return;
    }
    if (action === 'approve' && !jobType) {
      toast.error('Choose whether this is a placement job or an internship job.');
      return;
    }
    if (action === 'reject' && !rejectionReason.trim()) {
      toast.error('Provide a reason before rejecting this JAF.');
      return;
    }

    setReviewing(true);
    try {
      const response = await fetch(`/phdplacement/api/jobs/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          applicationDeadline: action === 'approve' ? applicationDeadline : undefined,
          is_placement_job: action === 'approve' ? jobType === 'placement' : undefined,
          feedback: action === 'reject' ? rejectionReason.trim() : undefined,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Unable to update this JAF.');

      setJob((current: any) => ({
        ...current,
        status: action === 'approve' ? 'Approved' : 'Rejected',
        applicationDeadline: action === 'approve' ? result.data?.applicationDeadline || applicationDeadline : current.applicationDeadline,
        is_placement_job: action === 'approve' ? jobType === 'placement' : current.is_placement_job,
        feedback: action === 'reject' ? rejectionReason.trim() : '',
      }));
      setReviewMode(null);
      toast.success(action === 'approve' ? 'JAF approved and opened for applications.' : 'JAF rejected.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update this JAF.');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="w-8 h-8 border-3 border-[#1B2A4A] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium text-xs">Loading JAF details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="p-8 bg-red-50 text-red-700 rounded-lg border border-red-200 mt-6 max-w-xl mx-auto text-center shadow-xs">
          <p className="font-semibold text-base">Job Application Not Found</p>
          <p className="text-xs mt-1 text-red-600">The requested job drive does not exist or you do not have permission to view it.</p>
          <Link
            href="/jobs"
            className="inline-block mt-4 px-4 py-2 bg-[#1B2A4A] text-white rounded text-xs font-semibold hover:bg-[#2D3F5E] transition-colors"
          >
            &larr; Back to Job Applications
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const canWithdrawApplication = Boolean(
    job.applicationDeadline && new Date(job.applicationDeadline).getTime() > Date.now(),
  );

  const companyName = job.company || (job.companyId && typeof job.companyId === 'object' ? job.companyId.company_name : profile?.name || 'Recruiter');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'jobDetails', label: 'Job Details' },
    { key: 'eligibleProgrammes', label: 'Eligible Programmes and Departments' },
    { key: 'salaryDetails', label: 'Salary Details' },
    { key: 'selectionProcess', label: 'Selection Process' },
    { key: 'bondContract', label: 'Bond/Service Contract' },
    { key: 'additionalDetails', label: 'Additional Details' },
    { key: 'approvalStatus', label: 'Approval Status and Dates' },
  ];

  return (
    <DashboardLayout>
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#1B2A4A] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Job Applications
        </Link>
        <div className="flex items-center gap-2">
          {isCoordinator && (
            <>
              <Link
                href={`/jaf/new?edit=${id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                Edit JAF
              </Link>
              <Link
                href={`/jaf/${id}/applicants`}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1B2A4A] rounded-md hover:bg-[#2D3F5E] transition-colors shadow-2xs"
              >
                Registered Candidates &rarr;
              </Link>
            </>
          )}
          {isCompany && job.status !== 'Approved' && (
            <Link
              href={`/jaf/new?edit=${id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
            >
              <PencilIcon className="h-3.5 w-3.5" />
              Edit JAF
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg p-5 sm:p-7 shadow-xs border border-gray-200 min-h-[600px]">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-gray-100">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                PhD Drive
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                job.status === 'Approved'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {job.status || 'Approved'}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                job.is_placement_job ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-teal-50 text-teal-700 border border-teal-200'
              }`}>
                {job.is_placement_job ? 'Placement job' : 'Internship job'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {job.jobDesignation || 'Untitled Role'}
            </h1>
            <p className="text-sm font-semibold text-[#1B2A4A] mt-0.5">{companyName}</p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 flex-shrink-0">
            <div>
              <span className="text-[10px] uppercase font-semibold text-gray-400 block">CTC (Gross)</span>
              <strong className="text-gray-900 font-bold">{job.salary?.additionalInfo || '₹ 38.0 LPA'}</strong>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-gray-400 block">Location</span>
              <span className="text-gray-700 font-medium">{job.placeOfPosting || 'Pan-India'}</span>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Closing Date</span>
                <span className="text-amber-800 font-medium">{job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'Not set'}</span>
            </div>
          </div>
        </div>

        {isCoordinator && job.status !== 'Approved' && job.status !== 'Rejected' && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            {reviewMode === null ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Coordinator review</h2>
                  <p className="mt-0.5 text-xs text-gray-600">Set the closing date when approving, or reject the JAF with a reason.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setReviewMode('reject')} className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">Reject JAF</button>
                  <button onClick={() => setReviewMode('approve')} className="rounded-md bg-[#1B2A4A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2D3F5E]">Approve JAF</button>
                </div>
              </div>
            ) : reviewMode === 'approve' ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="block flex-1 text-xs font-semibold text-gray-700">
                  Job type
                  <select value={jobType} onChange={(event) => setJobType(event.target.value as '' | 'internship' | 'placement')} className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" required>
                    <option value="">Select job type…</option>
                    <option value="internship">Internship job</option>
                    <option value="placement">Placement job</option>
                  </select>
                </label>
                <label className="block flex-1 text-xs font-semibold text-gray-700">
                  Application closing date
                  <input type="date" value={applicationDeadline} onChange={(event) => setApplicationDeadline(event.target.value)} min={new Date().toISOString().slice(0, 10)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" required />
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setReviewMode(null)} disabled={reviewing} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700">Cancel</button>
                  <button onClick={() => submitReview('approve')} disabled={reviewing} className="rounded-md bg-[#1B2A4A] px-3 py-2 text-xs font-semibold text-white disabled:bg-gray-400">{reviewing ? 'Approving...' : 'Confirm approval'}</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <label className="block text-xs font-semibold text-gray-700">
                  Rejection reason
                  <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} className="mt-1 block min-h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" required />
                </label>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setReviewMode(null)} disabled={reviewing} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700">Cancel</button>
                  <button onClick={() => submitReview('reject')} disabled={reviewing} className="rounded-md bg-rose-700 px-3 py-2 text-xs font-semibold text-white disabled:bg-gray-400">{reviewing ? 'Rejecting...' : 'Confirm rejection'}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {isCoordinator && job.status === 'Approved' && (
          <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <label className="block text-xs font-semibold text-gray-700">
              Job type (coordinator only)
              <select
                value={jobType || (job.is_placement_job ? 'placement' : 'internship')}
                onChange={(event) => setJobType(event.target.value as 'internship' | 'placement')}
                className="mt-1 block rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="internship">Internship job</option>
                <option value="placement">Placement job</option>
              </select>
            </label>
            <button
              type="button"
              disabled={savingType || !jobType || (jobType === 'placement') === Boolean(job.is_placement_job)}
              onClick={async () => {
                setSavingType(true);
                try {
                  const response = await fetch(`/phdplacement/api/jobs/${id}/type`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_placement_job: jobType === 'placement' }),
                  });
                  const result = await response.json().catch(() => ({}));
                  if (!response.ok) throw new Error(result.error || 'Unable to change the job type.');
                  setJob((current: any) => ({ ...current, is_placement_job: jobType === 'placement' }));
                  toast.success(jobType === 'placement' ? 'Marked as a placement job.' : 'Marked as an internship job.');
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Unable to change the job type.');
                } finally {
                  setSavingType(false);
                }
              }}
              className="rounded-md bg-[#1B2A4A] px-3 py-2 text-xs font-semibold text-white disabled:bg-gray-400"
            >
              {savingType ? 'Saving...' : 'Save job type'}
            </button>
            <p className="text-[11px] text-gray-500">Placement jobs are open only to scholars marked eligible for placements. Existing applications are not affected.</p>
          </div>
        )}

        {/* Student Application Status & Action Banner */}
        {isStudent && (
          hasApplied ? (
            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50/90 p-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-emerald-900">Application Submitted</h3>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Your PhD application has been registered for this drive. The placement coordinator and recruiter have received your profile and CV.
                    </p>
                  </div>
                </div>
                {canWithdrawApplication && (
                  <button
                    onClick={handleWithdrawApplication}
                    className="px-3.5 py-1.5 text-xs font-medium text-rose-700 bg-white border border-rose-200 rounded-md hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
                  >
                    Withdraw Application
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-6 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 p-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1B2A4A] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    📋
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">PhD Placement Drive — Open for Applications</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Closing date: <strong className="text-amber-800">{job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'Not set'}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1B2A4A] rounded-md hover:bg-[#2D3F5E] transition-colors shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  Apply for this Role &rarr;
                </button>
              </div>
            </div>
          )
        )}

        {/* Tab Bar */}
        <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'text-[#1B2A4A] border-b-2 border-[#1B2A4A]'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="text-xs text-gray-800">
          {activeTab === 'jobDetails' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
              <div>
                <p className="text-[11px] font-semibold uppercase text-gray-400 mb-1">Designation</p>
                <p className="font-medium text-sm text-gray-900">{job.jobDesignation || 'NA'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-gray-400 mb-1">Approval Status</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {job.status || 'Approved'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase text-gray-400 mb-1">Job Description & Research Focus</p>
                {job.jobDescription?.mode === 'html' ? (
                  <div dangerouslySetInnerHTML={{ __html: job.jobDescription.content }} className="prose prose-sm max-w-none text-gray-700 bg-slate-50 p-4 rounded-md border border-slate-200 text-xs" />
                ) : job.jobDescription?.mode === 'file' && job.jobDescription?.fileUrl ? (
                  <a href={job.jobDescription.fileUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline inline-flex items-center gap-1">
                    Download Job Description File &rarr;
                  </a>
                ) : (
                  <p className="font-medium bg-slate-50 p-4 rounded-md border border-slate-200 text-gray-700">{job.jobDescription?.content || 'Standard PhD Research & Development specifications apply.'}</p>
                )}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-gray-400 mb-1">Place of Posting</p>
                <p className="font-medium text-sm text-gray-900">{job.placeOfPosting || 'Bengaluru / Pan-India'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-gray-400 mb-1">Date of Joining</p>
                <p className="font-medium text-sm text-gray-900">
                  {job.dateOfJoining ? new Date(job.dateOfJoining).toLocaleDateString() : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-gray-400 mb-1">Application Closing Date</p>
                <p className="font-medium text-sm text-amber-800">
                  {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'Not set'}
                </p>
              </div>
              {!isStudent && (
                <div>
                  <p className="text-[11px] font-semibold uppercase text-gray-400 mb-1">Expected Recruitments from IIT Guwahati</p>
                  <p className="font-medium text-sm text-gray-900">{job.numOpenings || 5} scholars</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'eligibleProgrammes' && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-gray-400 mb-0.5">10th Cutoff</p>
                  <p className="font-bold text-gray-800">{job.academicEligibility?.tenthPercentage ? `${job.academicEligibility.tenthPercentage}%` : 'None'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-gray-400 mb-0.5">12th Cutoff</p>
                  <p className="font-bold text-gray-800">{job.academicEligibility?.twelfthPercentage ? `${job.academicEligibility.twelfthPercentage}%` : 'None'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-gray-400 mb-0.5">Min Bachelor's CPI</p>
                  <p className="font-bold text-gray-800">{job.academicEligibility?.bachelorsCPI || 'None'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-gray-400 mb-0.5">Allow Backlogs</p>
                  <p className="font-bold text-gray-800">{job.allowBacklog ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <h3 className="text-xs font-bold text-gray-900 mb-2">Eligible Programmes & CPI Cutoffs</h3>
              {Array.isArray(job.eligible_programmes) && job.eligible_programmes.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#f8fafc] border-b border-gray-200 text-xs font-semibold text-gray-600">
                      <tr>
                        <th className="px-4 py-2.5 w-12 text-center">#</th>
                        <th className="px-4 py-2.5">Programme</th>
                        <th className="px-4 py-2.5">Department</th>
                        <th className="px-4 py-2.5 w-32 text-center">Major (min CPI)</th>
                        <th className="px-4 py-2.5 w-32 text-center">Minor (min CPI)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {job.eligible_programmes.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/80">
                          <td className="px-4 py-2 text-center text-gray-400">{i + 1}</td>
                          <td className="px-4 py-2 font-medium text-gray-800">{row.programme?.programme || '—'}</td>
                          <td className="px-4 py-2 text-gray-800">{row.programme?.department || '—'}</td>
                          <td className="px-4 py-2 text-center font-bold text-emerald-700">
                            {row.major?.allowed ? Number(row.major.cpi_cutoff || 0).toFixed(2) : <span className="font-normal text-gray-400">Not eligible</span>}
                          </td>
                          <td className="px-4 py-2 text-center font-bold text-emerald-700">
                            {row.minor?.allowed ? Number(row.minor.cpi_cutoff || 0).toFixed(2) : <span className="font-normal text-gray-400">Not eligible</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {!(Array.isArray(job.eligible_programmes) && job.eligible_programmes.length > 0) && (job.eligibility && job.eligibility.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#f8fafc] border-b border-gray-200 text-xs font-semibold text-gray-600">
                      <tr>
                        <th className="px-4 py-2.5 w-12 text-center">#</th>
                        <th className="px-4 py-2.5">Eligible Department</th>
                        <th className="px-4 py-2.5 w-32 text-center">CPI Cutoff</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {job.eligibility.map((el: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/80">
                          <td className="px-4 py-2 text-center text-gray-400">{i + 1}</td>
                          <td className="px-4 py-2 font-medium text-gray-800">{el.department}</td>
                          <td className="px-4 py-2 text-center font-bold text-emerald-700">{Number(el.cpiCutoff || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 bg-slate-50 p-4 rounded border">All PhD departments are eligible.</p>
              ))}
            </div>
          )}

          {activeTab === 'salaryDetails' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-gray-400 mb-1">Currency</p>
                  <p className="font-bold text-gray-900">{job.salary?.currency || 'INR (₹)'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-gray-400 mb-1">Total CTC Offered</p>
                  <p className="font-bold text-gray-900 text-sm text-[#1B2A4A]">{job.salary?.additionalInfo || '₹ 38.0 LPA'}</p>
                </div>
              </div>

              {job.salary?.programmes && job.salary.programmes.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#f8fafc] border-b border-gray-200 font-semibold text-gray-600">
                      <tr>
                        <th className="px-4 py-2.5">Programme</th>
                        <th className="px-4 py-2.5">CTC (per annum)</th>
                        <th className="px-4 py-2.5">Base Salary (per annum)</th>
                        <th className="px-4 py-2.5">Monthly In-hand (Approx)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {job.salary.programmes.map((p: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/80">
                          <td className="px-4 py-2.5 font-bold text-[#1B2A4A]">{p.programme}</td>
                          <td className="px-4 py-2.5 font-semibold text-gray-900">₹ {(p.ctc || 4000000).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-2.5 text-gray-700">₹ {(p.base || 3000000).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-2.5 text-gray-700">₹ {(p.monthlyFixed || 250000).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'selectionProcess' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="font-bold text-xs text-gray-900 mb-2">Selection Stages</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
                    <span className="text-gray-700">Pre-Placement Talk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
                    <span className="text-gray-700">Resume Shortlisting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
                    <span className="text-gray-700">Technical Seminar / OA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
                    <span className="text-gray-700">Interview Panel</span>
                  </div>
                </div>
              </div>

              {job.selectionProcess?.notes && (
                <div>
                  <p className="text-[11px] font-semibold uppercase text-gray-400 mb-1">Process Outline</p>
                  <p className="font-medium text-gray-700 bg-white p-3 border rounded-md">{job.selectionProcess.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bondContract' && (
            <div>
              <p className="text-[11px] font-semibold uppercase text-gray-400 mb-1">Service Agreement / Bond</p>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-gray-800 font-medium">
                {job.bondDetails?.description || 'No bond or service commitment contract required for this appointment.'}
              </div>
            </div>
          )}

          {activeTab === 'additionalDetails' && (
            <div>
              {job.additionalRequirements && job.additionalRequirements.length > 0 ? (
                <ul className="space-y-3">
                  {job.additionalRequirements.map((req: any, i: number) => (
                    <li key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <p className="font-semibold text-gray-900">{req.title}</p>
                      <p className="text-gray-600 mt-0.5">{req.description}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 bg-slate-50 p-4 rounded border">No additional requirements specified.</p>
              )}
            </div>
          )}

          {activeTab === 'approvalStatus' && (
            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
              <div>
                <p className="text-[11px] font-semibold uppercase text-gray-400 mb-1">CCD Approval Status</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {job.status || 'Approved'}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-gray-400 mb-1">Drive Opened Date</p>
                <p className="font-medium text-gray-800">
                  {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Sep 24, 2026'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-gray-400 mb-1">Closing Date</p>
                <p className="font-medium text-amber-800">
                  {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-gray-400 mb-1">Recruitment Drive Lead</p>
                <p className="font-medium text-gray-800">CCD PhD Placement Coordination Cell</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" aria-modal="true" role="dialog">
          <div className="bg-white rounded-lg max-w-lg w-full overflow-hidden shadow-xl border border-gray-200">
            {/* Modal Header */}
            <div className="bg-[#1B2A4A] text-white p-4 sm:px-6 sm:py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base leading-tight">Apply for Position</h3>
                <p className="text-xs text-blue-200 mt-0.5 truncate max-w-md">{job.jobDesignation} &bull; {companyName}</p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-gray-300 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmApplication} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Scholar Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Applicant Details</span>
                <div className="grid grid-cols-2 gap-2 text-gray-800">
                  <div>
                    <span className="text-gray-500">Name:</span> <strong className="font-semibold">{profile.name}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Roll No:</span> <span className="font-mono font-medium">{profile.rollNumber || '216101001'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Programme:</span> <strong>Ph.D.</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Department:</span> <span>Computer Science & Engineering</span>
                  </div>
                </div>
              </div>

              {/* Your two CVs are shared automatically; there is nothing to choose. */}
              <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                Your one-page CV and your detailed CV, both from your registration, will be shared with the recruiter and the placement coordinator.
              </p>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white rounded-md transition-colors shadow-2xs bg-[#1B2A4A] hover:bg-[#2D3F5E] disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Confirm & Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
