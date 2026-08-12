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

const TEMP_FILE_PATH = path.join(os.tmpdir(), '.powerschedule_cloud_data.json');

function getStoreData(): { leagues: LeagueSeason[]; activeId: string } {
  if (globalThis.__POWER_SCHEDULE_STORE__) {
    return globalThis.__POWER_SCHEDULE_STORE__;
  }

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

function setStoreData(data: { leagues: LeagueSeason[]; activeId: string }) {
  globalThis.__POWER_SCHEDULE_STORE__ = data;
  try {
    fs.writeFileSync(TEMP_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing cloud store file:', err);
  }
}

export async function GET() {
  const store = getStoreData();
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
      setStoreData(cleanStore);
      return NextResponse.json({ success: true, message: 'Reset to clean initial state', store: cleanStore });
    }

    if (!Array.isArray(leagues) || leagues.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const updatedStore = { leagues, activeId: activeId || leagues[0].id };
    setStoreData(updatedStore);

    return NextResponse.json({ success: true, leaguesCount: leagues.length });
  } catch (err) {
    console.error('Failed to update cloud storage API', err);
    return NextResponse.json({ error: 'Failed to update cloud storage' }, { status: 500 });
  }
}
