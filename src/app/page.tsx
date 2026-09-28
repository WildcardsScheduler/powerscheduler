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
import { LeagueRulesModal } from '@/components/LeagueRulesModal';
import { PWAInstallModal } from '@/components/PWAInstallModal';
import { PWAInstallBar } from '@/components/PWAInstallBar';
import { LeagueSelectorBar } from '@/components/LeagueSelectorBar';
import { MatchEditorModal } from '@/components/MatchEditorModal';
import { FairnessReportModal } from '@/components/FairnessReportModal';
import { createBlankLeague, createSampleLeague } from '@/utils/leagueGenerator';
import { formatMatchRulesDescription } from '@/utils/formatRules';
import { Globe, Trophy, Users, Calendar, MapPin, BookOpen, Download } from 'lucide-react';

export default function Home() {
  const [leagues, setLeagues] = useState<LeagueSeason[]>(initialLeaguesList);
  const [activeLeagueId, setActiveLeagueId] = useState<string>(initialLeaguesList[0].id);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [serverVersion, setServerVersion] = useState<number>(1);

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
        const defaultSavedId = localStorage.getItem('powerschedule_default_league_id');
        savedActiveId = defaultSavedId || localStorage.getItem('powerschedule_active_league_id');

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
              if (typeof data.version === 'number') {
                setServerVersion(data.version);
              }
              const defaultSavedId = localStorage.getItem('powerschedule_default_league_id');
              if (defaultSavedId && repaired.some((l: LeagueSeason) => l.id === defaultSavedId)) {
                setActiveLeagueId(defaultSavedId);
              } else if (data.activeId && repaired.some((l: LeagueSeason) => l.id === data.activeId)) {
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
        const defaultSavedId = localStorage.getItem('powerschedule_default_league_id');
        if (defaultSavedId && repaired.some((l: LeagueSeason) => l.id === defaultSavedId)) {
          setActiveLeagueId(defaultSavedId);
        } else if (savedActiveId && repaired.some((l: LeagueSeason) => l.id === savedActiveId)) {
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

  const [authRole, setAuthRole] = useState<UserRole>('public');
  const [authLeagueId, setAuthLeagueId] = useState<string | null>(null);
  const [authTeamId, setAuthTeamId] = useState<string | null>(null);

  // Hydrate auth role from secure server session
  useEffect(() => {
    let isMounted = true;
    const checkServerSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const session = await res.json();
          if (isMounted) {
            if (session.authenticated && (session.role === 'scheduler' || session.role === 'team_rep')) {
              setAuthRole(session.role);
              if (session.role === 'team_rep' && session.teamId && session.leagueId) {
                setAuthLeagueId(session.leagueId);
                setAuthTeamId(session.teamId);
                setActiveLeagueId(session.leagueId);
                setSelectedTeamId(session.teamId);
              }
            } else {
              setAuthRole('public');
              setAuthLeagueId(null);
              setAuthTeamId(null);
            }
          }
        }
      } catch (err) {
        console.warn('Session verification error:', err);
      }
    };

    checkServerSession();
    return () => {
      isMounted = false;
    };
  }, [isLoaded]);

  const handleLoginSuccess = (role: 'scheduler' | 'team_rep', teamId?: string, leagueId?: string) => {
    setAuthRole(role);
    if (role === 'team_rep' && teamId && leagueId) {
      setAuthLeagueId(leagueId);
      setAuthTeamId(teamId);
      setActiveLeagueId(leagueId);
      setSelectedTeamId(teamId);
    } else if (role === 'scheduler') {
      setAuthLeagueId(null);
      setAuthTeamId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setAuthRole('public');
    setAuthLeagueId(null);
    setAuthTeamId(null);
    localStorage.removeItem('powerschedule_auth_role');
    localStorage.removeItem('powerschedule_auth_league_id');
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
              if (JSON.stringify(repaired) === JSON.stringify(currentLeagues)) {
                return currentLeagues;
              }
              return repaired;
            });
            if (typeof data.version === 'number') {
              setServerVersion(data.version);
            }
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

      // Restrict full league tree write to authenticated administrators
      if (authRole === 'scheduler') {
        fetch('/api/leagues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leagues, activeId: activeLeagueId, version: serverVersion }),
        })
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              if (typeof data?.version === 'number') setServerVersion(data.version);
              setIsCloudSynced(true);
            } else if (res.status === 409) {
              console.warn('Schedule was concurrently updated; re-fetching latest state.');
              const fresh = await fetch('/api/leagues', { cache: 'no-store' });
              if (fresh.ok) {
                const freshData = await fresh.json();
                if (freshData?.leagues) setLeagues(repairLeaguesData(freshData.leagues));
                if (typeof freshData?.version === 'number') setServerVersion(freshData.version);
              }
            }
          })
          .catch((err) => {
            console.warn('Cloud sync post warning:', err);
          });
      }
    } catch (err) {
      console.error('Failed to save state', err);
    }
  }, [leagues, activeLeagueId, isLoaded, authRole, serverVersion]);

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
  const [isMatchEditorOpen, setIsMatchEditorOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isFairnessReportOpen, setIsFairnessReportOpen] = useState(false);

  // Derive effective role strictly for the current active league view
  const currentRole: UserRole =
    authRole === 'scheduler'
      ? 'scheduler'
      : authRole === 'team_rep' && authLeagueId === activeLeagueId
      ? 'team_rep'
      : 'public';

  // Info about the globally authenticated session (for banners & navbar)
  const authLeague = authLeagueId ? leagues.find((l) => l.id === authLeagueId) : undefined;
  const authTeam = authLeague && authTeamId ? authLeague.teams.find((t) => t.id === authTeamId) : undefined;

  // Derive effective active division and team for current active league
  const activeDivision =
    league.divisions.find((d) => d.id === selectedDivisionId) || league.divisions[0];
  const effectiveDivisionId = activeDivision?.id || '';

  const activeTeam =
    currentRole === 'team_rep' && authTeamId
      ? league.teams.find((t) => t.id === authTeamId) || league.teams[0]
      : league.teams.find((t) => t.id === selectedTeamId) || league.teams[0];
  const effectiveTeamId = currentRole === 'team_rep' ? (activeTeam?.id || '') : '';

  const handleSelectTeam = (teamId: string) => {
    if (currentRole === 'team_rep') {
      if (authTeamId && teamId !== authTeamId) {
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
      if (authRole === 'team_rep' && authLeagueId === id && authTeamId && targetLeague.teams.some((t) => t.id === authTeamId)) {
        setSelectedTeamId(authTeamId);
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
    adminPasscode?: string,
    publicFairnessReport?: boolean
  ) => {
    const localStored = typeof window !== 'undefined' ? localStorage.getItem('powerschedule_admin_passcode') : null;
    const existingPasscode = leagues.find((l) => l.adminPasscode)?.adminPasscode;
    const universalPasscode = adminPasscode || localStored || existingPasscode || 'admin123';

    const newLeague = autofill
      ? createSampleLeague(name, sport, startDate, endDate, maxTeams, hasDivisions, matchRules)
      : createBlankLeague(name, sport, startDate, endDate, maxTeams, hasDivisions, matchRules);

    newLeague.adminPasscode = universalPasscode;
    newLeague.publicFairnessReport = publicFairnessReport !== undefined ? publicFairnessReport : true;

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
    adminPasscode?: string,
    publicFairnessReport?: boolean
  ) => {
    const formattedDesc = formatMatchRulesDescription(matchRules);
    const localStored = typeof window !== 'undefined' ? localStorage.getItem('powerschedule_admin_passcode') : null;
    const updatedPasscode = adminPasscode?.trim() || localStored || leagues.find((l) => l.adminPasscode)?.adminPasscode || 'admin123';

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
          publicFairnessReport: isTarget
            ? (publicFairnessReport !== undefined ? publicFairnessReport : (l.publicFairnessReport !== false))
            : l.publicFairnessReport,
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

  // Universal Admin Passcode — applies to all leagues and syncs everywhere immediately
  const handleUpdateUniversalPasscode = (passcode: string) => {
    const cleanPasscode = passcode.trim() || 'admin123';
    try {
      localStorage.setItem('powerschedule_admin_passcode', cleanPasscode);
    } catch (e) {
      console.warn('Failed to save admin passcode to localStorage', e);
    }
    setLeagues((prev) => {
      const updated = prev.map((l) => ({ ...l, adminPasscode: cleanPasscode }));
      // Immediately post to cloud store
      fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagues: updated, activeId: activeLeagueId }),
      }).then(() => setIsCloudSynced(true)).catch((err) => {
        console.warn('Cloud sync post error on passcode update:', err);
      });
      return updated;
    });
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
    badgeColor: string,
    accessPin?: string
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
      accessPin: accessPin?.trim() || '1234',
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
      '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#eab308',
      '#84cc16', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6',
      '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#f43f5e', '#64748b'
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
        accessPin: '1234',
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
    badgeColor: string,
    accessPin?: string
  ) => {
    updateActiveLeague((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === teamId
          ? {
              ...t,
              name,
              divisionId,
              captainName,
              captainEmail,
              captainPhone,
              badgeColor,
              accessPin: accessPin !== undefined ? (accessPin.trim() || '1234') : (t.accessPin || '1234'),
            }
          : t
      ),
    }));
  };

  const handleUpdateTeamPin = (teamId: string, newPin: string) => {
    const cleanPin = newPin.trim() || '1234';
    updateActiveLeague((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === teamId ? { ...t, accessPin: cleanPin } : t
      ),
    }));
    fetch(`/api/teams/${encodeURIComponent(teamId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessPin: cleanPin, version: serverVersion }),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (typeof data.version === 'number') setServerVersion(data.version);
        }
      })
      .catch((err) => console.warn('Failed to sync team PIN to server:', err));
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
  // Handle Score Save via Scoped API
  const handleSaveMatchScore = async (matchId: string, scores: SetScore[], winnerId: string) => {
    // Optimistic UI update
    updateActiveLeague((prev) => ({
      ...prev,
      matches: prev.matches.map((m) =>
        m.id === matchId ? { ...m, scores, winnerId, status: 'Completed' as const } : m
      ),
    }));

    try {
      const res = await fetch(`/api/matches/${encodeURIComponent(matchId)}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores, winnerId, version: serverVersion }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.version === 'number') setServerVersion(data.version);
      } else if (res.status === 409) {
        console.warn('Match score conflict: re-fetching latest schedule.');
        const fresh = await fetch('/api/leagues', { cache: 'no-store' });
        if (fresh.ok) {
          const freshData = await fresh.json();
          if (freshData?.leagues) setLeagues(repairLeaguesData(freshData.leagues));
          if (typeof freshData?.version === 'number') setServerVersion(freshData.version);
        }
      } else {
        const err = await res.json();
        console.warn('Failed to persist match score:', err.error);
      }
    } catch (e) {
      console.warn('Network error saving match score:', e);
    }
  };

  // Manual Match Edit & Reschedule Handlers via Scoped API
  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setIsMatchEditorOpen(true);
  };

  const handleAddMatch = () => {
    setEditingMatch(null);
    setIsMatchEditorOpen(true);
  };

  const handleSaveMatch = async (savedMatch: Match) => {
    const exists = league.matches.some((m) => m.id === savedMatch.id);

    // Optimistic UI update
    updateActiveLeague((prev) => {
      let updatedMatches: Match[];
      if (exists) {
        updatedMatches = prev.matches.map((m) => (m.id === savedMatch.id ? savedMatch : m));
      } else {
        updatedMatches = [...prev.matches, savedMatch];
      }
      return {
        ...prev,
        matches: updatedMatches,
      };
    });
    setIsMatchEditorOpen(false);
    setEditingMatch(null);

    try {
      let res: Response;
      if (exists) {
        res = await fetch(`/api/matches/${encodeURIComponent(savedMatch.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...savedMatch, version: serverVersion }),
        });
      } else {
        res = await fetch('/api/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leagueId: activeLeagueId, match: savedMatch, version: serverVersion }),
        });
      }
      if (res.ok) {
        const data = await res.json();
        if (typeof data.version === 'number') setServerVersion(data.version);
      } else if (res.status === 409) {
        console.warn('Schedule conflict on match save: re-fetching latest schedule.');
        const fresh = await fetch('/api/leagues', { cache: 'no-store' });
        if (fresh.ok) {
          const freshData = await fresh.json();
          if (freshData?.leagues) setLeagues(repairLeaguesData(freshData.leagues));
          if (typeof freshData?.version === 'number') setServerVersion(freshData.version);
        }
      }
    } catch (e) {
      console.warn('Failed to persist match edit:', e);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    // Optimistic UI update
    updateActiveLeague((prev) => ({
      ...prev,
      matches: prev.matches.filter((m) => m.id !== matchId),
    }));
    setIsMatchEditorOpen(false);
    setEditingMatch(null);

    try {
      const res = await fetch(`/api/matches/${encodeURIComponent(matchId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.version === 'number') setServerVersion(data.version);
      }
    } catch (e) {
      console.warn('Failed to delete match on server:', e);
    }
  };

  // Handle New Generated Schedule Apply
  const handleApplySchedule = (newMatches: Match[], divisionId: string) => {
    updateActiveLeague((prev) => ({
      ...prev,
      matches: [...prev.matches.filter((m) => m.divisionId !== divisionId), ...newMatches],
    }));
  };

  // Handle RSVP status update with server sync to /api/teams/[id]
  const handleUpdateRsvp = (teamId: string, playerId: string, status: 'Going' | 'Maybe' | 'Out') => {
    updateActiveLeague((prev) => {
      const targetTeam = prev.teams.find((t) => t.id === teamId);
      if (targetTeam) {
        const updatedRoster = targetTeam.roster.map((player) =>
          player.id === playerId ? { ...player, rsvpStatus: status } : player
        );
        fetch(`/api/teams/${encodeURIComponent(teamId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roster: updatedRoster, version: serverVersion }),
        })
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              if (typeof data.version === 'number') setServerVersion(data.version);
            }
          })
          .catch((err) => console.warn('Failed to sync RSVP to server:', err));

        return {
          ...prev,
          teams: prev.teams.map((t) => (t.id === teamId ? { ...t, roster: updatedRoster } : t)),
        };
      }
      return prev;
    });
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 animate-pulse flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 tracking-tight">PowerSchedule</h2>
        <p className="text-xs text-slate-500 mt-1 animate-pulse">Loading league data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-rose-500 selection:text-white font-sans pb-16 transition-colors duration-150">
      
      {/* Dynamic Top Navbar with Multi-League Support */}
      <Navbar
        leagues={leagues}
        activeLeagueId={activeLeagueId}
        currentRole={currentRole}
        authRole={authRole}
        authLeagueId={authLeagueId}
        authLeagueName={authLeague?.name}
        activeTeamName={activeTeam?.name}
        authTeamName={authTeam?.name}
        onRoleChange={setAuthRole}
        onSelectLeague={handleSelectLeague}
        onOpenLeagueManager={() => setIsLeagueManagerOpen(true)}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Dedicated League Selector Row with Set Default Option */}
      <LeagueSelectorBar
        leagues={leagues}
        activeLeagueId={activeLeagueId}
        currentRole={currentRole}
        onSelectLeague={handleSelectLeague}
        onOpenLeagueManager={() => setIsLeagueManagerOpen(true)}
      />

      {/* Dedicated PWA Install Banner Bar (Mobile & Desktop) */}
      <PWAInstallBar onOpenInstallModal={() => setIsInstallModalOpen(true)} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6 sm:space-y-8">
        
        {/* Role-Based Upper Section */}
        {currentRole === 'scheduler' ? (
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
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
            onOpenFairnessReport={() => setIsFairnessReportOpen(true)}
            selectedDivisionId={effectiveDivisionId}
            onSelectDivision={setSelectedDivisionId}
          />
        ) : currentRole === 'team_rep' ? (
          <TeamRepDashboard
            teams={league.teams}
            matches={league.matches}
            locations={league.locations}
            divisions={league.divisions}
            selectedTeamId={effectiveTeamId}
            leagueRulesContent={league.rulesContent}
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
            onOpenFairnessReport={() => setIsFairnessReportOpen(true)}
            showFairnessReport={league.publicFairnessReport !== false}
            onSelectTeam={handleSelectTeam}
            onUpdateRsvp={handleUpdateRsvp}
            onOpenScorekeeper={(match) => {
              setActiveScoreMatch(match);
              setIsScorekeeperOpen(true);
            }}
            onUpdateTeamPin={handleUpdateTeamPin}
            currentRole={currentRole}
          />
        ) : null}

        {/* Division Selector Tabs for Standings & Schedule (Only if Multi-Division mode or >1 divisions) */}
        {league.hasDivisions !== false && league.divisions.length > 1 ? (
          <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto scrollbar-none">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-2 shrink-0">
              Division View:
            </span>
            {league.divisions.map((div) => (
              <button
                key={div.id}
                onClick={() => setSelectedDivisionId(div.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  effectiveDivisionId === div.id
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-white hover:bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xs'
                }`}
              >
                {div.name}
              </button>
            ))}
          </div>
        ) : currentRole === 'scheduler' ? (
          <div className="flex items-center justify-end border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              onClick={() => setIsDivisionManagerOpen(true)}
              className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-semibold"
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
            leagueName={league.name}
            hasMultipleDivisions={league.divisions.length > 1}
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
          onEditMatch={handleEditMatch}
          onAddMatch={handleAddMatch}
          onOpenFairnessReport={() => setIsFairnessReportOpen(true)}
          showFairnessReport={currentRole === 'scheduler' || league.publicFairnessReport !== false}
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
        authRole={authRole}
        authTeamName={authTeam?.name}
        authLeagueName={authLeague?.name}
        onSelectLeague={handleSelectLeague}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Official League Rules & Guidelines Modal */}
      <LeagueRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        league={league}
        isAdmin={currentRole === 'scheduler'}
        onSaveRules={(rulesText) => {
          updateActiveLeague((prev) => ({
            ...prev,
            rulesContent: rulesText,
          }));
        }}
      />

      {/* PWA Install App Modal (iPhone & Android) */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Manual Match Editor & In-Season Rescheduling Modal */}
      <MatchEditorModal
        isOpen={isMatchEditorOpen}
        match={editingMatch}
        teams={league.teams}
        divisions={league.divisions}
        locations={league.locations}
        allMatches={league.matches}
        selectedDivisionId={effectiveDivisionId}
        onClose={() => {
          setIsMatchEditorOpen(false);
          setEditingMatch(null);
        }}
        onSaveMatch={handleSaveMatch}
        onDeleteMatch={handleDeleteMatch}
      />

      {/* Schedule Equity & Fairness Audit Report Modal */}
      <FairnessReportModal
        isOpen={isFairnessReportOpen}
        divisions={league.divisions}
        teams={league.teams}
        matches={league.matches}
        locations={league.locations}
        selectedDivisionId={effectiveDivisionId}
        isCaptainOrPublic={currentRole !== 'scheduler'}
        publicFairnessReport={league.publicFairnessReport !== false}
        onTogglePublicFairnessReport={(enabled) => {
          updateActiveLeague((prev) => ({
            ...prev,
            publicFairnessReport: enabled,
          }));
        }}
        onClose={() => setIsFairnessReportOpen(false)}
      />

    </div>
  );
}
