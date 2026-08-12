'use client';

import React, { useState } from 'react';
import { LeagueSeason, SportType, MatchRules, ThirdSetRule, DEFAULT_MATCH_RULES } from '@/types/league';
import { X, Trophy, Plus, Calendar, Users, Building2, Layers, Edit3, Trash2, CheckCircle2, Sparkles, Check, Settings2, KeyRound } from 'lucide-react';

interface LeagueManagerModalProps {
  leagues: LeagueSeason[];
  activeLeagueId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectLeague: (id: string) => void;
  onCreateLeague: (
    name: string,
    sport: SportType,
    startDate: string,
    endDate: string,
    maxTeams: number,
    hasDivisions: boolean,
    autofill: boolean,
    matchRules: MatchRules,
    adminPasscode?: string
  ) => void;
  onUpdateLeague: (
    id: string,
    name: string,
    sport: SportType,
    startDate: string,
    endDate: string,
    maxTeams: number,
    matchRules: MatchRules,
    adminPasscode?: string
  ) => void;
  onDeleteLeague: (id: string) => void;
  onUpdateUniversalPasscode: (passcode: string) => void;
}

export const LeagueManagerModal: React.FC<LeagueManagerModalProps> = ({
  leagues,
  activeLeagueId,
  isOpen,
  onClose,
  onSelectLeague,
  onCreateLeague,
  onUpdateLeague,
  onDeleteLeague,
  onUpdateUniversalPasscode,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLeagueId, setEditingLeagueId] = useState<string | null>(null);

  // Universal Admin Passcode state (shared across all leagues)
  const currentPasscode = leagues.find((l) => l.adminPasscode)?.adminPasscode || 'admin123';
  const [universalPasscode, setUniversalPasscode] = useState(currentPasscode);
  const [passcodeSaved, setPasscodeSaved] = useState(false);

  // New League Form State
  const [name, setName] = useState('');
  const [sport, setSport] = useState<SportType>('Volleyball');
  const [startDate, setStartDate] = useState('2026-09-08');
  const [endDate, setEndDate] = useState('2026-11-24');
  const [maxTeams, setMaxTeams] = useState<number>(12);
  const [hasDivisions, setHasDivisions] = useState<boolean>(true);

  // Match Rules State (New League)
  const [totalSets, setTotalSets] = useState<number>(3);
  const [pointsPerSet, setPointsPerSet] = useState<number>(25);
  const [pointsPerDecidingSet, setPointsPerDecidingSet] = useState<number>(15);
  const [thirdSetRule, setThirdSetRule] = useState<ThirdSetRule>('guaranteed_all');
  const [capRule, setCapRule] = useState<MatchRules['capRule']>('Win by 2 (Uncapped)');
  const [excludeThirdSetPointsFromDiff, setExcludeThirdSetPointsFromDiff] = useState<boolean>(true);

  // Edit League Form State
  const [editName, setEditName] = useState('');
  const [editSport, setEditSport] = useState<SportType>('Volleyball');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editMaxTeams, setEditMaxTeams] = useState<number>(12);

  // Edit Match Rules State
  const [editTotalSets, setEditTotalSets] = useState<number>(3);
  const [editPointsPerSet, setEditPointsPerSet] = useState<number>(25);
  const [editPointsPerDecidingSet, setEditPointsPerDecidingSet] = useState<number>(15);
  const [editThirdSetRule, setEditThirdSetRule] = useState<ThirdSetRule>('guaranteed_all');
  const [editCapRule, setEditCapRule] = useState<MatchRules['capRule']>('Win by 2 (Uncapped)');
  const [editExcludeThirdSetPointsFromDiff, setEditExcludeThirdSetPointsFromDiff] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const matchRules: MatchRules = {
      totalSets,
      pointsPerSet,
      pointsPerDecidingSet,
      thirdSetRule,
      winByTwo: true,
      capRule,
      excludeThirdSetPointsFromDiff,
    };

    onCreateLeague(name.trim(), sport, startDate, endDate, maxTeams, hasDivisions, false, matchRules);
    setName('');
    setShowCreateForm(false);
  };

  const startEditLeague = (league: LeagueSeason) => {
    const rules = league.matchRules || DEFAULT_MATCH_RULES;
    setEditingLeagueId(league.id);
    setEditName(league.name);
    setEditSport(league.sport);
    setEditStartDate(league.startDate);
    setEditEndDate(league.endDate);
    setEditMaxTeams(league.maxTeams || 12);

    setEditTotalSets(rules.totalSets);
    setEditPointsPerSet(rules.pointsPerSet);
    setEditPointsPerDecidingSet(rules.pointsPerDecidingSet);
    setEditThirdSetRule(rules.thirdSetRule);
    setEditCapRule(rules.capRule);
    setEditExcludeThirdSetPointsFromDiff(rules.excludeThirdSetPointsFromDiff ?? true);
  };

  const handleSaveEdit = (leagueId: string) => {
    if (!editName.trim()) return;
    const updatedRules: MatchRules = {
      totalSets: editTotalSets,
      pointsPerSet: editPointsPerSet,
      pointsPerDecidingSet: editPointsPerDecidingSet,
      thirdSetRule: editThirdSetRule,
      winByTwo: true,
      capRule: editCapRule,
      excludeThirdSetPointsFromDiff: editExcludeThirdSetPointsFromDiff,
    };

    onUpdateLeague(
      leagueId,
      editName.trim(),
      editSport,
      editStartDate,
      editEndDate,
      editMaxTeams,
      updatedRules
    );
    setEditingLeagueId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">League Manager</h3>
              <p className="text-xs text-slate-400">Create, Edit, Delete, and Switch active league seasons</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">

          {/* Universal Master Admin Passcode */}
          <div className="p-4 bg-slate-950 border border-rose-500/30 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <KeyRound className="h-4 w-4" /> Universal Master Admin Passcode
            </label>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              This is the single master password for all administrative access across every league season. Changing it here applies everywhere.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={universalPasscode}
                onChange={(e) => { setUniversalPasscode(e.target.value); setPasscodeSaved(false); }}
                placeholder="Master Admin Passcode"
                className="flex-1 bg-slate-900 border border-slate-800 text-rose-300 font-mono font-bold text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-rose-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  onUpdateUniversalPasscode(universalPasscode.trim() || 'admin123');
                  setPasscodeSaved(true);
                  setTimeout(() => setPasscodeSaved(false), 2000);
                }}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1 ${
                  passcodeSaved
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                }`}
              >
                {passcodeSaved ? <><Check className="h-3.5 w-3.5" /> Saved</> : 'Save'}
              </button>
            </div>
          </div>
          
          {/* Top Bar with Add League Button */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Configured Leagues ({leagues.length})
            </h4>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-110 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow-md shadow-rose-500/20 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Create New League</span>
              </button>
            )}
          </div>

          {/* Create New League Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateSubmit} className="p-4 bg-slate-950 border border-amber-500/30 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Trophy className="h-4 w-4" /> Create New League Season
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">League Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Winter 2027 Co-Ed Indoor League"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Sport Type</label>
                    <select
                      value={sport}
                      onChange={(e) => setSport(e.target.value as SportType)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs"
                    >
                      <option value="Volleyball">Volleyball (Indoor 6s)</option>
                      <option value="Beach Volleyball">Beach Volleyball</option>
                      <option value="Basketball">Basketball</option>
                      <option value="Soccer">Soccer</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">League Capacity (Max Teams)</label>
                    <select
                      value={maxTeams}
                      onChange={(e) => setMaxTeams(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs"
                    >
                      <option value={4}>4 Teams</option>
                      <option value={8}>8 Teams</option>
                      <option value={12}>12 Teams</option>
                      <option value={16}>16 Teams</option>
                      <option value={24}>24 Teams</option>
                      <option value={32}>32 Teams</option>
                    </select>
                  </div>
                </div>

                {/* Division Structure Selection */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Division Structure Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setHasDivisions(false)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between ${
                        !hasDivisions
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Single Division</span>
                      {!hasDivisions && <Check className="h-3.5 w-3.5 text-amber-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasDivisions(true)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between ${
                        hasDivisions
                          ? 'bg-violet-500/10 border-violet-500 text-violet-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Multiple Divisions</span>
                      {hasDivisions && <Check className="h-3.5 w-3.5 text-violet-400" />}
                    </button>
                  </div>
                </div>

                {/* League Match Rules & Scoring Setup */}
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
                    <Settings2 className="h-4 w-4 text-amber-400" />
                    <span>Match Rules & Scoring Configuration</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Sets per Match</label>
                      <select
                        value={totalSets}
                        onChange={(e) => setTotalSets(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-2.5 py-1.5 text-xs"
                      >
                        <option value={3}>3 Sets (Standard)</option>
                        <option value={5}>5 Sets (Best of 5)</option>
                        <option value={2}>2 Sets (Timed)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Points per Set</label>
                      <select
                        value={pointsPerSet}
                        onChange={(e) => setPointsPerSet(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-2.5 py-1.5 text-xs"
                      >
                        <option value={25}>25 Points</option>
                        <option value={21}>21 Points</option>
                        <option value={15}>15 Points</option>
                        <option value={30}>30 Points</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Deciding Set Points</label>
                      <select
                        value={pointsPerDecidingSet}
                        onChange={(e) => setPointsPerDecidingSet(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-2.5 py-1.5 text-xs"
                      >
                        <option value={15}>15 Points (Set 3/5)</option>
                        <option value={25}>25 Points (Full Set)</option>
                        <option value={21}>21 Points</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Deciding / 3rd Set Requirement</label>
                      <select
                        value={thirdSetRule}
                        onChange={(e) => setThirdSetRule(e.target.value as ThirdSetRule)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-2.5 py-1.5 text-xs"
                      >
                        <option value="guaranteed_all">3 Guaranteed Sets (Play set 3 even if 2-0)</option>
                        <option value="play_if_tied">Best of 3 (Play set 3 ONLY if tied 1-1)</option>
                        <option value="timed_sets">Timed Sets (Stop at match time limit)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Cap & Win-by Rule</label>
                      <select
                        value={capRule}
                        onChange={(e) => setCapRule(e.target.value as MatchRules['capRule'])}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-2.5 py-1.5 text-xs"
                      >
                        <option value="Win by 2 (Uncapped)">Win by 2 (Uncapped)</option>
                        <option value="Cap at +2 (e.g. 27/17)">Cap at +2 (e.g. 27/17)</option>
                        <option value="Hard Cap at Target (25/15)">Hard Cap at Target Points</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/60">
                    <label className="flex items-center space-x-2 text-xs text-slate-300 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={excludeThirdSetPointsFromDiff}
                        onChange={(e) => setExcludeThirdSetPointsFromDiff(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 h-4 w-4"
                      />
                      <span>Exclude Set #3 (Tie-breaker) scores from +/- Point Differential calculation</span>
                    </label>
                    <p className="text-[10px] text-slate-500 ml-6">
                      When enabled, standings +/- point totals only count scores from regulation sets 1 & 2.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-xs rounded-xl shadow-md hover:brightness-110"
              >
                Create League Season
              </button>
            </form>
          )}

          {/* List of Leagues */}
          <div className="space-y-3">
            {leagues.map((league) => {
              const isActive = league.id === activeLeagueId;

              return (
                <div
                  key={league.id}
                  className={`bg-slate-950 border rounded-2xl p-4 transition-all space-y-3 ${
                    isActive ? 'border-amber-500/60 shadow-lg shadow-amber-500/10' : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {editingLeagueId === league.id ? (
                    /* Edit Form */
                    <div className="space-y-3 p-2">
                      <span className="text-xs font-bold text-amber-400 block">Edit League Configuration</span>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="League Name"
                        className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-3 py-1.5"
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={editSport}
                          onChange={(e) => setEditSport(e.target.value as SportType)}
                          className="bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-3 py-1.5"
                        >
                          <option value="Volleyball">Volleyball</option>
                          <option value="Beach Volleyball">Beach Volleyball</option>
                          <option value="Basketball">Basketball</option>
                          <option value="Soccer">Soccer</option>
                        </select>

                        <select
                          value={editMaxTeams}
                          onChange={(e) => setEditMaxTeams(Number(e.target.value))}
                          className="bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-3 py-1.5"
                        >
                          <option value={4}>4 Teams Cap</option>
                          <option value={8}>8 Teams Cap</option>
                          <option value={12}>12 Teams Cap</option>
                          <option value={16}>16 Teams Cap</option>
                          <option value={24}>24 Teams Cap</option>
                          <option value={32}>32 Teams Cap</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={editStartDate}
                          onChange={(e) => setEditStartDate(e.target.value)}
                          className="bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-3 py-1.5"
                        />
                        <input
                          type="date"
                          value={editEndDate}
                          onChange={(e) => setEditEndDate(e.target.value)}
                          className="bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-3 py-1.5"
                        />
                      </div>


                      {/* Edit Match Rules */}
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                        <span className="text-[11px] font-bold text-amber-400 block">Edit Match & Scoring Rules</span>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block">Total Sets</label>
                            <select
                              value={editTotalSets}
                              onChange={(e) => setEditTotalSets(Number(e.target.value))}
                              className="w-full bg-slate-950 text-white text-[11px] rounded px-2 py-1 border border-slate-800"
                            >
                              <option value={3}>3 Sets</option>
                              <option value={5}>5 Sets</option>
                              <option value={2}>2 Sets</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block">Reg Set Pts</label>
                            <select
                              value={editPointsPerSet}
                              onChange={(e) => setEditPointsPerSet(Number(e.target.value))}
                              className="w-full bg-slate-950 text-white text-[11px] rounded px-2 py-1 border border-slate-800"
                            >
                              <option value={25}>25 Pts</option>
                              <option value={21}>21 Pts</option>
                              <option value={15}>15 Pts</option>
                              <option value={30}>30 Pts</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block">Deciding Pts</label>
                            <select
                              value={editPointsPerDecidingSet}
                              onChange={(e) => setEditPointsPerDecidingSet(Number(e.target.value))}
                              className="w-full bg-slate-950 text-white text-[11px] rounded px-2 py-1 border border-slate-800"
                            >
                              <option value={15}>15 Pts</option>
                              <option value={25}>25 Pts</option>
                              <option value={21}>21 Pts</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="text-[10px] text-slate-400 block">3rd Set Condition</label>
                            <select
                              value={editThirdSetRule}
                              onChange={(e) => setEditThirdSetRule(e.target.value as ThirdSetRule)}
                              className="w-full bg-slate-950 text-white text-[11px] rounded px-2 py-1 border border-slate-800"
                            >
                              <option value="guaranteed_all">3 Guaranteed Sets</option>
                              <option value="play_if_tied">Best of 3 (If Tied 1-1)</option>
                              <option value="timed_sets">Timed Sets</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block">Cap Rule</label>
                            <select
                              value={editCapRule}
                              onChange={(e) => setEditCapRule(e.target.value as MatchRules['capRule'])}
                              className="w-full bg-slate-950 text-white text-[11px] rounded px-2 py-1 border border-slate-800"
                            >
                              <option value="Win by 2 (Uncapped)">Win by 2 (Uncapped)</option>
                              <option value="Cap at +2 (e.g. 27/17)">Cap at +2 (27/17)</option>
                              <option value="Hard Cap at Target (25/15)">Hard Cap (25/15)</option>
                            </select>
                          </div>
                        </div>

                        <div className="pt-1">
                          <label className="flex items-center space-x-2 text-[11px] text-slate-300 font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editExcludeThirdSetPointsFromDiff}
                              onChange={(e) => setEditExcludeThirdSetPointsFromDiff(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5"
                            />
                            <span>Exclude Set #3 scores from +/- Point Differential</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => handleSaveEdit(league.id)}
                          className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingLeagueId(null)}
                          className="px-3 py-1.5 border border-slate-800 text-slate-400 text-xs rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                            {league.sport}
                          </span>
                          <h5 className="font-extrabold text-white text-base">{league.name}</h5>
                          {isActive && (
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-rose-400" />
                            {league.startDate} to {league.endDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-amber-400" />
                            {league.teams.length} / {league.maxTeams || 12} Teams
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5 text-violet-400" />
                            {league.hasDivisions === false ? 'Single Division' : `${league.divisions.length} Divisions`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5 text-blue-400" />
                            {league.locations.length} Venues
                          </span>
                          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-[11px] font-semibold">
                            <Settings2 className="h-3 w-3" />
                            {league.matchRules ? `${league.matchRules.totalSets} Sets (${league.matchRules.pointsPerSet}/${league.matchRules.pointsPerSet}/${league.matchRules.pointsPerDecidingSet} pts)` : '3 Sets (25-25-15)'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {!isActive && (
                          <button
                            onClick={() => onSelectLeague(league.id)}
                            className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-amber-400 text-xs font-bold rounded-xl transition-all"
                          >
                            Switch to League
                          </button>
                        )}

                        <button
                          onClick={() => startEditLeague(league)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 text-xs"
                          title="Edit League"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteLeague(league.id)}
                          disabled={leagues.length <= 1}
                          className={`p-1.5 rounded-lg bg-slate-900 text-xs border border-slate-800 ${
                            leagues.length <= 1 ? 'text-slate-600 cursor-not-allowed' : 'text-rose-400 hover:bg-slate-800'
                          }`}
                          title={leagues.length <= 1 ? "Cannot delete only remaining league" : "Delete League"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
