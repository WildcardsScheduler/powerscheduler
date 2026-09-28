import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('End-to-End Penetration & Security Tests', () => {
  let adminCookie = '';
  let captainCookie = '';
  let teamACaptainCookie = '';
  let teamBCaptainCookie = '';
  let teamAId = '';
  let teamBId = '';
  let matchId = '';
  let currentVersion = 1;

  test('Setup & Seed Test State if empty', async () => {
    // 1. Login as admin first
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'admin', passcode: 'admin123' }),
    });
    assert.equal(loginRes.status, 200);
    const rawCookies = loginRes.headers.get('set-cookie');
    adminCookie = rawCookies.split(';')[0];

    // 2. Fetch league state
    const res = await fetch(`${BASE_URL}/api/leagues`);
    const json = await res.json();
    const targetLeague = json.leagues[0];

    // Seed teams and match if clean/empty
    if (targetLeague.teams.length < 2 || targetLeague.matches.length === 0) {
      targetLeague.teams = [
        {
          id: 'team-alpha',
          divisionId: 'div-main',
          name: 'Team Alpha',
          captainName: 'Alice',
          captainEmail: 'alice@example.com',
          captainPhone: '(555) 111-2222',
          badgeColor: '#3b82f6',
          accessPin: '1234',
          roster: [{ id: 'p-1', name: 'Alice', isCaptain: true, rsvpStatus: 'Going' }],
        },
        {
          id: 'team-beta',
          divisionId: 'div-main',
          name: 'Team Beta',
          captainName: 'Bob',
          captainEmail: 'bob@example.com',
          captainPhone: '(555) 333-4444',
          badgeColor: '#ef4444',
          accessPin: '1234',
          roster: [{ id: 'p-2', name: 'Bob', isCaptain: true, rsvpStatus: 'Going' }],
        },
      ];
      targetLeague.matches = [
        {
          id: 'match-1',
          divisionId: 'div-main',
          weekNumber: 1,
          date: '2026-10-15',
          startTime: '18:30',
          endTime: '19:30',
          subLocationId: 'sub-pioneer-c1',
          homeTeamId: 'team-alpha',
          awayTeamId: 'team-beta',
          status: 'Scheduled',
          scores: [],
        },
      ];

      await fetch(`${BASE_URL}/api/leagues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({ leagues: json.leagues, activeId: targetLeague.id }),
      });
    }
  });

  test('Public API Data Sanitization: GET /api/leagues', async () => {
    const res = await fetch(`${BASE_URL}/api/leagues`);
    assert.equal(res.status, 200);

    const text = await res.text();
    assert.doesNotMatch(text, /"adminPasscode":/);
    assert.doesNotMatch(text, /"accessPin":/);

    const json = JSON.parse(text);
    assert.ok(json.leagues && json.leagues.length > 0);
    assert.equal(json.session?.role, 'public');

    // Store sample IDs for subsequent RBAC tests
    const league = json.leagues[0];
    teamAId = league.teams[0]?.id;
    teamBId = league.teams[1]?.id;
    matchId = league.matches[0]?.id;
    currentVersion = json.version || 1;

    // Contact PII shielding
    assert.equal(league.teams[0].captainPhone, '');
    assert.equal(league.teams[0].captainEmail, '');
  });

  test('Security Headers: Frame protection and CSP', async () => {
    const res = await fetch(`${BASE_URL}/api/leagues`);
    const headers = res.headers;

    assert.equal(headers.get('x-frame-options'), 'DENY');
    assert.equal(headers.get('x-content-type-options'), 'nosniff');
    assert.ok(headers.get('content-security-policy'));
  });

  test('Unauthenticated mutation requests are blocked by middleware (401)', async () => {
    const matchRes = await fetch(`${BASE_URL}/api/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(matchRes.status, 401);

    const scoreRes = await fetch(`${BASE_URL}/api/matches/m1/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(scoreRes.status, 401);

    const teamRes = await fetch(`${BASE_URL}/api/teams/t1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(teamRes.status, 401);

    const leagueRes = await fetch(`${BASE_URL}/api/leagues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(leagueRes.status, 401);
  });

  test('Authentication: Login with invalid credentials returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'admin', passcode: 'wrong-passcode-12345' }),
    });
    assert.equal(res.status, 401);
  });

  test('Authentication: Valid admin login sets secure session cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'admin', passcode: 'admin123' }),
    });
    assert.equal(res.status, 200);

    const rawCookies = res.headers.get('set-cookie');
    assert.ok(rawCookies);
    assert.match(rawCookies, /powerschedule_session=/);
    assert.match(rawCookies, /HttpOnly/i);

    adminCookie = rawCookies.split(';')[0];
  });

  test('Session Verification: /api/auth/session reports role with valid cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.authenticated, true);
    assert.equal(json.role, 'scheduler');
  });

  test('Authentication: Captain login sets scoped team session cookie', async () => {
    const getRes = await fetch(`${BASE_URL}/api/leagues`);
    const { leagues } = await getRes.json();
    const targetLeague = leagues[0];
    const teamA = targetLeague.teams[0];

    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'captain',
        leagueId: targetLeague.id,
        teamId: teamA.id,
        pin: '1234',
      }),
    });
    assert.equal(res.status, 200);

    const rawCookies = res.headers.get('set-cookie');
    assert.ok(rawCookies);
    teamACaptainCookie = rawCookies.split(';')[0];
  });

  test('RBAC / BOLA: Captain of Team A cannot edit Team B (403)', async () => {
    const res = await fetch(`${BASE_URL}/api/teams/${encodeURIComponent(teamBId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teamACaptainCookie,
      },
      body: JSON.stringify({ name: 'Tampered Name by Hacker' }),
    });
    assert.equal(res.status, 403);
  });

  test('RBAC / BOLA: Captain of Team A can edit Team A (200)', async () => {
    const res = await fetch(`${BASE_URL}/api/teams/${encodeURIComponent(teamAId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teamACaptainCookie,
      },
      body: JSON.stringify({ name: 'Updated Team A' }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.version);
    currentVersion = json.version;
  });

  test('RBAC: Non-admin captain cannot call POST /api/leagues (403)', async () => {
    const res = await fetch(`${BASE_URL}/api/leagues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teamACaptainCookie,
      },
      body: JSON.stringify({ action: 'RESET_TO_CLEAN' }),
    });
    assert.equal(res.status, 403);
  });

  test('Zod Schema Validation: Rejects malformed score payload (400)', async () => {
    const res = await fetch(`${BASE_URL}/api/matches/${encodeURIComponent(matchId)}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ scores: [{ setNumber: 1, homeScore: -10, awayScore: 25 }] }),
    });
    assert.equal(res.status, 400);
  });

  test('Business Logic: Court double booking is rejected with 409 Conflict', async () => {
    // Attempt to schedule a duplicate match at the same time and court as an existing match
    const getRes = await fetch(`${BASE_URL}/api/leagues`);
    const { leagues } = await getRes.json();
    const existingMatch = leagues[0].matches[0];

    const res = await fetch(`${BASE_URL}/api/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        leagueId: leagues[0].id,
        match: {
          date: existingMatch.date,
          startTime: existingMatch.startTime,
          subLocationId: existingMatch.subLocationId,
          homeTeamId: 'team-new-1',
          awayTeamId: 'team-new-2',
        },
      }),
    });
    assert.equal(res.status, 409);
    const json = await res.json();
    assert.match(json.error, /Conflict: Selected court is already booked/);
  });

  test('Optimistic Concurrency Control (OCC): Stale version returns 409 Conflict', async () => {
    const staleVersion = currentVersion - 1; // Explicitly stale version
    const res = await fetch(`${BASE_URL}/api/teams/${encodeURIComponent(teamAId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: 'Stale Update Attempt',
        version: staleVersion,
      }),
    });
    assert.equal(res.status, 409);
    const json = await res.json();
    assert.match(json.error, /Conflict:/);
  });

  test('Admin Reset: Admin can reset database cleanly', async () => {
    const res = await fetch(`${BASE_URL}/api/leagues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ action: 'RESET_TO_CLEAN' }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
  });
});
