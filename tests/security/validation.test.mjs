import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  loginSchema,
  scoreSubmissionSchema,
  createMatchRequestSchema,
  updateMatchRequestSchema,
  updateTeamRequestSchema,
} from '../../src/lib/validations/leagueSchemas.ts';

describe('Server-Side Zod Payload Validation', () => {
  describe('Login Schema Validation', () => {
    test('accepts valid admin login credentials', () => {
      const result = loginSchema.safeParse({ type: 'admin', passcode: 'admin123' });
      assert.ok(result.success);
    });

    test('accepts valid captain login credentials', () => {
      const result = loginSchema.safeParse({
        type: 'captain',
        pin: '1234',
        leagueId: 'league-1',
        teamId: 'team-1',
      });
      assert.ok(result.success);
    });

    test('rejects empty or blank admin passcode', () => {
      const result = loginSchema.safeParse({ type: 'admin', passcode: '   ' });
      assert.equal(result.success, false);
    });

    test('rejects captain login missing teamId or leagueId', () => {
      const result = loginSchema.safeParse({ type: 'captain', pin: '1234' });
      assert.equal(result.success, false);
    });

    test('rejects oversized login strings (>100 chars)', () => {
      const result = loginSchema.safeParse({
        type: 'admin',
        passcode: 'a'.repeat(150),
      });
      assert.equal(result.success, false);
    });
  });

  describe('Score Submission Schema Validation', () => {
    test('accepts valid volleyball set scores', () => {
      const result = scoreSubmissionSchema.safeParse({
        scores: [
          { setNumber: 1, homeScore: 25, awayScore: 23 },
          { setNumber: 2, homeScore: 19, awayScore: 25 },
          { setNumber: 3, homeScore: 15, awayScore: 11 },
        ],
        winnerId: 'team-1',
      });
      assert.ok(result.success);
    });

    test('rejects negative scores', () => {
      const result = scoreSubmissionSchema.safeParse({
        scores: [{ setNumber: 1, homeScore: -5, awayScore: 25 }],
      });
      assert.equal(result.success, false);
    });

    test('rejects absurdly large scores (> 99)', () => {
      const result = scoreSubmissionSchema.safeParse({
        scores: [{ setNumber: 1, homeScore: 1000, awayScore: 25 }],
      });
      assert.equal(result.success, false);
    });

    test('rejects empty score arrays', () => {
      const result = scoreSubmissionSchema.safeParse({ scores: [] });
      assert.equal(result.success, false);
    });

    test('transforms null winnerId to undefined safely', () => {
      const result = scoreSubmissionSchema.safeParse({
        scores: [{ setNumber: 1, homeScore: 25, awayScore: 20 }],
        winnerId: null,
      });
      assert.ok(result.success);
      assert.equal(result.data.winnerId, undefined);
    });
  });

  describe('Match Management Schema Validation', () => {
    test('accepts valid match creation payload', () => {
      const result = createMatchRequestSchema.safeParse({
        leagueId: 'l1',
        match: {
          date: '2026-10-15',
          startTime: '18:30',
          subLocationId: 'court-1',
          homeTeamId: 'team-a',
          awayTeamId: 'team-b',
        },
      });
      assert.ok(result.success);
    });

    test('rejects invalid date format', () => {
      const result = createMatchRequestSchema.safeParse({
        leagueId: 'l1',
        match: {
          date: '10/15/2026', // Invalid format; must be YYYY-MM-DD
          startTime: '18:30',
          subLocationId: 'court-1',
          homeTeamId: 'team-a',
          awayTeamId: 'team-b',
        },
      });
      assert.equal(result.success, false);
    });

    test('rejects oversized match notes (> 500 characters)', () => {
      const result = updateMatchRequestSchema.safeParse({
        notes: 'X'.repeat(600),
      });
      assert.equal(result.success, false);
    });
  });

  describe('Team Management Schema Validation', () => {
    test('accepts valid team update with roster and contact info', () => {
      const result = updateTeamRequestSchema.safeParse({
        name: 'Spike Protectors',
        captainName: 'Jane Doe',
        captainEmail: 'jane@example.com',
        captainPhone: '(555) 123-4567',
        roster: [
          { id: 'p1', name: 'Jane Doe', isCaptain: true, rsvpStatus: 'Going' },
          { id: 'p2', name: 'John Smith', isCaptain: false, rsvpStatus: 'Maybe' },
        ],
      });
      assert.ok(result.success);
    });

    test('rejects invalid captain email addresses', () => {
      const result = updateTeamRequestSchema.safeParse({
        captainEmail: 'not-a-valid-email',
      });
      assert.equal(result.success, false);
    });

    test('rejects invalid player rsvpStatus value', () => {
      const result = updateTeamRequestSchema.safeParse({
        roster: [{ id: 'p1', name: 'Test', rsvpStatus: 'Attending' }], // Not in enum
      });
      assert.equal(result.success, false);
    });
  });
});
