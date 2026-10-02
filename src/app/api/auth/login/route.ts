import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getStoreData } from '@/lib/store';
import { createSessionToken, safeEqual, COOKIE_NAME, SESSION_DURATION_MS } from '@/lib/auth';
import { loginSchema } from '@/lib/validations/leagueSchemas';
import { getClientIp, isLoginBlocked, recordLoginFailure, LoginLimit } from '@/lib/rateLimit';

const tooManyAttempts = () => NextResponse.json(
  { error: 'Too many failed attempts. Please wait 15 minutes and try again.' },
  { status: 429 }
);

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  });
}

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
    const ip = getClientIp(request);

    if (type === 'admin') {
      const limits: LoginLimit[] = [
        { key: `admin:ip:${ip}`, maxFailures: 10, windowSeconds: 15 * 60 },
        { key: 'admin:global', maxFailures: 50, windowSeconds: 15 * 60 },
      ];
      if (await isLoginBlocked(limits)) return tooManyAttempts();

      // In production the passcode comes ONLY from the ADMIN_PASSCODE environment variable.
      // (Falling back to a passcode stored in league data let an old passcode keep working
      // when the variable was empty.) Local development keeps the old fallbacks.
      const serverPasscode = (process.env.ADMIN_PASSCODE || '').trim();
      let validPasscode = serverPasscode;
      if (!validPasscode) {
        if (process.env.NODE_ENV === 'production') {
          console.error('Admin login refused: ADMIN_PASSCODE is not set (or is empty) in this environment.');
          return NextResponse.json(
            { error: 'Admin login is not configured on the server (ADMIN_PASSCODE is missing).' },
            { status: 503 }
          );
        }
        const store = await getStoreData();
        validPasscode = store.leagues.find((l) => l.adminPasscode)?.adminPasscode?.trim() || 'admin123';
      }

      if (!passcode || !safeEqual(passcode.trim(), validPasscode)) {
        await recordLoginFailure(limits);
        return NextResponse.json({ error: 'Invalid admin passcode.' }, { status: 401 });
      }

      await setSessionCookie(await createSessionToken({ role: 'scheduler' }));
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

      // Per-team limit stops PIN guessing even when the attacker rotates IPs.
      const limits: LoginLimit[] = [
        { key: `captain:ip:${ip}`, maxFailures: 20, windowSeconds: 15 * 60 },
        { key: `captain:team:${teamId}`, maxFailures: 10, windowSeconds: 60 * 60 },
      ];
      if (await isLoginBlocked(limits)) return tooManyAttempts();

      const store = await getStoreData();
      const league = store.leagues.find((l) => l.id === leagueId);
      const team = league?.teams.find((t) => t.id === teamId);

      if (!league || !team) {
        return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
      }

      const validPin = (team.accessPin || '').trim();
      if (!validPin || !pin || !safeEqual(pin.trim(), validPin)) {
        await recordLoginFailure(limits);
        return NextResponse.json({ error: 'Invalid PIN.' }, { status: 401 });
      }

      await setSessionCookie(
        await createSessionToken({ role: 'team_rep', teamId: team.id, leagueId: league.id })
      );
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
