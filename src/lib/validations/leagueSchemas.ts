import { z } from 'zod';

// ==========================================
// Authentication Schemas
// ==========================================

export const loginSchema = z.object({
  type: z.enum(['admin', 'captain']),
  passcode: z.string().max(100, 'Passcode is too long').optional(),
  pin: z.string().max(50, 'PIN is too long').optional(),
  teamId: z.string().max(100).optional(),
  leagueId: z.string().max(100).optional(),
}).refine((data) => {
  if (data.type === 'admin') {
    return Boolean(data.passcode && data.passcode.trim().length > 0);
  }
  if (data.type === 'captain') {
    return Boolean(
      data.pin &&
      data.pin.trim().length > 0 &&
      data.teamId &&
      data.teamId.trim().length > 0 &&
      data.leagueId &&
      data.leagueId.trim().length > 0
    );
  }
  return false;
}, {
  message: 'Invalid credentials: Admin passcode or Captain PIN with leagueId and teamId is required.',
});

// ==========================================
// Scorekeeper / Match Scoring Schemas
// ==========================================

export const setScoreSchema = z.object({
  setNumber: z.number().int().min(1).max(20),
  homeScore: z.number().int().min(0, 'Score cannot be negative').max(99, 'Score cannot exceed 99'),
  awayScore: z.number().int().min(0, 'Score cannot be negative').max(99, 'Score cannot exceed 99'),
});

export const scoreSubmissionSchema = z.object({
  scores: z.array(setScoreSchema).min(1, 'At least one set score is required').max(10, 'Too many sets'),
  winnerId: z.string().max(100).optional().nullable().transform((v) => v ?? undefined),
  version: z.number().int().optional(),
  // A forfeit win for winnerId: the server records the league-standard forfeit score itself
  forfeit: z.boolean().optional(),
});

// ==========================================
// Match Management Schemas
// ==========================================

export const matchStatusSchema = z.enum(['Scheduled', 'In Progress', 'Completed', 'Postponed', 'Forfeit', 'Cancelled']);

export const matchPayloadSchema = z.object({
  id: z.string().max(100).optional(),
  divisionId: z.string().max(100).optional().default(''),
  weekNumber: z.number().int().min(0).max(100).optional().default(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  startTime: z.string().min(1).max(20),
  endTime: z.string().max(20).optional().default(''),
  locationId: z.string().max(100).optional(),
  subLocationId: z.string().min(1, 'Court or sub-location is required').max(100),
  courtId: z.string().max(100).optional(),
  homeTeamId: z.string().min(1, 'Home team is required').max(100),
  awayTeamId: z.string().min(1, 'Away team is required').max(100),
  workTeamId: z.string().max(100).optional().nullable().transform((v) => v ?? undefined),
  status: matchStatusSchema.optional().default('Scheduled'),
  scores: z.array(setScoreSchema).optional().default([]),
  winnerId: z.string().max(100).optional().nullable().transform((v) => v ?? undefined),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().default(''),
  isExhibition: z.boolean().optional().default(false),
});

export const createMatchRequestSchema = z.object({
  leagueId: z.string().min(1, 'leagueId is required').max(100),
  match: matchPayloadSchema,
  version: z.number().int().optional(),
});

export const updateMatchRequestSchema = matchPayloadSchema.partial().extend({
  version: z.number().int().optional(),
});

// ==========================================
// Team Management Schemas
// ==========================================

export const playerSchema = z.object({
  id: z.string().max(100),
  name: z.string().min(1, 'Player name is required').max(100),
  number: z.string().max(20).optional(),
  position: z.enum([
    'Setter',
    'Outside Hitter',
    'Middle Blocker',
    'Opposite Hitter',
    'Libero',
    'Defensive Specialist',
    'Utility',
  ]).optional().default('Utility'),
  gender: z.enum(['M', 'F', 'Other']).optional().default('Other'),
  isCaptain: z.boolean().optional().default(false),
  rsvpStatus: z.enum(['Going', 'Maybe', 'Out', 'Pending']).optional(),
});

export const updateTeamRequestSchema = z.object({
  name: z.string().min(1, 'Team name cannot be empty').max(100, 'Team name too long').optional(),
  divisionId: z.string().max(100).optional(),
  captainName: z.string().min(1, 'Captain name cannot be empty').max(100).optional(),
  captainEmail: z.string().email('Invalid email address').max(100).or(z.literal('')).optional(),
  captainPhone: z.string().max(30, 'Phone number too long').optional(),
  badgeColor: z.string().max(30).optional(),
  accessPin: z.string().min(1, 'PIN cannot be empty').max(20, 'PIN too long').optional(),
  roster: z.array(playerSchema).max(50, 'Roster exceeds maximum of 50 players').optional(),
  version: z.number().int().optional(),
});

// ==========================================
// League State Schemas
// ==========================================

export const updateLeaguesRequestSchema = z.object({
  leagues: z.array(z.any()).max(50, 'Too many leagues').optional(),
  activeId: z.string().max(100).optional(),
  action: z.enum(['RESET_TO_CLEAN']).optional(),
  version: z.number().int().optional(),
}).refine((data) => {
  if (data.action === 'RESET_TO_CLEAN') return true;
  return Array.isArray(data.leagues) && data.leagues.length > 0;
}, {
  message: 'leagues array is required unless action is RESET_TO_CLEAN.',
});
