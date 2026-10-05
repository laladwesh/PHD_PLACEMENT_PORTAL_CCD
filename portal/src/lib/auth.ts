'use client';

import { useEffect, useState, useCallback } from 'react';
import type { UserProfile, UserRole } from './types';

export const COOKIE_NAME_ROLE = 'user_role';
export const COOKIE_NAME_PROFILE = 'user_profile';

export const ROLE_PROFILES: Record<UserRole, UserProfile> = {
  coordinator: {
    role: 'coordinator',
    name: 'Placement Coordinator',
    title: 'Placement Coordinator',
    email: '',
    organization: 'CCD - IIT Guwahati',
  },
  company: {
    role: 'company',
    name: 'Recruiter',
    title: 'Company Recruiter',
    email: '',
    organization: 'Recruiting Organization',
  },
  student: {
    role: 'student',
    name: 'PhD Scholar',
    title: 'PhD Scholar',
    email: '',
    organization: 'IIT Guwahati',
    rollNumber: '',
  },
};

/**
 * Read cookie by name in browser
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Set cookie with standard settings (path=/ for entire portal, max-age 30 days)
 */
export function setCookie(name: string, value: string, days = 30): void {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Delete cookie
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Get active user role from cookie (fallback to localStorage or coordinator default)
 */
export function getUserRole(): UserRole {
  if (typeof window === 'undefined') return 'coordinator';
  const cookieRole = getCookie(COOKIE_NAME_ROLE) as UserRole | null;
  if (cookieRole && (cookieRole === 'coordinator' || cookieRole === 'student' || cookieRole === 'company')) {
    return cookieRole;
  }
  const localRole = localStorage.getItem(COOKIE_NAME_ROLE) as UserRole | null;
  if (localRole && (localRole === 'coordinator' || localRole === 'student' || localRole === 'company')) {
    return localRole;
  }
  return 'coordinator';
}

/**
 * Set active user role across both cookie and localStorage
 */
export function setUserRole(role: UserRole, customProfile?: Partial<UserProfile>): void {
  setCookie(COOKIE_NAME_ROLE, role);
  if (typeof window !== 'undefined') {
    localStorage.setItem(COOKIE_NAME_ROLE, role);
    const baseProfile = ROLE_PROFILES[role];
    const profile = { ...baseProfile, ...customProfile };
    localStorage.setItem(COOKIE_NAME_PROFILE, JSON.stringify(profile));
    setCookie(COOKIE_NAME_PROFILE, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('auth_role_changed', { detail: { role, profile } }));
  }
}

/**
 * Get active user profile
 */
export function getUserProfile(): UserProfile {
  const role = getUserRole();
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(COOKIE_NAME_PROFILE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role === role) return parsed;
      }
    } catch {
      // fallback
    }
  }
  return ROLE_PROFILES[role];
}

export function useUserRole() {
  const [role, setRole] = useState<UserRole>('coordinator');
  const [profile, setProfile] = useState<UserProfile>(ROLE_PROFILES.coordinator);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initialRole = getUserRole();
    setRole(initialRole);
    const initialProfile = getUserProfile();
    setProfile(initialProfile);

    // Sync from server session if available
    let active = true;
    fetch('/phdplacement/api/auth/session', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => (response.ok ? ((await response.json()) as { user: UserProfile }) : null))
      .then((result) => {
        if (!active || !result?.user) return;
        const freshProfile = { ...ROLE_PROFILES[result.user.role], ...result.user };
        setRole(result.user.role);
        setProfile(freshProfile);
        try {
          localStorage.setItem(COOKIE_NAME_ROLE, result.user.role);
          localStorage.setItem(COOKIE_NAME_PROFILE, JSON.stringify(freshProfile));
        } catch {}
      })
      .catch(() => {});

    const handleRoleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ role: UserRole; profile: UserProfile }>;
      if (customEvent.detail?.role) {
        setRole(customEvent.detail.role);
        setProfile(customEvent.detail.profile || ROLE_PROFILES[customEvent.detail.role]);
      }
    };

    window.addEventListener('auth_role_changed', handleRoleChange);
    return () => {
      active = false;
      window.removeEventListener('auth_role_changed', handleRoleChange);
    };
  }, []);

  const changeRole = useCallback((newRole: UserRole) => {
    setUserRole(newRole);
    setRole(newRole);
    setProfile(ROLE_PROFILES[newRole]);
  }, []);

  return {
    role,
    profile,
    changeRole,
    mounted,
    isCoordinator: role === 'coordinator',
    isStudent: role === 'student',
    isCompany: role === 'company',
  };
}
