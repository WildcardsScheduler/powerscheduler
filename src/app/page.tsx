'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { initialLeaguesList, calculateStandings } from '@/data/mockLeagueData';
import { LeagueSeason, Match, SetScore, TeamStanding, Location, SubLocation, SportType, Division, SetFormat, Team, Player, MatchRules } from '@/types/league';
import { Navbar, UserRole } from '@/components/Navbar';
import { SchedulerDashboard } from '@/components/SchedulerDashboard';
import { TeamRepDashboard } from '@/components/TeamRepDashboard';
import { StandingsTable } from '@/components/StandingsTable';
import { ScheduleGrid } from '@/components/ScheduleGrid';
import { ScorekeeperModal } from '@/components/ScorekeeperModal';
import { ScheduleGeneratorModal } from '@/components/ScheduleGeneratorModal';
import type { SchedulerPriority } from '@/utils/schedulePriorities';
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
import { BackupModal } from '@/components/BackupModal';
import { createBlankLeague, createSampleLeague } from '@/utils/leagueGenerator';
import { formatMatchRulesDescription } from '@/utils/formatRules';
import { generateRandomPin } from '@/utils/pinGenerator';
import { isGameDay } from '@/utils/gameDay';
import { Trophy } from 'lucide-react';

export default function Home() {
  const [leagues, setLeagues] = useState<LeagueSeason[]>(initialLeaguesList);
  const [activeLeagueId, setActiveLeagueId] = useState<string>(initialLeaguesList[0].id);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(initialLeaguesList[0].divisions[0]?.id || '');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(initialLeaguesList[0].teams[0]?.id || '');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalTab, setLoginModalTab] = useState<'team' | 'admin'>('team');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);


  // --- Cloud sync bookkeeping (refs so async callbacks always see current values) ---
  // Store version of the data we last received from / saved to the server.
  const versionRef = useRef<number>(0);
  // JSON of the leagues tree + activeId as the server last knew them. Local state that
  // differs from this has unsaved admin edits ("dirty").
  const lastSyncedLeaguesRef = useRef<string>('');
  const lastSyncedActiveIdRef = useRef<string>('');
  const syncInFlightRef = useRef(false);
  const syncQueuedRef = useRef(false);
  const syncFailureAlertedRef = useRef(false);
  // Count of in-flight targeted writes (scores, RSVPs, PINs) from captains.
  const pendingWritesRef = useRef(0);

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

  // Listen for direct URL query params (e.g. ?login=admin, ?login=team, or ?admin=true)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loginParam = params.get('login');
    const tab =
      loginParam === 'admin' || params.get('admin') === 'true'
        ? 'admin'
        : loginParam === 'team' || loginParam === 'true'
        ? 'team'
        : null;
    if (tab) {
      // Browser-only (URL) read after hydration; reading it during render would mismatch the server HTML
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoginModalTab(tab);
      setIsLoginModalOpen(true);
    }
  }, []);

  const [authRole, setAuthRole] = useState<UserRole>('public');
  const [authLeagueId, setAuthLeagueId] = useState<string | null>(null);
  const [authTeamId, setAuthTeamId] = useState<string | null>(null);

  // Latest values for async callbacks and the polling interval
  const leaguesRef = useRef(leagues);
  const activeLeagueIdRef = useRef(activeLeagueId);
  const authRoleRef = useRef(authRole);
  useEffect(() => {
    leaguesRef.current = leagues;
    activeLeagueIdRef.current = activeLeagueId;
    authRoleRef.current = authRole;
  }, [leagues, activeLeagueId, authRole]);

  const hasUnsyncedAdminEdits = useCallback(
    () =>
      JSON.stringify(leaguesRef.current) !== lastSyncedLeaguesRef.current ||
      activeLeagueIdRef.current !== lastSyncedActiveIdRef.current,
    []
  );

  // Replace local state with the server's copy and mark it as synced.
  const applyServerData = useCallback(
    (data: { leagues: LeagueSeason[]; version?: number }) => {
      const repaired = repairLeaguesData(data.leagues);
      const json = JSON.stringify(repaired);
      lastSyncedLeaguesRef.current = json;
      leaguesRef.current = repaired;
      if (typeof data.version === 'number') versionRef.current = data.version;
      setLeagues((current) => (JSON.stringify(current) === json ? current : repaired));
      try {
        localStorage.setItem('powerschedule_leagues', json);
      } catch {}
      return repaired;
    },
    []
  );

  const refreshFromServer = useCallback(async () => {
    try {
      const res = await fetch('/api/leagues', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.leagues) && data.leagues.length > 0) return applyServerData(data);
      }
    } catch (err) {
      console.warn('Failed to refresh league data:', err);
    }
    return null;
  }, [applyServerData]);

  // Load state from online cloud API on mount (Cloud is the authoritative single source of truth)
  useEffect(() => {
    let isMounted = true;

    // Older versions stored the admin passcode in plain text in the browser.
    try {
      localStorage.removeItem('powerschedule_admin_passcode');
    } catch {}

    const pickInitialLeagueId = (available: LeagueSeason[], serverActiveId?: string) => {
      const defaultSavedId = localStorage.getItem('powerschedule_default_league_id');
      if (defaultSavedId && available.some((l) => l.id === defaultSavedId)) return defaultSavedId;
      if (serverActiveId && available.some((l) => l.id === serverActiveId)) return serverActiveId;
      return available[0].id;
    };

    const fetchCloudData = async () => {
      try {
        const res = await fetch('/api/leagues', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data?.leagues) && data.leagues.length > 0) {
            const repaired = applyServerData(data);
            const initialId = pickInitialLeagueId(repaired, data.activeId);
            lastSyncedActiveIdRef.current = initialId;
            activeLeagueIdRef.current = initialId;
            setActiveLeagueId(initialId);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch online cloud data, falling back to local storage cache', err);
      }

      // Offline / Local Storage Fallback only when cloud network is unreachable.
      // Marked as "synced" with version 0 so an admin can never push this possibly-stale
      // copy over the real data (the server will reject it as a version conflict).
      try {
        const rawSaved = localStorage.getItem('powerschedule_leagues');
        if (rawSaved) {
          const offlineData = JSON.parse(rawSaved);
          if (offlineData && Array.isArray(offlineData) && offlineData.length > 0 && isMounted) {
            const repaired = repairLeaguesData(offlineData);
            lastSyncedLeaguesRef.current = JSON.stringify(repaired);
            leaguesRef.current = repaired;
            versionRef.current = 0;
            setLeagues(repaired);
            const initialId = pickInitialLeagueId(repaired);
            lastSyncedActiveIdRef.current = initialId;
            activeLeagueIdRef.current = initialId;
            setActiveLeagueId(initialId);
          }
        }
      } catch (err) {
        console.warn('Failed to parse offline local storage cache', err);
      }
    };

    fetchCloudData().finally(() => {
      if (isMounted) setIsLoaded(true);
    });

    return () => {
      isMounted = false;
    };
  }, [applyServerData]);

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

  const handleLoginSuccess = async (role: 'scheduler' | 'team_rep', teamId?: string, leagueId?: string) => {
    // Reload with the new session BEFORE switching roles: the copy loaded while logged out
    // has captain contact details and PINs stripped, and must never be saved back.
    await refreshFromServer();
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
    authRoleRef.current = 'public';
    setAuthLeagueId(null);
    setAuthTeamId(null);
    localStorage.removeItem('powerschedule_auth_role');
    localStorage.removeItem('powerschedule_auth_league_id');
    localStorage.removeItem('powerschedule_auth_team_id');
    // Drop PINs / contact details from memory and the offline cache
    await refreshFromServer();
  };

  // Save the admin's full league tree. Only one save runs at a time; edits made
  // meanwhile are picked up by a follow-up save.
  const pushLeaguesToCloud = useCallback(async () => {
    if (syncInFlightRef.current) {
      syncQueuedRef.current = true;
      return;
    }
    syncInFlightRef.current = true;
    try {
      do {
        syncQueuedRef.current = false;
        const leaguesSnapshot = leaguesRef.current;
        const activeIdSnapshot = activeLeagueIdRef.current;
        const leaguesJson = JSON.stringify(leaguesSnapshot);
        if (leaguesJson === lastSyncedLeaguesRef.current && activeIdSnapshot === lastSyncedActiveIdRef.current) {
          break;
        }

        const res = await fetch('/api/leagues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leagues: leaguesSnapshot, activeId: activeIdSnapshot, version: versionRef.current }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          if (typeof data.version === 'number') versionRef.current = data.version;
          lastSyncedLeaguesRef.current = leaguesJson;
          lastSyncedActiveIdRef.current = activeIdSnapshot;
          syncFailureAlertedRef.current = false;
          continue;
        }

        if (res.status === 409) {
          await refreshFromServer();
          lastSyncedActiveIdRef.current = activeLeagueIdRef.current;
          window.alert(
            'Someone else saved a change at the same moment (for example, a captain entering a score), ' +
              'so your last change was NOT saved.\n\nThe latest data has been loaded. Please check it and redo your change.'
          );
          break;
        }

        if (res.status === 401 || res.status === 403) {
          window.alert('Your admin session has expired, so your last change was NOT saved. Please sign in again.');
          setAuthRole('public');
          authRoleRef.current = 'public';
          await refreshFromServer();
          break;
        }

        throw new Error(data.error || `HTTP ${res.status}`);
      } while (syncQueuedRef.current);
    } catch (err) {
      if (!syncFailureAlertedRef.current) {
        syncFailureAlertedRef.current = true;
        window.alert(
          `Could not save your changes to the cloud (${err instanceof Error ? err.message : 'network error'}). ` +
            'Saving will be retried automatically. Please keep this page open until it succeeds.'
        );
      }
    } finally {
      syncInFlightRef.current = false;
    }
  }, [refreshFromServer]);

  // Targeted write used by captains (scores, RSVPs, PIN changes). On failure the
  // user is told and the optimistic local change is rolled back.
  const sendTargetedWrite = useCallback(
    async (url: string, method: 'POST' | 'PATCH', body: unknown, failureMessage: string) => {
      pendingWritesRef.current += 1;
      let ok = false;
      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          if (typeof data.version === 'number') versionRef.current = Math.max(versionRef.current, data.version);
          ok = true;
        } else {
          window.alert(`${failureMessage}: ${data.error || `HTTP ${res.status}`}`);
        }
      } catch {
        window.alert(`${failureMessage}: network error. Please check your connection and try again.`);
      } finally {
        pendingWritesRef.current -= 1;
      }
      if (!ok) await refreshFromServer();
      return ok;
    },
    [refreshFromServer]
  );

  // Periodic polling to keep all devices (phone, desktop, public viewers) in sync.
  // Paused while the page is hidden (each poll is a database request), with an
  // immediate refresh when the user comes back to it.
  useEffect(() => {
    if (!isLoaded) return;
    const isBusy = () =>
      syncInFlightRef.current ||
      pendingWritesRef.current > 0 ||
      (authRoleRef.current === 'scheduler' && hasUnsyncedAdminEdits());

    const poll = async () => {
      if (authRoleRef.current === 'scheduler' && hasUnsyncedAdminEdits() && !syncInFlightRef.current) {
        // A previous save failed: retry it rather than overwriting the admin's edits.
        // Runs even while hidden so unsaved changes aren't left waiting.
        pushLeaguesToCloud();
        return;
      }
      if (document.hidden) return;
      if (isBusy()) return;
      try {
        const res = await fetch('/api/leagues', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        // Local state may have changed while this request was in flight
        if (isBusy()) return;
        if (typeof data?.version === 'number' && data.version < versionRef.current) return;
        if (Array.isArray(data?.leagues) && data.leagues.length > 0) applyServerData(data);
      } catch {
        // silent fail on network pulse
      }
    };

    // Live refreshing only matters on game days (scores coming in). On game days admins poll
    // quickly so their copy stays fresh (fewer save conflicts with captains) and everyone else
    // every 30s. On other days viewers refresh only when they open or return to the page, and
    // admins once a minute.
    const isAdmin = authRole === 'scheduler';
    const OFF_DAY_ADMIN_POLL_MS = 60000;
    let lastTimedPoll = 0;
    const timedPoll = () => {
      if (!isGameDay(leaguesRef.current)) {
        const adminDue = isAdmin && Date.now() - lastTimedPoll >= OFF_DAY_ADMIN_POLL_MS;
        const retryingSave = isAdmin && hasUnsyncedAdminEdits();
        if (!adminDue && !retryingSave) return;
      }
      lastTimedPoll = Date.now();
      poll();
    };
    const interval = setInterval(timedPoll, isAdmin ? 6000 : 30000);
    // Returning to the page can fire both "visible" and "focus"; refresh once
    let lastReturnRefresh = 0;
    const handleVisibilityChange = () => {
      if (document.hidden || Date.now() - lastReturnRefresh < 2000) return;
      lastReturnRefresh = Date.now();
      poll();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [isLoaded, authRole, applyServerData, hasUnsyncedAdminEdits, pushLeaguesToCloud]);

  // Persist the admin's local edits to the cloud
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('powerschedule_active_league_id', activeLeagueId);
    } catch {}
    if (authRole === 'scheduler' && hasUnsyncedAdminEdits()) {
      // Saving to the server is a side effect; any state updates inside happen after the request
      // eslint-disable-next-line react-hooks/set-state-in-effect
      pushLeaguesToCloud();
    }
  }, [leagues, activeLeagueId, isLoaded, authRole, hasUnsyncedAdminEdits, pushLeaguesToCloud]);

  const league = leagues.find((l) => l.id === activeLeagueId) || leagues[0];


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
  const [isBackupOpen, setIsBackupOpen] = useState(false);

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
    const existingPasscode = leagues.find((l) => l.adminPasscode)?.adminPasscode;
    const universalPasscode = adminPasscode || existingPasscode || 'admin123';

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
          publicFairnessReport: isTarget
            ? (publicFairnessReport !== undefined ? publicFairnessReport : (l.publicFairnessReport !== false))
            : l.publicFairnessReport,
          divisions: isTarget
            ? l.divisions.map((d) => ({
                ...d,
                setFormat: formattedDesc as SetFormat,
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
      accessPin: accessPin?.trim() || generateRandomPin(),
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
        accessPin: generateRandomPin(),
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
    if (authRole === 'scheduler') return; // saved by the admin sync effect
    sendTargetedWrite(
      `/api/teams/${encodeURIComponent(teamId)}`,
      'PATCH',
      { accessPin: cleanPin },
      'Your new PIN was NOT saved'
    );
  };

  const handleDeleteTeam = (teamId: string) => {
    const team = league.teams.find((t) => t.id === teamId);
    const matchCount = league.matches.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId).length;
    if (
      !window.confirm(
        `Delete "${team?.name || 'this team'}"? This also deletes its ${matchCount} scheduled/played match(es), including any scores. This cannot be undone.`
      )
    ) {
      return;
    }
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
  const handleSaveMatchScore = async (matchId: string, scores: SetScore[], winnerId: string) => {
    // Optimistic UI update
    updateActiveLeague((prev) => ({
      ...prev,
      matches: prev.matches.map((m) =>
        m.id === matchId ? { ...m, scores, winnerId, status: 'Completed' as const } : m
      ),
    }));

    if (authRole === 'scheduler') return; // saved by the admin sync effect
    await sendTargetedWrite(
      `/api/matches/${encodeURIComponent(matchId)}/score`,
      'POST',
      { scores, winnerId },
      'The match score was NOT saved'
    );
  };

  // Manual Match Edit & Reschedule Handlers (admin only; saved by the admin sync effect)
  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setIsMatchEditorOpen(true);
  };

  const handleAddMatch = () => {
    setEditingMatch(null);
    setIsMatchEditorOpen(true);
  };

  const handleSaveMatch = (savedMatch: Match) => {
    updateActiveLeague((prev) => {
      const exists = prev.matches.some((m) => m.id === savedMatch.id);
      return {
        ...prev,
        matches: exists
          ? prev.matches.map((m) => (m.id === savedMatch.id ? savedMatch : m))
          : [...prev.matches, savedMatch],
      };
    });
    setIsMatchEditorOpen(false);
    setEditingMatch(null);
  };

  const handleDeleteMatch = (matchId: string) => {
    updateActiveLeague((prev) => ({
      ...prev,
      matches: prev.matches.filter((m) => m.id !== matchId),
    }));
    setIsMatchEditorOpen(false);
    setEditingMatch(null);
  };

  // Restore all leagues from a backup (admin only; saved to the cloud by the admin sync effect)
  const handleRestoreBackup = (restored: LeagueSeason[], restoredActiveId?: string) => {
    const repaired = repairLeaguesData(restored);
    setLeagues(repaired);
    const nextId =
      restoredActiveId && repaired.some((l) => l.id === restoredActiveId) ? restoredActiveId : repaired[0].id;
    handleSelectLeague(nextId, repaired.find((l) => l.id === nextId));
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
    const targetTeam = league.teams.find((t) => t.id === teamId);
    if (!targetTeam) return;
    const updatedRoster = targetTeam.roster.map((player) =>
      player.id === playerId ? { ...player, rsvpStatus: status } : player
    );

    updateActiveLeague((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => (t.id === teamId ? { ...t, roster: updatedRoster } : t)),
    }));

    if (authRole === 'scheduler') return; // saved by the admin sync effect
    sendTargetedWrite(
      `/api/teams/${encodeURIComponent(teamId)}`,
      'PATCH',
      { roster: updatedRoster },
      'The RSVP was NOT saved'
    );
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
      <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#0e1012] flex flex-col items-center justify-center p-6 text-slate-900 dark:text-white font-sans transition-colors duration-150">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#101010] dark:bg-[#007afc] animate-pulse flex items-center justify-center shadow-md">
            <Trophy className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 tracking-tight">PowerSchedule</h2>
        <p className="text-xs text-slate-500 dark:text-[#8b96aa] mt-1 animate-pulse">Loading league data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#0e1012] text-slate-900 dark:text-[#a0aaba] selection:bg-[#101010] dark:selection:bg-[#007afc] selection:text-white font-sans pb-16 transition-colors duration-150">
      
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
        onOpenLoginModal={() => {
          setLoginModalTab('team');
          setIsLoginModalOpen(true);
        }}
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
            onOpenBackups={() => setIsBackupOpen(true)}
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
                    ? 'bg-[#101010] text-white dark:bg-[#007afc] dark:text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 dark:bg-[#15171b] text-slate-700 dark:text-[#a0aaba] hover:text-slate-900 dark:hover:text-white dark:hover:bg-[#1c1f24] border border-slate-200 dark:border-[#333943] shadow-xs'
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
            hasExhibitionGames={league.matches.some((m) => m.divisionId === activeDivision.id && m.isExhibition)}
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
      {activeScoreMatch && (
        <ScorekeeperModal
          key={activeScoreMatch.id}
          match={activeScoreMatch}
          homeTeam={activeHomeTeam}
          awayTeam={activeAwayTeam}
          workTeam={activeWorkTeam}
          division={league.divisions.find((d) => d.id === activeScoreMatch.divisionId) || activeDivision}
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
        existingMatches={league.matches}
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onApplySchedule={handleApplySchedule}
        defaultStartDate={league.startDate}
        defaultEndDate={league.endDate}
        priorities={league.schedulerPriorities as SchedulerPriority[] | undefined}
        onSavePriorities={(schedulerPriorities) => updateActiveLeague((prev) => ({ ...prev, schedulerPriorities }))}
        extraGames={league.scheduleExtraGames}
        onSaveExtraGames={(scheduleExtraGames) => updateActiveLeague((prev) => ({ ...prev, scheduleExtraGames }))}
        emptySlot={league.scheduleEmptySlot}
        onSaveEmptySlot={(scheduleEmptySlot) => updateActiveLeague((prev) => ({ ...prev, scheduleEmptySlot }))}
        blackoutDates={league.scheduleBlackoutDates}
        onSaveBlackoutDates={(scheduleBlackoutDates) => updateActiveLeague((prev) => ({ ...prev, scheduleBlackoutDates }))}
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
        initialTab={loginModalTab}
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
      {isMatchEditorOpen && (
      <MatchEditorModal
        key={editingMatch?.id ?? 'new-match'}
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
      )}

      {/* Backups (admin only) */}
      {currentRole === 'scheduler' && isBackupOpen && (
        <BackupModal
          isOpen={isBackupOpen}
          onClose={() => setIsBackupOpen(false)}
          leagues={leagues}
          activeLeagueId={activeLeagueId}
          onRestore={handleRestoreBackup}
        />
      )}

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
