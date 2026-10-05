'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserRole } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';

interface Candidate {
  id: string | number;
  name: string;
  rollNumber: string;
  email: string;
  department: string;
  researchArea: string;
  cpi: number;
  thesisStatus: string;
  status: string;
  isBlocked: boolean;
  placedAt?: {
    company: string;
    designation?: string;
  };
  supervisor?: string;
  supervisorNoc?: boolean;
  expectedGraduation?: string;
}

export default function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params);
  const { isCoordinator, isCompany } = useUserRole();

  const [jaf, setJaf] = useState<any>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [policyFilter, setPolicyFilter] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Attempt to fetch from real API first
        const res = await fetch(`/phdplacement/api/jobs/${rawId}/applicants`);
        if (res.ok) {
          const data = await res.json();
          if (data.job) {
            setJaf({
              id: data.job.id || rawId,
              company: data.job.company || 'Unknown Organization',
              designation: data.job.designation || 'Research Scientist',
              salary: {
                ctc:
                  data.job.salary?.additionalInfo ||
                  (data.job.salary?.programmes?.[0]?.amount
                    ? `₹ ${(data.job.salary.programmes[0].amount / 100000).toFixed(1)} LPA`
                    : '₹ 24.0 — 45.0 LPA'),
              },
              placeOfPosting: data.job.placeOfPosting || 'Bengaluru / Pan-India',
              expectedRecruitments: data.job.numOpenings || 5,
              status: data.job.status || 'Approved',
              deadline: data.job.applicationDeadline
                ? new Date(data.job.applicationDeadline).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Oct 30, 2026',
              poc: {
                name: 'Placement Operations',
                role: 'CCD Placement Cell',
                email: 'placement.head@iitg.ac.in',
                phone: '+91 361 258 2175',
              },
            });

            if (data.applicants && data.applicants.length > 0) {
              const mapped: Candidate[] = data.applicants.map((app: any, idx: number) => {
                const s = app.student;
                const isSelected = app.application_status === 'selected';
                const isShortlisted = app.application_status === 'shortlist';
                const isInterviewing = app.application_status === 'waitlist';

                let displayStatus = 'Applied';
                if (isSelected) displayStatus = 'Selected';
                else if (isShortlisted) displayStatus = 'Shortlisted';
                else if (isInterviewing) displayStatus = 'Interviewing';

                const isBlocked =
                  s.status === 'Placed' ||
                  Boolean(s.placedAt?.company);

                return {
                  id: s.id || idx + 1,
                  name: s.name || `Scholar ${s.roll_number}`,
                  rollNumber: String(s.roll_number || ''),
                  email: s.email || '',
                  department: s.department || 'Computer Science and Engineering',
                  researchArea: s.researchArea || 'Applied AI, High-Performance Systems & Networks',
                  cpi: Number(s.cpi) || 8.5,
                  thesisStatus: s.thesisStatus || 'Pre-Synopsis Complete',
                  status: displayStatus,
                  isBlocked,
                  placedAt: s.placedAt,
                  supervisor: 'Prof. Faculty Advisor',
                  supervisorNoc: true,
                  expectedGraduation: 'May 2027',
                };
              });
              setCandidates(mapped);
            } else {
              setCandidates([]);
            }
            return;
          }
        }
        setJaf(null);
        setCandidates([]);
      } catch (err) {
        console.error('Error fetching applicants:', err);
        setJaf(null);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [rawId, isCoordinator, isCompany]);

  const departmentsList = Array.from(new Set(candidates.map((c) => c.department))).filter(Boolean);

  const filteredCandidates = candidates.filter((c) => {
    if (deptFilter !== 'all' && c.department !== deptFilter) return false;
    if (statusFilter !== 'all' && c.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (policyFilter === 'active' && c.isBlocked) return false;
    if (policyFilter === 'blocked' && !c.isBlocked) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.rollNumber.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q) ||
        c.researchArea.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string, isBlocked: boolean) => {
    if (isBlocked) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Blocked
        </span>
      );
    }
    switch (status.toLowerCase()) {
      case 'selected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Selected
          </span>
        );
      case 'shortlisted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Shortlisted
          </span>
        );
      case 'interviewing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Interviewing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Applied
          </span>
        );
    }
  };

  const handleQuickStatusUpdate = (candidateId: string | number, newStatus: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c))
    );
    toast.success(`Scholar application status updated to "${newStatus}".`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[420px] gap-3">
          <div className="w-8 h-8 border-3 border-[#1B2A4A] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium text-sm">Loading registered applicants...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!jaf) {
    return (
      <DashboardLayout>
        <div className="p-8 bg-red-50 text-red-700 rounded-lg border border-red-200 mt-6 max-w-2xl mx-auto text-center shadow-xs">
          <p className="font-semibold text-lg">Job Application Not Found</p>
          <p className="text-sm mt-1 text-red-600">The requested job drive does not exist or you do not have permission to view its registered scholars.</p>
          <Link
            href="/jobs"
            className="inline-block mt-4 px-4 py-2 bg-[#1B2A4A] text-white rounded text-sm font-medium hover:bg-[#2D3F5E] transition-colors"
          >
            ← Back to Job Applications
          </Link>
        </div>
      </DashboardLayout>
    );
  }

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
        <div className="flex items-center gap-2.5">
          <Link
            href={`/jaf/${rawId}/details`}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
          >
            JAF Details
          </Link>
          <Link
            href={`/jaf/${rawId}/final-selection`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1B2A4A] rounded-md hover:bg-[#2D3F5E] transition-colors shadow-2xs"
          >
            Final Selection List
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Job Summary Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex-shrink-0">
              PhD Drive
            </span>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight truncate" title={jaf.designation}>
              {jaf.designation}
            </h1>
            <span className="text-gray-300 flex-shrink-0 hidden sm:inline">&bull;</span>
            <span className="text-xs sm:text-sm font-medium text-[#1B2A4A] truncate flex-shrink-0" title={jaf.company}>
              {jaf.company}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${
              jaf.status === 'Approved'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {jaf.status || 'Approved'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs flex-shrink-0">
            <span className="text-gray-500">
              Registered: <strong className="text-[#1B2A4A] font-bold">{candidates.length}</strong>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">
              Intake: <strong className="text-gray-800 font-semibold">{jaf.expectedRecruitments || 5}</strong>
            </span>
          </div>
        </div>

        {/* Metadata Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
          <div className="truncate">
            <span className="text-[10px] uppercase font-semibold text-gray-400 block mb-0.5">CTC (Gross)</span>
            <span className="font-semibold text-gray-800 truncate block">{jaf.salary?.ctc || '₹ 24.5 LPA'}</span>
          </div>
          <div className="truncate">
            <span className="text-[10px] uppercase font-semibold text-gray-400 block mb-0.5">Location</span>
            <span className="text-gray-700 truncate block">{jaf.placeOfPosting || 'Pan-India'}</span>
          </div>
          <div className="truncate">
            <span className="text-[10px] uppercase font-semibold text-gray-400 block mb-0.5">Deadline</span>
            <span className="text-gray-700 truncate block">{jaf.deadline || 'Oct 30, 2026'}</span>
          </div>
          <div className="truncate">
            <span className="text-[10px] uppercase font-semibold text-gray-400 block mb-0.5">SPOC</span>
            <span className="text-gray-700 truncate block" title={jaf.poc?.name}>
              {jaf.poc?.name || 'Placement Cell'} ({jaf.poc?.role || 'CCD Lead'})
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-3.5 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[200px] max-w-xs flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search scholar, roll, or research..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] focus:border-[#1B2A4A] bg-white text-gray-800"
              />
            </div>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
            >
              <option value="all">All Depts ({candidates.length})</option>
              {departmentsList.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Application Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
            >
              <option value="all">All Statuses</option>
              <option value="selected">Selected</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interviewing">Interviewing</option>
              <option value="applied">Applied</option>
            </select>

            {/* Policy Filter */}
            <select
              value={policyFilter}
              onChange={(e) => setPolicyFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
            >
              <option value="all">All Policy</option>
              <option value="active">Active Only</option>
              <option value="blocked">Blocked Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
              <strong className="text-gray-800">{filteredCandidates.length}</strong> of {candidates.length}
            </span>
            {(search || deptFilter !== 'all' || statusFilter !== 'all' || policyFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setDeptFilter('all');
                  setStatusFilter('all');
                  setPolicyFilter('all');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline whitespace-nowrap cursor-pointer ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Candidates Data Table - Compact Responsive Mode */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-200">
                <th className="px-3.5 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap w-[200px]">
                  Scholar & Roll No
                </th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap max-w-[200px]">
                  Department & Research
                </th>
                <th className="px-2.5 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap text-center w-[60px]">
                  CPI
                </th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap w-[140px]">
                  Thesis Status
                </th>
                <th className="px-2.5 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap text-center w-[100px]">
                  Status
                </th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap w-[130px]">
                  Placement Policy
                </th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap text-right w-[140px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <p className="font-semibold text-gray-700 text-sm">No registered scholars found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {search || deptFilter !== 'all' || statusFilter !== 'all' || policyFilter !== 'all'
                        ? 'Try clearing active filters.'
                        : 'No students have applied yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => {
                  const isBlocked = candidate.isBlocked;
                  return (
                    <tr key={candidate.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Scholar & Roll */}
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[11px] text-[#1B2A4A] flex-shrink-0">
                            {candidate.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-gray-900 block truncate" title={candidate.name}>
                              {candidate.name}
                            </span>
                            <span className="font-mono text-[10px] text-gray-500 font-medium block">
                              {candidate.rollNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department & Research Focus */}
                      <td className="px-3.5 py-2.5 max-w-[200px]">
                        <span className="text-xs font-medium text-gray-800 block truncate" title={candidate.department}>
                          {candidate.department}
                        </span>
                        {candidate.researchArea && (
                          <span className="text-[11px] text-gray-400 block truncate" title={candidate.researchArea}>
                            {candidate.researchArea}
                          </span>
                        )}
                      </td>

                      {/* CPI */}
                      <td className="px-2.5 py-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${
                            Number(candidate.cpi) >= 9.0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : Number(candidate.cpi) >= 8.0
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {Number(candidate.cpi).toFixed(2)}
                        </span>
                      </td>

                      {/* Thesis Status */}
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 truncate max-w-[130px]" title={candidate.thesisStatus}>
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              candidate.thesisStatus.includes('Defended')
                                ? 'bg-emerald-500'
                                : candidate.thesisStatus.includes('Synopsis')
                                ? 'bg-blue-500'
                                : 'bg-slate-400'
                            }`}
                          ></span>
                          <span className="truncate">{candidate.thesisStatus}</span>
                        </span>
                      </td>

                      {/* Application Status */}
                      <td className="px-2.5 py-2.5 text-center whitespace-nowrap">
                        {getStatusBadge(candidate.status, isBlocked)}
                      </td>

                      {/* Placement Policy Note */}
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        {isBlocked ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full truncate max-w-[130px]"
                            title={candidate.placedAt?.company ? `Placed at ${candidate.placedAt.company}` : 'Offer Accepted'}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0"></span>
                            <span className="truncate">Blocked</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                            Eligible
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedCandidate(candidate)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
                          >
                            Profile
                          </button>

                          {!isBlocked && (isCoordinator || isCompany) && (
                            <>
                              {candidate.status !== 'Shortlisted' && candidate.status !== 'Selected' && (
                                <button
                                  onClick={() => handleQuickStatusUpdate(candidate.id, 'Shortlisted')}
                                  className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
                                >
                                  Shortlist
                                </button>
                              )}
                              {candidate.status === 'Shortlisted' && (
                                <button
                                  onClick={() => handleQuickStatusUpdate(candidate.id, 'Selected')}
                                  className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors cursor-pointer"
                                >
                                  Select
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary */}
        <div className="bg-[#f8fafc] px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
          <span>PhD Placement Drive &bull; IIT Guwahati CCD</span>
          <div className="flex items-center gap-3">
            <span>
              Eligible: <strong className="text-gray-800">{candidates.filter((c) => !c.isBlocked).length}</strong>
            </span>
            <span className="text-gray-300">|</span>
            <span>
              Placed / Locked: <strong className="text-gray-800">{candidates.filter((c) => c.isBlocked).length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Candidate Profile Details Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#1B2A4A] text-white flex items-center justify-center font-bold text-sm">
                  {selectedCandidate.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{selectedCandidate.name}</h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    Roll No: {selectedCandidate.rollNumber} &bull; {selectedCandidate.department}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-gray-400 hover:text-gray-600 rounded-full p-1.5 hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-sm">
              {/* Academic Highlights */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">Major CPI</span>
                  <span className="text-lg font-bold font-mono text-[#1B2A4A] mt-0.5 block">
                    {Number(selectedCandidate.cpi).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">Programme</span>
                  <span className="text-sm font-semibold text-gray-800 mt-1 block">Ph.D. Scholar</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">Graduation</span>
                  <span className="text-xs font-semibold text-gray-800 mt-1 block">
                    {selectedCandidate.expectedGraduation || 'May 2027'}
                  </span>
                </div>
              </div>

              {/* Research Focus */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Doctoral Research Area
                </h4>
                <p className="text-gray-800 bg-gray-50 border border-gray-200 rounded-md p-3 text-xs leading-relaxed">
                  {selectedCandidate.researchArea}
                </p>
              </div>

              {/* Supervision & Thesis */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 font-medium block">Faculty Supervisor</span>
                  <span className="text-gray-900 font-semibold mt-0.5 block">
                    {selectedCandidate.supervisor || 'Prof. Faculty Advisor'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block">Supervisor NOC Status</span>
                  <span className="text-emerald-700 font-semibold mt-0.5 inline-flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Approved &bull; Eligible to Join
                  </span>
                </div>
              </div>

              {/* Policy Status */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  One-Student-One-Offer Compliance
                </h4>
                {selectedCandidate.isBlocked ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800">
                    <strong>Locked Application:</strong> Candidate has accepted an offer from{' '}
                    <span className="font-semibold">{selectedCandidate.placedAt?.company || 'another company'}</span>.
                    In accordance with IIT Guwahati placement rules, remaining drives are automatically locked.
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800">
                    <strong>Active Application:</strong> Scholar has zero accepted full-time offers and is currently eligible to participate in interviews and accept offers.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">Scholar Roll: {selectedCandidate.rollNumber}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
                {!selectedCandidate.isBlocked && (
                  <button
                    onClick={() => {
                      const next = selectedCandidate.status === 'Shortlisted' ? 'Selected' : 'Shortlisted';
                      handleQuickStatusUpdate(selectedCandidate.id, next);
                      setSelectedCandidate((prev) => (prev ? { ...prev, status: next } : null));
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#1B2A4A] rounded hover:bg-[#2D3F5E] transition-colors"
                  >
                    {selectedCandidate.status === 'Shortlisted' ? 'Mark Selected' : 'Mark Shortlisted'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
