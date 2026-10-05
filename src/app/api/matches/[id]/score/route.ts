import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getStoreData, setStoreData } from '@/lib/store';
import { scoreSubmissionSchema } from '@/lib/validations/leagueSchemas';
import { LeagueSeason, Match } from '@/types/league';
import { forfeitScores } from '@/utils/matchStatus';

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

    const { scores, winnerId, forfeit } = parseResult.data;

    const store = await getStoreData();

    let foundMatch: Match | undefined;
    let parentLeagueId: string | undefined;
    let parentLeague: LeagueSeason | undefined;

    for (const league of store.leagues) {
      const m = league.matches.find((item) => item.id === matchId);
      if (m) {
        foundMatch = m;
        parentLeagueId = league.id;
        parentLeague = league;
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

    // Forfeit: the named winner gets the league-standard forfeit score (25-0, 25-0)
    if (forfeit) {
      if (winnerId !== foundMatch.homeTeamId && winnerId !== foundMatch.awayTeamId) {
        return NextResponse.json({ error: 'Choose which team won by forfeit.' }, { status: 400 });
      }
      const division = parentLeague?.divisions.find((d) => d.id === foundMatch.divisionId);
      const pointsPerSet = division?.matchRules?.pointsPerSet ?? parentLeague?.matchRules?.pointsPerSet ?? 25;
      foundMatch.scores = forfeitScores(winnerId === foundMatch.homeTeamId, pointsPerSet);
      foundMatch.winnerId = winnerId;
      foundMatch.status = 'Forfeit';
      await setStoreData(store);
      return NextResponse.json({ success: true, message: 'Forfeit recorded.', match: foundMatch, version: store.version });
    }

    // The winner must be the team that won more of the submitted sets, so a
    // mistaken or tampered request cannot record a loss as a win.
    let homeSetsWon = 0;
    let awaySetsWon = 0;
    scores.forEach((s) => {
      if (s.homeScore > s.awayScore) homeSetsWon++;
      else if (s.awayScore > s.homeScore) awaySetsWon++;
    });
    if (homeSetsWon === awaySetsWon) {
      return NextResponse.json(
        { error: 'Scores are tied on sets. Enter the deciding set before saving.' },
        { status: 400 }
      );
    }
    const derivedWinnerId = homeSetsWon > awaySetsWon ? foundMatch.homeTeamId : foundMatch.awayTeamId;
    if (winnerId && winnerId !== derivedWinnerId) {
      return NextResponse.json(
        { error: 'The selected winner does not match the set scores.' },
        { status: 400 }
      );
    }

    // Apply score update
    foundMatch.scores = scores;
    foundMatch.winnerId = derivedWinnerId;
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
