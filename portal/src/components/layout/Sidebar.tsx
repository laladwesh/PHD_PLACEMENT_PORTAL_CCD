'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserRole } from '@/lib/auth';

const HomeIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7H4a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 004 0" />
  </svg>
);

const ScaleIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
  </svg>
);

const HelpCircleIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AcademicCapIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const DocumentTextIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export function Sidebar() {
  const pathname = usePathname();
  const { isCoordinator, isStudent } = useUserRole();

  const getNavItems = () => {
    if (isCoordinator) {
      return [
        { name: 'Home', href: '/dashboard', icon: <HomeIcon /> },
        { name: 'Job Applications', href: '/jobs', icon: <BriefcaseIcon /> },
        { name: 'Offers Received', href: '/offers', icon: <CheckCircleIcon /> },
        { name: 'Announcements', href: '/announcements', icon: <BellIcon /> },
        { name: 'Course Structure', href: '/course-structure', icon: <AcademicCapIcon /> },
        { name: 'Support & Inquiries', href: '/help', icon: <HelpCircleIcon /> },
      ];
    }

    if (isStudent) {
      return [
        { name: 'Home', href: '/dashboard', icon: <HomeIcon /> },
        { name: 'Job Applications', href: '/jobs', icon: <BriefcaseIcon /> },
        { name: 'Registration', href: '/registration/profile', icon: <CheckCircleIcon /> },
        { name: 'Step 1: Profile Update', href: '/registration/profile', icon: <UserIcon />, nested: true },
        { name: 'Step 2: CV Upload', href: '/registration/cv', icon: <DocumentTextIcon />, nested: true },
        { name: 'Step 3: Fee Payment', href: '/registration/fee', icon: <ScaleIcon />, nested: true },
        { name: 'Announcements', href: '/announcements', icon: <BellIcon /> },
        { name: 'Help & Support', href: '/help', icon: <HelpCircleIcon /> },
      ];
    }

    return [
      { name: 'Home', href: '/dashboard', icon: <HomeIcon /> },
      { name: 'Job Application Form', href: '/jaf/new', icon: <BriefcaseIcon /> },
      { name: 'Job Application List', href: '/jobs', icon: <BriefcaseIcon /> },
      { name: 'Course Structure', href: '/course-structure', icon: <AcademicCapIcon /> },
      { name: 'Help & Support', href: '/help', icon: <HelpCircleIcon /> },
    ];
  };

  const navItems = getNavItems();

  const isActive = (href: string, name: string) => {
    if (href === '#') return false;
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/registration/profile') return name === 'Registration' ? pathname?.startsWith('/registration') : pathname === href;
    if (href === '/registration/cv' || href === '/registration/fee') return pathname === href;
    if (href === '/offers') return pathname === '/offers' || pathname === '/policy';
    if (href === '/jaf/new') return pathname === '/jaf/new';
    if (href === '/course-structure') return pathname === '/course-structure';
    if (href === '/jobs') return pathname === '/jobs' || (Boolean(pathname?.startsWith('/jaf/')) && pathname !== '/jaf/new');
    if (href === '/help') return pathname === '/help';
    if (href === '/announcements') return pathname === '/announcements';
    return pathname?.startsWith(href);
  };

  return (
    <div className="w-[220px] bg-white min-h-screen flex flex-col flex-shrink-0 border-r border-gray-100">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3">
        <div className="w-[35px] h-[35px] flex-shrink-0">
          <img src="/phdplacement/logo.jpeg" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <span className="font-bold text-[15px] text-[#1B2A4A] leading-tight block">Placement Portal</span>
          <span className="text-[10px] text-gray-500 font-medium">IIT Guwahati</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-2">
        {navItems.map((item) => {
          const active = isActive(item.href, item.name);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 py-2.5 text-[13px] transition-colors ${'nested' in item && item.nested ? 'pl-8 pr-4' : 'px-5'} ${
                active
                  ? 'border-l-[3px] border-[#1B2A4A] bg-[#e6ebf2] text-[#1B2A4A] font-semibold'
                  : 'border-l-[3px] border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-5 text-xs text-gray-800 font-medium border-t border-gray-50">
        Technical Support Team, CCD, IITG
      </div>
    </div>
  );
}

export default Sidebar;
