'use client';

import { FormEvent, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserRole } from '@/lib/auth';

type AnnouncementCategory = 'Job Alert' | 'General' | 'Important' | 'Event';
type AnnouncementRecord = {
  _id: string;
  title: string;
  message: string;
  category: AnnouncementCategory;
  audience: 'all_students' | 'eligible_students';
  min_cpi?: number;
  link?: string;
  link_label?: string;
  publish_at: string;
  expires_at?: string;
  createdAt?: string;
  status: 'draft' | 'published';
  is_saved?: boolean;
  is_read?: boolean;
};

const API_ROOT = '/phdplacement/api';

async function getErrorMessage(response: Response) {
  const result = await response.json().catch(() => ({})) as { error?: string };
  return result.error || 'Request failed.';
}

function BookmarkIcon({ saved }: { saved: boolean }) {
  return (
    <svg className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 4.75A1.75 1.75 0 017.75 3h8.5A1.75 1.75 0 0118 4.75V21l-6-4-6 4V4.75z" />
    </svg>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
}

function AnnouncementList({
  announcements,
  onStateChange,
}: {
  announcements: AnnouncementRecord[];
  onStateChange: (announcement: AnnouncementRecord, state: 'saved' | 'read') => void;
}) {
  if (announcements.length === 0) {
    return <div className="border-y border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">No announcements to show.</div>;
  }

  return (
    <div className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
      {announcements.map((announcement) => (
        <article key={announcement._id} className="grid gap-3 border-l-4 border-[#172b4d] px-4 py-4 sm:grid-cols-[minmax(0,1fr)_120px] sm:gap-6 sm:px-5">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{announcement.title}</h2>
              <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${announcement.category === 'Important' ? 'bg-red-50 text-red-700' : announcement.category === 'Job Alert' ? 'bg-blue-50 text-blue-700' : announcement.category === 'Event' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {announcement.category}
              </span>
              {announcement.status === 'draft' && <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Draft</span>}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{announcement.message}</p>
            {announcement.link && (
              <a href={announcement.link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-[#1b2a4a] underline underline-offset-2">
                {announcement.link_label || 'Open link'}
              </a>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 text-xs text-slate-500 sm:flex-col sm:items-end sm:justify-start sm:gap-1">
            <button
              type="button"
              onClick={() => onStateChange(announcement, 'saved')}
              aria-label={announcement.is_saved ? 'Remove saved announcement' : 'Save announcement'}
              title={announcement.is_saved ? 'Remove saved announcement' : 'Save announcement'}
              className={`p-1 ${announcement.is_saved ? 'text-[#172b4d]' : 'text-slate-500 hover:text-[#172b4d]'}`}
            >
              <BookmarkIcon saved={Boolean(announcement.is_saved)} />
            </button>
            <span>{formatDate(announcement.publish_at)}</span>
            <button
              type="button"
              onClick={() => onStateChange(announcement, 'read')}
              className="font-medium text-[#1b2a4a] hover:underline"
            >
              {announcement.is_read ? 'Read' : 'Mark read'}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function AnnouncementsPage() {
  const { isStudent, isCoordinator } = useUserRole();
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('Job Alert');
  const [audience, setAudience] = useState<'all_students' | 'eligible_students'>('all_students');
  const [minimumCpi, setMinimumCpi] = useState('');
  const [link, setLink] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [publishAt, setPublishAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isStudent && !isCoordinator) return;
    let active = true;
    fetch(`${API_ROOT}/announcements`, { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(await getErrorMessage(response));
        return response.json() as Promise<{ announcements: AnnouncementRecord[] }>;
      })
      .then((result) => active && setAnnouncements(result.announcements))
      .catch((loadError: unknown) => active && setError(loadError instanceof Error ? loadError.message : 'Unable to load announcements.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [isStudent, isCoordinator]);

  const handleStateChange = async (announcement: AnnouncementRecord, state: 'saved' | 'read') => {
    const property = state === 'saved' ? 'is_saved' : 'is_read';
    const value = !announcement[property];
    try {
      const response = await fetch(`${API_ROOT}/announcements/${announcement._id}/state`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [state]: value }),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      setAnnouncements((current) => current.map((item) => item._id === announcement._id ? { ...item, [property]: value } : item));
    } catch (stateError) {
      setError(stateError instanceof Error ? stateError.message : 'Unable to update announcement.');
    }
  };

  const publishAnnouncement = async (event: FormEvent<HTMLFormElement>, status: 'draft' | 'published') => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`${API_ROOT}/announcements`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          category,
          audience,
          min_cpi: audience === 'eligible_students' ? minimumCpi : undefined,
          link,
          link_label: linkLabel,
          publish_at: publishAt || undefined,
          expires_at: expiresAt || undefined,
          status,
        }),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      const result = await response.json() as { announcement: AnnouncementRecord };
      setAnnouncements((current) => [result.announcement, ...current]);
      setNotice(status === 'draft' ? 'Announcement saved as a draft.' : 'Announcement published.');
      setTitle('');
      setMessage('');
      setLink('');
      setLinkLabel('');
      setMinimumCpi('');
      setPublishAt('');
      setExpiresAt('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save announcement.');
    } finally {
      setSaving(false);
    }
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch = `${announcement.title} ${announcement.message}`.toLowerCase().includes(search.toLowerCase());
    const matchesTab = !isStudent || activeTab === 'all' || announcement.is_saved;
    return matchesSearch && matchesTab;
  });

  if (!isStudent && !isCoordinator) {
    return <DashboardLayout><p className="bg-white p-6 text-sm text-slate-700">Choose a portal role to view announcements.</p></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Portal updates</p>
          <h1 className="text-3xl font-bold text-[#172b4d]">Announcements</h1>
        </div>
        {isCoordinator && <span className="text-sm font-medium text-slate-500">Coordinator publishing</span>}
      </div>

      {isCoordinator && (
        <form onSubmit={(event) => publishAnnouncement(event, 'published')} className="mb-6 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-[#172b4d]">Compose announcement</h2>
              <p className="mt-1 text-sm text-slate-500">Set the message, audience, and publication window.</p>
            </div>
            <span className="text-xs text-slate-500">Required fields are marked *</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-800">Title <span className="text-red-600">*</span>
              <input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. New Job Alert!" className="mt-1.5 h-10 w-full rounded border border-slate-300 px-3 font-normal outline-none focus:border-[#1b2a4a] focus:ring-2 focus:ring-[#1b2a4a]/15" />
            </label>
            <label className="text-sm font-semibold text-slate-800">Category
              <select value={category} onChange={(event) => setCategory(event.target.value as AnnouncementCategory)} className="mt-1.5 h-10 w-full rounded border border-slate-300 bg-white px-3 font-normal outline-none focus:border-[#1b2a4a]">
                <option>Job Alert</option><option>General</option><option>Important</option><option>Event</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-800">Audience
              <select value={audience} onChange={(event) => setAudience(event.target.value as typeof audience)} className="mt-1.5 h-10 w-full rounded border border-slate-300 bg-white px-3 font-normal outline-none focus:border-[#1b2a4a]">
                <option value="all_students">All students</option><option value="eligible_students">Students by minimum CPI</option>
              </select>
            </label>
            {audience === 'eligible_students' && (
              <label className="text-sm font-semibold text-slate-800">Minimum CPI <span className="text-red-600">*</span>
                <input required type="number" min="0" max="10" step="0.01" value={minimumCpi} onChange={(event) => setMinimumCpi(event.target.value)} className="mt-1.5 h-10 w-full rounded border border-slate-300 px-3 font-normal outline-none focus:border-[#1b2a4a]" />
              </label>
            )}
            <label className="text-sm font-semibold text-slate-800">Publish on
              <input type="datetime-local" value={publishAt} onChange={(event) => setPublishAt(event.target.value)} className="mt-1.5 h-10 w-full rounded border border-slate-300 px-3 font-normal outline-none focus:border-[#1b2a4a]" />
            </label>
            <label className="text-sm font-semibold text-slate-800">Expires on
              <input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} className="mt-1.5 h-10 w-full rounded border border-slate-300 px-3 font-normal outline-none focus:border-[#1b2a4a]" />
            </label>
            <label className="text-sm font-semibold text-slate-800">Link (optional)
              <input type="url" value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://" className="mt-1.5 h-10 w-full rounded border border-slate-300 px-3 font-normal outline-none focus:border-[#1b2a4a]" />
            </label>
            <label className="text-sm font-semibold text-slate-800">Link label
              <input value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} placeholder="View details" className="mt-1.5 h-10 w-full rounded border border-slate-300 px-3 font-normal outline-none focus:border-[#1b2a4a]" />
            </label>
            <label className="text-sm font-semibold text-slate-800 md:col-span-2">Message <span className="text-red-600">*</span>
              <textarea required maxLength={3000} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write the announcement details" className="mt-1.5 w-full resize-y rounded border border-slate-300 px-3 py-2 font-normal outline-none focus:border-[#1b2a4a]" />
            </label>
          </div>
          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="mt-4 text-sm text-emerald-700">{notice}</p>}
          <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" disabled={saving || !title || !message} onClick={(event) => publishAnnouncement(event as unknown as FormEvent<HTMLFormElement>, 'draft')} className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Save draft</button>
            <button type="submit" disabled={saving} className="rounded bg-[#1b2a4a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#263b60] disabled:opacity-50">{saving ? 'Publishing...' : 'Publish announcement'}</button>
          </div>
        </form>
      )}

      <section className="bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          {isStudent ? (
            <div className="flex gap-6" role="tablist" aria-label="Announcement views">
              <button type="button" role="tab" aria-selected={activeTab === 'all'} onClick={() => setActiveTab('all')} className={`border-b-2 px-1 py-2 text-sm font-semibold ${activeTab === 'all' ? 'border-[#1b2a4a] text-slate-900' : 'border-transparent text-slate-600'}`}>All Announcements</button>
              <button type="button" role="tab" aria-selected={activeTab === 'saved'} onClick={() => setActiveTab('saved')} className={`border-b-2 px-1 py-2 text-sm font-semibold ${activeTab === 'saved' ? 'border-[#1b2a4a] text-slate-900' : 'border-transparent text-slate-600'}`}>Saved Announcements</button>
            </div>
          ) : <p className="text-sm font-semibold text-slate-700">Published and scheduled announcements</p>}
          <label className="flex h-9 items-center gap-2 rounded border border-slate-300 px-3 text-slate-500 sm:w-64">
            <span aria-hidden="true">⌕</span>
            <input aria-label="Search announcements" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title" className="min-w-0 flex-1 text-sm text-slate-800 outline-none placeholder:text-slate-400" />
          </label>
        </div>
        <p className="border-b border-slate-200 px-4 py-3 text-sm text-slate-600 sm:px-5">Select the bookmark icon to save or unsave an announcement.</p>
        {error && !isCoordinator && <p role="alert" className="px-5 py-3 text-sm text-red-700">{error}</p>}
        {loading ? <p className="bg-white px-5 py-8 text-sm text-slate-500">Loading announcements...</p> : (
          <AnnouncementList announcements={filteredAnnouncements} onStateChange={handleStateChange} />
        )}
      </section>
    </DashboardLayout>
  );
}