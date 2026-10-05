'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { setUserRole } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';

function MicrosoftIcon() {
  return (
    <svg className="w-4 h-4 mr-2.5 flex-shrink-0" viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

function SignInCard() {
  const params = useSearchParams();
  const error = params.get('error');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast.error('Please enter your email address');
      return;
    }

    if (trimmedEmail.endsWith('@iitg.ac.in')) {
      toast.info('IIT Guwahati students and coordinators must use the Microsoft account sign-in button above.');
      return;
    }

    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/phdplacement/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Authentication failed');
        return;
      }

      setUserRole(data.role, data.user);
      toast.success(`Logged in as ${data.user?.name || data.role}`);
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Unable to connect to login service');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative z-10 w-full max-w-md mx-auto bg-white rounded-xl shadow-2xl p-8 text-center border border-gray-100">
      <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
        <img
          src="/phdplacement/logo.jpeg"
          alt="IIT Guwahati"
          className="w-full h-full object-contain"
        />
      </div>

      <h1 className="text-xl font-bold text-gray-900 tracking-tight">PhD Placement Portal</h1>
      <p className="text-xs text-gray-500 mt-1">Centre for Career Development — IIT Guwahati</p>

      {error && (
        <div role="alert" className="mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium text-left">
          {error}
        </div>
      )}

      {/* Azure Single Sign-On */}
      <div className="mt-6">
        <a
          href="/phdplacement/api/auth/azure/login"
          className="w-full flex items-center justify-center rounded-lg bg-[#0f172a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-black transition-all shadow-sm cursor-pointer"
        >
          <MicrosoftIcon />
          <span>Sign in with IITG Microsoft account</span>
        </a>
        <p className="text-[11px] text-gray-400 mt-2">
          Single sign-on for Ph.D. scholars & placement coordinators
        </p>
      </div>

      {/* Divider */}
      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink mx-3 text-gray-400 text-xs font-medium uppercase tracking-wider">
          Or recruiter sign in
        </span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      {/* Credentials Form for Recruiters */}
      <form onSubmit={handleLogin} className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Recruiter Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="recruiter@company.com"
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:bg-white transition-all text-gray-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter recruiter password"
              className="w-full px-3 py-2 pr-10 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:bg-white transition-all text-gray-900"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1B2A4A] text-white py-2.5 rounded-md text-sm font-semibold hover:bg-[#2D3F5E] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isLoading ? 'Signing in…' : 'Sign In as Recruiter'}
          </button>
        </div>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/auth/register"
          className="text-xs text-[#1B2A4A] font-medium hover:underline inline-flex items-center gap-1"
        >
          <span>New recruiter? Register your organization</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 text-center">
        <p className="text-[11px] text-gray-500">
          Trouble logging in?{' '}
          <a href="mailto:placement@iitg.ac.in" className="text-[#1B2A4A] font-semibold hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/phdplacement/bg.jpeg)' }}
      />
      <Suspense fallback={<div className="relative z-10 text-white font-medium">Loading sign-in…</div>}>
        <SignInCard />
      </Suspense>
    </div>
  );
}
