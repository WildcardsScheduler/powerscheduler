import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Protect all mutation endpoints under /api/matches, /api/teams, and /api/leagues
  const isMatchMutation = pathname.startsWith('/api/matches') && method !== 'GET';
  const isTeamMutation = pathname.startsWith('/api/teams') && method !== 'GET';
  const isLeagueMutation = pathname === '/api/leagues' && method !== 'GET';

  if (isMatchMutation || isTeamMutation || isLeagueMutation) {
    const sessionCookie = request.cookies.get('powerschedule_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication session required for this action.' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/matches/:path*', '/api/teams/:path*', '/api/leagues'],
};
