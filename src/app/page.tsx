'use client';

import React, { useState, useEffect } from 'react';
import { initialLeaguesList, calculateStandings } from '@/data/mockLeagueData';
import { LeagueSeason, Match, SetScore, TeamStanding, Location, SubLocation, SportType, Division, NetHeight, SetFormat, Team, Player, MatchRules } from '@/types/league';
import { Navbar, UserRole } from '@/components/Navbar';
import { SchedulerDashboard } from '@/components/SchedulerDashboard';
import { TeamRepDashboard } from '@/components/TeamRepDashboard';
import { StandingsTable } from '@/components/StandingsTable';
import { ScheduleGrid } from '@/components/ScheduleGrid';
import { ScorekeeperModal } from '@/components/ScorekeeperModal';
import { ScheduleGeneratorModal } from '@/components/ScheduleGeneratorModal';
import { LocationManagerModal } from '@/components/LocationManagerModal';
import { LeagueManagerModal } from '@/components/LeagueManagerModal';
import { DivisionManagerModal } from '@/components/DivisionManagerModal';
import { TeamManagerModal } from '@/components/TeamManagerModal';
import { createBlankLeague, createSampleLeague } from '@/utils/leagueGenerator';
import { Globe, Trophy, Users, Calendar, MapPin } from 'lucide-react';

