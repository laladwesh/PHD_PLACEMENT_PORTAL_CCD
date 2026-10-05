// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { DetailedJAF } from '@/lib/types';

interface JAFReviewModalProps {
  jaf: DetailedJAF | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: number | string) => void;
  onRequestChanges: (id: number | string, feedback: string) => void;
  onReject: (id: number | string, reason: string) => void;
  onEdit?: (jaf: DetailedJAF) => void;
}

export function JAFReviewModal({
  jaf,
  isOpen,
  onClose,
  onApprove,
  onRequestChanges,
  onReject,
  onEdit,
}: JAFReviewModalProps) {
  const [feedbackText, setFeedbackText] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionView, setActionView] = useState<'main' | 'changes' | 'reject'>('main');

  if (!isOpen || !jaf) return null;

  const handleSendChanges = () => {
    if (!feedbackText.trim()) return;
    onRequestChanges(jaf.id, feedbackText);
    setActionView('main');
    setFeedbackText('');
  };

  const handleSendReject = () => {
    if (!rejectReason.trim()) return;
    onReject(jaf.id, rejectReason);
    setActionView('main');
    setRejectReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1B2A4A] text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-300 font-mono">
                JAF #{jaf.id}
              </span>
              <span className="text-xs text-gray-200">
                • Status: {jaf.status}
              </span>
            </div>
            <h2 className="text-xl font-bold">{jaf.designation}</h2>
            <p className="text-xs text-gray-300">{jaf.company} • Submitted on {jaf.createdAt}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Existing Feedback Alert if any */}
        {jaf.feedback && (
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 text-xs text-gray-700">
            <strong className="font-semibold block text-gray-900 mb-0.5">Coordinator Note for Recruiter:</strong>
            {jaf.feedback}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1">
          {/* Job Overview */}
          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Job Description</h3>
            <p className="text-gray-700 leading-relaxed text-xs">
              {jaf.description}
            </p>
            <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-100 text-xs">
              <div>
                <span className="text-gray-400 block">Place of Posting</span>
                <span className="font-medium text-gray-800">{jaf.placeOfPosting}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Expected Recruitment</span>
                <span className="font-medium text-gray-800">{jaf.expectedRecruitments} Candidates</span>
              </div>
              <div>
                <span className="text-gray-400 block">Deadline</span>
                <span className="font-medium text-gray-800">{jaf.deadline}</span>
              </div>
            </div>
          </div>

          {/* Compensation & Bond Details */}
          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">
              Compensation & Terms
            </h3>
            <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded border border-gray-200 text-xs">
              <div className="col-span-3">
                <span className="text-gray-400 block mb-1">Stipend / Compensation per Programme ({jaf.salary.currency})</span>
                <div className="flex flex-wrap gap-2">
                  {jaf.salary?.programmes && jaf.salary.programmes.length > 0 ? jaf.salary.programmes.map((p, i) => (
                    <span key={i} className="bg-white border border-gray-200 px-2 py-1 rounded text-gray-800">
                      {p.programme}: <span className="font-semibold">{p.amount}</span>
                    </span>
                  )) : <span className="text-gray-500">Not specified</span>}
                </div>
              </div>
              <div>
                <span className="text-gray-400 block">Accommodation</span>
                <span className="font-medium text-gray-800">{jaf.salary?.accommodationAvailable ? 'Provided' : 'No'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">PPO Extension</span>
                <span className="font-medium text-gray-800">{jaf.salary?.ppoExtension ? 'Yes' : 'No'}</span>
              </div>
              <div className="col-span-3 mt-2">
                <span className="text-gray-400 block mb-1">Additional Salary Info</span>
                <span className="font-medium text-gray-800 whitespace-pre-wrap">{jaf.salary?.additionalInfo || 'None'}</span>
              </div>
            </div>
          </div>

          {/* PhD Eligibility & Academic Criteria */}
          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">
              Eligibility & Department Criteria
            </h3>
            <div className="space-y-3 p-3 bg-gray-50 rounded border border-gray-200 text-xs">
              <div>
                <span className="text-gray-500 block mb-2">Eligible Departments & Cutoffs:</span>
                <div className="grid grid-cols-2 gap-2">
                  {Array.isArray(jaf.eligibility) && jaf.eligibility.length > 0 ? (
                    jaf.eligibility.map((e, i) => (
                      <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-gray-100">
                        <span className="text-gray-800">{e.department}</span>
                        <span className="font-semibold text-gray-900">CPI: {e.cpiCutoff}</span>
                      </div>
                    ))
                  ) : !Array.isArray(jaf.eligibility) && jaf.eligibility?.departments && jaf.eligibility.departments.length > 0 ? (
                    jaf.eligibility.departments.map((dept, i) => (
                      <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-gray-100">
                        <span className="text-gray-800">{dept}</span>
                        <span className="font-semibold text-gray-900">CPI: {jaf.eligibility && !Array.isArray(jaf.eligibility) ? jaf.eligibility.minCpi ?? 6.5 : 6.5}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-500">Not specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Selection Pipeline & Interview Format */}
          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">
              Recruitment Process
            </h3>
            <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 block mb-1">Screening</span>
                  <ul className="list-disc pl-4 text-gray-800">
                    {jaf.selectionProcess.ppt && <li>Pre-Placement Talk</li>}
                    {jaf.selectionProcess.shortlistResume && <li>Resume Shortlisting</li>}
                    {jaf.selectionProcess.writtenTest && <li>Written Test</li>}
                    {!jaf.selectionProcess.ppt && !jaf.selectionProcess.shortlistResume && !jaf.selectionProcess.writtenTest && <li>None specified</li>}
                  </ul>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Interviews</span>
                  <ul className="list-disc pl-4 text-gray-800">
                    {jaf.selectionProcess.inPerson && <li>In Person</li>}
                    {jaf.selectionProcess.telephonic && <li>Telephonic</li>}
                    {jaf.selectionProcess.videoConferencing && <li>Video Conferencing</li>}
                    {!jaf.selectionProcess.inPerson && !jaf.selectionProcess.telephonic && !jaf.selectionProcess.videoConferencing && <li>None specified</li>}
                  </ul>
                </div>
              </div>
              {jaf.selectionProcess.testRequirements && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-500 block mb-1">Test Requirements</span>
                  <span className="font-medium text-gray-800">{jaf.selectionProcess.testRequirements}</span>
                </div>
              )}
            </div>
          </div>

          {/* Company POC Contacts */}
          <div className="text-xs text-gray-600">
            <span className="text-gray-400 block mb-0.5">Recruiter Contact:</span>
            <span className="font-medium text-gray-800">{jaf.poc.name}</span> ({jaf.poc.role}) • {jaf.poc.email} • {jaf.poc.phone}
          </div>

          {/* Action View: Request Revision Form */}
          {actionView === 'changes' && (
            <div className="p-4 bg-gray-50 border border-gray-300 rounded space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800 text-xs">
                  Request Revision from Recruiter
                </span>
                <button onClick={() => setActionView('main')} className="text-xs text-gray-500 hover:text-gray-800">
                  Cancel
                </button>
              </div>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="State changes required (e.g., clarify bond terms, update thesis completion date)..."
                rows={3}
                className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white"
              />
              <button
                onClick={handleSendChanges}
                disabled={!feedbackText.trim()}
                className="bg-[#1B2A4A] hover:bg-[#2D3F5E] disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded transition-colors"
              >
                Send Request
              </button>
            </div>
          )}

          {/* Action View: Reject Form */}
          {actionView === 'reject' && (
            <div className="p-4 bg-gray-50 border border-gray-300 rounded space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800 text-xs">
                  Reason for Rejecting JAF
                </span>
                <button onClick={() => setActionView('main')} className="text-xs text-gray-500 hover:text-gray-800">
                  Cancel
                </button>
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="State reason for rejecting JAF..."
                rows={2}
                className="w-full text-xs p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white"
              />
              <button
                onClick={handleSendReject}
                disabled={!rejectReason.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-[#f5f7fa] border-t border-gray-200 flex items-center justify-end gap-2">
          {jaf.status !== 'Approved' && (
            <>
              <button
                type="button"
                onClick={() => setActionView('changes')}
                className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs px-3 py-1.5 rounded transition-colors"
              >
                Request Revision
              </button>
              <button
                type="button"
                onClick={() => setActionView('reject')}
                className="text-red-600 hover:text-red-700 text-xs px-3 py-1.5 rounded transition-colors"
              >
                Reject JAF
              </button>
              <button
                type="button"
                onClick={() => onApprove(jaf.id)}
                className="bg-[#1B2A4A] hover:bg-[#2D3F5E] text-white text-xs px-4 py-1.5 rounded font-medium transition-colors"
              >
                Approve JAF
              </button>
            </>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(jaf);
              }}
              className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs px-3 py-1.5 rounded transition-colors"
            >
              Edit JAF
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs px-3 py-1.5 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
