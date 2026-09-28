import { NextResponse } from 'next/server';
import { LeagueSeason, Team } from '@/types/league';
import { initialLeaguesList } from '@/data/mockLeagueData';
import { getStoreData, setStoreData, LeagueStoreData } from '@/lib/store';
import { getSession } from '@/lib/auth';

export async function GET() {
  const store = await getStoreData();
  const session = await getSession();

  const isScheduler = session?.role === 'scheduler';
  const isCaptain = session?.role === 'team_rep';
  const sessionTeamId = session?.teamId;

  // Sanitize all league data before sending to client
  const sanitizedLeagues: LeagueSeason[] = store.leagues.map((league) => {
    // 1. NEVER expose master adminPasscode to public or team captains
    const cleanLeague: LeagueSeason = {
      ...league,
      adminPasscode: isScheduler ? league.adminPasscode : undefined,
    };

    // 2. Sanitize teams: protect access PINs and contact PII
    cleanLeague.teams = league.teams.map((team) => {
      const isOwnTeam = isCaptain && sessionTeamId === team.id;
      const canViewContact = isScheduler || isCaptain;

      const cleanTeam: Team = {
        ...team,
        // Only scheduler or the team's own authenticated captain sees their PIN
        accessPin: isScheduler || isOwnTeam ? team.accessPin : undefined,
        // Protect captain personal phone and email from unauthenticated public scrapers
        captainEmail: canViewContact ? team.captainEmail : '',
        captainPhone: canViewContact ? team.captainPhone : '',
      };

      return cleanTeam;
    });

    return cleanLeague;
  });

  return NextResponse.json({
    leagues: sanitizedLeagues,
    activeId: store.activeId,
    version: store.version,
    updatedAt: store.updatedAt,
    session: session
      ? { role: session.role, teamId: session.teamId, leagueId: session.leagueId }
      : { role: 'public' },
  });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    // Restrict full league state mutation strictly to authenticated Administrators (schedulers)
    if (!session || session.role !== 'scheduler') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can modify full league state.' },
        { status: 403 }
      );
    }

    const rawBody = await request.json();
    const { updateLeaguesRequestSchema } = await import('@/lib/validations/leagueSchemas');
    const parseResult = updateLeaguesRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error: ' + parseResult.error.issues.map((i) => i.message).join(', '),
          issues: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { leagues, activeId, action, version } = parseResult.data;
    const currentStore = await getStoreData();

    // Optimistic Concurrency Control check
    if (version !== undefined && version !== currentStore.version) {
      return NextResponse.json(
        {
          error: 'Conflict: The league configuration has been updated by another session. Please refresh.',
          currentVersion: currentStore.version,
        },
        { status: 409 }
      );
    }

    // Reset action strictly reserved for Admin (scheduler)
    if (action === 'RESET_TO_CLEAN') {
      const cleanStore: LeagueStoreData = {
        leagues: initialLeaguesList,
        activeId: initialLeaguesList[0].id,
      };
      await setStoreData(cleanStore);
      return NextResponse.json({
        success: true,
        message: 'Reset to clean initial state',
        store: cleanStore,
        version: cleanStore.version,
      });
    }

    // Preserve master adminPasscodes and team PINs from current store if stripped in client payload
    const currentPasscodeMap = new Map<string, string | undefined>(
      currentStore.leagues.map((l) => [l.id, l.adminPasscode])
    );
    const currentPinMap = new Map<string, string | undefined>();
    currentStore.leagues.forEach((l) => {
      l.teams.forEach((t: Team) => currentPinMap.set(t.id, t.accessPin));
    });

    if (!leagues || !Array.isArray(leagues)) {
      return NextResponse.json({ error: 'Leagues array is required.' }, { status: 400 });
    }

    const preservedLeagues: LeagueSeason[] = leagues.map((l) => ({
      ...l,
      adminPasscode: l.adminPasscode || currentPasscodeMap.get(l.id) || 'admin123',
      teams: l.teams.map((t: Team) => ({
        ...t,
        accessPin: t.accessPin || currentPinMap.get(t.id) || '1234',
      })),
    }));

    const updatedStore: LeagueStoreData = { leagues: preservedLeagues, activeId: activeId || preservedLeagues[0].id };
    await setStoreData(updatedStore);

    return NextResponse.json({
      success: true,
      leaguesCount: preservedLeagues.length,
      version: updatedStore.version,
    });
  } catch (err) {
    console.error('Failed to update cloud storage API', err);
    return NextResponse.json({ error: 'Failed to update cloud storage' }, { status: 500 });
  }
}
