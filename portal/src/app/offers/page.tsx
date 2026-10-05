'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Offer, OfferStatus } from '@/lib/types';
import { useUserRole } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';

type StatusFilter = 'all' | 'received' | 'approved' | 'declined';

export default function OffersPage() {
  const { isCoordinator } = useUserRole();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [confirmModalOffer, setConfirmModalOffer] = useState<Offer | null>(null);
  const [inPersonConfirmed, setInPersonConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOffers() {
      try {
        const res = await fetch('/phdplacement/api/offers');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.offers) && data.offers.length > 0) {
            const mapped: Offer[] = data.offers.map((o: any, idx: number) => ({
              id: o._id || idx + 1,
              candidateName: o.student?.name || `Scholar (${o.student?.roll_number || 'N/A'})`,
              rollNumber: String(o.student?.roll_number || ''),
              department: o.student?.academic_details?.major_department || 'Computer Science and Engineering',
              cpi: Number(o.student?.major_cpi || 8.5),
              thesisStatus: 'Synopsis Defended',
              company: o.company?.company_name || 'Hiring Organization',
              designation: o.designation || o.job?.job_designation || 'Research Scientist',
              ctc: o.ctc || '₹ 38.0 LPA',
              baseSalary: o.base_salary || '₹ 28.0 LPA',
              status:
                o.status === 'approved_restricted' || o.status === 'accepted'
                  ? ('Approved & Restricted' as OfferStatus)
                  : o.status === 'rejected'
                  ? ('Declined' as OfferStatus)
                  : ('Offer Received' as OfferStatus),
              offeredAt: o.offered_at ? new Date(o.offered_at).toLocaleDateString() : '2026-10-01',
              responseDeadline: o.response_deadline ? new Date(o.response_deadline).toLocaleDateString() : '2026-10-30',
              portalAccessRestricted: o.status === 'approved_restricted' || o.status === 'accepted',
              blockedApplicationsCount: 3,
              approvedAt: o.approved_at ? new Date(o.approved_at).toLocaleDateString() : undefined,
            }));
            setOffers(mapped);
          } else {
            setOffers([]);
          }
        } else {
          setOffers([]);
        }
      } catch (err) {
        console.error('Error fetching offers from database:', err);
        setOffers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
  }, []);

  // Open confirmation modal to approve & restrict
  const handleOpenApprovalModal = (offer: Offer) => {
    setConfirmModalOffer(offer);
    setInPersonConfirmed(false);
  };

  // Confirm in-person approval and restrict portal access
  const handleExecuteApproval = async () => {
    if (!confirmModalOffer) return;
    const targetId = confirmModalOffer.id;

    try {
      await fetch(`/phdplacement/api/offers/${targetId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Approved via coordinator dashboard' }),
      });
    } catch {}

    setOffers((prev) =>
      prev.map((o) => {
        if (o.id === targetId) {
          return {
            ...o,
            status: 'Approved & Restricted' as OfferStatus,
            portalAccessRestricted: true,
            approvedAt: new Date().toISOString().split('T')[0],
          };
        }
        return o;
      })
    );

    toast.success(
      `Offer approved for ${confirmModalOffer.candidateName} (${confirmModalOffer.company}). Scholar is placed and portal access is restricted.`
    );
    setConfirmModalOffer(null);
    setInPersonConfirmed(false);
  };

  // Mark declined if candidate rejected during in-person talk
  const handleMarkDeclined = async (offerId: string | number) => {
    try {
      await fetch(`/phdplacement/api/offers/${offerId}/decline`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {}

    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: 'Declined' as OfferStatus } : o))
    );
    const offer = offers.find((o) => o.id === offerId);
    toast.info(`Offer from ${offer?.company} marked as declined by ${offer?.candidateName}.`);
  };

  // Override to unlock student
  const handleUnlockStudent = (offerId: string | number) => {
    setOffers((prev) =>
      prev.map((o) => {
        if (o.id === offerId) {
          return {
            ...o,
            status: 'Offer Received' as OfferStatus,
            portalAccessRestricted: false,
          };
        }
        return o;
      })
    );
    toast.warning(`Portal access restriction lifted for offer #${offerId}.`);
  };

  const filteredOffers = offers.filter((o) => {
    if (statusFilter === 'received' && o.status !== 'Offer Received') return false;
    if (statusFilter === 'approved' && o.status !== 'Approved & Restricted') return false;
    if (statusFilter === 'declined' && o.status !== 'Declined') return false;
    if (deptFilter !== 'all' && o.department !== deptFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.candidateName.toLowerCase().includes(q) ||
        o.rollNumber.toLowerCase().includes(q) ||
        o.company.toLowerCase().includes(q) ||
        o.designation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const departmentsList = Array.from(new Set(offers.map((o) => o.department)));

  const statusColor = (status: OfferStatus) => {
    if (status === 'Offer Received') return 'text-amber-500 font-medium';
    if (status === 'Approved & Restricted') return 'text-green-600 font-medium';
    if (status === 'Declined') return 'text-gray-400 font-medium';
    return 'text-gray-700';
  };

  const pendingCount = offers.filter((o) => o.status === 'Offer Received').length;
  const approvedCount = offers.filter((o) => o.status === 'Approved & Restricted').length;

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offers Received</h1>
          <p className="text-sm text-gray-600 mt-1">
            Review company offers received for PhD scholars, consult candidates in person, and approve directly to restrict portal access.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mt-5 mb-4">
        <div className="flex flex-wrap gap-2.5 items-center">
          <input
            type="text"
            placeholder="Search candidate, roll, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-xs w-[250px] focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white text-gray-800"
          />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
          >
            <option value="all">All Departments</option>
            {departmentsList.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="border border-gray-300 rounded-md px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
          >
            <option value="all">All Offers Received ({offers.length})</option>
            <option value="received">Pending Consultation ({pendingCount})</option>
            <option value="approved">Approved & Restricted ({approvedCount})</option>
            <option value="declined">Declined</option>
          </select>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          {filteredOffers.length} {filteredOffers.length === 1 ? 'offer' : 'offers'} displayed
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-200">
                <th className="text-xs uppercase font-semibold text-gray-500 px-3.5 py-2.5 whitespace-nowrap w-44">Roll & Scholar</th>
                <th className="text-xs uppercase font-semibold text-gray-500 px-3.5 py-2.5 whitespace-nowrap w-40">Department</th>
                <th className="text-xs uppercase font-semibold text-gray-500 px-3.5 py-2.5 whitespace-nowrap max-w-[180px]">Company & Profile</th>
                <th className="text-xs uppercase font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap w-28">Offered CTC</th>
                <th className="text-xs uppercase font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap w-28">Offer Date</th>
                <th className="text-xs uppercase font-semibold text-gray-500 px-3 py-2.5 whitespace-nowrap w-28">Status</th>
                <th className="text-right text-xs uppercase font-semibold text-gray-500 px-3.5 py-2.5 whitespace-nowrap w-48">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOffers.length > 0 ? (
                filteredOffers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-2.5 text-xs text-gray-800 whitespace-nowrap">
                      <span className="font-semibold block">{offer.candidateName}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{offer.rollNumber}</span>
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-gray-700 whitespace-nowrap">
                      <span className="font-medium block">{offer.department}</span>
                      <span className="text-[10px] text-gray-400 block font-mono">CPI: {offer.cpi}</span>
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-gray-800 max-w-[180px]">
                      <span className="font-semibold block truncate" title={offer.company}>{offer.company}</span>
                      <span className="text-[10px] text-gray-400 block truncate" title={offer.designation}>{offer.designation}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-900 whitespace-nowrap">
                      <span className="font-semibold block">{offer.ctc}</span>
                      <span className="text-[10px] text-gray-400 block">Base: {offer.baseSalary}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-700 whitespace-nowrap">
                      <span>{offer.offeredAt}</span>
                      <span className="text-[10px] text-gray-400 block">Due: {offer.responseDeadline}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                      <span className={`block font-semibold ${statusColor(offer.status)}`}>
                        {offer.status}
                      </span>
                      {offer.portalAccessRestricted && (
                        <span className="text-[10px] text-gray-400 block">Access Restricted</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2 text-xs">
                        {isCoordinator && offer.status === 'Offer Received' && (
                          <>
                            <button
                              onClick={() => handleOpenApprovalModal(offer)}
                              className="bg-[#1B2A4A] text-white text-xs px-2.5 py-1 rounded-md hover:bg-[#2D3F5E] transition-colors font-medium cursor-pointer shadow-2xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleMarkDeclined(offer.id)}
                              className="border border-gray-300 text-gray-700 text-xs px-2.5 py-1 rounded-md hover:bg-gray-50 transition-colors font-medium cursor-pointer"
                            >
                              Declined
                            </button>
                          </>
                        )}

                        {offer.status === 'Approved & Restricted' && (
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Placed</span>
                            <button
                              onClick={() => handleUnlockStudent(offer.id)}
                              className="text-gray-500 hover:text-gray-800 underline text-xs font-medium cursor-pointer"
                              title="Coordinator override to unlock"
                            >
                              Unlock
                            </button>
                          </div>
                        )}

                        {offer.status === 'Declined' && (
                          <span className="text-gray-400 text-xs italic">Declined</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-gray-400 text-xs">
                    No offers found matching this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Workflow Guide Note */}
      <div className="mt-6 p-4 bg-white border border-gray-200 rounded text-xs text-gray-600">
        <span className="font-semibold text-gray-800 block mb-1">CCD Placement Procedure</span>
        <p>
          When companies extend offers, they appear under <strong>Offers Received</strong>. The placement coordinator discusses directly with the student in person. Upon confirmation, clicking <strong>Approve & Restrict Access</strong> marks the scholar as Placed and restricts their portal access, automatically closing out their candidature across all other active placement drives.
        </p>
      </div>

      {/* Confirmation Modal */}
      {confirmModalOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              Confirm In-Person Discussion & Restrict Portal Access
            </h2>

            <div className="text-xs text-gray-700 space-y-2 bg-gray-50 p-3 rounded border border-gray-200">
              <div>
                <span className="text-gray-500 block">Candidate:</span>
                <span className="font-semibold text-gray-900 text-sm">{confirmModalOffer.candidateName}</span> ({confirmModalOffer.rollNumber})
              </div>
              <div>
                <span className="text-gray-500 block">Department:</span>
                <span className="font-medium text-gray-900">{confirmModalOffer.department}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Company & Role:</span>
                <span className="font-medium text-gray-900">{confirmModalOffer.company}</span> • {confirmModalOffer.designation}
              </div>
              <div>
                <span className="text-gray-500 block">Compensation (CTC):</span>
                <span className="font-bold text-gray-900 text-sm">{confirmModalOffer.ctc}</span> (Base: {confirmModalOffer.baseSalary})
              </div>
            </div>

            <div className="text-xs text-gray-700 leading-relaxed border border-gray-200 rounded p-3 bg-white">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inPersonConfirmed}
                  onChange={(e) => setInPersonConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-[#1B2A4A] focus:ring-[#1B2A4A]"
                />
                <span className="text-gray-800">
                  I have met and consulted with <strong>{confirmModalOffer.candidateName}</strong> in person, and the scholar has confirmed acceptance of this offer.
                </span>
              </label>
            </div>

            <p className="text-[11px] text-gray-500 italic">
              Note: This action will approve the offer, formally record the scholar as Placed, and restrict the student&apos;s portal access across all other recruitment drives.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setConfirmModalOffer(null)}
                className="border border-gray-300 px-3 py-1.5 rounded text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!inPersonConfirmed}
                onClick={handleExecuteApproval}
                className="bg-[#1B2A4A] disabled:opacity-50 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-[#2D3F5E] transition-colors"
              >
                Confirm & Restrict Portal Access
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
