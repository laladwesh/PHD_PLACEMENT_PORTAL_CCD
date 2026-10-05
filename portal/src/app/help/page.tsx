'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserRole } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';

interface Coordinator {
  name: string;
  role: string;
  badge: string;
  phone: string;
  email: string;
  office: string;
}

interface SupportQueryRecord {
  _id: string;
  ticket_id: string;
  user_email: string;
  user_name: string;
  user_role: 'student' | 'company' | 'coordinator';
  category: string;
  subject: string;
  query: string;
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Closed';
  response?: string;
  resolved_by?: string;
  resolved_at?: string;
  createdAt: string;
  updatedAt: string;
}

const API_ROOT = '/phdplacement/api';

const coordinators: Coordinator[] = [
  {
    name: 'Career Development Officer (CDO)',
    role: 'Officer In-Charge',
    badge: 'CCD Administration',
    phone: '+91 91014 67789',
    email: 'cdo.ccd@iitg.ac.in',
    office: 'CCD Office, 2nd Floor, Admin Building',
  },
  {
    name: 'Avinash Gupta',
    role: 'Lead Student Coordinator (LSC)',
    badge: 'Overall Drives & Logistics',
    phone: '+91 98383 68756',
    email: 'guptaavinash302@gmail.com',
    office: 'Student Placement Committee',
  },
  {
    name: 'Ravit Chatrath',
    role: 'Lead Student Coordinator (LSC)',
    badge: 'PhD & Research Placements',
    phone: '+91 74540 63847',
    email: 'c.ravit@iitg.ac.in',
    office: 'PhD Placement Operations',
  },
  {
    name: 'CCD Helpdesk & Support',
    role: 'Technical & Query Operations',
    badge: 'Portal Support',
    phone: '+91 361 258 2175',
    email: 'placement@iitg.ac.in',
    office: 'Room 201, Administrative Building, IITG',
  },
];

const faqs = [
  {
    q: 'How long does CV verification take for PhD scholars?',
    a: 'CV verification is typically completed within 24 to 48 working hours by the departmental placement coordinator. You can check the verification status in Step 2 (CV Upload) of the Registration workflow.',
  },
  {
    q: 'Can recruiters access student resumes before shortlisting?',
    a: 'Yes, authorized recruiters can view and download verified CVs submitted by applicants through their Job Application Form (JAF) applicant console.',
  },
  {
    q: 'What should I do if my registration fee status is not updated?',
    a: 'Fee verification involves banking reconciliation with IIT Guwahati accounts. If your payment receipt remains unverified after 2 working days, please submit a query here with your payment reference / DU number.',
  },
  {
    q: 'How can a recruiting organization schedule interview rounds or PPTs?',
    a: 'Once a Job Application Form (JAF) is submitted and reviewed, the designated CCD coordinator will coordinate drive dates, interview slots, and any video conferencing or offline logistics.',
  },
  {
    q: 'How do I update locked profile details after submission?',
    a: 'Editable profile information can be updated anytime under "Registration > Step 1: Profile Update". For locked fields (such as official roll number or department), please contact the CDO office or submit a query.',
  },
];

const categories = [
  'Registration & Profile Verification',
  'CV Upload & Department Verification',
  'Placement Fee & Payment Reconciliation',
  'Job Application Form (JAF) & Eligibility',
  'Drive Scheduling & Interview Slots',
  'Technical Issue with Portal',
  'Other Inquiries',
];

