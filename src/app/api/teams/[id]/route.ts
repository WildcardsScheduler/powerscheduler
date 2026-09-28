import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getStoreData, setStoreData } from '@/lib/store';
import { updateTeamRequestSchema } from '@/lib/validations/leagueSchemas';
import { Team, LeagueSeason } from '@/types/league';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'scheduler' && session.role !== 'team_rep')) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to update team details.' },
        { status: 401 }
      );
    }

    const { id: teamId } = await params;

    // BOLA / IDOR Protection: Team Captains can only update their own team
    if (session.role === 'team_rep' && session.teamId !== teamId) {
      return NextResponse.json(
        { error: 'Forbidden: You are only authorized to edit your own team.' },
        { status: 403 }
      );
    }

    const rawBody = await request.json();
    const parseResult = updateTeamRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error: ' + parseResult.error.issues.map((i) => i.message).join(', '),
          issues: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const validatedData = parseResult.data;
    const store = await getStoreData();

    // Optimistic Concurrency Control check
    if (validatedData.version !== undefined && validatedData.version !== store.version) {
      return NextResponse.json(
        {
          error: 'Conflict: This team has been updated by another user or session. Please refresh.',
          currentVersion: store.version,
        },
        { status: 409 }
      );
    }

    let foundTeam: Team | undefined;
    let targetLeague: LeagueSeason | undefined;

    for (const league of store.leagues) {
      const t = league.teams.find((item) => item.id === teamId);
      if (t) {
        foundTeam = t;
        targetLeague = league;
        break;
      }
    }

    if (!foundTeam || !targetLeague) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

    // Apply allowed updates
    if (validatedData.name !== undefined) foundTeam.name = validatedData.name;
    if (validatedData.divisionId !== undefined && session.role === 'scheduler') {
      foundTeam.divisionId = validatedData.divisionId;
    }
    if (validatedData.captainName !== undefined) foundTeam.captainName = validatedData.captainName;
    if (validatedData.captainEmail !== undefined) foundTeam.captainEmail = validatedData.captainEmail;
    if (validatedData.captainPhone !== undefined) foundTeam.captainPhone = validatedData.captainPhone;
    if (validatedData.badgeColor !== undefined) foundTeam.badgeColor = validatedData.badgeColor;
    if (validatedData.accessPin !== undefined) foundTeam.accessPin = validatedData.accessPin;
    if (validatedData.roster !== undefined) {
      // Map roster players ensuring IDs and valid positions
      foundTeam.roster = validatedData.roster.map((p) => ({
        id: p.id || `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: p.name,
        number: p.number,
        position: p.position || 'Utility',
        gender: p.gender || 'Other',
        isCaptain: Boolean(p.isCaptain),
        rsvpStatus: p.rsvpStatus,
      }));
    }

    await setStoreData(store);

    return NextResponse.json({
      success: true,
      message: 'Team updated successfully.',
      team: foundTeam,
      version: store.version,
    });
  } catch (err) {
    console.error('Failed to update team:', err);
    return NextResponse.json({ error: 'Internal server error while updating team.' }, { status: 500 });
  }
}
