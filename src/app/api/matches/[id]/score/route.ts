import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getStoreData, setStoreData } from '@/lib/store';
import { scoreSubmissionSchema } from '@/lib/validations/leagueSchemas';
import { Match } from '@/types/league';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'scheduler' && session.role !== 'team_rep')) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to enter scores.' },
        { status: 401 }
      );
    }

    const { id: matchId } = await params;
    const rawBody = await request.json();
    const parseResult = scoreSubmissionSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error: ' + parseResult.error.issues.map((i) => i.message).join(', '),
          issues: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { scores, winnerId, version } = parseResult.data;

    const store = await getStoreData();

    // Optimistic Concurrency Control check
    if (version !== undefined && version !== store.version) {
      return NextResponse.json(
        {
          error: 'Conflict: This match has been updated by another user or scorekeeper. Please refresh.',
          currentVersion: store.version,
        },
        { status: 409 }
      );
    }
    let foundMatch: Match | undefined;
    let parentLeagueId: string | undefined;

    for (const league of store.leagues) {
      const m = league.matches.find((item) => item.id === matchId);
      if (m) {
        foundMatch = m;
        parentLeagueId = league.id;
        break;
      }
    }

    if (!foundMatch || !parentLeagueId) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    // Authorization Check: Scheduler or Involved Team Representative
    if (session.role === 'team_rep') {
      const isAuthorizedTeam =
        session.teamId &&
        (foundMatch.homeTeamId === session.teamId ||
          foundMatch.awayTeamId === session.teamId ||
          foundMatch.workTeamId === session.teamId);

      if (!isAuthorizedTeam) {
        return NextResponse.json(
          { error: 'Forbidden: You are only authorized to score matches your team participates in.' },
          { status: 403 }
        );
      }
    }

    // Validate winnerId if supplied
    if (winnerId && winnerId !== foundMatch.homeTeamId && winnerId !== foundMatch.awayTeamId) {
      return NextResponse.json(
        { error: 'Winner ID must belong to either the home team or away team.' },
        { status: 400 }
      );
    }

    // Apply score update
    foundMatch.scores = scores;
    foundMatch.winnerId = winnerId || undefined;
    foundMatch.status = 'Completed';

    await setStoreData(store);

    return NextResponse.json({
      success: true,
      message: 'Match score saved successfully.',
      match: foundMatch,
      version: store.version,
    });
  } catch (err) {
    console.error('Failed to save score:', err);
    return NextResponse.json({ error: 'Internal server error while saving score.' }, { status: 500 });
  }
}
