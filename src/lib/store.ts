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

export async function getStoreData(): Promise<LeagueStoreData> {
  // 1. Check Upstash Redis / Cloud KV DB if credentials exist
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const res = await fetch(`${UPSTASH_URL}/get/powerschedule_league_store`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.result) {
          const parsed = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
          if (parsed?.leagues && Array.isArray(parsed.leagues) && parsed.leagues.length > 0) {
            if (typeof parsed.version !== 'number') parsed.version = 1;
            if (typeof parsed.updatedAt !== 'number') parsed.updatedAt = Date.now();
            globalThis.__POWER_SCHEDULE_STORE__ = parsed;
            return parsed;
          }
        }
      }
    } catch (err) {
      console.error('Error fetching from Upstash Cloud DB:', err);
    }
  }

  // 2. In-memory global cache
  if (globalThis.__POWER_SCHEDULE_STORE__) {
    if (typeof globalThis.__POWER_SCHEDULE_STORE__.version !== 'number') {
      globalThis.__POWER_SCHEDULE_STORE__.version = 1;
    }
    return globalThis.__POWER_SCHEDULE_STORE__;
  }

  // 3. Fallback to temp disk file
  try {
    if (fs.existsSync(TEMP_FILE_PATH)) {
      const content = fs.readFileSync(TEMP_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed?.leagues && Array.isArray(parsed.leagues) && parsed.leagues.length > 0) {
        if (typeof parsed.version !== 'number') parsed.version = 1;
        if (typeof parsed.updatedAt !== 'number') parsed.updatedAt = Date.now();
        globalThis.__POWER_SCHEDULE_STORE__ = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading cloud store file:', err);
  }

  const defaultStore: LeagueStoreData = {
    leagues: initialLeaguesList,
    activeId: initialLeaguesList[0].id,
    version: 1,
    updatedAt: Date.now(),
  };
  globalThis.__POWER_SCHEDULE_STORE__ = defaultStore;
  return defaultStore;
}

export async function setStoreData(data: LeagueStoreData) {
  // Increment version counter for optimistic concurrency control
  data.version = (data.version || 0) + 1;
  data.updatedAt = Date.now();

  globalThis.__POWER_SCHEDULE_STORE__ = data;

  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      await fetch(`${UPSTASH_URL}/set/powerschedule_league_store`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error('Error writing to Upstash Cloud DB:', err);
    }
  }

  try {
    fs.writeFileSync(TEMP_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing cloud store file:', err);
  }
}

