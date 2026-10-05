'use client';

import React, { useState } from 'react';
import { LeagueSeason } from '@/types/league';
import { AlertTriangle, CalendarDays, Download, FileText, FolderArchive, KeyRound, Loader2, ScrollText, X } from 'lucide-react';
import type { PackageProgress } from '@/utils/adminPackage';

interface AdminPackageModalProps {
  league: LeagueSeason;
  onClose: () => void;
}

/** Builds and downloads the admin package: one folder per team with everything its captain needs. */
export const AdminPackageModal: React.FC<AdminPackageModalProps> = ({ league, onClose }) => {
  const [progress, setProgress] = useState<PackageProgress | null>(null);
  const [error, setError] = useState('');
  const [finished, setFinished] = useState<{ fileName: string; teamCount: number; sizeMb: string } | null>(null);
  const isBuilding = progress !== null && !finished;
  const exampleTeam = league.teams[0]?.name || 'Team Name';
  const teamsWithoutPin = league.teams.filter((t) => !t.accessPin).length;
  const teamsWithoutGames = league.teams.filter(
    (t) => !league.matches.some((m) => m.homeTeamId === t.id || m.awayTeamId === t.id)
  ).length;

  const handleBuild = async () => {
    setError('');
    setFinished(null);
    setProgress({ done: 0, total: 1, label: 'Loading' });
    try {
      // The PDF and zip libraries load only now, so regular visitors never download them
      const { buildAdminPackage } = await import('@/utils/adminPackage');
      const { blob, fileName, teamCount } = await buildAdminPackage(league, setProgress);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setFinished({ fileName, teamCount, sizeMb: (blob.size / 1024 / 1024).toFixed(1) });
    } catch (e) {
      console.error('Admin package failed', e);
      setError('The package could not be built. Please try again, or use the Print Studio instead.');
      setProgress(null);
    }
  };

  const percent = progress ? Math.round((progress.done / Math.max(1, progress.total)) * 100) : 0;
  const contents = [
    { icon: FileText, name: `${exampleTeam} - Schedule.pdf`, text: "The team's games, ref duties and byes" },
    { icon: KeyRound, name: `${exampleTeam} - Captain Quick Start.pdf`, text: 'How to log in and enter scores, with the team PIN' },
    { icon: ScrollText, name: `${exampleTeam} - League Rules.pdf`, text: 'The current league rules' },
    { icon: CalendarDays, name: `${exampleTeam} - Calendar.ics`, text: 'Adds every game to a phone or computer calendar' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#15171b] border border-[#e5e7eb] dark:border-[#1c1f24] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-[#0e1012] border-b border-[#e5e7eb] dark:border-[#1c1f24] flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#1c1f24] text-[#242424] dark:text-[#a0aaba] border border-[#e5e7eb] dark:border-[#333943]">
              <FolderArchive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#242424] dark:text-white">Admin Package</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {league.name}: a .zip with a folder for each of the {league.teams.length} teams
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isBuilding}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Each team folder contains</p>
            <ul className="space-y-1.5">
              {contents.map(({ icon: Icon, name, text }) => (
                <li key={name} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <Icon className="h-4 w-4 mt-0.5 shrink-0 text-slate-500 dark:text-slate-400" />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-slate-900 dark:text-white break-words">{name}</span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Attach a team&apos;s files to an email to its captain. Everything reflects the schedule as it is right now.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <b>Contains every team&apos;s login PIN.</b> Send each captain only their own team&apos;s folder, and don&apos;t share the
              whole zip.
            </span>
          </div>

          {(teamsWithoutPin > 0 || teamsWithoutGames > 0) && (
            <ul className="text-[11px] text-slate-600 dark:text-slate-300 list-disc pl-5 space-y-0.5">
              {teamsWithoutPin > 0 && <li>{teamsWithoutPin} team{teamsWithoutPin === 1 ? ' has' : 's have'} no PIN yet (the PIN boxes will be blank).</li>}
              {teamsWithoutGames > 0 && <li>{teamsWithoutGames} team{teamsWithoutGames === 1 ? ' has' : 's have'} no games scheduled yet.</li>}
            </ul>
          )}

          {progress && !finished && (
            <div className="space-y-1.5" aria-live="polite">
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="truncate pr-2">{progress.label}…</span>
                <span>{percent}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-[#007afc] transition-all" style={{ width: `${percent}%` }} />
              </div>
            </div>
          )}

          {finished && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300" aria-live="polite">
              <b>Downloaded:</b> {finished.fileName} ({finished.teamCount} team folders, {finished.sizeMb} MB). Check your
              Downloads folder.
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300">{error}</div>
          )}
        </div>

        <div className="mt-auto p-4 bg-slate-50 dark:bg-[#0e1012] border-t border-[#e5e7eb] dark:border-[#1c1f24] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isBuilding}
            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-semibold disabled:opacity-40"
          >
            {finished ? 'Done' : 'Cancel'}
          </button>
          <button
            onClick={handleBuild}
            disabled={isBuilding || league.teams.length === 0}
            className="px-5 py-2.5 rounded-xl bg-[#101010] hover:bg-[#242424] text-white dark:bg-[#007afc] dark:hover:bg-[#0062ca] font-bold text-xs flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-wait"
          >
            {isBuilding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>{isBuilding ? 'Building…' : finished ? 'Download again' : 'Build & download .zip'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
