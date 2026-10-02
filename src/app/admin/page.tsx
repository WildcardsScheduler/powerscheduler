'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowLeft, UserCheck, Volleyball } from 'lucide-react';

function AdminContent() {
  const router = useRouter();
  const [adminPasscode, setAdminPasscode] = useState<string>('');
  const [showAdminPasscode, setShowAdminPasscode] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string>('');
  const [adminSuccess, setAdminSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'admin',
          passcode: adminPasscode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAdminError(data.error || 'Invalid Admin Passcode.');
        setIsSubmitting(false);
        return;
      }

      setAdminSuccess('Administrator Authorized. Redirecting to Management Dashboard...');
      setTimeout(() => {
        router.replace('/');
      }, 400);
    } catch {
      setAdminError('Unable to connect to authentication service.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#0e1012] text-[#242424] dark:text-[#a0aaba] flex flex-col justify-center items-center p-4 transition-colors duration-150">
      {/* Container */}
      <div className="w-full max-w-md bg-white dark:bg-[#15171b] border border-[#e5e7eb] dark:border-[#1c1f24] rounded-3xl overflow-hidden shadow-2xl transition-colors duration-150">
        {/* Header */}
        <div className="p-6 bg-slate-50 dark:bg-[#0e1012] border-b border-[#e5e7eb] dark:border-[#1c1f24] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#1c1f24] text-[#242424] dark:text-[#a0aaba] border border-[#e5e7eb] dark:border-[#333943]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#242424] dark:text-white tracking-tight">League Admin</h1>
              <p className="text-xs text-slate-500 dark:text-[#8b96aa]">Master Passcode Authentication</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1c1f24] hover:bg-slate-100 dark:hover:bg-[#23262d] text-[#242424] dark:text-[#a0aaba] hover:text-[#101010] dark:hover:text-white text-xs font-semibold border border-[#e5e7eb] dark:border-[#333943] transition-colors shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Schedule</span>
          </Link>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-[#a0aaba] block">Master Administrator Passcode</label>
              <div className="relative">
                <input
                  id="admin-master-security-passcode-direct"
                  name="admin-master-security-passcode"
                  type={showAdminPasscode ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Enter Admin Passcode"
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1c1f24] border border-[#e5e7eb] dark:border-[#333943] rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-mono tracking-wider text-[#242424] dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#566171] focus:outline-none focus:border-[#101010] dark:focus:border-[#007afc]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPasscode(!showAdminPasscode)}
                  className="absolute right-3.5 top-3 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  {showAdminPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#8b96aa] italic">
                Grants full access to schedule generation, matrix assignment, and scorekeeping.
              </p>
            </div>

            {adminError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            {adminSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{adminSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#101010] hover:bg-[#242424] text-white dark:bg-[#007afc] dark:hover:bg-[#0062ca] dark:text-white disabled:opacity-50 font-black text-sm shadow-xs transition-all flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{isSubmitting ? 'Verifying...' : 'Authorize Administrator'}</span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#e5e7eb] dark:border-[#1c1f24] flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-[#8b96aa]">Team representative?</span>
            <Link
              href="/login"
              className="text-[#101010] dark:text-[#007afc] hover:underline font-semibold inline-flex items-center space-x-1"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Team Captain Login</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#0e1012] border-t border-[#e5e7eb] dark:border-[#1c1f24] text-center">
          <Link
            href="/"
            className="text-xs text-slate-500 dark:text-[#8b96aa] hover:text-[#101010] dark:hover:text-[#007afc] transition-colors inline-flex items-center space-x-1"
          >
            <Volleyball className="h-3 w-3" />
            <span>PowerSchedule Live Court Management</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#0e1012] text-[#242424] dark:text-[#a0aaba] flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-[#101010] dark:border-[#007afc] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