export default function Home() {
  const [leagues, setLeagues] = useState<LeagueSeason[]>(initialLeaguesList);
  const [activeLeagueId, setActiveLeagueId] = useState<string>(initialLeaguesList[0].id);
  const [currentRole, setCurrentRole] = useState<UserRole>('public');
  const [isLoaded, setIsLoaded] = useState(false);

  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // Helper to repair potential orphaned divisionIds
  const repairLeaguesData = (data: LeagueSeason[]) => {
    return data.map((l) => {
      if (!l.divisions || l.divisions.length === 0) return l;
      const validDivisionIds = new Set(l.divisions.map((d) => d.id));
      const fallbackDivId = l.divisions[0].id;
      const anyOrphaned = l.teams.some((t) => !validDivisionIds.has(t.divisionId));
      if (!anyOrphaned) return l;
      return {
        ...l,
        teams: l.teams.map((t) =>
          validDivisionIds.has(t.divisionId) ? t : { ...t, divisionId: fallbackDivId }
        ),
      };
    });
  };

  // Load state from online cloud API on mount (fallback to localStorage if offline)
  useEffect(() => {
    let isMounted = true;
    const fetchCloudData = async () => {
      try {
        const res = await fetch('/api/leagues', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.leagues && Array.isArray(data.leagues) && data.leagues.length > 0) {
            const repaired = repairLeaguesData(data.leagues);
            if (isMounted) {
              setLeagues(repaired);
              if (data.activeId && repaired.some((l: LeagueSeason) => l.id === data.activeId)) {
                setActiveLeagueId(data.activeId);
              } else {
                setActiveLeagueId(repaired[0].id);
              }
              setIsCloudSynced(true);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch online cloud data, falling back to local storage', err);
      }

      // Offline / Local Storage Fallback
      try {
        const savedLeagues = localStorage.getItem('powerschedule_leagues');
        const savedActiveId = localStorage.getItem('powerschedule_active_league_id');
        if (savedLeagues) {
          const parsed: LeagueSeason[] = JSON.parse(savedLeagues);
          if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
            const repaired = repairLeaguesData(parsed);
            setLeagues(repaired);
            if (savedActiveId && repaired.some((l: LeagueSeason) => l.id === savedActiveId)) {
              setActiveLeagueId(savedActiveId);
            } else {
              setActiveLeagueId(repaired[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load local storage state', err);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    };

    fetchCloudData().finally(() => {
      if (isMounted) setIsLoaded(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Periodic polling interval to keep all devices (phone, desktop, public viewers) in sync
  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/leagues', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.leagues && Array.isArray(data.leagues) && data.leagues.length > 0) {
            const repaired = repairLeaguesData(data.leagues);
            setLeagues(repaired);
            setIsCloudSynced(true);
          }
        }
      } catch {
        // silent fail on network pulse
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [isLoaded]);

  // Persist state to online cloud API and local storage whenever leagues or active league changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('powerschedule_leagues', JSON.stringify(leagues));
      localStorage.setItem('powerschedule_active_league_id', activeLeagueId);

      // Post updates to online cloud store
      fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagues, activeId: activeLeagueId }),
      }).then(() => setIsCloudSynced(true)).catch((err) => {
        console.warn('Cloud sync post warning:', err);
      });
    } catch (err) {
      console.error('Failed to save state', err);
    }
  }, [leagues, activeLeagueId, isLoaded]);

  const league = leagues.find((l) => l.id === activeLeagueId) || leagues[0];

  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(
    league.divisions[0]?.id || ''
  );
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    league.teams[0]?.id || ''
  );

  // Modals State
  const [isScorekeeperOpen, setIsScorekeeperOpen] = useState(false);
  const [activeScoreMatch, setActiveScoreMatch] = useState<Match | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isLocationManagerOpen, setIsLocationManagerOpen] = useState(false);
  const [isLeagueManagerOpen, setIsLeagueManagerOpen] = useState(false);
  const [isDivisionManagerOpen, setIsDivisionManagerOpen] = useState(false);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);

  // Derive effective active division and team for current active league
  const activeDivision =
    league.divisions.find((d) => d.id === selectedDivisionId) || league.divisions[0];
  const effectiveDivisionId = activeDivision?.id || '';

  const activeTeam =
    league.teams.find((t) => t.id === selectedTeamId) || league.teams[0];
  const effectiveTeamId = activeTeam?.id || '';

  const handleSelectLeague = (id: string, targetLeagueOverride?: LeagueSeason) => {
    setActiveLeagueId(id);
    const targetLeague = targetLeagueOverride || leagues.find((l) => l.id === id);
    if (targetLeague) {
      if (targetLeague.divisions.length > 0) {
        setSelectedDivisionId(targetLeague.divisions[0].id);
      } else {
        setSelectedDivisionId('');
      }
      if (targetLeague.teams.length > 0) {
        setSelectedTeamId(targetLeague.teams[0].id);
      } else {
        setSelectedTeamId('');
      }
    }
  };

  // Helper to update active league
  const updateActiveLeague = (updater: (prevLeague: LeagueSeason) => LeagueSeason) => {
    setLeagues((prevLeagues) =>
      prevLeagues.map((l) => (l.id === activeLeagueId ? updater(l) : l))
    );
  };

  // League CRUD Handlers
  const handleCreateLeague = (
    name: string,
    sport: SportType,
    startDate: string,
    endDate: string,
    maxTeams: number,
    hasDivisions: boolean,
    autofill: boolean,
    matchRules: MatchRules
  ) => {
    const newLeague = autofill
      ? createSampleLeague(name, sport, startDate, endDate, maxTeams, hasDivisions, matchRules)
      : createBlankLeague(name, sport, startDate, endDate, maxTeams, hasDivisions, matchRules);

    setLeagues((prev) => [...prev, newLeague]);
    handleSelectLeague(newLeague.id, newLeague);
  };

  const handleUpdateLeague = (
    id: string,
    name: string,
    sport: SportType,
    startDate: string,
    endDate: string,
    maxTeams: number,
    matchRules: MatchRules
  ) => {
    setLeagues((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          return {
            ...l,
            name,
            sport,
            startDate,
            endDate,
            maxTeams,
            matchRules,
          };
        }
        return l;
      })
    );
  };

  const handleDeleteLeague = (id: string) => {
    if (leagues.length <= 1) return;
    const nextLeagues = leagues.filter((l) => l.id !== id);
    setLeagues(nextLeagues);
    if (activeLeagueId === id) {
      handleSelectLeague(nextLeagues[0].id);
    }
  };

  // Division CRUD Handlers
  const handleToggleHasDivisions = (enabled: boolean) => {
    updateActiveLeague((prev) => {
      if (!enabled) {
        // Switching to Single Division Mode
        const mainDivId = prev.divisions[0]?.id || `div-${Date.now()}-main`;
        const singleDiv: Division = prev.divisions[0]
          ? { ...prev.divisions[0], name: 'Main Division' }
          : {
              id: mainDivId,
              name: 'Main Division',
              genderCategory: 'Co-Ed',
              netHeight: "Co-Ed (2.43m)",
              setFormat: 'Best of 3 (25-25-15)',
              capRule: 'Win by 2 (Uncapped)',
              workTeamRequired: true,
              maxTeams: prev.maxTeams || 12,
            };

        // Reassign all teams to main division
        const updatedTeams = prev.teams.map((t) => ({ ...t, divisionId: mainDivId }));

        return {
          ...prev,
          hasDivisions: false,
          divisions: [singleDiv],
          teams: updatedTeams,
        };
      } else {
        return {
          ...prev,
          hasDivisions: true,
        };
      }
    });
  };

  const handleAddDivision = (
    name: string,
    genderCategory: Division['genderCategory'],
    netHeight: NetHeight,
    setFormat: SetFormat,
    maxTeams: number
  ) => {
    const newDivId = `div-${Date.now()}`;
    const newDivision: Division = {
      id: newDivId,
      name,
      genderCategory,
      netHeight,
      setFormat,
      capRule: 'Win by 2 (Uncapped)',
      workTeamRequired: true,
      maxTeams,
    };

    updateActiveLeague((prev) => ({
      ...prev,
      hasDivisions: true,
      divisions: [...prev.divisions, newDivision],
    }));
    setSelectedDivisionId(newDivId);
  };

  const handleUpdateDivision = (
    id: string,
    name: string,
    genderCategory: Division['genderCategory'],
    netHeight: NetHeight,
    setFormat: SetFormat,
    maxTeams: number
  ) => {
    updateActiveLeague((prev) => ({
      ...prev,
      divisions: prev.divisions.map((d) =>
        d.id === id ? { ...d, name, genderCategory, netHeight, setFormat, maxTeams } : d
      ),
    }));
  };

  const handleDeleteDivision = (id: string) => {
    updateActiveLeague((prev) => {
      if (prev.divisions.length <= 1) return prev;
      const remainingDivs = prev.divisions.filter((d) => d.id !== id);
      const fallbackDivId = remainingDivs[0].id;

      const updatedTeams = prev.teams.map((t) =>
        t.divisionId === id ? { ...t, divisionId: fallbackDivId } : t
      );

      return {
        ...prev,
        divisions: remainingDivs,
        teams: updatedTeams,
      };
    });
  };

  const handleAssignTeamDivision = (teamId: string, targetDivisionId: string) => {
    updateActiveLeague((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => (t.id === teamId ? { ...t, divisionId: targetDivisionId } : t)),
    }));
  };

  // Team CRUD Handlers
  const handleAddTeam = (
    name: string,
    divisionId: string,
    captainName: string,
    captainEmail: string,
    captainPhone: string,
    badgeColor: string
  ) => {
    const newTeamId = `team-${Date.now()}`;
    const newTeam: Team = {
      id: newTeamId,
      divisionId: divisionId || effectiveDivisionId,
      name,
      captainName,
      captainEmail,
      captainPhone,
      badgeColor,
      roster: [
        {
          id: `p-${Date.now()}-c`,
          name: captainName,
          position: 'Setter',
          gender: 'M',
          isCaptain: true,
          rsvpStatus: 'Going',
        },
      ],
    };

    updateActiveLeague((prev) => ({
      ...prev,
      teams: [...prev.teams, newTeam],
    }));
    setSelectedTeamId(newTeamId);
  };

  const handleUpdateTeam = (
    teamId: string,
    name: string,
    divisionId: string,
    captainName: string,
    captainEmail: string,
    captainPhone: string,
    badgeColor: string
  ) => {
    updateActiveLeague((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === teamId
          ? { ...t, name, divisionId, captainName, captainEmail, captainPhone, badgeColor }
          : t
      ),
    }));
  };

  const handleDeleteTeam = (teamId: string) => {
    updateActiveLeague((prev) => ({
      ...prev,
      teams: prev.teams.filter((t) => t.id !== teamId),
      matches: prev.matches.filter((m) => m.homeTeamId !== teamId && m.awayTeamId !== teamId),
    }));
  };

  const handleAddPlayer = (teamId: string, player: Omit<Player, 'id'>) => {
    const newPlayer: Player = {
      ...player,
      id: `p-${Date.now()}`,
    };

    updateActiveLeague((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === teamId ? { ...t, roster: [...t.roster, newPlayer] } : t
      ),
    }));
  };

  const handleUpdatePlayer = (teamId: string, playerId: string, playerUpdates: Partial<Player>) => {
    updateActiveLeague((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            roster: t.roster.map((p) => (p.id === playerId ? { ...p, ...playerUpdates } : p)),
          };
        }
        return t;
      }),
    }));
  };

  const handleDeletePlayer = (teamId: string, playerId: string) => {
    updateActiveLeague((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            roster: t.roster.filter((p) => p.id !== playerId),
          };
        }
        return t;
      }),
    }));
  };

  // Calculate live standings for selected division
  const standings: TeamStanding[] = activeDivision
    ? calculateStandings(league.teams, league.matches, activeDivision.id)
    : [];

  // Location Handlers
  const handleAddLocation = (name: string, address: string, parkingInfo?: string) => {
    const locId = `loc-${Date.now()}`;
    const newLoc: Location = {
      id: locId,
      name,
      address,
      parkingInfo,
      subLocations: [
        { id: `sub-${Date.now()}-c1`, locationId: locId, name: 'Court 1', surface: 'Hardwood' },
        { id: `sub-${Date.now()}-c2`, locationId: locId, name: 'Court 2', surface: 'Hardwood' },
      ],
    };

    updateActiveLeague((prev) => ({
      ...prev,
      locations: [...prev.locations, newLoc],
    }));
  };

  const handleUpdateLocation = (id: string, name: string, address: string, parkingInfo?: string) => {
    updateActiveLeague((prev) => ({
      ...prev,
      locations: prev.locations.map((loc) =>
        loc.id === id ? { ...loc, name, address, parkingInfo } : loc
      ),
    }));
  };

  const handleDeleteLocation = (id: string) => {
    updateActiveLeague((prev) => ({
      ...prev,
      locations: prev.locations.filter((loc) => loc.id !== id),
    }));
  };

  const handleAddSubLocation = (locationId: string, name: string, surface: SubLocation['surface']) => {
    updateActiveLeague((prev) => ({
      ...prev,
      locations: prev.locations.map((loc) => {
        if (loc.id === locationId) {
          const newSub: SubLocation = {
            id: `sub-${Date.now()}`,
            locationId,
            name,
            surface,
          };
          return { ...loc, subLocations: [...loc.subLocations, newSub] };
        }
        return loc;
      }),
    }));
  };

  const handleUpdateSubLocation = (
    locationId: string,
    subLocationId: string,
    name: string,
    surface: SubLocation['surface']
  ) => {
    updateActiveLeague((prev) => ({
      ...prev,
      locations: prev.locations.map((loc) => {
        if (loc.id === locationId) {
          return {
            ...loc,
            subLocations: loc.subLocations.map((sub) =>
              sub.id === subLocationId ? { ...sub, name, surface } : sub
            ),
          };
        }
        return loc;
      }),
    }));
  };

  const handleRemoveSubLocation = (locationId: string, subLocationId: string) => {
    updateActiveLeague((prev) => ({
      ...prev,
      locations: prev.locations.map((loc) =>
        loc.id === locationId
          ? { ...loc, subLocations: loc.subLocations.filter((s) => s.id !== subLocationId) }
          : loc
      ),
    }));
  };

  // Handle Score Save
  const handleSaveMatchScore = (matchId: string, scores: SetScore[], winnerId: string) => {
    updateActiveLeague((prev) => ({
      ...prev,
      matches: prev.matches.map((m) =>
        m.id === matchId ? { ...m, scores, winnerId, status: 'Completed' as const } : m
      ),
    }));
  };

  // Handle New Generated Schedule Apply
  const handleApplySchedule = (newMatches: Match[], divisionId: string) => {
    updateActiveLeague((prev) => ({
      ...prev,
      matches: [...prev.matches.filter((m) => m.divisionId !== divisionId), ...newMatches],
    }));
  };

  // Handle RSVP status update
  const handleUpdateRsvp = (teamId: string, playerId: string, status: 'Going' | 'Maybe' | 'Out') => {
    updateActiveLeague((prev) => ({
      ...prev,
      teams: prev.teams.map((team) => {
        if (team.id === teamId) {
          return {
            ...team,
            roster: team.roster.map((player) =>
              player.id === playerId ? { ...player, rsvpStatus: status } : player
            ),
          };
        }
        return team;
      }),
    }));
  };

  const activeHomeTeam = activeScoreMatch
    ? league.teams.find((t) => t.id === activeScoreMatch.homeTeamId)
    : undefined;
  const activeAwayTeam = activeScoreMatch
    ? league.teams.find((t) => t.id === activeScoreMatch.awayTeamId)
    : undefined;
  const activeWorkTeam = activeScoreMatch?.workTeamId
    ? league.teams.find((t) => t.id === activeScoreMatch.workTeamId)
    : undefined;

  const allSubLocations = league.locations.flatMap((l) => l.subLocations);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-rose-500 selection:text-white font-sans pb-16">
      
      {/* Dynamic Top Navbar with Multi-League Support */}
      <Navbar
        leagues={leagues}
        activeLeagueId={activeLeagueId}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        onSelectLeague={handleSelectLeague}
        onOpenLeagueManager={() => setIsLeagueManagerOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* Role-Based Upper Section */}
        {currentRole === 'public' ? (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center space-x-1">
                    <Globe className="h-3.5 w-3.5" />
                    <span>Public League Portal</span>
                  </span>
                  <span className="text-slate-400 text-xs font-semibold">• Official Standings & Schedule</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {league.name}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl text-xs font-mono text-slate-300">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Teams</span>
                  <strong className="text-white font-extrabold text-sm">{league.teams.length} Registered</strong>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl text-xs font-mono text-slate-300">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Matches</span>
                  <strong className="text-white font-extrabold text-sm">{league.matches.length} Scheduled</strong>
                </div>
              </div>
            </div>
          </div>
        ) : currentRole === 'scheduler' ? (
          <SchedulerDashboard
            league={league}
            divisions={league.divisions}
            teams={league.teams}
            matches={league.matches}
            locations={league.locations}
            onOpenGenerator={() => setIsGeneratorOpen(true)}
            onOpenLocationManager={() => setIsLocationManagerOpen(true)}
            onOpenDivisionManager={() => setIsDivisionManagerOpen(true)}
            onOpenTeamManager={() => setIsTeamManagerOpen(true)}
            selectedDivisionId={effectiveDivisionId}
            onSelectDivision={setSelectedDivisionId}
          />
        ) : (
          <TeamRepDashboard
            teams={league.teams}
            matches={league.matches}
            locations={league.locations}
            divisions={league.divisions}
            selectedTeamId={effectiveTeamId}
            onSelectTeam={setSelectedTeamId}
            onUpdateRsvp={handleUpdateRsvp}
            onOpenScorekeeper={(match) => {
              setActiveScoreMatch(match);
              setIsScorekeeperOpen(true);
            }}
          />
        )}

        {/* Division Selector Tabs for Standings & Schedule (Only if Multi-Division mode or >1 divisions) */}
        {league.hasDivisions !== false && league.divisions.length > 1 ? (
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
              Division View:
            </span>
            {league.divisions.map((div) => (
              <button
                key={div.id}
                onClick={() => setSelectedDivisionId(div.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  effectiveDivisionId === div.id
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {div.name}
              </button>
            ))}
          </div>
        ) : currentRole === 'scheduler' ? (
          <div className="flex items-center justify-end border-b border-slate-800 pb-3">
            <button
              onClick={() => setIsDivisionManagerOpen(true)}
              className="text-xs text-violet-400 hover:underline font-semibold"
            >
              + Edit Division Setup
            </button>
          </div>
        ) : null}

        {/* Dynamic Standings Table */}
        {activeDivision && <StandingsTable standings={standings} division={activeDivision} />}

        {/* Schedule & Fixtures Grid */}
        <ScheduleGrid
          matches={league.matches}
          teams={league.teams}
          locations={league.locations}
          divisions={league.divisions}
          selectedDivisionId={effectiveDivisionId}
          readOnly={currentRole === 'public'}
          onOpenScorekeeper={(match) => {
            setActiveScoreMatch(match);
            setIsScorekeeperOpen(true);
          }}
        />

      </main>

      {/* Court-side Mobile Scorekeeper Modal */}
      {activeScoreMatch && activeDivision && (
        <ScorekeeperModal
          match={activeScoreMatch}
          homeTeam={activeHomeTeam}
          awayTeam={activeAwayTeam}
          workTeam={activeWorkTeam}
          division={activeDivision}
          leagueRules={league.matchRules}
          isOpen={isScorekeeperOpen}
          onClose={() => {
            setIsScorekeeperOpen(false);
            setActiveScoreMatch(null);
          }}
          onSaveScore={handleSaveMatchScore}
        />
      )}

      {/* Auto Schedule & Ref Generator Modal */}
      <ScheduleGeneratorModal
        key={activeLeagueId}
        divisions={league.divisions}
        courts={allSubLocations}
        locations={league.locations}
        teams={league.teams}
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onApplySchedule={handleApplySchedule}
        defaultStartDate={league.startDate}
        defaultEndDate={league.endDate}
      />

      {/* Locations & Sub-locations Manager Modal */}
      <LocationManagerModal
        locations={league.locations}
        isOpen={isLocationManagerOpen}
        onClose={() => setIsLocationManagerOpen(false)}
        onAddLocation={handleAddLocation}
        onUpdateLocation={handleUpdateLocation}
        onDeleteLocation={handleDeleteLocation}
        onAddSubLocation={handleAddSubLocation}
        onUpdateSubLocation={handleUpdateSubLocation}
        onRemoveSubLocation={handleRemoveSubLocation}
      />

      {/* Multi-League Manager Modal */}
      <LeagueManagerModal
        leagues={leagues}
        activeLeagueId={activeLeagueId}
        isOpen={isLeagueManagerOpen}
        onClose={() => setIsLeagueManagerOpen(false)}
        onSelectLeague={handleSelectLeague}
        onCreateLeague={handleCreateLeague}
        onUpdateLeague={handleUpdateLeague}
        onDeleteLeague={handleDeleteLeague}
      />

      {/* Division Structure & Team Assignment Manager Modal */}
      <DivisionManagerModal
        divisions={league.divisions}
        teams={league.teams}
        hasDivisions={league.hasDivisions !== false}
        isOpen={isDivisionManagerOpen}
        onClose={() => setIsDivisionManagerOpen(false)}
        onToggleHasDivisions={handleToggleHasDivisions}
        onAddDivision={handleAddDivision}
        onUpdateDivision={handleUpdateDivision}
        onDeleteDivision={handleDeleteDivision}
        onAssignTeamDivision={handleAssignTeamDivision}
      />

      {/* Interactive Team & Roster Manager Modal */}
      <TeamManagerModal
        teams={league.teams}
        divisions={league.divisions}
        isOpen={isTeamManagerOpen}
        onClose={() => setIsTeamManagerOpen(false)}
        onAddTeam={handleAddTeam}
        onUpdateTeam={handleUpdateTeam}
        onDeleteTeam={handleDeleteTeam}
        onAddPlayer={handleAddPlayer}
        onUpdatePlayer={handleUpdatePlayer}
        onDeletePlayer={handleDeletePlayer}
      />

    </div>
  );
}
