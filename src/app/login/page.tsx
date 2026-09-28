'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LeagueSeason } from '@/types/league';
import { KeyRound, ShieldCheck, UserCheck, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowLeft, Volleyball } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab') === 'admin' ? 'admin' : 'team';

  const [activeTab, setActiveTab] = useState<'team' | 'admin'>(requestedTab);
  const [leagues, setLeagues] = useState<LeagueSeason[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [captainPin, setCaptainPin] = useState<string>('');
  const [showCaptainPin, setShowCaptainPin] = useState<boolean>(false);
  const [teamError, setTeamError] = useState<string>('');
  const [teamSuccess, setTeamSuccess] = useState<string>('');

  const [adminPasscode, setAdminPasscode] = useState<string>('');
  const [showAdminPasscode, setShowAdminPasscode] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string>('');
  const [adminSuccess, setAdminSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/leagues', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.leagues && Array.isArray(data.leagues) && data.leagues.length > 0) {
          setLeagues(data.leagues);
          const firstLeague = data.leagues[0];
          setSelectedLeagueId(firstLeague.id);
          if (firstLeague.teams && firstLeague.teams.length > 0) {
            setSelectedTeamId(firstLeague.teams[0].id);
          }
        }
      })
      .catch((err) => console.warn('Failed to fetch leagues in login page:', err))
      .finally(() => {
        if (isMounted) setIsLoadingLeagues(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const targetLeague = leagues.find((l) => l.id === selectedLeagueId) || leagues[0];

  const handleCaptainLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeamError('');
    setTeamSuccess('');
    setIsSubmitting(true);

    if (!targetLeague || !selectedTeamId) {
      setTeamError('Please select a valid team.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'captain',
          leagueId: targetLeague.id,
          teamId: selectedTeamId,
          pin: captainPin.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTeamError(data.error || 'Invalid 4-digit PIN for selected team.');
        setIsSubmitting(false);
        return;
      }

      setTeamSuccess(data.message || 'Access Granted. Redirecting...');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 400);
    } catch {
      setTeamError('Unable to connect to authentication service.');
      setIsSubmitting(false);
    }
  };

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

      setAdminSuccess('Administrator Authorized. Redirecting...');
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
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Access Portal</h1>
              <p className="text-xs text-slate-400">Sign in for Scorekeeping & Management</p>
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

        {/* Tab Selection */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex">
          <button
            type="button"
            onClick={() => {
              setActiveTab('team');
              setTeamError('');
              setAdminError('');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'team'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Team Captain PIN</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setTeamError('');
              setAdminError('');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'admin'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>League Admin</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {isLoadingLeagues ? (
            <div className="py-8 text-center text-slate-400 text-sm flex flex-col items-center space-y-2">
              <div className="h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span>Connecting to league portal...</span>
            </div>
          ) : activeTab === 'team' ? (
            <form onSubmit={handleCaptainLogin} className="space-y-4">
              {leagues.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Select League Season</span>
                    <span className="text-[10px] text-amber-400 font-mono">({leagues.length} Available)</span>
                  </label>
                  <select
                    value={selectedLeagueId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedLeagueId(newId);
                      const targetL = leagues.find((l) => l.id === newId);
                      if (targetL && targetL.teams && targetL.teams.length > 0) {
                        setSelectedTeamId(targetL.teams[0].id);
                      } else {
                        setSelectedTeamId('');
                      }
                      setCaptainPin('');
                      setTeamError('');
                      setTeamSuccess('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-500"
                  >
                    {leagues.map((l) => (
                      <option key={l.id} value={l.id} className="bg-slate-900 text-white">
                        {l.name} ({l.sport})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(!targetLeague?.teams || targetLeague.teams.length === 0) ? (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-center">
                  <div className="mx-auto w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">No Teams Registered Yet</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      This league season has no teams configured yet. Log in as League Admin to set up teams and generate matches.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('admin');
                      setTeamError('');
                      setAdminError('');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md shadow-violet-600/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Switch to League Admin Sign In</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">Select Your Team</label>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => {
                        setSelectedTeamId(e.target.value);
                        setCaptainPin('');
                        setTeamError('');
                        setTeamSuccess('');
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-500"
                    >
                      {targetLeague.teams.map((t) => (
                        <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">4-Digit Captain PIN</label>
                    <div className="relative">
                      <input
                        id="captain-team-access-pin-page"
                        name="captain-team-access-pin"
                        type={showCaptainPin ? 'text' : 'password'}
                        maxLength={10}
                        autoComplete="new-password"
                        placeholder="Enter team PIN (e.g. 1234)"
                        value={captainPin}
                        onChange={(e) => setCaptainPin(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-mono tracking-wider text-amber-400 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCaptainPin(!showCaptainPin)}
                        className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                      >
                        {showCaptainPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      Default PIN for teams is <strong className="text-slate-400">1234</strong>.
                    </p>
                  </div>

                  {teamError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-xs text-rose-400 font-semibold">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{teamError}</span>
                    </div>
                  )}

                  {teamSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-xs text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{teamSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>{isSubmitting ? 'Authenticating...' : 'Log In as Team Captain'}</span>
                  </button>
                </>
              )}
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Master Administrator Passcode</label>
                <div className="relative">
                  <input
                    id="admin-master-security-passcode-page"
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
          )}
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
