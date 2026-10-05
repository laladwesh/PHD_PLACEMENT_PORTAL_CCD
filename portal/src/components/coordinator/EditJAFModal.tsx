// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { DetailedJAF, JAFStatus } from '@/lib/types';

interface EditJAFModalProps {
  jaf: DetailedJAF | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedJaf: DetailedJAF) => void;
}

export function EditJAFModal({ jaf, isOpen, onClose, onSave }: EditJAFModalProps) {
  const [designation, setDesignation] = useState('');
  const [company, setCompany] = useState('');
  const [placeOfPosting, setPlaceOfPosting] = useState('');
  const [deadline, setDeadline] = useState('');
  const [expectedRecruitments, setExpectedRecruitments] = useState(1);
  const [description, setDescription] = useState('');
  
  // Salary
  const [currency, setCurrency] = useState('INR');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [accommodation, setAccommodation] = useState(false);
  const [ppoExtension, setPpoExtension] = useState(false);

  // Eligibility & Selection
  const [minCpi, setMinCpi] = useState(6.5);
  const [interviewMode, setInterviewMode] = useState<'Virtual' | 'In-Person / Hybrid'>('Virtual');
  const [status, setStatus] = useState<JAFStatus>('Unapproved');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (jaf) {
      setDesignation(jaf.designation || '');
      setCompany(jaf.company || '');
      setPlaceOfPosting(jaf.placeOfPosting || '');
      setDeadline(jaf.deadline || '');
      setExpectedRecruitments(jaf.expectedRecruitments || 1);
      setDescription(jaf.description || '');
      setCurrency(jaf.salary?.currency || 'INR');
      setAdditionalInfo(jaf.salary?.additionalInfo || '');
      setAccommodation(jaf.salary?.accommodationAvailable || false);
      const el = jaf.eligibility;
      const parsedMinCpi = Array.isArray(el) ? (el[0]?.cpiCutoff ?? 6.5) : (el?.minCpi ?? 6.5);
      setMinCpi(parsedMinCpi);
      setInterviewMode(jaf.selectionProcess?.interviewMode === 'In-Person / Hybrid' ? 'In-Person / Hybrid' : 'Virtual');
      setStatus(jaf.status || 'Unapproved');
      setFeedback(jaf.feedback || '');
    }
  }, [jaf, isOpen]);

  if (!isOpen || !jaf) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: DetailedJAF = {
      ...jaf,
      designation,
      company,
      placeOfPosting,
      deadline,
      expectedRecruitments: Number(expectedRecruitments),
      description,
      status,
      feedback: feedback.trim() ? feedback.trim() : undefined,
      salary: {
        ...jaf.salary,
        currency,
        additionalInfo,
        accommodationAvailable: accommodation,
        ppoExtension,
      },
      eligibility: {
        ...jaf.eligibility,
        minCpi: Number(minCpi),
      },
      selectionProcess: {
        ...jaf.selectionProcess,
        interviewMode,
      },
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1B2A4A] text-white flex justify-between items-center">
          <div>
            <span className="text-xs text-gray-300 font-mono block">JAF #{jaf.id}</span>
            <h2 className="text-lg font-bold">Edit Job Application</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {/* Section 1: Designation & Company */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-gray-500 border-b border-gray-100 pb-1">
              Role & Company Details
            </h3>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Designation / Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white"
                placeholder="e.g. Research Scientist"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Place of Posting
                </label>
                <input
                  type="text"
                  value={placeOfPosting}
                  onChange={(e) => setPlaceOfPosting(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white"
                  placeholder="e.g. Bengaluru / Pune Labs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Expected Openings / Recruitments
                </label>
                <input
                  type="number"
                  min={1}
                  value={expectedRecruitments}
                  onChange={(e) => setExpectedRecruitments(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Job Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white"
                placeholder="Brief summary of duties and responsibilities..."
              />
            </div>
          </div>

          {/* Section 2: Compensation Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-gray-500 border-b border-gray-100 pb-1">
              Compensation & Terms
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Additional Salary Info
                </label>
                <input
                  type="text"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white"
                  placeholder="e.g. Relocation bonus included"
                />
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={accommodation}
                  onChange={(e) => setAccommodation(e.target.checked)}
                  className="accent-[#1B2A4A]"
                />
                Accommodation Provided
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={ppoExtension}
                  onChange={(e) => setPpoExtension(e.target.checked)}
                  className="accent-[#1B2A4A]"
                />
                PPO Extension Possible
              </label>
            </div>
          </div>

          {/* Section 3: Eligibility, Process & Status */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-gray-500 border-b border-gray-100 pb-1">
              Eligibility, Moderation & Status
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Minimum CPI Cutoff
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={minCpi}
                  onChange={(e) => setMinCpi(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Interview Mode
                </label>
                <select
                  value={interviewMode}
                  onChange={(e) => setInterviewMode(e.target.value as any)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white"
                >
                  <option value="Virtual">Virtual</option>
                  <option value="In-Person / Hybrid">In-Person / Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  JAF Moderation Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as JAFStatus)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white font-medium"
                >
                  <option value="Unapproved">Unapproved</option>
                  <option value="Approved">Approved</option>
                  <option value="Changes Requested">Changes Requested</option>
                  <option value="Incomplete">Incomplete</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Coordinator Feedback / Review Notes
              </label>
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. Please clarify thesis completion requirements"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] bg-white"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 px-3 py-1.5 rounded text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#1B2A4A] text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-[#2D3F5E] transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
