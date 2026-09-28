import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getStoreData, setStoreData } from '@/lib/store';
import { createMatchRequestSchema } from '@/lib/validations/leagueSchemas';
import { Match } from '@/types/league';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'scheduler') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can schedule new matches.' },
        { status: 403 }
      );
    }

    const rawBody = await request.json();
    const parseResult = createMatchRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error: ' + parseResult.error.issues.map((i) => i.message).join(', '),
          issues: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { leagueId, match, version } = parseResult.data;

    if (match.homeTeamId === match.awayTeamId) {
      return NextResponse.json(
        { error: 'Home team and away team must be distinct.' },
        { status: 400 }
      );
    }

    const store = await getStoreData();

    // Optimistic Concurrency Control check
    if (version !== undefined && version !== store.version) {
      return NextResponse.json(
        {
          error: 'Conflict: The schedule has been updated by another user. Please refresh.',
          currentVersion: store.version,
        },
        { status: 409 }
      );
    }

    const league = store.leagues.find((l) => l.id === leagueId);

    if (!league) {
      return NextResponse.json({ error: 'Target league not found.' }, { status: 404 });
    }

    // Court double-booking validation
    const courtConflict = league.matches.find(
      (m) =>
        m.date === match.date &&
        (m.subLocationId === match.subLocationId || m.courtId === match.subLocationId) &&
        m.startTime === match.startTime
    );
    if (courtConflict) {
      return NextResponse.json(
        { error: `Conflict: Selected court is already booked at ${match.startTime} on ${match.date}.` },
        { status: 409 }
      );
    }

    // Simultaneous team double-play validation
    const teamConflict = league.matches.find(
      (m) =>
        m.date === match.date &&
        m.startTime === match.startTime &&
        (m.homeTeamId === match.homeTeamId ||
          m.awayTeamId === match.homeTeamId ||
          m.homeTeamId === match.awayTeamId ||
          m.awayTeamId === match.awayTeamId)
    );
    if (teamConflict) {
      return NextResponse.json(
        { error: `Conflict: One of the teams is already scheduled at ${match.startTime} on ${match.date}.` },
        { status: 409 }
      );
    }

    const newMatch: Match = {
      ...match,
      id: match.id || `match-${Date.now()}`,
      workTeamId: match.workTeamId || undefined,
      winnerId: match.winnerId || undefined,
    };

    league.matches.push(newMatch);
    await setStoreData(store);

    return NextResponse.json({
      success: true,
      message: 'Match scheduled successfully.',
      match: newMatch,
      version: store.version,
    });
  } catch (err) {
    console.error('Failed to create match:', err);
    return NextResponse.json({ error: 'Internal server error while creating match.' }, { status: 500 });
  }
}
