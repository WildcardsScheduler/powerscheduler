import { NextResponse } from 'next/server';
import { LeagueSeason } from '@/types/league';
import { initialLeaguesList } from '@/data/mockLeagueData';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Global memory cache in Next.js server instance
declare global {
  var __POWER_SCHEDULE_STORE__: { leagues: LeagueSeason[]; activeId: string } | undefined;
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const TEMP_FILE_PATH = path.join(os.tmpdir(), '.powerschedule_cloud_data.json');

async function getStoreData(): Promise<{ leagues: LeagueSeason[]; activeId: string }> {
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
    return globalThis.__POWER_SCHEDULE_STORE__;
  }

  // 3. Fallback to temp disk file
  try {
    if (fs.existsSync(TEMP_FILE_PATH)) {
      const content = fs.readFileSync(TEMP_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed?.leagues && Array.isArray(parsed.leagues) && parsed.leagues.length > 0) {
        globalThis.__POWER_SCHEDULE_STORE__ = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading cloud store file:', err);
  }

  const defaultStore = {
    leagues: initialLeaguesList,
    activeId: initialLeaguesList[0].id,
  };
  globalThis.__POWER_SCHEDULE_STORE__ = defaultStore;
  return defaultStore;
}

async function setStoreData(data: { leagues: LeagueSeason[]; activeId: string }) {
  globalThis.__POWER_SCHEDULE_STORE__ = data;

  // 1. Write to Upstash Redis / Cloud KV DB if credentials exist
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

  // 2. Write to temp file fallback
  try {
    fs.writeFileSync(TEMP_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing cloud store file:', err);
  }
}

export async function GET() {
  const store = await getStoreData();
  return NextResponse.json(store);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leagues, activeId, action } = body;

    // Reset action to clear all test/mock data
    if (action === 'RESET_TO_CLEAN') {
      const cleanStore = {
        leagues: initialLeaguesList,
        activeId: initialLeaguesList[0].id,
      };
      await setStoreData(cleanStore);
      return NextResponse.json({ success: true, message: 'Reset to clean initial state', store: cleanStore });
    }

    if (!Array.isArray(leagues) || leagues.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const updatedStore = { leagues, activeId: activeId || leagues[0].id };
    await setStoreData(updatedStore);

    return NextResponse.json({ success: true, leaguesCount: leagues.length });
  } catch (err) {
    console.error('Failed to update cloud storage API', err);
    return NextResponse.json({ error: 'Failed to update cloud storage' }, { status: 500 });
  }
}
