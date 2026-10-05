'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from '@/components/ui/Toast';

type ApplicantItem = {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  status: string;
};

export default function FinalSelectionPage() {
  const params = useParams();
  const jafId = params.id as string;
  
  const [tab, setTab] = useState<'Manual' | 'Upload'>('Manual');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [jobTitle, setJobTitle] = useState('Research Scientist');
  const [applicantsList, setApplicantsList] = useState<ApplicantItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApplicants() {
      try {
        const res = await fetch(`/phdplacement/api/jobs/${jafId}/applicants`);
        if (res.ok) {
          const data = await res.json();
          if (data.job?.designation) setJobTitle(data.job.designation);
          if (Array.isArray(data.applicants)) {
            const mapped: ApplicantItem[] = data.applicants
              .filter((a: any) => a.student && a.application_status !== 'selected')
              .map((a: any) => ({
                id: String(a.student.id || a.student._id),
                name: a.student.name,
                rollNumber: String(a.student.roll_number || ''),
                department: a.student.department || 'Academic Department',
                status: a.application_status === 'shortlist' ? 'Shortlisted' : a.student.status === 'Placed' ? 'Blocked' : 'Applied',
              }));
            setApplicantsList(mapped);
          }
        }
      } catch (err) {
        console.error('Error fetching applicants for final selection:', err);
      } finally {
        setLoading(false);
      }
    }
    loadApplicants();
  }, [jafId]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(applicantsList.map(a => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSubmit = () => {
    setShowModal(true);
  };

  const confirmSubmit = async () => {
    setShowModal(false);
    try {
      const res = await fetch(`/phdplacement/api/jobs/${jafId}/final-selection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_ids: Array.from(selectedIds) }),
      });
      if (res.ok) {
        toast.success('Final selection list submitted successfully. Admin has been notified.');
        setSelectedIds(new Set());
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to submit final selection list.');
      }
    } catch {
      toast.error('Network error submitting final selection.');
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href={`/jaf/${jafId}/applicants`} className="text-gray-500 hover:text-[#1B2A4A] text-sm flex items-center mb-2">
          &larr; Back to Applicants
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Final Selection — {jobTitle}</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="flex border-b border-gray-200 px-6 pt-4 space-x-8">
          <button
            onClick={() => setTab('Manual')}
            className={`pb-3 font-medium text-sm transition-colors ${
              tab === 'Manual' ? 'text-[#1B2A4A] border-b-2 border-[#1B2A4A]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Select Manually
          </button>
          <button
            onClick={() => setTab('Upload')}
            className={`pb-3 font-medium text-sm transition-colors ${
              tab === 'Upload' ? 'text-[#1B2A4A] border-b-2 border-[#1B2A4A]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload List
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {tab === 'Manual' ? (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-gray-200 rounded-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f8fafc] text-gray-600 text-xs uppercase font-semibold border-b">
                      <th className="px-3.5 py-2.5 text-center w-10">
                        <input 
                          type="checkbox" 
                          onChange={(e) => toggleAll(e.target.checked)}
                          checked={selectedIds.size === applicantsList.length && applicantsList.length > 0}
                          className="w-4 h-4 text-[#1B2A4A] rounded focus:ring-[#1B2A4A]"
                        />
                      </th>
                      <th className="px-3.5 py-2.5">Student Name</th>
                      <th className="px-3.5 py-2.5">Roll Number</th>
                      <th className="px-3.5 py-2.5">Department</th>
                      <th className="px-3.5 py-2.5">Current Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {applicantsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-500 font-medium text-xs">
                          No applicants available for selection.
                        </td>
                      </tr>
                    ) : (
                      applicantsList.map((app) => {
                        const isBlocked = app.status.includes('Blocked') || app.status.includes('Auto-Withdrawn');
                        return (
                          <tr key={app.id} className={`hover:bg-gray-50/80 transition-colors ${isBlocked ? 'bg-gray-50/70 opacity-60' : ''}`}>
                            <td className="px-3.5 py-2.5 text-center">
                              <input 
                                type="checkbox" 
                                disabled={isBlocked}
                                checked={selectedIds.has(app.id)}
                                onChange={() => toggleSelect(app.id)}
                                className={`w-4 h-4 rounded ${isBlocked ? 'cursor-not-allowed opacity-40' : 'text-[#1B2A4A] focus:ring-[#1B2A4A]'}`}
                              />
                            </td>
                            <td className="px-3.5 py-2.5 font-medium text-gray-900">
                              {app.name}
                              {isBlocked && (
                                <span className="block text-[11px] text-red-600 font-normal">Offer already accepted in another drive</span>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5 text-gray-600 font-mono text-xs">{app.rollNumber}</td>
                            <td className="px-3.5 py-2.5 text-gray-600">{app.department}</td>
                            <td className="px-3.5 py-2.5">
                              {isBlocked ? (
                                <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                  Blocked (Offer Accepted)
                                </span>
                              ) : (
                                <span className="text-gray-700 text-xs">{app.status}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end pt-1">
                <button 
                  onClick={handleSubmit}
                  disabled={selectedIds.size === 0}
                  className={`px-5 py-2 rounded-md font-medium text-xs sm:text-sm text-white transition-colors shadow-2xs ${
                    selectedIds.size > 0 ? 'bg-[#1B2A4A] hover:bg-[#2D3F5E] cursor-pointer' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Submit Final Selection List
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-2xl mx-auto py-8">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50 flex flex-col items-center justify-center">
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Upload Final Selection List</h3>
                <p className="text-sm text-gray-500 mb-4">Drag and drop your CSV file here, or click to browse</p>
                <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium text-sm">
                  Select File
                </button>
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-white rounded-md font-medium transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Confirm Final Selection
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure? This action will finalize the selection list for this JAF. The placement admin will be notified and further changes may require their approval.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  onClick={confirmSubmit}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#1B2A4A] text-base font-medium text-white hover:bg-[#1B2A4A]/90 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Confirm
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
