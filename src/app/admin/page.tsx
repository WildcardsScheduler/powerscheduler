'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
        router.push('/');
        router.refresh();
      }, 400);
    } catch {
      setAdminError('Unable to connect to authentication service.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-violet-600/10 text-violet-400 border border-violet-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">League Admin</h1>
              <p className="text-xs text-slate-400">Master Passcode Authentication</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Schedule</span>
          </Link>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Master Administrator Passcode</label>
              <div className="relative">
                <input
                  id="admin-master-security-passcode-direct"
                  name="admin-master-security-passcode"
                  type={showAdminPasscode ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Enter Admin Passcode"
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-mono tracking-wider text-violet-400 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPasscode(!showAdminPasscode)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showAdminPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Grants full access to schedule generation, matrix assignment, and scorekeeping.
              </p>
            </div>

            {adminError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-xs text-rose-400 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            {adminSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{adminSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-black text-sm shadow-md shadow-violet-600/20 transition-all flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{isSubmitting ? 'Verifying...' : 'Authorize Administrator'}</span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Team representative?</span>
            <Link
              href="/login"
              className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center space-x-1"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Team Captain Login</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center space-x-1"
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
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
