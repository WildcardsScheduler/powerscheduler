'use client';

import React, { useState, useEffect } from 'react';
import { initialLeaguesList, calculateStandings } from '@/data/mockLeagueData';
import { LeagueSeason, Match, SetScore, TeamStanding, Location, SubLocation, SportType, Division, SetFormat, Team, Player, MatchRules } from '@/types/league';
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
import { LoginModal } from '@/components/LoginModal';
import { createBlankLeague, createSampleLeague } from '@/utils/leagueGenerator';
import { formatMatchRulesDescription } from '@/utils/formatRules';
import { Globe, Trophy, Users, Calendar, MapPin } from 'lucide-react';

export default function Home() {
  const [leagues, setLeagues] = useState<LeagueSeason[]>(initialLeaguesList);
  const [activeLeagueId, setActiveLeagueId] = useState<string>(initialLeaguesList[0].id);
  const [currentRole, setCurrentRole] = useState<UserRole>('public');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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
  const isDefaultInitialData = (data: LeagueSeason[]) => {
    if (!data || data.length === 0) return true;
    if (data.length !== initialLeaguesList.length) return false;
    return data.every((l, idx) => {
      const init = initialLeaguesList[idx];
      return (
        init &&
        l.id === init.id &&
        l.name === init.name &&
        l.teams.length === init.teams.length &&
        l.matches.length === init.matches.length
      );
    });
  };

  // Load state from online cloud API on mount (re-hydrate from localStorage or backup if server reset after deployment)
  useEffect(() => {
    let isMounted = true;

    const fetchCloudData = async () => {
      let savedLeagues: LeagueSeason[] | null = null;
      let savedActiveId: string | null = null;

      try {
        const rawSaved = localStorage.getItem('powerschedule_leagues');
        const backupSaved = localStorage.getItem('powerschedule_leagues_backup');
        savedActiveId = localStorage.getItem('powerschedule_active_league_id');

        let primary = rawSaved ? JSON.parse(rawSaved) : null;
        let backup = backupSaved ? JSON.parse(backupSaved) : null;

        // If primary is default template, but backup contains custom user data, restore backup!
        if ((!primary || isDefaultInitialData(primary)) && backup && !isDefaultInitialData(backup)) {
          savedLeagues = backup;
        } else {
          savedLeagues = primary || backup;
        }
      } catch (err) {
        console.warn('Failed to read local storage backup', err);
      }

      try {
        const res = await fetch('/api/leagues', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.leagues && Array.isArray(data.leagues) && data.leagues.length > 0) {
            const serverIsDefault = isDefaultInitialData(data.leagues);
            const clientHasCustom = savedLeagues && savedLeagues.length > 0 && !isDefaultInitialData(savedLeagues);

            // If server reset to default on deployment, but client/backup has custom data, re-hydrate server!
            if (serverIsDefault && clientHasCustom && savedLeagues) {
              const repaired = repairLeaguesData(savedLeagues);
              if (isMounted) {
                setLeagues(repaired);
                if (savedActiveId && repaired.some((l) => l.id === savedActiveId)) {
                  setActiveLeagueId(savedActiveId);
                } else {
                  setActiveLeagueId(repaired[0].id);
                }
                setIsCloudSynced(true);
              }
              // Immediately sync client's custom data back to server
              fetch('/api/leagues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leagues: repaired, activeId: savedActiveId || repaired[0].id }),
              }).catch(() => {});
              return;
            }

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
      if (savedLeagues && savedLeagues.length > 0 && isMounted) {
        const repaired = repairLeaguesData(savedLeagues);
        setLeagues(repaired);
        if (savedActiveId && repaired.some((l: LeagueSeason) => l.id === savedActiveId)) {
          setActiveLeagueId(savedActiveId);
        } else {
          setActiveLeagueId(repaired[0].id);
        }
      }
    };

    fetchCloudData().finally(() => {
      if (isMounted) setIsLoaded(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Hydrate auth role and check direct Captain URL query parameters once when loaded
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedRole = localStorage.getItem('powerschedule_auth_role') as UserRole;
      const savedTeamId = localStorage.getItem('powerschedule_auth_team_id');
      
      if (savedRole === 'scheduler' || savedRole === 'team_rep' || savedRole === 'public') {
        setCurrentRole(savedRole);
      }
      if (savedTeamId) {
        setSelectedTeamId(savedTeamId);
      }

      // Check URL parameters for direct Captain PIN share links
      const params = new URLSearchParams(window.location.search);
      const teamParam = params.get('team');
      const pinParam = params.get('pin');
      
      if (teamParam && pinParam && leagues.length > 0) {
        const targetLeague = leagues.find((l) => l.id === activeLeagueId) || leagues[0];
        const matchedTeam = targetLeague?.teams.find((t) => t.id === teamParam);
        if (matchedTeam && (matchedTeam.accessPin || '1234') === pinParam) {
          setSelectedTeamId(matchedTeam.id);
          setCurrentRole('team_rep');
          localStorage.setItem('powerschedule_auth_role', 'team_rep');
          localStorage.setItem('powerschedule_auth_team_id', matchedTeam.id);
        }
      }
    } catch (err) {
      console.warn('Failed to read auth params', err);
    }
  }, [isLoaded]);

  const handleLoginSuccess = (role: 'scheduler' | 'team_rep', teamId?: string) => {
    setCurrentRole(role);
    localStorage.setItem('powerschedule_auth_role', role);
    if (teamId) {
      setSelectedTeamId(teamId);
      localStorage.setItem('powerschedule_auth_team_id', teamId);
    }
  };

  const handleLogout = () => {
    setCurrentRole('public');
    localStorage.removeItem('powerschedule_auth_role');
    localStorage.removeItem('powerschedule_auth_team_id');
  };

  // Periodic polling interval to keep all devices (phone, desktop, public viewers) in sync
  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/leagues', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.leagues && Array.isArray(data.leagues) && data.leagues.length > 0) {
            const serverIsDefault = isDefaultInitialData(data.leagues);

            setLeagues((currentLeagues) => {
              const currentIsCustom = currentLeagues.length > 0 && !isDefaultInitialData(currentLeagues);
              // If server is showing default initial template, but client has custom data, re-hydrate server!
              if (serverIsDefault && currentIsCustom) {
                fetch('/api/leagues', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ leagues: currentLeagues, activeId: activeLeagueId }),
                }).catch(() => {});
                return currentLeagues;
              }
              const repaired = repairLeaguesData(data.leagues);
              return repaired;
            });
            setIsCloudSynced(true);
          }
        }
      } catch {
        // silent fail on network pulse
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [isLoaded, activeLeagueId]);

  // Persist state to online cloud API and local storage whenever leagues or active league changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('powerschedule_leagues', JSON.stringify(leagues));
      localStorage.setItem('powerschedule_active_league_id', activeLeagueId);

      // Save to permanent backup key whenever custom data exists
      if (!isDefaultInitialData(leagues)) {
        localStorage.setItem('powerschedule_leagues_backup', JSON.stringify(leagues));
      }

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

  const savedAuthTeamId = typeof window !== 'undefined' ? localStorage.getItem('powerschedule_auth_team_id') : null;
  const activeTeam =
    currentRole === 'team_rep' && savedAuthTeamId
      ? league.teams.find((t) => t.id === savedAuthTeamId) || league.teams.find((t) => t.id === selectedTeamId) || league.teams[0]
      : league.teams.find((t) => t.id === selectedTeamId) || league.teams[0];
  const effectiveTeamId = activeTeam?.id || '';

  const handleSelectTeam = (teamId: string) => {
    if (currentRole === 'team_rep') {
      if (savedAuthTeamId && teamId !== savedAuthTeamId) {
        return; // Prevent team captain from changing active team
      }
    }
    setSelectedTeamId(teamId);
  };

  const handleSelectLeague = (id: string, targetLeagueOverride?: LeagueSeason) => {
    setActiveLeagueId(id);
    const targetLeague = targetLeagueOverride || leagues.find((l) => l.id === id);
    if (targetLeague) {
      if (targetLeague.divisions.length > 0) {
        setSelectedDivisionId(targetLeague.divisions[0].id);
      } else {
        setSelectedDivisionId('');
      }
      if (currentRole === 'team_rep' && savedAuthTeamId && targetLeague.teams.some((t) => t.id === savedAuthTeamId)) {
        setSelectedTeamId(savedAuthTeamId);
      } else if (targetLeague.teams.length > 0) {
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
    matchRules: MatchRules,
    adminPasscode?: string
  ) => {
    const existingPasscode = leagues.find((l) => l.adminPasscode)?.adminPasscode;
    const universalPasscode = adminPasscode || existingPasscode || 'admin123';

    const newLeague = autofill
      ? createSampleLeague(name, sport, startDate, endDate, maxTeams, hasDivisions, matchRules)
      : createBlankLeague(name, sport, startDate, endDate, maxTeams, hasDivisions, matchRules);

    newLeague.adminPasscode = universalPasscode;

    // Ensure all leagues keep the universal passcode synchronized
    setLeagues((prev) => [
      ...prev.map((l) => ({ ...l, adminPasscode: universalPasscode })),
      { ...newLeague, adminPasscode: universalPasscode },
    ]);
    handleSelectLeague(newLeague.id, newLeague);
  };

  const handleUpdateLeague = (
    id: string,
    name: string,
    sport: SportType,
    startDate: string,
    endDate: string,
    maxTeams: number,
    matchRules: MatchRules,
    adminPasscode?: string
  ) => {
    const formattedDesc = formatMatchRulesDescription(matchRules);
    const updatedPasscode = adminPasscode?.trim() || leagues.find((l) => l.adminPasscode)?.adminPasscode || 'admin123';

    // Universal update across all leagues in the platform
    setLeagues((prev) =>
      prev.map((l) => {
        const isTarget = l.id === id;
        return {
          ...l,
          adminPasscode: updatedPasscode, // Universal Passcode
          name: isTarget ? name : l.name,
          sport: isTarget ? sport : l.sport,
          startDate: isTarget ? startDate : l.startDate,
          endDate: isTarget ? endDate : l.endDate,
          maxTeams: isTarget ? maxTeams : l.maxTeams,
          matchRules: isTarget ? matchRules : l.matchRules,
          divisions: isTarget
            ? l.divisions.map((d) => ({
                ...d,
                setFormat: formattedDesc as any,
                matchRules: matchRules,
              }))
            : l.divisions,
        };
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

  // Universal Admin Passcode — applies to all leagues
  const handleUpdateUniversalPasscode = (passcode: string) => {
    setLeagues((prev) =>
      prev.map((l) => ({ ...l, adminPasscode: passcode }))
    );
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
    setFormat: SetFormat,
    maxTeams: number
  ) => {
    const newDivId = `div-${Date.now()}`;
    const newDivision: Division = {
      id: newDivId,
      name,
      genderCategory,
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
    setFormat: SetFormat,
    maxTeams: number
  ) => {
    updateActiveLeague((prev) => ({
      ...prev,
      divisions: prev.divisions.map((d) =>
        d.id === id ? { ...d, name, genderCategory, setFormat, maxTeams } : d
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

  const handleQuickGenerateTeams = (count: number, divisionId?: string) => {
    const targetDivId = divisionId || effectiveDivisionId || league.divisions[0]?.id || '';
    const currentDivTeams = league.teams.filter((t) => t.divisionId === targetDivId);
    const startIndex = currentDivTeams.length + 1;

    const colors = [
      '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#ef4444', '#14b8a6', '#6366f1', '#f97316'
    ];

    const newTeams: Team[] = [];
    for (let i = 0; i < count; i++) {
      const num = startIndex + i;
      newTeams.push({
        id: `team-${Date.now()}-${i}`,
        divisionId: targetDivId,
        name: `Team ${num}`,
        captainName: `Captain ${num}`,
        captainEmail: `captain${num}@example.com`,
        captainPhone: `(555) 000-00${num < 10 ? '0' + num : num}`,
        badgeColor: colors[i % colors.length],
        roster: [],
      });
    }

    updateActiveLeague((prev) => ({
      ...prev,
      teams: [...prev.teams, ...newTeams],
    }));
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
    ? calculateStandings(league.teams, league.matches, activeDivision.id, activeDivision.matchRules || league.matchRules)
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
        activeTeamName={activeTeam?.name}
        onRoleChange={setCurrentRole}
        onSelectLeague={handleSelectLeague}
        onOpenLeagueManager={() => setIsLeagueManagerOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
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
            onOpenLeagueManager={() => setIsLeagueManagerOpen(true)}
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
            onSelectTeam={handleSelectTeam}
            onUpdateRsvp={handleUpdateRsvp}
            onOpenScorekeeper={(match) => {
              setActiveScoreMatch(match);
              setIsScorekeeperOpen(true);
            }}
            currentRole={currentRole}
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
        {activeDivision && (
          <StandingsTable
            standings={standings}
            division={activeDivision}
            matchRules={league.matchRules}
          />
        )}

        {/* Schedule & Fixtures Grid */}
        <ScheduleGrid
          matches={league.matches}
          teams={league.teams}
          locations={league.locations}
          divisions={league.divisions}
          selectedDivisionId={effectiveDivisionId}
          readOnly={currentRole === 'public'}
          currentRole={currentRole}
          userTeamId={effectiveTeamId}
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
          currentRole={currentRole}
          userTeamId={effectiveTeamId}
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
        onUpdateUniversalPasscode={handleUpdateUniversalPasscode}
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
        onQuickGenerateTeams={handleQuickGenerateTeams}
        onUpdateTeam={handleUpdateTeam}
        onDeleteTeam={handleDeleteTeam}
        onAddPlayer={handleAddPlayer}
        onUpdatePlayer={handleUpdatePlayer}
        onDeletePlayer={handleDeletePlayer}
      />

      {/* Login & Access Portal Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        leagues={leagues}
        activeLeagueId={activeLeagueId}
        onSelectLeague={handleSelectLeague}
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
}
