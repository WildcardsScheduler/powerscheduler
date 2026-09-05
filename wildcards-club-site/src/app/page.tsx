'use client';

import React, { useState, useEffect } from 'react';
import {
  Volleyball, Calendar, Trophy, Users, ShieldCheck, DollarSign, FileText,
  ExternalLink, ArrowRight, CheckCircle2, ChevronRight, Search, MapPin, Mail, Phone, Lock, Sparkles, Award
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { TryoutRegistrationModal } from '@/components/TryoutRegistrationModal';
import { NewsReaderModal } from '@/components/NewsReaderModal';
import { AdminPortalModal } from '@/components/AdminPortalModal';
import { INITIAL_CLUB_DATA } from '@/data/initialClubData';
import { WildcardsClubData, Announcement, TryoutSession } from '@/types/club';
import { fetchSanityClubData } from '@/sanity/fetchClubDataFromSanity';

export default function Home() {
  const [clubData, setClubData] = useState<WildcardsClubData>(INITIAL_CLUB_DATA);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedTryout, setSelectedTryout] = useState<TryoutSession | null>(null);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const [selectedArticle, setSelectedArticle] = useState<Announcement | null>(null);
  const [newsModalOpen, setNewsModalOpen] = useState(false);

  const [adminModalOpen, setAdminModalOpen] = useState(false);

  // Filter states
  const [tryoutFilter, setTryoutFilter] = useState<string>('All');
  const [newsFilter, setNewsFilter] = useState<string>('All');
  const [newsSearch, setNewsSearch] = useState<string>('');

  // Fetch live club data on mount
  const fetchClubData = async () => {
    try {
      // 1. Check local storage first for quick restore
      const localSaved = localStorage.getItem('wildcards_club_data');
      if (localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          setClubData(parsed);
        } catch (e) {
          // ignore
        }
      }

      // 2. Fetch API route data
      const res = await fetch('/api/club');
      if (res.ok) {
        const data = await res.json();
        setClubData(data);
        localStorage.setItem('wildcards_club_data', JSON.stringify(data));
      }

      // 3. Fetch Sanity Headless CMS data if present
      const sanityData = await fetchSanityClubData();
      if (sanityData) {
        setClubData((prev) => ({
          ...prev,
          ...sanityData,
        }));
      }
    } catch (error) {
      console.error('Failed to load club data from API:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubData();
  }, []);

  const handleUpdateClubData = async (newData: WildcardsClubData): Promise<boolean> => {
    // 1. Instantly update React state and LocalStorage for immediate UI feedback
    setClubData(newData);
    try {
      localStorage.setItem('wildcards_club_data', JSON.stringify(newData));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    // 2. Persist to API
    try {
      const res = await fetch('/api/club', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passcode: newData.clubInfo.adminPasscode || 'admin123',
          data: newData,
        }),
      });

      if (res.ok) {
        return true;
      }
    } catch (err) {
      console.error('Failed to update club data on server:', err);
    }
    return true; // Return true because local state and local storage are saved successfully!
  };

  const { clubInfo, announcements, tryouts, teams, coaches, fees, policies } = clubData;

  // Filtered tryouts & news
  const filteredTryouts = tryouts.filter((t) => {
    if (tryoutFilter === 'All') return true;
    return t.ageGroup === tryoutFilter || t.gender === tryoutFilter;
  });

  const filteredNews = announcements.filter((n) => {
    const matchesCategory = newsFilter === 'All' || n.category === newsFilter;
    const matchesSearch =
      n.title.toLowerCase().includes(newsSearch.toLowerCase()) ||
      n.summary.toLowerCase().includes(newsSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      
      {/* Navbar with Sponsor Bar */}
      <Navbar
        clubInfo={clubInfo}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdmin={() => setAdminModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        
        {/* ======================================================== */}
        {/* TAB 1: HOME PAGE */}
        {/* ======================================================== */}
        {activeTab === 'home' && (
          <div className="space-y-16 pb-12 animate-in fade-in duration-300">
            
            {/* Hero Section matching original Wildcards Branding */}
            <section className="relative pt-14 pb-20 overflow-hidden bg-gradient-to-b from-black via-zinc-950 to-black border-b border-zinc-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  
                  {/* Left Column: Headline */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-red-600/10 border border-red-500/30 text-red-400 text-xs font-extrabold">
                      <Volleyball className="h-4 w-4" />
                      <span>{clubInfo.heroBadge || 'Volleyball Alberta Member Club'}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-2xl sm:text-3xl font-black text-zinc-400 tracking-widest uppercase">
                        {clubInfo.heroTitleLine1 || 'ROCKY'}
                      </div>
                      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-red-600 tracking-tight leading-none">
                        {clubInfo.heroTitleLine2 || 'WILDCARDS'}
                      </h1>
                      <div className="text-xl sm:text-2xl font-bold text-white tracking-wider">
                        {clubInfo.heroTitleLine3 || 'VOLLEYBALL CLUB'}
                      </div>
                    </div>

                    <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl">
                      {clubInfo.heroDescription || 'Developing youth athletes in Rocky and surrounding Alberta communities. Focused on technical excellence, competitive resilience, and leadership development.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={() => setActiveTab('tryouts')}
                        className="px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-xl shadow-red-600/30 hover:scale-105 active:scale-98 transition-all flex items-center space-x-2"
                      >
                        <span>2026/2027 Tryout Dates</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => setActiveTab('teams')}
                        className="px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm border border-zinc-800 hover:border-red-500/50 transition-all shadow-md"
                      >
                        Our Teams
                      </button>

                      <button
                        onClick={() => setActiveTab('fees')}
                        className="px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm border border-zinc-800 hover:border-red-500/50 transition-all shadow-md"
                      >
                        Athlete Fees
                      </button>

                      <a
                        href={clubInfo.schedulePortalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-red-400 hover:text-white font-bold text-sm border border-zinc-800 hover:border-red-500/50 flex items-center space-x-1.5 transition-all shadow-md group"
                      >
                        <span>Practice Schedules</span>
                        <ExternalLink className="h-4 w-4 text-red-500 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>

                    {/* Quick Metrics */}
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-800/80">
                      <div>
                        <div className="text-2xl sm:text-3xl font-black text-red-500">{clubInfo.metric1Value || '12+'}</div>
                        <div className="text-xs text-zinc-400 font-semibold">{clubInfo.metric1Label || 'Competitive Teams'}</div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-black text-white">{clubInfo.metric2Value || '150+'}</div>
                        <div className="text-xs text-zinc-400 font-semibold">{clubInfo.metric2Label || 'Youth Athletes'}</div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-black text-amber-400">{clubInfo.metric3Value || '100%'}</div>
                        <div className="text-xs text-zinc-400 font-semibold">{clubInfo.metric3Label || 'NCCP Certified'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Logo Showcase & Featured Tryout Callout */}
                  <div className="lg:col-span-5 space-y-5">
                    {/* Official Logo Emblem Showcase */}
                    <div className="bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex items-center space-x-6 relative overflow-hidden backdrop-blur-md">
                      <div className="h-28 w-28 shrink-0 rounded-2xl bg-black p-2 shadow-2xl border border-red-600/30 flex items-center justify-center relative group overflow-hidden">
                        <img
                          src="/logo.png"
                          alt="Rocky Wildcards Official Logo"
                          className="h-full w-full object-contain filter drop-shadow-[0_0_12px_rgba(239,68,68,0.4)] transform group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-600/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                          Official Club Crest
                        </span>
                        <h4 className="text-xl font-black text-white">Rocky Wildcards</h4>
                        <p className="text-xs text-zinc-400">Competitive Youth Volleyball Association • Alberta</p>
                      </div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden group hover:border-red-500/40 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-red-600/10 text-red-500 border border-red-500/20">
                          {clubInfo.heroCalloutBadge || 'Tryout Signing Period'}
                        </span>
                        <span className="text-xs text-zinc-500">Volleyball Alberta</span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                        {clubInfo.heroCalloutTitle || '2026/2027 Signing & Evaluation Dates'}
                      </h3>

                      <div className="space-y-2 text-xs text-zinc-300 whitespace-pre-line">
                        {clubInfo.heroCalloutText || '16U-18U LOI Signing Period: August 30 – September 13\n14U-15U Signing Period: September 12 – September 20\nOfficial offers (LOI) will be emailed to athletes following evaluations.'}
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
                        <button
                          onClick={() => setActiveTab('tryouts')}
                          className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all text-center"
                        >
                          View Full Tryout Details & Register
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* Upcoming Tryouts Highlight */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                    <Calendar className="h-7 w-7 text-red-500" />
                    <span>Fall & Winter Tryouts</span>
                  </h2>
                  <p className="text-xs text-zinc-400">Pre-register online to reserve your evaluation bib</p>
                </div>

                <button
                  onClick={() => setActiveTab('tryouts')}
                  className="text-xs font-bold text-red-400 hover:text-white flex items-center space-x-1"
                >
                  <span>View All Age Divisions ({tryouts.length})</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tryouts.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 hover:border-red-500/40 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-red-600/10 text-red-500 border border-red-500/20">
                          {session.ageGroup} {session.gender}
                        </span>
                        <span className="text-[11px] font-bold text-red-400 bg-red-600/10 px-2 py-0.5 rounded border border-red-500/20">
                          {session.status}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white">{session.date}</h3>

                      <div className="space-y-1 text-xs text-zinc-300">
                        <p><strong>Time:</strong> {session.time}</p>
                        <p><strong>Venue:</strong> {session.venue}</p>
                        <p><strong>Fee:</strong> {session.fee}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedTryout(session);
                        setRegisterModalOpen(true);
                      }}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
                    >
                      Register Now
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* PowerSchedule Integration Banner */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-8 space-y-3">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-600/10 text-red-500 border border-red-500/20 text-xs font-bold">
                      <Trophy className="h-4 w-4" />
                      <span>{clubInfo.scheduleBannerBadge || 'Live League Fixtures & Practice Schedules'}</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white">
                      {clubInfo.scheduleBannerTitle || 'Track Match Fixtures & Division Standings'}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl">
                      {clubInfo.scheduleBannerText || 'Rocky Wildcards Volleyball Club integrates with PowerSchedule to deliver real-time tournament schedules, court assignments, and standings for all wildcards teams.'}
                    </p>
                  </div>
                  <div className="md:col-span-4 flex justify-start md:justify-end">
                    <a
                      href={clubInfo.schedulePortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-2xl shadow-xl transition-all flex items-center space-x-2"
                    >
                      <span>Open PowerSchedule Portal</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: TRYOUTS PAGE */}
        {/* ======================================================== */}
        {activeTab === 'tryouts' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
              <div>
                <h1 className="text-3xl font-black text-white flex items-center gap-2">
                  <Calendar className="h-8 w-8 text-red-500" />
                  <span>{clubInfo.tryoutsPageTitle || '2026/2027 Tryout Dates & Signing Info'}</span>
                </h1>
                <p className="text-xs text-zinc-400 mt-1">{clubInfo.tryoutsPageSubtitle || 'Pre-register online for evaluation sessions under Volleyball Alberta guidelines'}</p>
              </div>

              {/* Age Group Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {['All', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'Boys', 'Girls'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTryoutFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      tryoutFilter === filter
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Tryout Guidelines & Info Banner */}
            {(clubInfo.tryoutInfoTitle || clubInfo.tryoutInfoText || clubInfo.tryoutRequirementsText) && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-2">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-600/10 text-red-500 border border-red-500/20 text-xs font-bold">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{clubInfo.tryoutInfoTitle || 'Volleyball Alberta Evaluation & Signing Rules'}</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {clubInfo.tryoutInfoText || 'Pre-registration is required for all athletes attending evaluation sessions. Official Letters of Intent (LOI) will be distributed to selected athletes following evaluations in accordance with Volleyball Alberta signing windows.'}
                  </p>
                </div>
                <div className="md:col-span-4 bg-black p-4 rounded-2xl border border-zinc-800 space-y-1 text-xs">
                  <strong className="text-red-400 font-bold block">Important Notice / Checklist</strong>
                  <p className="text-zinc-300 whitespace-pre-line">
                    {clubInfo.tryoutRequirementsText || 'What to Bring: Volleyball Alberta Tryout Membership, Clean Indoor Court Shoes, Knee Pads, Water Bottle. Arrive 15 minutes prior for check-in.'}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTryouts.map((session) => (
                <div
                  key={session.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 hover:border-red-500/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-red-600/10 text-red-500 border border-red-500/20">
                        {session.ageGroup} {session.gender}
                      </span>
                      <span className="text-[11px] font-bold text-red-400 bg-red-600/10 px-2 py-0.5 rounded border border-red-500/20">
                        {session.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{session.date}</h3>

                    <div className="space-y-1.5 text-xs text-zinc-300 bg-black p-3.5 rounded-2xl border border-zinc-800">
                      <p><strong>Time:</strong> {session.time}</p>
                      <p><strong>Location:</strong> {session.venue}</p>
                      <p><strong>Gym Address:</strong> {session.address}</p>
                      <p><strong>Tryout Fee:</strong> <span className="text-red-400 font-bold">{session.fee}</span></p>
                      {session.notes && <p className="text-zinc-400 italic pt-1">Note: {session.notes}</p>}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTryout(session);
                      setRegisterModalOpen(true);
                    }}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>Register Athlete Online</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: OUR TEAMS PAGE */}
        {/* ======================================================== */}
        {activeTab === 'teams' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in duration-300">
            <div className="border-b border-zinc-800 pb-6">
              <h1 className="text-3xl font-black text-white flex items-center gap-2">
                <Trophy className="h-8 w-8 text-red-500" />
                <span>{clubInfo.teamsPageTitle || 'Wildcards Club Teams & Divisions'}</span>
              </h1>
              <p className="text-xs text-zinc-400 mt-1">{clubInfo.teamsPageSubtitle || 'Overview of active competitive squads for the 2026 season'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 hover:border-red-500/40 transition-all overflow-hidden"
                >
                  {t.teamPhotoUrl && (
                    <div className="h-44 w-full rounded-2xl bg-black border border-zinc-800 overflow-hidden relative group">
                      <img
                        src={t.teamPhotoUrl}
                        alt={t.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span
                        className="h-5 w-5 rounded-full shadow-md shrink-0"
                        style={{ backgroundColor: t.badgeColor }}
                      />
                      <h3 className="text-lg font-bold text-white">{t.name}</h3>
                    </div>
                    <span className="text-xs font-bold text-red-400 bg-red-600/10 px-2.5 py-1 rounded-lg border border-red-500/20">
                      {t.division}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-zinc-300 bg-black p-4 rounded-2xl border border-zinc-800">
                    <div>
                      <span className="text-zinc-500 block">Head Coach</span>
                      <strong className="text-white">{t.headCoach}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Assistant Coach</span>
                      <strong className="text-white">{t.assistantCoach || 'Staff Coach'}</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-500 block">Practice Times</span>
                      <span className="text-red-400 font-semibold">{t.practiceSchedule} ({t.homeGym})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: NEWS PAGE */}
        {/* ======================================================== */}
        {activeTab === 'news' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
              <div>
                <h1 className="text-3xl font-black text-white flex items-center gap-2">
                  <ShieldCheck className="h-8 w-8 text-red-500" />
                  <span>{clubInfo.newsPageTitle || 'Club News & Announcements'}</span>
                </h1>
                <p className="text-xs text-zinc-400 mt-1">{clubInfo.newsPageSubtitle || 'Official updates from Rocky Wildcards Volleyball Club'}</p>
              </div>

              {/* Search */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="h-4 w-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={newsSearch}
                    onChange={(e) => setNewsSearch(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredNews.map((article) => (
                <div
                  key={article.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 hover:border-red-500/40 transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="space-y-3">
                    {article.imageUrl && (
                      <div className="h-40 w-full rounded-2xl bg-black border border-zinc-800 overflow-hidden relative group">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600/10 text-red-500 border border-red-500/20">
                        {article.category}
                      </span>
                      <span className="text-xs text-zinc-500">{article.date}</span>
                    </div>

                    <h3 className="text-base font-bold text-white leading-snug">{article.title}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-3">{article.summary}</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedArticle(article);
                      setNewsModalOpen(true);
                    }}
                    className="text-xs font-bold text-red-400 hover:text-white flex items-center space-x-1 pt-2 border-t border-zinc-800"
                  >
                    <span>Read Full Article</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: COACHES PAGE */}
        {/* ======================================================== */}
        {activeTab === 'coaches' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in duration-300">
            <div className="border-b border-zinc-800 pb-6">
              <h1 className="text-3xl font-black text-white flex items-center gap-2">
                <Users className="h-8 w-8 text-red-500" />
                <span>{clubInfo.coachesPageTitle || 'Coaching Staff Directory'}</span>
              </h1>
              <p className="text-xs text-zinc-400 mt-1">{clubInfo.coachesPageSubtitle || 'Meet our NCCP certified technical directors and head coaches'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {coaches.map((coach) => (
                <div key={coach.id} className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between overflow-hidden">
                  <div className="space-y-4">
                    {coach.photoUrl && (
                      <div className="h-72 w-full rounded-2xl bg-black border border-zinc-800 overflow-hidden relative group">
                        <img
                          src={coach.photoUrl}
                          alt={coach.name}
                          className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-red-500">{coach.role}</span>
                      <h3 className="text-xl font-bold text-white">{coach.name}</h3>
                      <p className="text-xs text-zinc-400">Assigned Team: <strong className="text-white">{coach.teamAssigned}</strong></p>
                    </div>

                    <div className="bg-black p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Certifications</span>
                      <ul className="space-y-1">
                        {coach.certifications.map((cert, idx) => (
                          <li key={idx} className="text-xs text-zinc-300 flex items-center space-x-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            <span>{cert}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">{coach.bio}</p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-400">
                    <a href={`mailto:${coach.email}`} className="text-red-400 hover:underline flex items-center space-x-1">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{coach.email}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: FEES PAGE */}
        {/* ======================================================== */}
        {activeTab === 'fees' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in duration-300">
            <div className="border-b border-zinc-800 pb-6">
              <h1 className="text-3xl font-black text-white flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-red-500" />
                <span>{clubInfo.feesPageTitle || '2026 Season Athlete Fees'}</span>
              </h1>
              <p className="text-xs text-zinc-400 mt-1">{clubInfo.feesPageSubtitle || 'Transparent pricing, deposit terms, and itemized inclusions'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {fees.map((fee) => (
                <div key={fee.id} className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-bold text-red-500 uppercase tracking-wider">{fee.ageGroup}</span>
                      <h3 className="text-xl font-bold text-white">{fee.division}</h3>
                    </div>

                    <div className="bg-black p-4 rounded-2xl border border-zinc-800 space-y-1">
                      <div className="text-3xl font-black text-red-500">${fee.totalFee}</div>
                      <p className="text-xs text-zinc-400">Deposit: <strong>${fee.depositAmount}</strong> (Due upon team acceptance)</p>
                      <p className="text-xs text-zinc-400">Installments: <strong>{fee.monthlyPayments}</strong></p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-zinc-300 block">Fee Inclusions:</span>
                      <ul className="space-y-1.5">
                        {fee.includes.map((inc, i) => (
                          <li key={i} className="text-xs text-zinc-300 flex items-start space-x-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('tryouts')}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow-md"
                  >
                    View Tryouts & Register
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: POLICIES PAGE */}
        {/* ======================================================== */}
        {activeTab === 'policies' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in duration-300">
            <div className="border-b border-zinc-800 pb-6">
              <h1 className="text-3xl font-black text-white flex items-center gap-2">
                <FileText className="h-8 w-8 text-red-500" />
                <span>{clubInfo.policiesPageTitle || 'Club Policies & Bylaws'}</span>
              </h1>
              <p className="text-xs text-zinc-400 mt-1">{clubInfo.policiesPageSubtitle || 'Official governing documents and Safe Sport guidelines'}</p>
            </div>

            <div className="space-y-4 max-w-4xl">
              {policies.map((p) => (
                <div key={p.id} className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600/10 text-red-500 border border-red-500/20">
                      {p.category}
                    </span>
                    <span className="text-xs text-zinc-500">Updated: {p.updatedAt}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{p.title}</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">{p.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Footer Component */}
      <Footer
        clubInfo={clubInfo}
        setActiveTab={setActiveTab}
        onOpenAdmin={() => setAdminModalOpen(true)}
      />

      {/* Modals */}
      <TryoutRegistrationModal
        session={selectedTryout}
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={() => {
          fetchClubData();
        }}
      />

      <NewsReaderModal
        article={selectedArticle}
        isOpen={newsModalOpen}
        onClose={() => setNewsModalOpen(false)}
      />

      <AdminPortalModal
        data={clubData}
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onUpdateClubData={handleUpdateClubData}
      />

    </div>
  );
}
