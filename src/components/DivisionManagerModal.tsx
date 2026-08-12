'use client';

import React, { useState } from 'react';
import { Division, Team, SetFormat } from '@/types/league';
import { X, Layers, Plus, Edit3, Trash2, Users, ArrowRightLeft, ShieldCheck, Check } from 'lucide-react';

interface DivisionManagerModalProps {
  divisions: Division[];
  teams: Team[];
  hasDivisions: boolean;
  isOpen: boolean;
  onClose: () => void;
  onToggleHasDivisions: (enabled: boolean) => void;
  onAddDivision: (
    name: string,
    genderCategory: Division['genderCategory'],
    setFormat: SetFormat,
    maxTeams: number
  ) => void;
  onUpdateDivision: (
    id: string,
    name: string,
    genderCategory: Division['genderCategory'],
    setFormat: SetFormat,
    maxTeams: number
  ) => void;
  onDeleteDivision: (id: string) => void;
  onAssignTeamDivision: (teamId: string, targetDivisionId: string) => void;
}

export const DivisionManagerModal: React.FC<DivisionManagerModalProps> = ({
  divisions,
  teams,
  hasDivisions,
  isOpen,
  onClose,
  onToggleHasDivisions,
  onAddDivision,
  onUpdateDivision,
  onDeleteDivision,
  onAssignTeamDivision,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDivisionId, setEditingDivisionId] = useState<string | null>(null);

  // Add Form State
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<Division['genderCategory']>('Co-Ed');
  const [newSetFormat, setNewSetFormat] = useState<SetFormat>('Best of 3 (25-25-15)');
  const [newMaxTeams, setNewMaxTeams] = useState<number>(8);

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState<Division['genderCategory']>('Co-Ed');
  const [editSetFormat, setEditSetFormat] = useState<SetFormat>('Best of 3 (25-25-15)');
  const [editMaxTeams, setEditMaxTeams] = useState<number>(8);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddDivision(newName.trim(), newGender, newSetFormat, newMaxTeams);
    setNewName('');
    setShowAddForm(false);
  };

  const startEdit = (div: Division) => {
    setEditingDivisionId(div.id);
    setEditName(div.name);
    setEditGender(div.genderCategory);
    setEditSetFormat(div.setFormat);
    setEditMaxTeams(div.maxTeams || 8);
  };

  const handleSaveEdit = (divId: string) => {
    if (!editName.trim()) return;
    onUpdateDivision(divId, editName.trim(), editGender, editSetFormat, editMaxTeams);
    setEditingDivisionId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Division & Team Assignment Manager</h3>
              <p className="text-xs text-slate-400">Configure single vs multi-division structure & assign team tiers</p>
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
          
          {/* Division Structure Mode Selector */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
              League Division Structure
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onToggleHasDivisions(false)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  !hasDivisions
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Single Division</span>
                  {!hasDivisions && <Check className="h-4 w-4 text-amber-400" />}
                </div>
                <p className="text-[11px] opacity-80 mt-1">
                  All teams play in 1 single standings table and schedule.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onToggleHasDivisions(true)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  hasDivisions
                    ? 'bg-violet-500/10 border-violet-500 text-violet-400 shadow-md shadow-violet-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Multiple Divisions (Tiered / Gender)</span>
                  {hasDivisions && <Check className="h-4 w-4 text-violet-400" />}
                </div>
                <p className="text-[11px] opacity-80 mt-1">
                  Split teams into Division A, B, C or Co-Ed / Men's / Women's tiers.
                </p>
              </button>
            </div>
          </div>

          {/* Division List & Management (Enabled when Multi-Division is active) */}
          {hasDivisions && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Configured Divisions ({divisions.length})
                </h4>
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center space-x-1 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Add Division</span>
                  </button>
                )}
              </div>

              {/* Add Division Form */}
              {showAddForm && (
                <form onSubmit={handleAddSubmit} className="p-4 bg-slate-950 border border-violet-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-400 flex items-center gap-1.5">
                      <Layers className="h-4 w-4" /> Add New Division
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Division Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Division B, Competitive Co-Ed"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Gender Category</label>
                      <select
                        value={newGender}
                        onChange={(e) => setNewGender(e.target.value as Division['genderCategory'])}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs"
                      >
                        <option value="Co-Ed">Co-Ed</option>
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Reverse Co-Ed">Reverse Co-Ed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">


                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Max Teams</label>
                      <select
                        value={newMaxTeams}
                        onChange={(e) => setNewMaxTeams(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs"
                      >
                        <option value={4}>4 Teams</option>
                        <option value={6}>6 Teams</option>
                        <option value={8}>8 Teams</option>
                        <option value={12}>12 Teams</option>
                        <option value={16}>16 Teams</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-violet-600 to-amber-500 text-white font-bold text-xs rounded-xl shadow-md hover:brightness-110"
                  >
                    Save New Division
                  </button>
                </form>
              )}

              {/* Division Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {divisions.map((div) => {
                  const divTeams = teams.filter((t) => t.divisionId === div.id);

                  return (
                    <div
                      key={div.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3"
                    >
                      {editingDivisionId === div.id ? (
                        /* Edit Division */
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={editGender}
                              onChange={(e) => setEditGender(e.target.value as Division['genderCategory'])}
                              className="bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5"
                            >
                              <option value="Co-Ed">Co-Ed</option>
                              <option value="Men">Men</option>
                              <option value="Women">Women</option>
                              <option value="Reverse Co-Ed">Reverse Co-Ed</option>
                            </select>
                            <select
                              value={editMaxTeams}
                              onChange={(e) => setEditMaxTeams(Number(e.target.value))}
                              className="bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5"
                            >
                              <option value={4}>4 Max</option>
                              <option value={6}>6 Max</option>
                              <option value={8}>8 Max</option>
                              <option value={12}>12 Max</option>
                              <option value={16}>16 Max</option>
                            </select>
                          </div>
                          <div className="flex items-center space-x-2 pt-1">
                            <button
                              onClick={() => handleSaveEdit(div.id)}
                              className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingDivisionId(null)}
                              className="px-3 py-1 border border-slate-800 text-slate-400 text-xs rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Division */
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-extrabold text-white text-sm">{div.name}</h5>
                              <span className="text-[11px] text-slate-400">
                                {div.genderCategory}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => startEdit(div)}
                                className="p-1 text-amber-400 hover:bg-slate-900 rounded-md"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteDivision(div.id)}
                                disabled={divisions.length <= 1}
                                className={`p-1 rounded-md ${
                                  divisions.length <= 1 ? 'text-slate-600' : 'text-rose-400 hover:bg-slate-900'
                                }`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-amber-400" />
                              {divTeams.length} / {div.maxTeams} Teams Assigned
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Team Assignment Matrix */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Team Division Assignments ({teams.length} Teams)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">Move teams between divisions below</span>
            </div>

            {teams.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No teams registered in this league season yet.</p>
            ) : (
              <div className="space-y-2">
                {teams.map((team) => {
                  const assignedDiv = divisions.find((d) => d.id === team.divisionId);

                  return (
                    <div
                      key={team.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: team.badgeColor || '#3b82f6' }}
                        />
                        <div>
                          <span className="font-bold text-xs text-white">{team.name}</span>
                          <span className="text-[10px] text-slate-400 block">
                            Captain: {team.captainName} ({team.roster.length} Players)
                          </span>
                        </div>
                      </div>

                      {/* Division Switch Selector */}
                      {hasDivisions && divisions.length > 1 ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-slate-400">Assigned to:</span>
                          <select
                            value={team.divisionId}
                            onChange={(e) => onAssignTeamDivision(team.id, e.target.value)}
                            className="bg-slate-950 border border-slate-700 text-amber-400 font-bold text-xs rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-amber-500"
                          >
                            {divisions.map((d) => (
                              <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg">
                          {assignedDiv?.name || 'Main Division'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
