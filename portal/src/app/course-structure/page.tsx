'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { useState } from 'react';

const disciplines = [
  { discipline: 'Computer Science and Engineering', type: 'Department', name: 'Department of Computer Science and Engineering' },
  { discipline: 'Electronics and Electrical Engineering', type: 'Department', name: 'Department of Electronics and Electrical Engineering' },
  { discipline: 'Mechanical Engineering', type: 'Department', name: 'Department of Mechanical Engineering' },
  { discipline: 'Civil Engineering', type: 'Department', name: 'Department of Civil Engineering' },
  { discipline: 'Design', type: 'Department', name: 'Department of Design' },
  { discipline: 'Biosciences and Bioengineering', type: 'Department', name: 'Department of Biosciences and Bioengineering' },
  { discipline: 'Chemical Engineering', type: 'Department', name: 'Department of Chemical Engineering' },
  { discipline: 'Physics', type: 'Department', name: 'Department of Physics' },
  { discipline: 'Chemistry', type: 'Department', name: 'Department of Chemistry' },
  { discipline: 'Mathematics', type: 'Department', name: 'Department of Mathematics' },
  { discipline: 'Humanities and Social Sciences', type: 'Department', name: 'Department of Humanities and Social Sciences' },
  { discipline: 'Agro and Rural Technology', type: 'School', name: 'School of Agro and Rural Technology' },
  { discipline: 'Business', type: 'School', name: 'School of Business' },
  { discipline: 'Energy Science and Engineering', type: 'School', name: 'School of Energy Science and Engineering' },
  { discipline: 'Health Sciences and Technology', type: 'School', name: 'School of Health Sciences and Technology' },
  { discipline: 'Data Science and Artificial Intelligence', type: 'School', name: 'Mehta Family School of Data Science and Artificial Intelligence' },
  { discipline: 'Interdisciplinary Studies and Sustainability', type: 'School', name: 'School of Interdisciplinary Studies and Sustainability' },
  { discipline: 'Indian Knowledge Systems', type: 'Centre', name: 'Centre for Indian Knowledge Systems' },
  { discipline: 'Linguistic Science and Technology', type: 'Centre', name: 'Centre for Linguistic Science and Technology' },
  { discipline: 'Nanotechnology', type: 'Centre', name: 'Centre for Nanotechnology' },
  { discipline: 'National Security Studies and Research', type: 'Centre', name: 'Centre for National Security Studies and Research' },
];

export default function CourseStructurePage() {
  const [activeTab, setActiveTab] = useState('Ph.D.');

  return (
    <DashboardLayout>
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm min-h-screen">
        {/* Top Table */}
        <div className="w-full">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-gray-100">
                <th className="text-left text-sm font-bold text-gray-800 px-6 py-4">Sr No.</th>
                <th className="text-left text-sm font-bold text-gray-800 px-6 py-4">Programme</th>
                <th className="text-left text-sm font-bold text-gray-800 px-6 py-4">Description</th>
                <th className="text-left text-sm font-bold text-gray-800 px-6 py-4">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-6 py-4 text-sm text-[#4b5563] font-medium border-b border-gray-100">1</td>
                <td className="px-6 py-4 text-sm text-[#4b5563] font-medium border-b border-gray-100">Ph.D.</td>
                <td className="px-6 py-4 text-sm text-[#1e40af] font-medium border-b border-gray-100">Doctor of Philosophy</td>
                <td className="px-6 py-4 text-sm text-[#4b5563] font-medium border-b border-gray-100">Min. 2 years</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Course Structure & Syllabi Section */}
        <div className="px-6 py-8">
          <h2 className="text-lg font-medium text-gray-800 mb-6">Course Structure & Syllabi</h2>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6 space-x-6">
            {['Ph.D.', 'Dual MTech + Ph.D.', 'Dual MS + Ph.D.'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black"></span>
                )}
              </button>
            ))}
          </div>

          {/* Data Table */}
          {activeTab === 'Ph.D.' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-gray-200">
                    <th className="text-left text-sm font-semibold text-gray-800 px-4 py-3">Discipline</th>
                    <th className="text-left text-sm font-semibold text-gray-800 px-4 py-3">Programme Structure & Syllabi</th>
                    <th className="text-left text-sm font-semibold text-gray-800 px-4 py-3">Offering Department/School/Centre</th>
                  </tr>
                </thead>
                <tbody>
                  {disciplines.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-800 font-medium">
                        {item.discipline}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <Link href="https://iitg.ac.in/acad/admission/doctoral/disciplines.php/#phd" target="_blank" className="text-[#a52a2a] hover:underline flex items-center gap-1.5 text-xs font-medium">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          View Syllabus
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#a52a2a] font-medium">
                        {item.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center text-gray-500 font-medium">
              Data not available for {activeTab}.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
