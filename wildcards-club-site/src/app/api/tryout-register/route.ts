import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { INITIAL_CLUB_DATA } from '@/data/initialClubData';
import { WildcardsClubData, TryoutRegistration } from '@/types/club';

const DATA_FILE_PATH = path.join(process.cwd(), '.wildcards_club_data.json');

function readClubData(): WildcardsClubData {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      return JSON.parse(fileData);
    }
  } catch (error) {
    console.error('Error reading club data file:', error);
  }
  return INITIAL_CLUB_DATA;
}

function writeClubData(data: WildcardsClubData): boolean {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing club data file:', error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      sessionId,
      athleteName,
      ageGroup,
      birthYear,
      parentName,
      parentEmail,
      parentPhone,
      preferredPosition,
      experienceYears,
      medicalNotes,
    } = body;

    if (!athleteName || !parentEmail || !parentPhone) {
      return NextResponse.json(
        { error: 'Please provide athlete name, parent email, and phone number.' },
        { status: 400 }
      );
    }

    const currentData = readClubData();

    const newRegistration: TryoutRegistration = {
      id: `reg-${Date.now()}`,
      sessionId: sessionId || '',
      athleteName: athleteName.trim(),
      ageGroup: ageGroup || 'U14',
      birthYear: birthYear?.trim() || 'N/A',
      parentName: parentName?.trim() || 'N/A',
      parentEmail: parentEmail.trim(),
      parentPhone: parentPhone.trim(),
      preferredPosition: preferredPosition || 'Outside Hitter',
      experienceYears: experienceYears || '1 year',
      medicalNotes: medicalNotes?.trim() || '',
      registeredAt: new Date().toISOString(),
    };

    const updatedData: WildcardsClubData = {
      ...currentData,
      registrations: [newRegistration, ...(currentData.registrations || [])],
    };

    writeClubData(updatedData);

    return NextResponse.json({
      success: true,
      message: 'Registration submitted successfully!',
      registration: newRegistration,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
