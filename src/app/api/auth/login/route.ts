import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getStoreData } from '@/lib/store';
import { createSessionToken, COOKIE_NAME, SESSION_DURATION_MS } from '@/lib/auth';
import { loginSchema } from '@/lib/validations/leagueSchemas';

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parseResult = loginSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error: ' + parseResult.error.issues.map((i) => i.message).join(', '),
          issues: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { type, passcode, pin, leagueId, teamId } = parseResult.data;

    const store = await getStoreData();

    if (type === 'admin') {
      const serverPasscode = (process.env.ADMIN_PASSCODE || '').trim();
      const storedPasscode = store.leagues.find((l) => l.adminPasscode)?.adminPasscode?.trim();
      const validPasscode = serverPasscode || storedPasscode || 'admin123';

      if (!passcode || passcode.trim() !== validPasscode) {
        return NextResponse.json({ error: 'Invalid admin passcode.' }, { status: 401 });
      }

      const token = await createSessionToken({ role: 'scheduler' });
      const cookieStore = await cookies();
      cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: Math.floor(SESSION_DURATION_MS / 1000),
      });

      return NextResponse.json({
        success: true,
        role: 'scheduler',
        message: 'Admin authorization successful.',
      });
    }

    if (type === 'captain') {
      if (!leagueId || !teamId) {
        return NextResponse.json({ error: 'League ID and Team ID are required.' }, { status: 400 });
      }

      const league = store.leagues.find((l) => l.id === leagueId) || store.leagues[0];
      const team = league?.teams.find((t) => t.id === teamId);

      if (!team) {
        return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
      }

      const validPin = (team.accessPin || '1234').trim();
      if (!pin || pin.trim() !== validPin) {
        return NextResponse.json({ error: 'Invalid 4-digit PIN.' }, { status: 401 });
      }

      const token = await createSessionToken({
        role: 'team_rep',
        teamId: team.id,
        leagueId: league.id,
      });

      const cookieStore = await cookies();
      cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: Math.floor(SESSION_DURATION_MS / 1000),
      });

      return NextResponse.json({
        success: true,
        role: 'team_rep',
        teamId: team.id,
        leagueId: league.id,
        teamName: team.name,
        leagueName: league.name,
        message: `Welcome, ${team.name}!`,
      });
    }

    return NextResponse.json({ error: 'Invalid login type specified.' }, { status: 400 });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Authentication service error.' }, { status: 500 });
  }
}
