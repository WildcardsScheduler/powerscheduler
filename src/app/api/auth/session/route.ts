import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getStoreData } from '@/lib/store';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({
      authenticated: false,
      role: 'public',
    });
  }

  let teamName: string | undefined;
  let leagueName: string | undefined;

  if (session.role === 'team_rep' && session.teamId && session.leagueId) {
    const store = await getStoreData();
    const league = store.leagues.find((l) => l.id === session.leagueId);
    const team = league?.teams.find((t) => t.id === session.teamId);
    teamName = team?.name;
    leagueName = league?.name;
  }

  return NextResponse.json({
    authenticated: true,
    role: session.role,
    teamId: session.teamId,
    leagueId: session.leagueId,
    teamName,
    leagueName,
    expiresAt: session.expiresAt,
  });
}
