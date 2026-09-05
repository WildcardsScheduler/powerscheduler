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
  onSelectLeague,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'team' | 'admin'>('team');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(activeLeagueId);
  
  const targetLeague = leagues.find((l) => l.id === selectedLeagueId) || leagues[0];

  // Team Captain Form State
  const [selectedTeamId, setSelectedTeamId] = useState<string>(targetLeague?.teams[0]?.id || '');
  const [captainPin, setCaptainPin] = useState<string>('');
  const [showCaptainPin, setShowCaptainPin] = useState<boolean>(false);
  const [teamError, setTeamError] = useState<string>('');
  const [teamSuccess, setTeamSuccess] = useState<string>('');

  // Admin Form State
  const [adminPasscode, setAdminPasscode] = useState<string>('');
  const [showAdminPasscode, setShowAdminPasscode] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string>('');
  const [adminSuccess, setAdminSuccess] = useState<string>('');

  // Update team selection if active league changes or modal opens
  React.useEffect(() => {
    setSelectedLeagueId(activeLeagueId);
    const currL = leagues.find((l) => l.id === activeLeagueId) || leagues[0];
    if (currL && currL.teams.length > 0) {
      setSelectedTeamId(currL.teams[0].id);
    }
  }, [activeLeagueId, isOpen, leagues]);

  if (!isOpen) return null;

  const handleCaptainLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setTeamError('');
    setTeamSuccess('');

    const targetTeam = targetLeague?.teams.find((t) => t.id === selectedTeamId);
    if (!targetTeam) {
      setTeamError('Please select a valid team.');
      return;
    }

    // Default PIN fallback if not explicitly defined on team is "1234"
    const validPin = targetTeam.accessPin || '1234';

    if (captainPin.trim() === validPin) {
      setTeamSuccess(`Welcome back, ${targetTeam.name}! Access Granted.`);
      onSelectLeague(targetLeague.id);
      setTimeout(() => {
        onLoginSuccess('team_rep', targetTeam.id, targetLeague.id);
        onClose();
      }, 500);
    } else {
      setTeamError(`Incorrect 4-digit PIN for ${targetTeam.name}. (Default: 1234)`);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    // Check universal master admin passcode across localStorage and all leagues
    let storedPasscode: string | null = null;
    if (typeof window !== 'undefined') {
      storedPasscode = localStorage.getItem('powerschedule_admin_passcode');
    }
    const universalPasscode =
      (storedPasscode && storedPasscode.trim()) ||
      leagues.find((l) => l.adminPasscode)?.adminPasscode ||
      targetLeague?.adminPasscode ||
      'admin123';

    if (adminPasscode.trim() === universalPasscode.trim()) {
      setAdminSuccess('Administrator Authorized. Access Granted.');
      onSelectLeague(targetLeague.id);
      setTimeout(() => {
        onLoginSuccess('scheduler', undefined, targetLeague.id);
        onClose();
      }, 500);
    } else {
      setAdminError('Invalid Admin Passcode. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Access Portal</h3>
              <p className="text-xs text-slate-400">Sign in for Scorekeeping & Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role Selector Tabs */}
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
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
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
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-bold">Currently Signed In:</span>{' '}
                    <strong className="text-white">{authTeamName}</strong>
                    {authLeagueName && <span className="text-slate-400"> ({authLeagueName})</span>}.
                    <p className="text-[11px] text-amber-200/80 mt-0.5">
                      Logging in below will replace your current session with the selected team.
                    </p>
                  </div>
                </div>
              )}

              {/* League Selector (if multiple leagues exist) */}
              {leagues.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Select League Season</span>
                    <span className="text-[10px] text-amber-400 font-mono font-normal">({leagues.length} Available)</span>
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Select Your Team</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-500"
                >
                  {targetLeague?.teams.map((t) => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  4-Digit Captain PIN
                </label>
                <div className="relative">
                  <input
                    type={showCaptainPin ? 'text' : 'password'}
                    maxLength={10}
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
                  Default PIN for teams is <strong className="text-slate-400">1234</strong> (or custom configured PIN).
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
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2"
              >
                <UserCheck className="h-4 w-4" />
                <span>Log In as Team Captain</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Master Administrator Passcode
                </label>
                <div className="relative">
                  <input
                    type={showAdminPasscode ? 'text' : 'password'}
                    placeholder="Enter master admin passcode"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-mono text-violet-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
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
                  Provides full administrator management across all league seasons.
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
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-sm shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center space-x-2"
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
