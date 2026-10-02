import { isCloudStoreConfigured, upstash } from '@/lib/store';

/**
 * League data backups, stored as copies of the main store key in the same Upstash database.
 *   - daily (from the cron job): kept 35 days; Monday's copy is kept 180 days (a full season)
 *   - manual (admin "Back up now", and automatically before every restore): kept 90 days
 */

const STORE_KEY = 'powerschedule_league_store';
const BACKUP_PREFIX = 'powerschedule_backup:';
const DAY_SECONDS = 24 * 60 * 60;
const BACKUP_ID_PATTERN = /^\d{4}-\d{2}-\d{2}(-manual-\d{6})?$/;

export type BackupKind = 'daily' | 'weekly' | 'manual';

export interface BackupInfo {
  id: string;
  kind: BackupKind;
  date: string; // YYYY-MM-DD (UTC)
  keptForDays: number;
}

function describe(id: string): BackupInfo {
  const date = id.slice(0, 10);
  if (id.includes('-manual-')) return { id, kind: 'manual', date, keptForDays: 90 };
  const isMonday = new Date(date + 'T12:00:00Z').getUTCDay() === 1;
  return isMonday
    ? { id, kind: 'weekly', date, keptForDays: 180 }
    : { id, kind: 'daily', date, keptForDays: 35 };
}

export function isValidBackupId(id: string): boolean {
  return BACKUP_ID_PATTERN.test(id);
}

export async function createBackup(trigger: 'cron' | 'manual'): Promise<BackupInfo> {
  if (!isCloudStoreConfigured) {
    throw new Error('Backups require the cloud database (Upstash) to be configured.');
  }
  const raw = await upstash(`get/${STORE_KEY}`);
  if (!raw) throw new Error('There is no league data to back up yet.');

  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const id = trigger === 'manual' ? `${date}-manual-${now.toISOString().slice(11, 19).replace(/:/g, '')}` : date;
  const info = describe(id);
  const key = encodeURIComponent(BACKUP_PREFIX + id);

  await upstash(`set/${key}`, typeof raw === 'string' ? raw : JSON.stringify(raw));
  await upstash(`expire/${key}/${info.keptForDays * DAY_SECONDS}`);
  return info;
}

export async function listBackups(): Promise<BackupInfo[]> {
  if (!isCloudStoreConfigured) return [];
  const keys = (await upstash(`keys/${encodeURIComponent(BACKUP_PREFIX + '*')}`)) as string[] | null;
  return (keys || [])
    .map((k) => k.slice(BACKUP_PREFIX.length))
    .filter(isValidBackupId)
    .sort((a, b) => b.localeCompare(a))
    .map(describe);
}

export async function readBackup(id: string): Promise<unknown | null> {
  if (!isCloudStoreConfigured || !isValidBackupId(id)) return null;
  const raw = await upstash(`get/${encodeURIComponent(BACKUP_PREFIX + id)}`);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}
