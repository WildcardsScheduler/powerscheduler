import { NextResponse } from 'next/server';
import { LeagueSeason } from '@/types/league';
import { initialLeaguesList } from '@/data/mockLeagueData';

const CLOUD_OBJECT_ID = 'ff8081819ff5b110019ff669921a4';
const CLOUD_API_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;

// In-memory cache for fast local responses
let memoryStore: { leagues: LeagueSeason[]; activeId: string } | null = null;

export async function GET() {
  try {
    const res = await fetch(CLOUD_API_URL, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (res.ok) {
      const result = await res.json();
      if (result?.data?.leagues && Array.isArray(result.data.leagues) && result.data.leagues.length > 0) {
        memoryStore = {
          leagues: result.data.leagues,
          activeId: result.data.activeId || result.data.leagues[0].id,
        };
        return NextResponse.json(memoryStore);
      }
    }
  } catch (err) {
    console.error('Failed to fetch from cloud storage API', err);
  }

  // Fallback to memoryStore or initialLeaguesList
  if (!memoryStore) {
    memoryStore = {
      leagues: initialLeaguesList,
      activeId: initialLeaguesList[0].id,
    };
  }

  return NextResponse.json(memoryStore);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leagues, activeId } = body;

    if (!Array.isArray(leagues) || leagues.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Update local memory cache immediately
    memoryStore = { leagues, activeId: activeId || leagues[0].id };

    // Persist to cloud API in background / sync
    const res = await fetch(CLOUD_API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'PowerSchedule_Master_Store_v1',
        data: memoryStore,
      }),
    });

    if (!res.ok) {
      console.warn('Cloud API PUT warning:', res.statusText);
    }

    return NextResponse.json({ success: true, leaguesCount: leagues.length });
  } catch (err) {
    console.error('Failed to persist to cloud storage API', err);
    return NextResponse.json({ error: 'Failed to update cloud storage' }, { status: 500 });
  }
}
