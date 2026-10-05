'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LeagueSeason } from '@/types/league';
import { X, DatabaseBackup, Download, Upload, RotateCcw, CloudUpload, Loader2, AlertTriangle } from 'lucide-react';

interface BackupInfo {
  id: string;
  kind: 'daily' | 'weekly' | 'manual';
  date: string;
  keptForDays: number;
}

interface BackupFile {
  leagues: LeagueSeason[];
  activeId?: string;
  exportedAt?: string;
}

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  leagues: LeagueSeason[];
  activeLeagueId: string;
  onRestore: (leagues: LeagueSeason[], activeId?: string) => void;
}

// Accepts both downloaded files ({ leagues, activeId }) and raw store copies from the cloud
function parseBackup(data: unknown): BackupFile | null {
  const d = data as Partial<BackupFile> | null;
  if (!d || !Array.isArray(d.leagues) || d.leagues.length === 0) return null;
  const valid = d.leagues.every(
    (l) => l && typeof l.id === 'string' && typeof l.name === 'string' && Array.isArray(l.teams) && Array.isArray(l.matches)
  );
  return valid ? { leagues: d.leagues, activeId: d.activeId, exportedAt: d.exportedAt } : null;
}

function summarize(file: BackupFile): string {
  const teams = file.leagues.reduce((n, l) => n + l.teams.length, 0);
  const matches = file.leagues.reduce((n, l) => n + l.matches.length, 0);
  const scored = file.leagues.reduce((n, l) => n + l.matches.filter((m) => m.status === 'Completed' || m.status === 'Forfeit').length, 0);
  return `${file.leagues.length} league(s), ${teams} teams, ${matches} matches (${scored} with results)`;
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function fetchBackupList(): Promise<{ backups: BackupInfo[]; enabled: boolean }> {
  const res = await fetch('/api/backups', { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return { backups: data.backups || [], enabled: data.enabled !== false };
}

const KIND_LABEL: Record<BackupInfo['kind'], string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  manual: 'Manual',
};

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose, leagues, activeLeagueId, onRestore }) => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [cloudEnabled, setCloudEnabled] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBackups = useCallback(() => {
    return fetchBackupList()
      .then((data) => {
        setBackups(data.backups);
        setCloudEnabled(data.enabled);
      })
      .catch((err) => {
        setMessage({ type: 'error', text: `Could not load cloud backups: ${err instanceof Error ? err.message : 'error'}` });
      })
      .finally(() => setLoadingList(false));
  }, []);

  // The modal is mounted fresh each time it opens, so this runs once per opening
  useEffect(() => {
    if (isOpen) loadBackups();
  }, [isOpen, loadBackups]);

  if (!isOpen) return null;

  const today = new Date().toISOString().slice(0, 10);

  const handleDownloadCurrent = () => {
    downloadJson(`powerschedule-backup-${today}.json`, {
      app: 'PowerSchedule',
      exportedAt: new Date().toISOString(),
      activeId: activeLeagueId,
      leagues,
    });
    setMessage({ type: 'ok', text: 'Backup file downloaded. Keep it somewhere safe (email it to yourself, cloud drive, etc).' });
  };

  const handleBackupNow = async () => {
    setBusy('backup-now');
    setMessage(null);
    try {
      const res = await fetch('/api/backups', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMessage({ type: 'ok', text: 'Cloud backup saved.' });
      await loadBackups();
    } catch (err) {
      setMessage({ type: 'error', text: `Backup failed: ${err instanceof Error ? err.message : 'error'}` });
    } finally {
      setBusy(null);
    }
  };

  const fetchCloudBackup = async (id: string): Promise<BackupFile> => {
    const res = await fetch(`/api/backups/${encodeURIComponent(id)}`, { cache: 'no-store' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    const parsed = parseBackup(body.data);
    if (!parsed) throw new Error('The backup is empty or damaged.');
    return parsed;
  };

  // Saves a copy of the current data first, so a restore can itself be undone
  const restore = async (file: BackupFile, label: string) => {
    if (
      !window.confirm(
        `Restore ${label}?\n\nIt contains ${summarize(file)}.\n\n` +
          'This REPLACES all current league data, including any scores entered since the backup was made. ' +
          'A backup of the current data will be saved first, so you can undo this.'
      )
    ) {
      return;
    }
    if (cloudEnabled) {
      const res = await fetch('/api/backups', { method: 'POST' }).catch(() => null);
      if (!res?.ok && !window.confirm('Could not save a safety backup of the current data. Restore anyway?')) return;
    }
    onRestore(file.leagues, file.activeId);
    setMessage({ type: 'ok', text: `Restored ${label}. The previous data was saved as a manual backup.` });
    loadBackups();
  };

  const handleCloudAction = async (backup: BackupInfo, action: 'download' | 'restore') => {
    setBusy(`${action}-${backup.id}`);
    setMessage(null);
    try {
      const file = await fetchCloudBackup(backup.id);
      if (action === 'download') {
        downloadJson(`powerschedule-backup-${backup.id}.json`, { app: 'PowerSchedule', ...file });
      } else {
        await restore(file, `the ${KIND_LABEL[backup.kind].toLowerCase()} backup from ${backup.date}`);
      }
    } catch (err) {
      setMessage({ type: 'error', text: `${err instanceof Error ? err.message : 'Something went wrong'}` });
    } finally {
      setBusy(null);
    }
  };

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = e.target.files?.[0];
    e.target.value = '';
    if (!fileObj) return;
    setMessage(null);
    try {
      const parsed = parseBackup(JSON.parse(await fileObj.text()));
      if (!parsed) throw new Error('This file is not a PowerSchedule backup.');
      await restore(parsed, `the file "${fileObj.name}"`);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not read that file.' });
    }
  };

  const buttonClass =
    'px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#15171b] border border-[#e5e7eb] dark:border-[#1c1f24] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-slate-50 dark:bg-[#0e1012] border-b border-[#e5e7eb] dark:border-[#1c1f24] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#1c1f24] text-[#242424] dark:text-[#a0aaba] border border-[#e5e7eb] dark:border-[#333943]">
              <DatabaseBackup className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#242424] dark:text-white">Backups</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Save and restore all leagues, teams, schedules, scores and PINs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold border ${
                message.type === 'ok'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Download / upload */}
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Backup file</h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleDownloadCurrent}
                className={`${buttonClass} flex-1 bg-[#101010] hover:bg-[#242424] text-white dark:bg-[#007afc] dark:hover:bg-[#0062ca]`}
              >
                <Download className="h-4 w-4" /> Download backup now
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`${buttonClass} flex-1 border border-slate-200 dark:border-[#333943] text-slate-700 dark:text-[#a0aaba] hover:bg-slate-100 dark:hover:bg-[#1c1f24]`}
              >
                <Upload className="h-4 w-4" /> Restore from a file…
              </button>
              <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFileChosen} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              The file contains team PINs and captain contact details. Store it privately.
            </p>
          </section>

          {/* Cloud backups */}
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Automatic cloud backups
              </h4>
              <button
                onClick={handleBackupNow}
                disabled={!cloudEnabled || busy !== null}
                className={`${buttonClass} border border-slate-200 dark:border-[#333943] text-slate-700 dark:text-[#a0aaba] hover:bg-slate-100 dark:hover:bg-[#1c1f24]`}
              >
                {busy === 'backup-now' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                Back up now
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              A backup is taken automatically every night. Daily copies are kept 35 days, Monday copies 6 months,
              and manual copies 90 days.
            </p>

            {!cloudEnabled ? (
              <div className="p-3 rounded-xl text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Cloud backups need the Upstash database, which isn&apos;t configured here. Use backup files instead.
              </div>
            ) : loadingList ? (
              <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading backups…
              </div>
            ) : backups.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No cloud backups yet. The first nightly backup runs after your next deploy, or press “Back up now”.
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {backups.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs bg-white dark:bg-slate-950">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {new Date(b.date + 'T12:00:00Z').toLocaleDateString('en-CA', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          timeZone: 'UTC',
                        })}
                        {b.kind === 'manual' && (
                          <span className="font-normal text-slate-500"> · {b.id.slice(-6, -4)}:{b.id.slice(-4, -2)} UTC</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {KIND_LABEL[b.kind]} · kept {b.keptForDays} days
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCloudAction(b, 'download')}
                        disabled={busy !== null}
                        title="Download this backup as a file"
                        className={`${buttonClass} border border-slate-200 dark:border-[#333943] text-slate-700 dark:text-[#a0aaba] hover:bg-slate-100 dark:hover:bg-[#1c1f24]`}
                      >
                        {busy === `download-${b.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCloudAction(b, 'restore')}
                        disabled={busy !== null}
                        className={`${buttonClass} border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10`}
                      >
                        {busy === `restore-${b.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                        Restore
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