function formatDate(value?: string) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function HelpPage() {
  const { profile, role } = useUserRole();
  const isCoordinator = role === 'coordinator';

  // Default coordinators to the Inquiries Desk, students/companies to submit or my queries
  const [activeTab, setActiveTab] = useState<'contact' | 'query' | 'queries' | 'faqs'>('contact');
  const [category, setCategory] = useState(categories[0]);
  const [subject, setSubject] = useState('');
  const [query, setQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [queriesList, setQueriesList] = useState<SupportQueryRecord[]>([]);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sorting & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'pending_first' | 'newest' | 'oldest'>('pending_first');

  // Coordinator response state
  const [activeRespondingId, setActiveRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState<'Pending' | 'In Progress' | 'Resolved' | 'Closed'>('Resolved');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isCoordinator) {
      setActiveTab('queries');
    }
  }, [isCoordinator]);

  const fetchQueries = async () => {
    setLoadingQueries(true);
    try {
      const res = await fetch(`${API_ROOT}/queries`);
      if (res.ok) {
        const data = await res.json();
        setQueriesList(data.queries || []);
      } else {
        console.error('Failed to load queries');
      }
    } catch (err) {
      console.error('Error fetching queries:', err);
    } finally {
      setLoadingQueries(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !query.trim()) {
      toast.warning('Please enter both subject and query before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_ROOT}/queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          query: query.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit query.');
        return;
      }

      toast.success(`Query submitted successfully! Ticket ID: ${data.query.ticket_id}`);
      setSubject('');
      setQuery('');
      await fetchQueries();
      setActiveTab('queries');
    } catch (err) {
      console.error('Error submitting query:', err);
      toast.error('Network error while submitting query.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (
    queryId: string,
    newStatus: 'Pending' | 'In Progress' | 'Resolved' | 'Closed',
    reply?: string
  ) => {
    setIsUpdating(true);
    try {
      const body: Record<string, string> = { status: newStatus };
      if (reply !== undefined) {
        body.response = reply.trim();
      }

      const res = await fetch(`${API_ROOT}/queries/${queryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update query.');
        return;
      }

      toast.success(`Query ${data.query.ticket_id} updated.`);
      setQueriesList((prev) => prev.map((q) => (q._id === queryId ? data.query : q)));
      setActiveRespondingId(null);
      setResponseText('');
    } catch (err) {
      console.error('Error updating query:', err);
      toast.error('Network error updating query.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Metrics
  const totalCount = queriesList.length;
  const pendingCount = queriesList.filter((q) => q.status === 'Pending').length;
  const inProgressCount = queriesList.filter((q) => q.status === 'In Progress').length;
  const resolvedCount = queriesList.filter((q) => q.status === 'Resolved' || q.status === 'Closed').length;

  // Filtered & Sorted Query List
  const filteredQueries = queriesList
    .filter((q) => {
      if (statusFilter !== 'all' && q.status !== statusFilter) return false;
      if (roleFilter !== 'all' && q.user_role !== roleFilter) return false;
      if (searchQuery.trim()) {
        const queryTerm = searchQuery.toLowerCase();
        const matchesTicket = q.ticket_id.toLowerCase().includes(queryTerm);
        const matchesSubject = q.subject.toLowerCase().includes(queryTerm);
        const matchesQuery = q.query.toLowerCase().includes(queryTerm);
        const matchesName = q.user_name.toLowerCase().includes(queryTerm);
        const matchesEmail = q.user_email.toLowerCase().includes(queryTerm);
        const matchesCat = q.category.toLowerCase().includes(queryTerm);
        if (!matchesTicket && !matchesSubject && !matchesQuery && !matchesName && !matchesEmail && !matchesCat) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'pending_first') {
        const orderMap: Record<string, number> = { Pending: 1, 'In Progress': 2, Resolved: 3, Closed: 4 };
        const orderA = orderMap[a.status] || 5;
        const orderB = orderMap[b.status] || 5;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const userEmail = profile.email || `${role}@iitg.ac.in`;
  const userName = profile.name || (isCoordinator ? 'Coordinator' : role === 'company' ? 'Recruiter' : 'PhD Scholar');

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                {isCoordinator ? 'Support & Inquiries Desk' : 'Help & Support Desk'}
              </h1>
              <span className="text-[11px] font-semibold bg-[#e6ebf2] text-[#1B2A4A] px-2.5 py-0.5 rounded-full">
                CCD IIT Guwahati
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isCoordinator
                ? 'Review, sort, and resolve grievance issues submitted by PhD scholars and visiting companies.'
                : 'Assistance for PhD scholars and corporate recruiters. Submit inquiries directly to placement coordinators.'}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200/70 rounded-lg px-3.5 py-2">
            <div className="w-8 h-8 rounded-full bg-[#1B2A4A] text-white flex items-center justify-center font-semibold text-xs">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-gray-800 leading-tight">{userName}</p>
              <p className="text-[11px] text-gray-500 font-mono leading-tight truncate max-w-[200px]">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
          {/* For Coordinators, put Inquiries Desk First */}
          {isCoordinator ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('queries')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer relative ${
                  activeTab === 'queries'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>Inquiries & Issues Desk</span>
                {pendingCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                    {pendingCount} pending
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('query')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'query'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Create Internal Ticket
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contact')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'contact'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Coordinator Directory
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('faqs')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'faqs'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                FAQs
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('query')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'query'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Submit an Issue / Query
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('queries')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer relative ${
                  activeTab === 'queries'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>My Submitted Issues</span>
                {queriesList.length > 0 && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                      activeTab === 'queries' ? 'bg-white text-[#1B2A4A]' : 'bg-[#1B2A4A] text-white'
                    }`}
                  >
                    {queriesList.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contact')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'contact'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Coordinator Directory
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('faqs')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'faqs'
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                FAQs
              </button>
            </>
          )}
        </div>

        {/* Tab: Inquiries Desk / My Queries */}
        {activeTab === 'queries' && (
          <div className="space-y-4">
            {/* KPI Metric Summary for Coordinator */}
            {isCoordinator && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white border-[#1B2A4A] shadow-xs ring-2 ring-[#1B2A4A]/10'
                      : 'bg-white border-gray-200/80 hover:border-gray-300'
                  }`}
                >
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">All Issues</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{totalCount}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Total across scholars & companies</p>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('Pending')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    statusFilter === 'Pending'
                      ? 'bg-amber-50/50 border-amber-500 shadow-xs ring-2 ring-amber-500/20'
                      : 'bg-white border-amber-200/80 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Pending</p>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  </div>
                  <p className="text-xl font-bold text-amber-900 mt-1">{pendingCount}</p>
                  <p className="text-[10px] text-amber-600/80 mt-0.5">Requires coordinator action</p>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('In Progress')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    statusFilter === 'In Progress'
                      ? 'bg-blue-50/50 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white border-blue-200/80 hover:border-blue-300'
                  }`}
                >
                  <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">In Progress</p>
                  <p className="text-xl font-bold text-blue-900 mt-1">{inProgressCount}</p>
                  <p className="text-[10px] text-blue-600/80 mt-0.5">Under investigation</p>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('Resolved')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    statusFilter === 'Resolved'
                      ? 'bg-emerald-50/50 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-white border-emerald-200/80 hover:border-emerald-300'
                  }`}
                >
                  <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Resolved</p>
                  <p className="text-xl font-bold text-emerald-900 mt-1">{resolvedCount}</p>
                  <p className="text-[10px] text-emerald-600/80 mt-0.5">Answered & resolved</p>
                </button>
              </div>
            )}

            {/* Sorting, Filtering, and Search Toolbar */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <svg
                    className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isCoordinator
                        ? 'Search by Ticket ID, Scholar roll/name, Company name, subject...'
                        : 'Search your submitted tickets by ID or keywords...'
                    }
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] bg-gray-50/50 focus:bg-white"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter and Sort Selectors */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Filter by Role (Coordinators only) */}
                  {isCoordinator && (
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                    >
                      <option value="all">All Submitters</option>
                      <option value="student">PhD Scholars</option>
                      <option value="company">Corporate Recruiters</option>
                    </select>
                  )}

                  {/* Filter by Status */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>

                  {/* Sort By */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'pending_first' | 'newest' | 'oldest')}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                  >
                    <option value="pending_first">Sort: Pending First</option>
                    <option value="newest">Sort: Newest First</option>
                    <option value="oldest">Sort: Oldest First</option>
                  </select>

                  {/* Refresh Button */}
                  <button
                    type="button"
                    onClick={() => fetchQueries()}
                    className="text-xs text-gray-600 hover:text-gray-900 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center gap-1"
                    title="Refresh from database"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>

                  {!isCoordinator && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('query')}
                      className="text-xs font-semibold bg-[#1B2A4A] text-white px-3 py-1.5 rounded-lg hover:bg-[#2D3F5E] transition-colors cursor-pointer"
                    >
                      + New Issue
                    </button>
                  )}
                </div>
              </div>

              {/* Active filters pill display */}
              {(statusFilter !== 'all' || roleFilter !== 'all' || searchQuery) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                  <span>Active Filters:</span>
                  {statusFilter !== 'all' && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                      Status: {statusFilter}
                      <button type="button" onClick={() => setStatusFilter('all')} className="hover:text-red-500">×</button>
                    </span>
                  )}
                  {roleFilter !== 'all' && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                      Role: {roleFilter === 'student' ? 'PhD Scholar' : 'Recruiter'}
                      <button type="button" onClick={() => setRoleFilter('all')} className="hover:text-red-500">×</button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                      &quot;{searchQuery}&quot;
                      <button type="button" onClick={() => setSearchQuery('')} className="hover:text-red-500">×</button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('all');
                      setRoleFilter('all');
                      setSearchQuery('');
                    }}
                    className="text-[#1B2A4A] font-semibold hover:underline ml-1 cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Inquiries List */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-900">
                    {isCoordinator ? 'Support Inquiries & Grievances' : 'Submitted Inquiries'}
                  </h2>
                  <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {filteredQueries.length} of {queriesList.length}
                  </span>
                </div>
              </div>

              {loadingQueries ? (
                <div className="py-16 text-center text-gray-400">
                  <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-[#1B2A4A] rounded-full animate-spin mb-2" />
                  <p className="text-xs">Loading inquiries from database...</p>
                </div>
              ) : filteredQueries.length === 0 ? (
                <div className="text-center py-14 text-gray-400 space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">No issues found matching criteria</p>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    {queriesList.length === 0
                      ? isCoordinator
                        ? 'There are currently no inquiries in the queue. New submissions from scholars or recruiters will appear here automatically.'
                        : 'You haven’t submitted any support queries yet. Click "Submit an Issue" if you need coordinator assistance.'
                      : 'Try broadening your search term or clearing active status and role filters.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredQueries.map((q) => {
                    const isResponding = activeRespondingId === q._id;

                    return (
                      <div key={q._id} className="py-5 first:pt-0 last:pb-0 space-y-3">
                        {/* Ticket Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Ticket ID */}
                              <span className="font-mono text-xs font-bold text-[#1B2A4A] bg-[#e6ebf2] px-2 py-0.5 rounded border border-[#1B2A4A]/10">
                                {q.ticket_id}
                              </span>

                              {/* Category */}
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                {q.category}
                              </span>

                              {/* Submitter Role badge */}
                              {isCoordinator && (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                    q.user_role === 'student'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                                  }`}
                                >
                                  {q.user_role === 'student' ? 'PhD Scholar' : 'Recruiter'}
                                </span>
                              )}

                              {/* Date */}
                              <span className="text-[11px] text-gray-400 font-mono">
                                {formatDate(q.createdAt)}
                              </span>
                            </div>

                            {/* Subject */}
                            <h3 className="text-sm font-bold text-gray-900 mt-1">{q.subject}</h3>

                            {/* Submitter Details for Coordinator */}
                            {isCoordinator && (
                              <p className="text-[11px] text-gray-600">
                                Submitter:{' '}
                                <span className="font-semibold text-gray-900">{q.user_name}</span> (
                                <a href={`mailto:${q.user_email}`} className="font-mono text-blue-600 hover:underline">
                                  {q.user_email}
                                </a>
                                )
                              </p>
                            )}
                          </div>

                          {/* Status Badge & Actions */}
                          <div className="flex items-center gap-2 self-start">
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                q.status === 'Resolved'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : q.status === 'In Progress'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : q.status === 'Closed'
                                  ? 'bg-gray-100 text-gray-700 border border-gray-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {q.status}
                            </span>

                            {/* Coordinator Actions */}
                            {isCoordinator && (
                              <div className="flex items-center gap-1.5 ml-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isResponding) {
                                      setActiveRespondingId(null);
                                    } else {
                                      setActiveRespondingId(q._id);
                                      setResponseText(q.response || '');
                                      setResponseStatus(q.status === 'Pending' ? 'Resolved' : q.status);
                                    }
                                  }}
                                  className="text-xs font-semibold px-2.5 py-1 rounded bg-[#1B2A4A] text-white hover:bg-[#2D3F5E] transition-colors cursor-pointer"
                                >
                                  {isResponding ? 'Close Drawer' : q.response ? 'Edit Resolution' : 'Resolve / Reply'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Issue Description */}
                        <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {q.query}
                        </div>

                        {/* Official CCD Response (Shown to scholars, recruiters, and coordinators) */}
                        {q.response && !isResponding && (
                          <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3.5 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-900">
                              <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Official CCD Coordinator Resolution
                              </span>
                              {q.resolved_at && (
                                <span className="text-emerald-700 font-normal">
                                  {formatDate(q.resolved_at)} {q.resolved_by ? `· by ${q.resolved_by}` : ''}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-emerald-950 whitespace-pre-wrap leading-relaxed">
                              {q.response}
                            </p>
                          </div>
                        )}

                        {/* Coordinator Resolution Console Drawer */}
                        {isCoordinator && isResponding && (
                          <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 sm:p-5 space-y-4 mt-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                              <div>
                                <h4 className="text-xs font-bold text-gray-900">
                                  Coordinator Resolution Console &mdash; Ticket {q.ticket_id}
                                </h4>
                                <p className="text-[11px] text-gray-500">
                                  Draft a response to {q.user_name} ({q.user_email}). Submitter will view this on their portal.
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <label className="text-[11px] text-gray-600 font-medium">Ticket Status:</label>
                                <select
                                  value={responseStatus}
                                  onChange={(e) =>
                                    setResponseStatus(
                                      e.target.value as 'Pending' | 'In Progress' | 'Resolved' | 'Closed'
                                    )
                                  }
                                  className="border border-gray-300 rounded-lg px-2.5 py-1 text-xs bg-white text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Resolved">Resolved</option>
                                  <option value="Closed">Closed</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                Resolution Notes / Official Reply Message:
                              </label>
                              <textarea
                                rows={4}
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Explain resolution details, instructions, or next steps clearly to the scholar or company..."
                                className="w-full border border-gray-300 rounded-lg p-3 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                              />
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              {/* Quick 1-click status shortcuts */}
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span>Quick Actions:</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(q._id, 'In Progress')}
                                  className="px-2 py-1 text-[11px] rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                                >
                                  Mark In Progress
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(q._id, 'Closed')}
                                  className="px-2 py-1 text-[11px] rounded bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                                >
                                  Close Ticket
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setActiveRespondingId(null)}
                                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateStatus(q._id, responseStatus, responseText)}
                                  className="bg-[#1B2A4A] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#2D3F5E] transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {isUpdating ? 'Saving...' : 'Save & Update Ticket'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Submit an Issue / Query */}
        {activeTab === 'query' && (
          <div className="bg-white rounded-xl border border-gray-200/80 p-6 md:p-8 shadow-xs">
            <div className="mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                {isCoordinator ? 'Create an Internal Support Ticket' : 'Submit a Support Ticket / Issue'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Submitting ticket as <span className="font-semibold text-gray-900">{userName}</span> ({userEmail}).
                Inquiries are permanently logged in the placement database and reviewed by the CCD placement cell.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Issue Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full max-w-xl border border-gray-300 rounded-lg px-3.5 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] text-gray-800"
                >
                  {categories.map((cat, i) => (
                    <option key={i} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Subject / Summary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Query regarding SBI Collect transaction verification / CV review"
                  className="w-full max-w-xl border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Detailed Issue Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  maxLength={3000}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Please describe your issue in detail. Include any relevant reference numbers, company names, or scholar roll numbers."
                  className="w-full max-w-2xl border border-gray-300 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] text-gray-900 placeholder:text-gray-400 resize-vertical"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#1B2A4A] text-white text-xs font-semibold px-6 py-2.5 rounded-lg hover:bg-[#2D3F5E] transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Issue'}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setSubject('');
                    setQuery('');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 py-2.5 px-4 cursor-pointer font-medium"
                >
                  Clear Form
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab: Coordinator Directory */}
        {activeTab === 'contact' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coordinators.map((c, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h2 className="text-sm font-bold text-gray-900">{c.name}</h2>
                        <p className="text-xs text-[#1B2A4A] font-medium mt-0.5">{c.role}</p>
                      </div>
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full border border-gray-200">
                        {c.badge}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-gray-600 my-4 bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-gray-700 truncate">{c.office}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="font-mono text-gray-700">{c.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-700 truncate">{c.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                    <a
                      href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-xs font-semibold transition-colors"
                    >
                      <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>Call</span>
                    </a>
                    <a
                      href={`mailto:${c.email}`}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#1B2A4A] hover:bg-[#2D3F5E] text-white rounded-md text-xs font-semibold transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Email</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Note Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 flex items-start gap-3">
              <svg className="w-5 h-5 text-[#1B2A4A] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-slate-900">CCD Office Operating Hours</p>
                <p className="text-slate-600 mt-0.5">
                  The Placement Cell office is open Monday through Friday, 9:00 AM – 5:30 PM IST. During peak placement drives, coordinators are available for extended hours via phone and portal inquiries.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Frequently Asked Questions */}
        {activeTab === 'faqs' && (
          <div className="bg-white rounded-xl border border-gray-200/80 p-6 md:p-8 shadow-xs">
            <div className="mb-6 pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Frequently Asked Questions</h2>
              <p className="text-xs text-gray-500 mt-1">
                Common questions and guidelines for IIT Guwahati PhD scholars and visiting companies.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full text-left p-4 bg-gray-50/70 hover:bg-gray-100/70 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span className="text-xs font-bold text-gray-800">{faq.q}</span>
                      <svg
                        className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="p-4 bg-white border-t border-gray-100 text-xs text-gray-600 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
