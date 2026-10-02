'use client';

import React, { useState } from 'react';
import { Team, Division, Player } from '@/types/league';
import {
  X,
  Users,
  Plus,
  Edit3,
  Trash2,
  UserPlus,User,Check,
  Search,
  KeyRound,
  Copy,
  Dices
} from 'lucide-react';
import { generateRandomPin } from '@/utils/pinGenerator';
import { formatPhoneNumber, isPhoneEmptyOrComplete, phoneDigits } from '@/utils/formatUtils';

const PHONE_HINT = 'Enter all 10 digits, e.g. (403) 846-3953';

/** Shows a stored phone in the standard format if it's a full number; anything else is left as entered. */
const phoneForEditing = (phone: string) => (phoneDigits(phone).length === 10 ? formatPhoneNumber(phone) : phone);

interface TeamManagerModalProps {
  teams: Team[];
  divisions: Division[];
  isOpen: boolean;
  onClose: () => void;
  onAddTeam: (
    name: string,
    divisionId: string,
    captainName: string,
    captainEmail: string,
    captainPhone: string,
    badgeColor: string,
    accessPin?: string
  ) => void;
  onQuickGenerateTeams?: (count: number, divisionId?: string) => void;
  onUpdateTeam: (
    teamId: string,
    name: string,
    divisionId: string,
    captainName: string,
    captainEmail: string,
    captainPhone: string,
    badgeColor: string,
    accessPin?: string
  ) => void;
  onDeleteTeam: (teamId: string) => void;
  onAddPlayer: (teamId: string, player: Omit<Player, 'id'>) => void;
  onUpdatePlayer: (teamId: string, playerId: string, player: Partial<Player>) => void;
  onDeletePlayer: (teamId: string, playerId: string) => void;
}

const PRESET_COLORS = [
  '#ec4899', // Hot Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#f43f5e', // Rose
  '#64748b', // Slate
];

const POSITIONS = [
  'Setter',
  'Outside Hitter',
  'Middle Blocker',
  'Opposite Hitter',
  'Libero',
  'Defensive Specialist',
  'Utility',
] as const;

