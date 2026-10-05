'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserRole } from '@/lib/auth';
import { DetailedJAF, JAFStatus } from '@/lib/types';
import { JAFReviewModal } from '@/components/coordinator/JAFReviewModal';
import { EditJAFModal } from '@/components/coordinator/EditJAFModal';
import { toast } from '@/components/ui/Toast';
import { loadStudentRecord, StudentRecord } from '@/lib/studentRegistration';

// Icons
const BriefcaseIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.25v4.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V14.25m16.5 0a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25m16.5 0v-3.75A2.25 2.25 0 0 0 18 8.25H6a2.25 2.25 0 0 0-2.25 2.25v3.75m14.25-6H5.25A2.25 2.25 0 0 1 3 6V4.5A2.25 2.25 0 0 1 5.25 2.25h13.5A2.25 2.25 0 0 1 21 4.5V6a2.25 2.25 0 0 1-.75 1.5Z" />
  </svg>
);

const CheckCircleIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const ClockIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const MapPinIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

const CurrencyIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const BellIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
  </svg>
);

const UsersIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

type AnnouncementItem = {
  _id: string;
  title: string;
  message: string;
  category: string;
  publish_at: string;
};

export default function DashboardPage() {
  const { isCoordinator, isStudent, isCompany, profile } = useUserRole();
  const [jobs, setJobs] = useState<DetailedJAF[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [reviewJaf, setReviewJaf] = useState<DetailedJAF | null>(null);
  const [editJaf, setEditJaf] = useState<DetailedJAF | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [coordinatorTab, setCoordinatorTab] = useState<'all' | 'pending' | 'approved' | 'changes'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [studentRec, setStudentRec] = useState<StudentRecord | null>(null);

  useEffect(() => {
    // Read applied jobs from localStorage for instant student feedback
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
          if (Array.isArray(data.jobs) && data.jobs.length > 0) {
            const mappedJobs = data.jobs.map((j: any) => ({
              id: j._id,
              company: j.company || j.companyId?.company_name || 'Partner Organization',
              designation: j.jobDesignation || j.job_designation || 'Research Scientist',
              status: j.status,
              createdAt: j.createdAt,
              deadline: j.applicationDeadline || j.deadline || '2026-10-25',
              registeredStudents: j.selectedStudents?.length || (j.cvs ? j.cvs.length : (j.registeredStudents || 0)),
              description: j.jobDescription?.content || j.job_description || '',
              placeOfPosting: j.placeOfPosting || j.place_of_posting || 'Pan-India',
              expectedRecruitments: j.numOpenings || j.num_openings || 1,
              salary: {
                currency: j.salary?.currency || 'INR',
                ctc: j.salary?.additionalInfo || (j.salary?.programmes?.[0]?.ctc ? `₹ ${(j.salary.programmes[0].ctc / 100000).toFixed(1)} LPA` : '₹ 38 LPA'),
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
                phone: 'N/A',
              },
            }));
            setJobs(mappedJobs);
          } else {
            setJobs([]);
          }
        } else {
          setJobs([]);
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setJobs([]);
      } finally {
        setLoadingJobs(false);
      }
    }

    async function fetchAnnouncements() {
      try {
        const res = await fetch('/phdplacement/api/announcements');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.announcements)) {
            setAnnouncements(data.announcements.slice(0, 3));
          } else {
            setAnnouncements([]);
          }
        } else {
          setAnnouncements([]);
        }
      } catch {
        setAnnouncements([]);
      }
    }

    fetchJobs();
    if (isStudent) {
      fetchAnnouncements();
      loadStudentRecord()
        .then((rec) => setStudentRec(rec))
        .catch(() => {});
    }
  }, [profile.name, profile.title, profile.email, isStudent]);

  const handleApprove = async (id: number | string) => {
    const response = await fetch(`/phdplacement/api/jobs/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    });
    if (!response.ok) {
      toast.error('Unable to approve this JAF.');
      return;
    }
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: 'Approved' as JAFStatus, feedback: undefined } : j))
    );
    if (reviewJaf?.id === id) {
      setReviewJaf((prev) => (prev ? { ...prev, status: 'Approved', feedback: undefined } : null));
    }
    toast.success(`Job Application #${id} approved successfully.`);
  };

  const handleRequestChanges = async (id: number | string, feedback: string) => {
    const response = await fetch(`/phdplacement/api/jobs/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request_changes', feedback }),
    });
    if (!response.ok) {
      toast.error('Unable to request changes.');
      return;
    }
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: 'Changes Requested' as JAFStatus, feedback } : j))
    );
    if (reviewJaf?.id === id) {
      setReviewJaf((prev) => (prev ? { ...prev, status: 'Changes Requested', feedback } : null));
    }
    toast.info(`Revision request sent to recruiter for #${id}.`);
  };

  const handleReject = async (id: number | string, reason: string) => {
    const response = await fetch(`/phdplacement/api/jobs/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', feedback: reason }),
    });
    if (!response.ok) {
      toast.error('Unable to reject this JAF.');
      return;
    }
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: 'Rejected' as JAFStatus, feedback: reason } : j))
    );
    setReviewJaf(null);
    toast.error(`Job Application #${id} rejected.`);
  };

  const handleSaveJaf = (updated: DetailedJAF) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    if (reviewJaf?.id === updated.id) {
      setReviewJaf(updated);
    }
    setEditJaf(null);
    toast.success(`Job application #${updated.id} (${updated.designation}) updated successfully.`);
  };

  // Status badge helper
  const renderStatusBadge = (status: JAFStatus) => {
    if (status === 'Approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Approved
        </span>
      );
    }
    if (status === 'Unapproved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Pending Review
        </span>
      );
    }
    if (status === 'Changes Requested') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Revision Needed
        </span>
      );
    }
    if (status === 'Rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        Draft
      </span>
    );
  };

  // ==========================================
  // STUDENT VIEW
  // ==========================================
  if (isStudent) {
    const approvedJobs = jobs.filter((j) => j.status === 'Approved');
    const appliedCount = appliedJobIds.size;

    return (
      <DashboardLayout>
        {/* Welcome Banner */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 sm:p-6 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  Ph.D. Scholar Console
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Placement Registration Active
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Welcome back, {profile.name}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {profile.organization || 'Dept. of Computer Science & Engineering'} &bull; Roll No:{' '}
                <span className="font-mono font-medium text-gray-800">{profile.rollNumber || '216101001'}</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Link
                href="/jobs"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1B2A4A] rounded-lg hover:bg-[#2D3F5E] transition-all shadow-xs cursor-pointer"
              >
                <BriefcaseIcon className="w-3.5 h-3.5" />
                <span>Explore All Drives ({approvedJobs.length})</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
          {/* Card 1: Open Drives */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Open Drives</span>
              <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
                <BriefcaseIcon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{approvedJobs.length}</span>
              <span className="text-[11px] text-gray-400">approved JAFs</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Available for PhD scholars</p>
          </div>

          {/* Card 2: Applications Submitted */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">My Applications</span>
              <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircleIcon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">{appliedCount}</span>
              <span className="text-[11px] text-gray-400">submitted</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Under review by recruiters</p>
          </div>

          {/* Card 3: Registration Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Registration</span>
              <div className="w-7 h-7 rounded-md bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">3 of 3</span>
              <span className="text-[11px] text-gray-400">steps cleared</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Profile & CVs active</p>
          </div>

          {/* Card 4: Policy Rule */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Placement Policy</span>
              <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                §
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-lg font-bold text-gray-900">One-Offer Rule</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Acceptance freezes portal</p>
          </div>
        </div>

        {/* 2-Column Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Placement Drives */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 pb-3.5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900 tracking-tight">
                      Active PhD Placement Drives (JAFs)
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {approvedJobs.length} Live
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Browse verified drives, inspect detailed job forms, and apply directly.
                  </p>
                </div>
                <Link
                  href="/jobs"
                  className="text-xs text-[#1B2A4A] hover:underline font-semibold whitespace-nowrap hidden sm:inline-flex items-center gap-1"
                >
                  View All &rarr;
                </Link>
              </div>

              <div className="divide-y divide-gray-100">
                {loadingJobs ? (
                  <div className="p-8 text-center text-xs text-gray-500">
                    <div className="animate-spin w-5 h-5 border-2 border-[#1B2A4A] border-t-transparent rounded-full mx-auto mb-2"></div>
                    Loading approved placement drives...
                  </div>
                ) : approvedJobs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">
                    <p className="font-semibold text-gray-700">No active placement drives found</p>
                    <p className="mt-1">Drives approved by the CCD coordinator will appear here for you to apply.</p>
                  </div>
                ) : (
                  approvedJobs.slice(0, 4).map((job) => {
                    const isApplied = appliedJobIds.has(String(job.id));
                    return (
                      <div
                        key={job.id}
                        className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded flex-shrink-0">
                              Ph.D.
                            </span>
                            <h3 className="font-semibold text-sm text-gray-900 truncate" title={job.designation}>
                              {job.designation}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 mt-1.5 text-xs text-gray-500">
                            <span className="font-semibold text-[#1B2A4A]">{job.company}</span>
                            <span className="text-gray-300">&bull;</span>
                            <span className="inline-flex items-center gap-1 text-gray-800 font-medium">
                              <CurrencyIcon className="w-3.5 h-3.5 text-emerald-600" />
                              {job.salary?.additionalInfo || job.salary?.ctc || '₹ 38 LPA'}
                            </span>
                            <span className="text-gray-300">&bull;</span>
                            <span className="inline-flex items-center gap-1 text-gray-600">
                              <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
                              {job.placeOfPosting || 'Pan-India'}
                            </span>
                            <span className="text-gray-300">&bull;</span>
                            <span className="inline-flex items-center gap-1 text-amber-800 font-medium">
                              <ClockIcon className="w-3.5 h-3.5 text-amber-600" />
                              Deadline: {job.deadline || '2026-10-25'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 flex-shrink-0 self-start sm:self-auto">
                          {isApplied ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Applied
                              </span>
                              <Link
                                href={`/jaf/${job.id}/details`}
                                className="px-3 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
                              >
                                View JAF
                              </Link>
                            </div>
                          ) : (
                            <Link
                              href={`/jaf/${job.id}/details`}
                              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1B2A4A] rounded-md hover:bg-[#2D3F5E] transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                            >
                              View JAF & Apply &rarr;
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 bg-[#f8fafc] border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Showing top {Math.min(approvedJobs.length, 4)} of {approvedJobs.length} active opportunities
                </span>
                <Link href="/jobs" className="text-[#1B2A4A] hover:underline font-semibold inline-flex items-center gap-1">
                  Explore full directory &rarr;
                </Link>
              </div>
            </div>

            {/* CCD Announcements Card */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 pb-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
                    <BellIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 tracking-tight">Recent Notices & Circulars</h2>
                    <p className="text-[11px] text-gray-500">Official updates from Centre for Career Development (CCD)</p>
                  </div>
                </div>
                <Link href="/announcements" className="text-xs text-[#1B2A4A] hover:underline font-semibold">
                  All Announcements &rarr;
                </Link>
              </div>

              <div className="divide-y divide-gray-100">
                {announcements.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">No active circulars at this moment.</div>
                ) : (
                  announcements.map((item) => (
                    <div key={item._id} className="p-4 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">{item.publish_at}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Right Column (1 Col) */}
          <div className="space-y-6">
            {/* Placement Registration Checklist */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 tracking-tight">Registration Checklist</h3>
                  {(() => {
                    const isProfileComplete = Boolean(studentRec?.name && studentRec?.email && (studentRec?.academic_details?.major_department || studentRec?.major_cpi));
                    const hasCv = Boolean(studentRec?.cv?.cv1 || studentRec?.cv?.cv2);
                    const isCvComplete = Boolean(studentRec?.cv_verified || hasCv);
                    const isFeeComplete = Boolean(studentRec?.fee_paid);
                    const completedCount = [isProfileComplete, isCvComplete, isFeeComplete].filter(Boolean).length;
                    const pct = Math.round((completedCount / 3) * 100);

                    if (completedCount === 3 && studentRec?.cv_verified) {
                      return (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          100% Complete
                        </span>
                      );
                    }
                    return (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {pct}% Complete ({completedCount}/3)
                      </span>
                    );
                  })()}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">Maintain up-to-date credentials for recruiter reviews.</p>
              </div>

              {(() => {
                const isProfileComplete = Boolean(studentRec?.name && studentRec?.email && (studentRec?.academic_details?.major_department || studentRec?.major_cpi));
                const hasCv = Boolean(studentRec?.cv?.cv1 || studentRec?.cv?.cv2);
                const isFeeComplete = Boolean(studentRec?.fee_paid);
                const cvSubtext = studentRec?.cv_verified
                  ? 'CV verified by CCD'
                  : studentRec?.cv_flagged
                    ? 'Action needed · CV flagged'
                    : hasCv
                      ? 'Uploaded · Pending verification'
                      : 'Upload required · No file uploaded';

                return (
                  <div className="divide-y divide-gray-100 text-xs">
                    <Link
                      href="/registration/profile"
                      className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          isProfileComplete
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-400 border border-slate-300'
                        }`}>
                          {isProfileComplete ? '✓' : '○'}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-800 group-hover:text-[#1B2A4A]">Step 1 · Scholar Profile</p>
                          <p className="text-[11px] text-gray-400">Research domain, CPI, supervisor</p>
                        </div>
                      </div>
                      <span className="text-gray-400 group-hover:text-gray-600 text-xs font-semibold">&rarr;</span>
                    </Link>

                    <Link
                      href="/registration/cv"
                      className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          studentRec?.cv_verified
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : hasCv
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-400 border border-slate-300'
                        }`}>
                          {studentRec?.cv_verified ? '✓' : hasCv ? '⏳' : '○'}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-800 group-hover:text-[#1B2A4A]">Step 2 · Dual CV Upload</p>
                          <p className={`text-[11px] ${studentRec?.cv_flagged ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                            {cvSubtext}
                          </p>
                        </div>
                      </div>
                      <span className="text-gray-400 group-hover:text-gray-600 text-xs font-semibold">&rarr;</span>
                    </Link>

                    <Link
                      href="/registration/fee"
                      className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          isFeeComplete
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {isFeeComplete ? '✓' : '○'}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-800 group-hover:text-[#1B2A4A]">Step 3 · Fee Payment</p>
                          <p className="text-[11px] text-gray-400">
                            {isFeeComplete ? 'Registration fee cleared' : `Fee pending: ₹${studentRec?.fee_remaining ?? 0}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-gray-400 group-hover:text-gray-600 text-xs font-semibold">&rarr;</span>
                    </Link>
                  </div>
                );
              })()}
            </div>

            {/* Placement Policy & Rules Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 tracking-tight mb-2">Key Placement Guidelines</h3>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#1B2A4A] font-bold">&bull;</span>
                  <span><strong>One-Offer Policy:</strong> Upon formal acceptance of any job offer, candidate portal access is automatically frozen.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1B2A4A] font-bold">&bull;</span>
                  <span><strong>NOC Clearance:</strong> Supervisor recommendation required before final interview rounds.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1B2A4A] font-bold">&bull;</span>
                  <span><strong>PPT Attendance:</strong> Attendance in pre-placement presentations is mandatory for registered applicants.</span>
                </li>
              </ul>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <Link href="/policy" className="text-[#1B2A4A] hover:underline font-semibold">
                  Read Full Placement Policy &rarr;
                </Link>
                <Link href="/offers" className="text-gray-500 hover:text-gray-800 font-medium">
                  My Offers
                </Link>
              </div>
            </div>

            {/* CCD Helpdesk Card */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/70 rounded-lg border border-gray-200 p-4 text-xs text-gray-600">
              <p className="font-bold text-gray-900 mb-1">Centre for Career Development</p>
              <p className="text-[11px] text-gray-500">Conference Centre, IIT Guwahati, Assam 781039</p>
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="font-mono text-gray-700">placement@iitg.ac.in</span>
                <Link href="/help" className="text-[#1B2A4A] hover:underline font-semibold">
                  Help Desk &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ==========================================
  // COORDINATOR & RECRUITER VIEW
  // ==========================================
  const pendingCount = jobs.filter((j) => j.status === 'Unapproved' || j.status === 'Changes Requested').length;
  const approvedCount = jobs.filter((j) => j.status === 'Approved').length;
  const changesCount = jobs.filter((j) => j.status === 'Changes Requested').length;
  const totalApplicants = jobs.reduce((acc, j) => acc + (j.registeredStudents || 0), 0);

  // Filtered jobs according to active tab and search query
  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.company.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (coordinatorTab === 'pending') return j.status === 'Unapproved';
    if (coordinatorTab === 'approved') return j.status === 'Approved';
    if (coordinatorTab === 'changes') return j.status === 'Changes Requested';
    return true;
  });

  return (
    <DashboardLayout>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              {isCoordinator ? 'Placement Coordinator Console' : 'Corporate Recruiter Console'}
            </span>
            <span className="text-xs text-gray-400">&bull;</span>
            <span className="text-xs text-gray-500">Academic Year 2026-27</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Job Application Forms (JAF)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isCoordinator
              ? 'Moderate corporate recruitment forms, review PhD eligibility criteria, and track scholar participation.'
              : 'Create and track Job Application Forms, review scholar applicants, and manage recruitment rounds.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0 self-start sm:self-auto">
          {isCoordinator && (
            <Link
              href="/help"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-xs cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Inquiries Desk</span>
            </Link>
          )}
          {isCompany && (
            <Link
              href="/jaf/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1B2A4A] rounded-lg hover:bg-[#2D3F5E] transition-all shadow-xs cursor-pointer"
            >
              <span>+ New JAF</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
        {/* KPI 1: Total JAFs */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Total JAFs</span>
            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
              <BriefcaseIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{jobs.length}</span>
            <span className="text-[11px] text-gray-400">total forms</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Submitted in portal</p>
        </div>

        {/* KPI 2: Pending Moderation */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Pending Review</span>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              !
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">{pendingCount}</span>
            <span className="text-[11px] text-gray-400">need action</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting coordinator review</p>
        </div>

        {/* KPI 3: Approved Drives */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Approved & Open</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircleIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{approvedCount}</span>
            <span className="text-[11px] text-gray-400">active drives</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Visible to eligible scholars</p>
        </div>

        {/* KPI 4: Total Applicants */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Total Applicants</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
              <UsersIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{totalApplicants}</span>
            <span className="text-[11px] text-gray-400">candidates</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Registered across drives</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
        {/* Tab & Search Toolbar */}
        <div className="p-4 sm:p-5 pb-3 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setCoordinatorTab('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                coordinatorTab === 'all'
                  ? 'bg-[#1B2A4A] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All JAFs ({jobs.length})
            </button>
            <button
              onClick={() => setCoordinatorTab('pending')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                coordinatorTab === 'pending'
                  ? 'bg-[#1B2A4A] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pending ({jobs.filter((j) => j.status === 'Unapproved').length})
            </button>
            <button
              onClick={() => setCoordinatorTab('approved')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                coordinatorTab === 'approved'
                  ? 'bg-[#1B2A4A] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Approved ({approvedCount})
            </button>
            {changesCount > 0 && (
              <button
                onClick={() => setCoordinatorTab('changes')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  coordinatorTab === 'changes'
                    ? 'bg-[#1B2A4A] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Revisions ({changesCount})
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by role or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-xs w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white text-gray-800"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loadingJobs ? (
            <div className="py-16 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-[#1B2A4A] border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="font-medium text-xs text-gray-500">Loading Job Application Forms...</p>
            </div>
          ) : filteredJobs.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-gray-200">
                  <th className="text-center text-xs uppercase font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap w-10">#</th>
                  <th className="text-left text-xs uppercase font-semibold text-gray-500 px-3.5 py-2.5 whitespace-nowrap min-w-[200px]">Designation & Company</th>
                  <th className="text-left text-xs uppercase font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap w-32">Status</th>
                  <th className="text-center text-xs uppercase font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap w-24">Applicants</th>
                  <th className="text-right text-xs uppercase font-semibold text-gray-500 px-3.5 py-2.5 whitespace-nowrap w-64">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredJobs.map((job, index) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-2.5 text-xs text-gray-500 text-center whitespace-nowrap font-mono">{index + 1}</td>
                    <td className="px-3.5 py-2.5 text-xs text-gray-800">
                      <span className="font-semibold block truncate text-gray-900" title={job.designation}>
                        {job.designation}
                      </span>
                      <span className="text-[11px] font-medium text-[#1B2A4A] block truncate" title={job.company}>
                        {job.company}
                      </span>
                      {job.feedback && (
                        <span className="text-[10px] text-blue-600 font-medium block truncate mt-0.5" title={job.feedback}>
                          Note: {job.feedback}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {renderStatusBadge(job.status)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-800 text-center whitespace-nowrap font-semibold">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        <UsersIcon className="w-3 h-3 text-slate-400" />
                        {job.registeredStudents || 0}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                      {isCompany ? (
                        job.status === 'Incomplete' ? (
                          <Link
                            href={`/jaf/${job.id}/details`}
                            className="inline-flex items-center justify-center bg-[#0f172a] text-white text-xs px-3 py-1.5 rounded-md font-semibold hover:bg-black transition-colors"
                          >
                            Complete &rarr;
                          </Link>
                        ) : (
                          <div className="flex items-center justify-end gap-2 text-xs">
                            <Link
                              href={`/jaf/${job.id}/details`}
                              className="border border-gray-300 text-gray-700 text-xs px-2.5 py-1 rounded-md hover:bg-gray-50 transition-colors font-medium cursor-pointer"
                            >
                              View JAF
                            </Link>
                            <Link
                              href={`/jaf/${job.id}/applicants`}
                              className={`inline-flex items-center justify-center text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                                job.status === 'Approved'
                                  ? 'bg-[#1B2A4A] text-white hover:bg-[#2D3F5E]'
                                  : 'bg-gray-100 text-[#a3a3a3] cursor-not-allowed pointer-events-none'
                              }`}
                            >
                              Applicants ({job.registeredStudents || 0})
                            </Link>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={() => setReviewJaf(job)}
                            className="border border-gray-300 text-gray-700 text-xs px-2.5 py-1 rounded-md hover:bg-gray-50 transition-colors font-medium cursor-pointer"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => setEditJaf(job)}
                            className="border border-gray-300 text-gray-700 text-xs px-2.5 py-1 rounded-md hover:bg-gray-50 transition-colors font-medium cursor-pointer"
                          >
                            Edit
                          </button>

                          {isCoordinator && job.status === 'Unapproved' && (
                            <button
                              onClick={() => handleApprove(job.id)}
                              className="bg-emerald-700 text-white text-xs px-2.5 py-1 rounded-md hover:bg-emerald-800 transition-colors font-medium cursor-pointer shadow-2xs"
                            >
                              Approve
                            </button>
                          )}

                          <Link
                            href={`/jaf/${job.id}/applicants`}
                            className="border border-gray-300 text-gray-700 text-xs px-2.5 py-1 rounded-md hover:bg-gray-50 transition-colors font-medium cursor-pointer"
                          >
                            Applicants
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-xs text-gray-500">
              <p className="font-semibold text-gray-700">No Job Application Forms match your filter</p>
              <p className="mt-1">Try resetting the search keywords or switching tabs.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 px-5 bg-[#f8fafc] border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Showing <strong className="text-gray-800">{filteredJobs.length}</strong> of {jobs.length} total applications
          </span>
          <Link href="/jobs" className="text-[#1B2A4A] hover:underline font-semibold inline-flex items-center gap-1">
            Open full jobs directory &rarr;
          </Link>
        </div>
      </div>

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
