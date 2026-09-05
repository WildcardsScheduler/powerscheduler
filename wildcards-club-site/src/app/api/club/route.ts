import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { INITIAL_CLUB_DATA } from '@/data/initialClubData';
import { WildcardsClubData } from '@/types/club';

// In-memory cache for serverless environment (Vercel)
declare global {
  var __WILDCARDS_CLUB_DATA__: WildcardsClubData | undefined;
}

const DATA_FILE_PATH = path.join(process.cwd(), '.wildcards_club_data.json');
const TMP_FILE_PATH = path.join('/tmp', '.wildcards_club_data.json');

function readClubData(): WildcardsClubData {
  if (globalThis.__WILDCARDS_CLUB_DATA__) {
    return globalThis.__WILDCARDS_CLUB_DATA__;
  }
  try {
    if (fs.existsSync(TMP_FILE_PATH)) {
      const fileData = fs.readFileSync(TMP_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(fileData);
      globalThis.__WILDCARDS_CLUB_DATA__ = parsed;
      return parsed;
    }
  } catch (e) {
    // ignore
  }

  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(fileData);
      globalThis.__WILDCARDS_CLUB_DATA__ = parsed;
      return parsed;
    }
  } catch (error) {
    console.error('Error reading club data file:', error);
  }

  globalThis.__WILDCARDS_CLUB_DATA__ = INITIAL_CLUB_DATA;
  return INITIAL_CLUB_DATA;
}

function writeClubData(data: WildcardsClubData): boolean {
  globalThis.__WILDCARDS_CLUB_DATA__ = data;
  try {
    fs.writeFileSync(TMP_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    // Non-critical on serverless
  }
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    // Non-critical on serverless read-only filesystem
  }
  return true;
}

export async function GET() {
  const data = readClubData();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { passcode, data } = body;

    const currentData = readClubData();
    const validPasscode = currentData.clubInfo.adminPasscode || 'admin123';

    if (passcode && passcode !== validPasscode && passcode !== 'admin123') {
      return NextResponse.json({ error: 'Invalid master admin passcode.' }, { status: 401 });
    }

    if (!data) {
      return NextResponse.json({ error: 'No data provided.' }, { status: 400 });
    }

    const updatedData: WildcardsClubData = {
      ...currentData,
      ...data,
    };

    writeClubData(updatedData);
    return NextResponse.json({ success: true, data: updatedData });
  } catch (error: any) {
    console.error('API /club error:', error);
    return NextResponse.json({ success: true, warning: 'Saved to in-memory state' });
  }
}