export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({
  teams,
  divisions,
  isOpen,
  onClose,
  onAddTeam,
  onQuickGenerateTeams,
  onUpdateTeam,
  onDeleteTeam,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teams[0]?.id || null);
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [showQuickBatchForm, setShowQuickBatchForm] = useState(false);
  const [quickBatchCount, setQuickBatchCount] = useState<number>(8);
  const [quickBatchDivisionId, setQuickBatchDivisionId] = useState<string>(divisions[0]?.id || '');

  // New Team Form State
  const [newTeamName, setNewTeamName] = useState('');
  const [newDivisionId, setNewDivisionId] = useState(divisions[0]?.id || '');
  const [newCaptainName, setNewCaptainName] = useState('');
  const [newCaptainEmail, setNewCaptainEmail] = useState('');
  const [newCaptainPhone, setNewCaptainPhone] = useState('');
  const [newBadgeColor, setNewBadgeColor] = useState('#3b82f6');
  const [newAccessPin, setNewAccessPin] = useState(() => generateRandomPin());


  // Edit Team Form State (derived from selected team)
  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];
  const [editName, setEditName] = useState('');
  const [editDivisionId, setEditDivisionId] = useState('');
  const [editCaptainName, setEditCaptainName] = useState('');
  const [editCaptainEmail, setEditCaptainEmail] = useState('');
  const [editCaptainPhone, setEditCaptainPhone] = useState('');
  const [editBadgeColor, setEditBadgeColor] = useState('#3b82f6');
  const [editAccessPin, setEditAccessPin] = useState('1234');
  const [copiedPin, setCopiedPin] = useState(false);

  // Add Player Form State
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [pName, setPName] = useState('');
  const [pNumber, setPNumber] = useState('');
  const [pPosition, setPPosition] = useState<Player['position']>('Outside Hitter');
  const [pGender, setPGender] = useState<Player['gender']>('M');
  const [pIsCaptain, setPIsCaptain] = useState(false);

  // Edit Player Form State
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editPName, setEditPName] = useState('');
  const [editPNumber, setEditPNumber] = useState('');
  const [editPPosition, setEditPPosition] = useState<Player['position']>('Outside Hitter');
  const [editPGender, setEditPGender] = useState<Player['gender']>('M');
  const [editPIsCaptain, setEditPIsCaptain] = useState(false);


  // State below is adjusted during render, per React's "reset state when a prop changes" pattern.

  // Sync the default division pickers when the active league's divisions change
  const firstDivisionId = divisions[0]?.id || '';
  const [lastFirstDivisionId, setLastFirstDivisionId] = useState(firstDivisionId);
  if (firstDivisionId !== lastFirstDivisionId) {
    setLastFirstDivisionId(firstDivisionId);
    setNewDivisionId(firstDivisionId);
    setQuickBatchDivisionId(firstDivisionId);
  }

  // Load the edit form when a different team is selected, or when THIS team's form fields change
  // elsewhere. Roster/RSVP updates from captains don't touch these fields, so they no longer
  // wipe edits in progress.
  const editFormSource = selectedTeam
    ? JSON.stringify([
        selectedTeam.id,
        selectedTeam.name,
        selectedTeam.divisionId,
        selectedTeam.captainName,
        selectedTeam.captainEmail,
        selectedTeam.captainPhone,
        selectedTeam.badgeColor,
        selectedTeam.accessPin,
      ])
    : '';
  const [loadedEditFormSource, setLoadedEditFormSource] = useState('');
  if (selectedTeam && editFormSource !== loadedEditFormSource) {
    setLoadedEditFormSource(editFormSource);
    setEditName(selectedTeam.name);
    setEditDivisionId(selectedTeam.divisionId);
    setEditCaptainName(selectedTeam.captainName);
    setEditCaptainEmail(selectedTeam.captainEmail);
    setEditCaptainPhone(phoneForEditing(selectedTeam.captainPhone || ''));
    setEditBadgeColor(selectedTeam.badgeColor || '#3b82f6');
    setEditAccessPin(selectedTeam.accessPin || '1234');
    setEditingPlayerId(null);
  }

  if (!isOpen) return null;

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.captainName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    if (!isPhoneEmptyOrComplete(newCaptainPhone)) return;

    onAddTeam(
      newTeamName.trim(),
      newDivisionId || divisions[0]?.id || '',
      newCaptainName.trim() || 'Unassigned Captain',
      newCaptainEmail.trim() || 'captain@example.com',
      newCaptainPhone.trim() || '(555) 000-0000',
      newBadgeColor,
      newAccessPin.trim() || generateRandomPin()
    );

    setNewTeamName('');
    setNewCaptainName('');
    setNewCaptainEmail('');
    setNewCaptainPhone('');
    setNewAccessPin(generateRandomPin());
    setShowAddTeamForm(false);
  };

  const handleQuickBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickBatchCount <= 0) return;
    if (onQuickGenerateTeams) {
      onQuickGenerateTeams(quickBatchCount, quickBatchDivisionId || divisions[0]?.id || '');
    }
    setShowQuickBatchForm(false);
    setShowAddTeamForm(false);
  };

  const handleSaveTeamEdit = () => {
    if (!selectedTeam || !editName.trim()) return;
    if (!isPhoneEmptyOrComplete(editCaptainPhone)) return;

    onUpdateTeam(
      selectedTeam.id,
      editName.trim(),
      editDivisionId,
      editCaptainName.trim(),
      editCaptainEmail.trim(),
      editCaptainPhone.trim(),
      editBadgeColor,
      editAccessPin.trim() || '1234'
    );
  };

  const handleCreatePlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !pName.trim()) return;

    onAddPlayer(selectedTeam.id, {
      name: pName.trim(),
      number: pNumber.trim() || undefined,
      position: pPosition,
      gender: pGender,
      isCaptain: pIsCaptain,
      rsvpStatus: 'Going',
    });

    setPName('');
    setPNumber('');
    setPIsCaptain(false);
    setShowAddPlayer(false);
  };

  const handleStartEditPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditPName(player.name);
    setEditPNumber(player.number || '');
    setEditPPosition(player.position);
    setEditPGender(player.gender);
    setEditPIsCaptain(player.isCaptain);
  };

  const handleSavePlayerEdit = (playerId: string) => {
    if (!selectedTeam || !editPName.trim()) return;

    onUpdatePlayer(selectedTeam.id, playerId, {
      name: editPName.trim(),
      number: editPNumber.trim() || undefined,
      position: editPPosition,
      gender: editPGender,
      isCaptain: editPIsCaptain,
    });

    setEditingPlayerId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 rounded-none sm:rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col h-[100dvh] sm:h-[90vh]">

        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Team & Roster Manager</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Create teams, edit captain details, badge colors & player rosters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Main Body (Grid split into Sidebar + Team Editor) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">

          {/* Left Sidebar: Team List & Search */}
          <div className="md:col-span-4 bg-slate-50 dark:bg-slate-950 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col space-y-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Teams ({teams.length})
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => {
                    setShowQuickBatchForm(true);
                    setShowAddTeamForm(false);
                  }}
                  className="px-2 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold text-[11px] flex items-center space-x-1 transition-all shadow-sm"
                  title="Quick add numbered teams (Team 1, Team 2, etc.)"
                >
                  <span>⚡ Add N Teams</span>
                </button>
                <button
                  onClick={() => {
                    setShowAddTeamForm(true);
                    setShowQuickBatchForm(false);
                  }}
                  className="px-2 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center space-x-1 transition-all shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Custom</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search team or captain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-sm"
              />
            </div>

            {/* List of Teams */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {filteredTeams.map((team) => {
                const isSelected = team.id === selectedTeam?.id;
                const div = divisions.find((d) => d.id === team.divisionId);

                return (
                  <button
                    key={team.id}
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setShowAddTeamForm(false);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all space-y-1 ${isSelected && !showAddTeamForm
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400 dark:border-emerald-500/60 text-slate-900 dark:text-white shadow-md shadow-emerald-500/10'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: team.badgeColor || '#3b82f6' }}
                        />
                        <span className="font-bold text-xs truncate max-w-[140px] text-slate-900 dark:text-white">{team.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                        {div?.name || 'Main Div'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Capt: {team.captainName}</span>
                      <span>{team.roster.length} Players</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Editor Panel */}
          <div className="md:col-span-8 p-4 sm:p-6 overflow-y-auto space-y-6">

            {showQuickBatchForm || (teams.length === 0 && !showAddTeamForm) ? (
              /* Quick Batch Numbered Teams Form */
              <div className="bg-slate-50 dark:bg-slate-950 border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <Users className="h-4 w-4" /> Quick Add Numbered Teams
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Generate placeholder teams (&quot;Team 1&quot;, &quot;Team 2&quot;, etc.) so you can perform schedule generation immediately and update names/captains later.
                    </p>
                  </div>
                  {teams.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowQuickBatchForm(false)}
                      className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={handleQuickBatchSubmit} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Select League / Division Capacity Preset:
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                      {[4, 6, 8, 10, 12, 16].map((num) => (
                        <button
                          type="button"
                          key={num}
                          onClick={() => setQuickBatchCount(num)}
                          className={`py-2 text-xs font-bold rounded-xl border transition-all ${quickBatchCount === num
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                          {num} Teams
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Number of Teams to Add
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="32"
                        value={quickBatchCount}
                        onChange={(e) => setQuickBatchCount(parseInt(e.target.value) || 1)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Target Division
                      </label>
                      <select
                        value={quickBatchDivisionId}
                        onChange={(e) => setQuickBatchDivisionId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs shadow-sm"
                      >
                        {divisions.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Generate {quickBatchCount} Numbered Teams (Team 1 to Team {quickBatchCount})</span>
                  </button>
                </form>
              </div>
            ) : showAddTeamForm ? (
              /* Create New Team Form */
              <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Plus className="h-4 w-4" /> Register New Team
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddTeamForm(false)}
                    className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Team Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Block Party"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Division</label>
                    <select
                      value={newDivisionId}
                      onChange={(e) => setNewDivisionId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs shadow-sm"
                    >
                      {divisions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Captain Details */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Captain Contact Information</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      placeholder="Captain Full Name"
                      value={newCaptainName}
                      onChange={(e) => setNewCaptainName(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3 py-1.5 text-xs shadow-sm"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={newCaptainEmail}
                      onChange={(e) => setNewCaptainEmail(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3 py-1.5 text-xs shadow-sm"
                    />
                    <div>
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        placeholder="(403) 555-0123"
                        value={newCaptainPhone}
                        onChange={(e) => setNewCaptainPhone(formatPhoneNumber(e.target.value))}
                        className={`w-full bg-white dark:bg-slate-900 border text-slate-900 dark:text-white rounded-xl px-3 py-1.5 text-xs shadow-sm ${
                          isPhoneEmptyOrComplete(newCaptainPhone) ? 'border-slate-200 dark:border-slate-800' : 'border-rose-400 dark:border-rose-500/60'
                        }`}
                      />
                      {!isPhoneEmptyOrComplete(newCaptainPhone) && (
                        <p className="mt-1 text-[10px] text-rose-600 dark:text-rose-400">{PHONE_HINT}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Auto-generated Captain Access PIN */}
                <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Captain Login PIN (Auto-Generated)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewAccessPin(generateRandomPin())}
                      className="text-[10px] text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                      title="Generate new random PIN"
                    >
                      <Dices className="h-3.5 w-3.5" />
                      <span>Randomize PIN</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={newAccessPin}
                    onChange={(e) => setNewAccessPin(e.target.value)}
                    placeholder="Auto-generated PIN"
                    className="w-full bg-white dark:bg-slate-900 border border-amber-500/40 text-amber-700 dark:text-amber-400 font-mono font-bold rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    A secure 4-digit PIN is automatically assigned for captain login.
                  </p>
                </div>

                {/* Color Badge Picker */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Team Color Badge</label>
                  <div className="flex flex-wrap items-center gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setNewBadgeColor(color)}
                        className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${newBadgeColor === color ? 'scale-125 ring-2 ring-slate-900 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''
                          }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <label
                      className="relative h-7 w-7 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 cursor-pointer hover:border-slate-900 dark:hover:border-white transition-colors flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0"
                      title="Custom Color Picker"
                    >
                      🎨
                      <input
                        type="color"
                        value={newBadgeColor}
                        onChange={(e) => setNewBadgeColor(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Save Team
                </button>
              </form>
            ) : selectedTeam ? (
              /* Active Team Detailed Editor */
              <div className="space-y-6">

                {/* Team Details Form */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: editBadgeColor || '#3b82f6' }}
                      />
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Edit Team Details</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteTeam(selectedTeam.id)}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-500/20 flex items-center space-x-1 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Team</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Team Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Division</label>
                      <select
                        value={editDivisionId}
                        onChange={(e) => setEditDivisionId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3 py-1.5 text-xs shadow-sm"
                      >
                        {divisions.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Captain Info Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Captain Name</label>
                      <input
                        type="text"
                        value={editCaptainName}
                        onChange={(e) => setEditCaptainName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-2.5 py-1 text-xs shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Captain Email</label>
                      <input
                        type="email"
                        value={editCaptainEmail}
                        onChange={(e) => setEditCaptainEmail(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-2.5 py-1 text-xs shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Captain Phone</label>
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        placeholder="(403) 555-0123"
                        value={editCaptainPhone}
                        onChange={(e) => setEditCaptainPhone(formatPhoneNumber(e.target.value))}
                        className={`w-full bg-white dark:bg-slate-900 border text-slate-900 dark:text-white rounded-xl px-2.5 py-1 text-xs shadow-sm ${
                          isPhoneEmptyOrComplete(editCaptainPhone) ? 'border-slate-200 dark:border-slate-800' : 'border-rose-400 dark:border-rose-500/60'
                        }`}
                      />
                      {!isPhoneEmptyOrComplete(editCaptainPhone) && (
                        <p className="mt-1 text-[10px] text-rose-600 dark:text-rose-400">{PHONE_HINT}</p>
                      )}
                    </div>
                  </div>

                  {/* Captain Access PIN & Copy PIN */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <KeyRound className="h-3 w-3" /> Captain 4-Digit Login PIN
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditAccessPin(generateRandomPin())}
                        className="text-[10px] text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                        title="Generate new random PIN"
                      >
                        <Dices className="h-3 w-3" />
                        <span>Randomize PIN</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={editAccessPin}
                        onChange={(e) => setEditAccessPin(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-900 border border-amber-500/40 text-amber-700 dark:text-amber-400 font-mono font-bold rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const pin = editAccessPin || selectedTeam.accessPin || '1234';
                          navigator.clipboard.writeText(pin);
                          setCopiedPin(true);
                          setTimeout(() => setCopiedPin(false), 2000);
                        }}
                        className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
                        title="Copy 4-digit PIN to clipboard"
                      >
                        {copiedPin ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400">PIN Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy PIN</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Color Badge Swatches */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">Badge Color:</span>
                      <span
                        className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700 shadow-sm"
                        style={{ backgroundColor: editBadgeColor }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 flex-1">
                      {PRESET_COLORS.map((color) => (
                        <button
                          type="button"
                          key={color}
                          onClick={() => setEditBadgeColor(color)}
                          className={`h-5 w-5 rounded-full transition-transform hover:scale-110 ${editBadgeColor === color ? 'ring-2 ring-slate-900 dark:ring-white ring-offset-1 ring-offset-white dark:ring-offset-slate-900 scale-110' : ''
                            }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <label
                        className="relative h-5 w-5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 cursor-pointer hover:border-slate-500 dark:hover:border-white transition-colors flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-400 shrink-0"
                        title="Custom Color Picker"
                      >
                        🎨
                        <input
                          type="color"
                          value={editBadgeColor}
                          onChange={(e) => setEditBadgeColor(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveTeamEdit}
                      disabled={!isPhoneEmptyOrComplete(editCaptainPhone)}
                      title={isPhoneEmptyOrComplete(editCaptainPhone) ? undefined : PHONE_HINT}
                      className="disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white dark:text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 shrink-0 shadow-md transition-all"
                    >
                      Save Team Info
                    </button>
                  </div>
                </div>

                {/* Interactive Player Roster Management */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                        Team Roster ({selectedTeam.roster.length} Players)
                      </h4>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Add or edit players on this roster</span>
                    </div>

                    {!showAddPlayer && (
                      <button
                        onClick={() => setShowAddPlayer(true)}
                        className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1 shadow-sm"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>+ Add Player</span>
                      </button>
                    )}
                  </div>

                  {/* Add Player Form */}
                  {showAddPlayer && (
                    <form onSubmit={handleCreatePlayerSubmit} className="p-3 bg-white dark:bg-slate-900 border border-violet-500/30 rounded-xl space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-violet-600 dark:text-violet-400">Add Player to Roster</span>
                        <button
                          type="button"
                          onClick={() => setShowAddPlayer(false)}
                          className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          placeholder="Player Name"
                          value={pName}
                          onChange={(e) => setPName(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-2.5 py-1 text-xs"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Jersey #"
                          value={pNumber}
                          onChange={(e) => setPNumber(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-2.5 py-1 text-xs"
                        />
                        <select
                          value={pPosition}
                          onChange={(e) => setPPosition(e.target.value as Player['position'])}
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-2.5 py-1 text-xs"
                        >
                          {POSITIONS.map((pos) => (
                            <option key={pos} value={pos}>
                              {pos}
                            </option>
                          ))}
                        </select>
                        <select
                          value={pGender}
                          onChange={(e) => setPGender(e.target.value as Player['gender'])}
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-2.5 py-1 text-xs"
                        >
                          <option value="M">Male (M)</option>
                          <option value="F">Female (F)</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pIsCaptain}
                            onChange={(e) => setPIsCaptain(e.target.checked)}
                            className="rounded accent-amber-500"
                          />
                          <span>Designate as Team Captain</span>
                        </label>

                        <button
                          type="submit"
                          className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-lg"
                        >
                          Add Player
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Player Roster Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedTeam.roster.map((player) => {
                      const isEditingThisPlayer = editingPlayerId === player.id;

                      if (isEditingThisPlayer) {
                        return (
                          <div
                            key={player.id}
                            className="sm:col-span-2 bg-white dark:bg-slate-900 border border-amber-500/40 rounded-xl p-3 space-y-2.5 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                                <Edit3 className="h-3.5 w-3.5" />
                                <span>Edit Player Details</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingPlayerId(null)}
                                className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                              <input
                                type="text"
                                value={editPName}
                                onChange={(e) => setEditPName(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-2.5 py-1 text-xs"
                                placeholder="Player Name"
                              />
                              <input
                                type="text"
                                value={editPNumber}
                                onChange={(e) => setEditPNumber(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-2.5 py-1 text-xs"
                                placeholder="Jersey #"
                              />
                              <select
                                value={editPPosition}
                                onChange={(e) => setEditPPosition(e.target.value as Player['position'])}
                                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-2.5 py-1 text-xs"
                              >
                                {POSITIONS.map((pos) => (
                                  <option key={pos} value={pos}>
                                    {pos}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={editPGender}
                                onChange={(e) => setEditPGender(e.target.value as Player['gender'])}
                                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-2.5 py-1 text-xs"
                              >
                                <option value="M">Male (M)</option>
                                <option value="F">Female (F)</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <label className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editPIsCaptain}
                                  onChange={(e) => setEditPIsCaptain(e.target.checked)}
                                  className="rounded accent-amber-500"
                                />
                                <span>Designate as Team Captain</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => handleSavePlayerEdit(player.id)}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1 shadow-sm"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Save Changes</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={player.id}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex items-center justify-between shadow-sm"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">{player.name}</span>
                                {player.number && (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">#{player.number}</span>
                                )}
                                {player.isCaptain && (
                                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                                    CAPT
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                                {player.position} • Gender: {player.gender}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleStartEditPlayer(player)}
                              className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-950 rounded-lg transition-colors"
                              title="Edit Player"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onDeletePlayer(selectedTeam.id, player.id)}
                              className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-950 rounded-lg transition-colors"
                              title="Remove Player"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Select a team from the left sidebar to edit.</p>
            )}

          </div>

        </div>

        {/* Footer */}
        <div className="mt-auto p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-colors shadow-sm"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
