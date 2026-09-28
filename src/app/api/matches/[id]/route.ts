import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getStoreData, setStoreData } from '@/lib/store';
import { updateMatchRequestSchema } from '@/lib/validations/leagueSchemas';
import { Match, LeagueSeason } from '@/types/league';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'scheduler') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can edit or reschedule matches.' },
        { status: 403 }
      );
    }

    const { id: matchId } = await params;
    const rawBody = await request.json();
    const parseResult = updateMatchRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error: ' + parseResult.error.issues.map((i) => i.message).join(', '),
          issues: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { version, ...updatedFields } = parseResult.data;

    const store = await getStoreData();

    // Optimistic Concurrency Control check
    if (version !== undefined && version !== store.version) {
      return NextResponse.json(
        {
          error: 'Conflict: This match has been updated by another user. Please refresh.',
          currentVersion: store.version,
        },
        { status: 409 }
      );
    }

    let foundMatch: Match | undefined;
    let targetLeague: LeagueSeason | undefined;

    for (const league of store.leagues) {
      const matchIndex = league.matches.findIndex((m) => m.id === matchId);
      if (matchIndex !== -1) {
        foundMatch = league.matches[matchIndex];
        targetLeague = league;
        break;
      }
    }

    if (!foundMatch || !targetLeague) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    // Check scheduling conflicts if date, time, court, or teams are being updated
    const targetDate = updatedFields.date || foundMatch.date;
    const targetStart = updatedFields.startTime || foundMatch.startTime;
    const targetCourt = updatedFields.subLocationId || foundMatch.subLocationId;
    const targetHome = updatedFields.homeTeamId || foundMatch.homeTeamId;
    const targetAway = updatedFields.awayTeamId || foundMatch.awayTeamId;

    if (targetHome === targetAway) {
      return NextResponse.json(
        { error: 'Home team and away team must be distinct.' },
        { status: 400 }
      );
    }

    const courtConflict = targetLeague.matches.find(
      (m) =>
        m.id !== matchId &&
        m.date === targetDate &&
        (m.subLocationId === targetCourt || m.courtId === targetCourt) &&
        m.startTime === targetStart
    );
    if (courtConflict) {
      return NextResponse.json(
        { error: `Conflict: Court is already booked at ${targetStart} on ${targetDate}.` },
        { status: 409 }
      );
    }

    const teamConflict = targetLeague.matches.find(
      (m) =>
        m.id !== matchId &&
        m.date === targetDate &&
        m.startTime === targetStart &&
        (m.homeTeamId === targetHome ||
          m.awayTeamId === targetHome ||
          m.homeTeamId === targetAway ||
          m.awayTeamId === targetAway)
    );
    if (teamConflict) {
      return NextResponse.json(
        { error: `Conflict: One of the teams is already scheduled at ${targetStart} on ${targetDate}.` },
        { status: 409 }
      );
    }

    // Apply updates safely
    const matchIndex = targetLeague.matches.findIndex((m) => m.id === matchId);
    const currentMatch = targetLeague.matches[matchIndex];
    targetLeague.matches[matchIndex] = {
      ...currentMatch,
      ...updatedFields,
      id: matchId, // Prevent ID tampering
      workTeamId: updatedFields.workTeamId !== undefined ? updatedFields.workTeamId : currentMatch.workTeamId,
      winnerId: updatedFields.winnerId !== undefined ? updatedFields.winnerId : currentMatch.winnerId,
    };

    await setStoreData(store);

    return NextResponse.json({
      success: true,
      message: 'Match updated successfully.',
      match: targetLeague.matches[matchIndex],
      version: store.version,
    });
  } catch (err) {
    console.error('Failed to update match:', err);
    return NextResponse.json({ error: 'Internal server error while updating match.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'scheduler') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can delete matches.' },
        { status: 403 }
      );
    }

    const { id: matchId } = await params;
    const store = await getStoreData();
    let deleted = false;

    for (const league of store.leagues) {
      const initialLength = league.matches.length;
      league.matches = league.matches.filter((m) => m.id !== matchId);
      if (league.matches.length < initialLength) {
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    await setStoreData(store);

    return NextResponse.json({
      success: true,
      message: 'Match deleted successfully.',
      version: store.version,
    });
  } catch (err) {
    console.error('Failed to delete match:', err);
    return NextResponse.json({ error: 'Internal server error while deleting match.' }, { status: 500 });
  }
}
