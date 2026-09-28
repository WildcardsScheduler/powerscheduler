'use client';

import React, { useState } from 'react';
import { LeagueSeason, Team } from '@/types/league';
import { KeyRound, ShieldCheck, UserCheck, X, AlertCircle, Sparkles, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  leagues: LeagueSeason[];
  activeLeagueId: string;
  authRole?: 'public' | 'team_rep' | 'scheduler';
  authTeamName?: string;
  authLeagueName?: string;
  initialTab?: 'team' | 'admin';
  onSelectLeague: (id: string) => void;
  onLoginSuccess: (role: 'scheduler' | 'team_rep', teamId?: string, leagueId?: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  leagues,
  activeLeagueId,
  authRole,
  authTeamName,
  authLeagueName,
  initialTab = 'team',
  onSelectLeague,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'team' | 'admin'>(initialTab);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(activeLeagueId);
  
  const targetLeague = leagues?.find((l) => l.id === selectedLeagueId) || leagues?.[0];

  // Team Captain Form State
  const [selectedTeamId, setSelectedTeamId] = useState<string>(targetLeague?.teams?.[0]?.id || '');
  const [captainPin, setCaptainPin] = useState<string>('');
  const [showCaptainPin, setShowCaptainPin] = useState<boolean>(false);
  const [teamError, setTeamError] = useState<string>('');
  const [teamSuccess, setTeamSuccess] = useState<string>('');

  // Admin Form State
  const [adminPasscode, setAdminPasscode] = useState<string>('');
  const [showAdminPasscode, setShowAdminPasscode] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string>('');
  const [adminSuccess, setAdminSuccess] = useState<string>('');

  // Update team selection ONLY when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      setSelectedLeagueId(activeLeagueId);
      const currL = leagues?.find((l) => l.id === activeLeagueId) || leagues?.[0];
      if (currL && currL.teams && currL.teams.length > 0) {
        setSelectedTeamId(currL.teams[0].id);
      } else {
        setSelectedTeamId('');
      }
      setCaptainPin('');
      setAdminPasscode('');
      setTeamError('');
      setAdminError('');
      setTeamSuccess('');
      setAdminSuccess('');
    }
  }, [isOpen, initialTab, activeLeagueId, leagues]);

  // Ensure selected team is valid if targetLeague changes
  React.useEffect(() => {
    if (isOpen && targetLeague && targetLeague.teams && targetLeague.teams.length > 0) {
      if (!targetLeague.teams.some((t) => t.id === selectedTeamId)) {
        setSelectedTeamId(targetLeague.teams[0].id);
      }
    } else if (isOpen) {
      setSelectedTeamId('');
    }
  }, [isOpen, selectedLeagueId, targetLeague, selectedTeamId]);

  if (!isOpen) return null;

  const [isSubmitting, setIsSubmitting] = useState(false);

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

      setTeamSuccess(data.message || `Welcome! Access Granted.`);
      onSelectLeague(targetLeague.id);
      setTimeout(() => {
        onLoginSuccess('team_rep', selectedTeamId, targetLeague.id);
        onClose();
        setIsSubmitting(false);
      }, 500);
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

      setAdminSuccess('Administrator Authorized. Access Granted.');
      const targetId = targetLeague?.id || activeLeagueId || (leagues?.[0]?.id ?? '');
      if (targetId) {
        onSelectLeague(targetId);
      }
      setTimeout(() => {
        onLoginSuccess('scheduler', undefined, targetId);
        onClose();
        setIsSubmitting(false);
      }, 500);
    } catch {
      setAdminError('Unable to connect to authentication service.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#15171b] border border-[#e5e7eb] dark:border-[#1c1f24] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 transition-colors duration-150">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 dark:bg-[#0e1012] border-b border-[#e5e7eb] dark:border-[#1c1f24] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#1c1f24] text-[#242424] dark:text-[#a0aaba] border border-[#e5e7eb] dark:border-[#333943]">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#242424] dark:text-white tracking-tight">Access Portal</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sign in for Scorekeeping & Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="p-4 bg-slate-100 dark:bg-[#0e1012] border-b border-[#e5e7eb] dark:border-[#1c1f24] flex">
          <button
            type="button"
            onClick={() => {
              setActiveTab('team');
              setTeamError('');
              setAdminError('');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'team'
                ? 'bg-[#101010] text-white dark:bg-[#007afc] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-[#8b96aa] hover:text-[#242424] dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1c1f24]'
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
                ? 'bg-[#101010] text-white dark:bg-[#007afc] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-[#8b96aa] hover:text-[#242424] dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1c1f24]'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>League Admin</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-5">
          {activeTab === 'team' ? (
            <form onSubmit={handleCaptainLogin} className="space-y-4">
              {authRole === 'team_rep' && authTeamName && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-bold">Currently Signed In:</span>{' '}
                    <strong className="text-slate-900 dark:text-white">{authTeamName}</strong>
                    {authLeagueName && <span className="text-slate-500 dark:text-slate-400"> ({authLeagueName})</span>}.
                    <p className="text-[11px] text-amber-900 dark:text-amber-200/80 mt-0.5">
                      Logging in below will replace your current session with the selected team.
                    </p>
                  </div>
                </div>
              )}

              {/* League Selector (if multiple leagues exist) */}
              {leagues.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Select League Season</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-normal">({leagues.length} Available)</span>
                  </label>
                  <select
                    value={selectedLeagueId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedLeagueId(newId);
                      onSelectLeague(newId);
                      const targetL = leagues.find((l) => l.id === newId);
                      if (targetL && targetL.teams.length > 0) {
                        setSelectedTeamId(targetL.teams[0].id);
                      }
                      setCaptainPin('');
                      setTeamError('');
                      setTeamSuccess('');
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    {leagues.map((l) => (
                      <option key={l.id} value={l.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {l.name} ({l.sport})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(!targetLeague?.teams || targetLeague.teams.length === 0) ? (
                <div className="p-4 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 text-center">
                  <div className="mx-auto w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Teams Registered Yet</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Select Your Team</label>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => {
                        setSelectedTeamId(e.target.value);
                        setCaptainPin('');
                        setTeamError('');
                        setTeamSuccess('');
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    >
                      {targetLeague.teams.map((t) => (
                        <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      4-Digit Captain PIN
                    </label>
                    <div className="relative">
                      <input
                        id="captain-team-access-pin"
                        name="captain-team-access-pin"
                        type={showCaptainPin ? 'text' : 'password'}
                        maxLength={10}
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                        placeholder="Enter team 4-digit PIN"
                        value={captainPin}
                        onChange={(e) => setCaptainPin(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-mono tracking-wider text-amber-600 dark:text-amber-400 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCaptainPin(!showCaptainPin)}
                        className="absolute right-3.5 top-3 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        {showCaptainPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      PIN assigned by League Admin upon team creation (or use direct captain access link).
                    </p>
                  </div>

                  {teamError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{teamError}</span>
                    </div>
                  )}

                  {teamSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{teamSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#101010] hover:bg-[#242424] text-white dark:bg-[#007afc] dark:hover:bg-[#0062ca] font-black text-sm shadow-xs transition-all flex items-center justify-center space-x-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Log In as Team Captain</span>
                  </button>
                </>
              )}
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Master Administrator Passcode
                </label>
                <div className="relative">
                  <input
                    id="admin-master-security-passcode"
                    name="admin-master-security-passcode"
                    type={showAdminPasscode ? 'text' : 'password'}
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    placeholder="Enter master admin passcode"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-mono text-violet-700 dark:text-violet-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
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
                <p className="text-[11px] text-slate-500 italic">
                  Provides full administrator management across all league seasons.
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
                className="w-full py-3 rounded-xl bg-[#101010] hover:bg-[#242424] text-white dark:bg-[#007afc] dark:hover:bg-[#0062ca] font-black text-sm shadow-xs transition-all flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Log In as Administrator</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
