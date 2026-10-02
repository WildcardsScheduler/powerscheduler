import { LeagueSeason } from '@/types/league';
import { initialLeaguesList } from '@/data/mockLeagueData';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface LeagueStoreData {
  leagues: LeagueSeason[];
  activeId: string;
  version?: number;
  updatedAt?: number;
}

declare global {
  var __POWER_SCHEDULE_STORE__: LeagueStoreData | undefined;
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const TEMP_FILE_PATH = path.join(os.tmpdir(), '.powerschedule_cloud_data.json');

export const isCloudStoreConfigured = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

function normalize(parsed: LeagueStoreData): LeagueStoreData {
  if (typeof parsed.version !== 'number') parsed.version = 1;
  if (typeof parsed.updatedAt !== 'number') parsed.updatedAt = Date.now();
  return parsed;
}

function isValidStore(parsed: unknown): parsed is LeagueStoreData {
  const p = parsed as LeagueStoreData | null;
  return Boolean(p?.leagues && Array.isArray(p.leagues) && p.leagues.length > 0);
}

function createDefaultStore(): LeagueStoreData {
  return {
    leagues: structuredClone(initialLeaguesList),
    activeId: initialLeaguesList[0].id,
    version: 1,
    updatedAt: Date.now(),
  };
}

/**
 * Upstash Redis REST call. Throws on network or HTTP errors so callers never
 * mistake an outage for an empty database.
 */
export async function upstash(command: string, body?: string): Promise<unknown> {
  const res = await fetch(`${UPSTASH_URL}/${command}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    body,
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Upstash ${command.split('/')[0]} failed with HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json?.error) throw new Error(`Upstash error: ${json.error}`);
  return json?.result;
}

export async function getStoreData(): Promise<LeagueStoreData> {
  // 1. Cloud database is the single source of truth when configured.
  //    If it is unreachable we throw rather than falling back to stale local copies:
  //    a later write based on stale data would overwrite the real league data.
  if (isCloudStoreConfigured) {
    const result = await upstash('get/powerschedule_league_store');
    if (result) {
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
      if (isValidStore(parsed)) return normalize(parsed);
    }
    // Database is genuinely empty (first run): start from the default template.
    return createDefaultStore();
  }

  // --- Local development fallbacks (no cloud database configured) ---

  // 2. In-memory global cache
  if (globalThis.__POWER_SCHEDULE_STORE__) {
    return normalize(structuredClone(globalThis.__POWER_SCHEDULE_STORE__));
  }

  // 3. Temp disk file
  try {
    if (fs.existsSync(TEMP_FILE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(TEMP_FILE_PATH, 'utf-8'));
      if (isValidStore(parsed)) {
        globalThis.__POWER_SCHEDULE_STORE__ = normalize(parsed);
        return structuredClone(globalThis.__POWER_SCHEDULE_STORE__);
      }
    }
  } catch (err) {
    console.error('Error reading local store file:', err);
  }

  return createDefaultStore();
}

/**
 * Persists the store. Throws if the cloud write fails so API routes report
 * an error instead of telling the user their change was saved.
 */
export async function setStoreData(data: LeagueStoreData) {
  // Increment version counter for optimistic concurrency control
  data.version = (data.version || 0) + 1;
  data.updatedAt = Date.now();

  if (isCloudStoreConfigured) {
    await upstash('set/powerschedule_league_store', JSON.stringify(data));
    return;
  }

  globalThis.__POWER_SCHEDULE_STORE__ = structuredClone(data);
  try {
    fs.writeFileSync(TEMP_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local store file:', err);
  }
}
