'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { useUserRole } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role, profile } = useUserRole();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!dropdownOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await fetch('/phdplacement/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Background logout
    }
    toast.info('Logged out successfully');
    router.push('/auth');
  };

  return (
    <div className="flex min-h-screen bg-[#eef2f6]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white py-2.5 px-6 flex justify-between items-center border-b border-gray-100 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Portal /</span>
            <span className="text-xs font-semibold text-gray-700 capitalize">{role} Console</span>
          </div>

          {/* User Profile Info */}
          <div ref={dropdownRef} className="relative flex items-center gap-3">
            {/* Clean subtle role tag */}
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded font-medium border border-gray-200 capitalize">
              {role === 'coordinator' ? 'Coordinator' : role === 'company' ? 'Recruiter' : 'PhD Scholar'}
            </span>

            {/* Profile Dropdown Toggle */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-left cursor-pointer p-1 rounded hover:bg-gray-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#1B2A4A] text-white flex items-center justify-center font-medium text-xs">
                {role === 'coordinator' ? 'C' : role === 'company' ? 'R' : 'S'}
              </div>
              <span className="text-[13px] font-medium text-gray-700">
                {profile.name}
              </span>
              <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-11 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-1.5 z-50">
                <div className="px-3.5 py-2.5 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900 truncate">{profile.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{profile.email}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{profile.organization || 'IIT Guwahati'}</p>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-5 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
