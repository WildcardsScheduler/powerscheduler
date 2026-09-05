'use client';

import React, { useState } from 'react';
import {
  X, Lock, Key, CheckCircle2, AlertCircle, Plus, Trash2, Save, Edit3, ExternalLink,
  Calendar, ShieldCheck, Users, Trophy, DollarSign, FileText, Download, Loader2, Settings, Palette
} from 'lucide-react';
import {
  WildcardsClubData, Announcement, TryoutSession, TeamRosterInfo,
  CoachProfile, FeeItem, ClubPolicy
} from '@/types/club';

interface AdminPortalModalProps {
  data: WildcardsClubData;
  isOpen: boolean;
  onClose: () => void;
  onUpdateClubData: (newData: WildcardsClubData) => Promise<boolean>;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  data,
  isOpen,
  onClose,
  onUpdateClubData,
}) => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'news' | 'tryouts' | 'registrations' | 'teams' | 'coaches' | 'fees' | 'policies' | 'settings'>('news');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local editable state copies
  const [clubInfo, setClubInfo] = useState(data.clubInfo);
  const [announcements, setAnnouncements] = useState<Announcement[]>(data.announcements);
  const [tryouts, setTryouts] = useState<TryoutSession[]>(data.tryouts);
  const [registrations, setRegistrations] = useState(data.registrations || []);
  const [teams, setTeams] = useState<TeamRosterInfo[]>(data.teams);
  const [coaches, setCoaches] = useState<CoachProfile[]>(data.coaches);
  const [fees, setFees] = useState<FeeItem[]>(data.fees);
  const [policies, setPolicies] = useState<ClubPolicy[]>(data.policies || []);

  // Editing item IDs
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [editingTryoutId, setEditingTryoutId] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);

  // Form states for creating new items
  const [showAddNews, setShowAddNews] = useState(false);
  const [newNewsTitle, setNewNewsTitle] = useState('');
  const [newNewsCategory, setNewNewsCategory] = useState<'General' | 'Tryouts' | 'Tournaments' | 'Club News'>('General');
  const [newNewsSummary, setNewNewsSummary] = useState('');
  const [newNewsContent, setNewNewsContent] = useState('');
  const [newNewsImage, setNewNewsImage] = useState('');

  const [showAddTryout, setShowAddTryout] = useState(false);
  const [newTryoutAge, setNewTryoutAge] = useState<'U13' | 'U14' | 'U15' | 'U16' | 'U17' | 'U18'>('U14');
  const [newTryoutGender, setNewTryoutGender] = useState<'Boys' | 'Girls' | 'Co-ed'>('Girls');
  const [newTryoutDate, setNewTryoutDate] = useState('');
  const [newTryoutTime, setNewTryoutTime] = useState('1:00 PM – 3:00 PM');
  const [newTryoutVenue, setNewTryoutVenue] = useState('Pioneer School Gym');
  const [newTryoutFee, setNewTryoutFee] = useState('$20');

  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDivision, setNewTeamDivision] = useState('14U Girls Premier');
  const [newTeamHeadCoach, setNewTeamHeadCoach] = useState('');
  const [newTeamBadgeColor, setNewTeamBadgeColor] = useState('#ef4444');
  const [newTeamPractice, setNewTeamPractice] = useState('Mon & Wed 6:00 PM');
  const [newTeamPhotoUrl, setNewTeamPhotoUrl] = useState('');

  const [showAddCoach, setShowAddCoach] = useState(false);
  const [newCoachName, setNewCoachName] = useState('');
  const [newCoachRole, setNewCoachRole] = useState<'Head Coach' | 'Assistant Coach' | 'Technical Director'>('Head Coach');
  const [newCoachTeam, setNewCoachTeam] = useState('14U Red');
  const [newCoachEmail, setNewCoachEmail] = useState('');
  const [newCoachCerts, setNewCoachCerts] = useState('NCCP Development Coach');
  const [newCoachBio, setNewCoachBio] = useState('');
  const [newCoachPhotoUrl, setNewCoachPhotoUrl] = useState('');

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, onComplete: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onComplete(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const [showAddFee, setShowAddFee] = useState(false);
  const [newFeeDivision, setNewFeeDivision] = useState('14U Girls Competitive');
  const [newFeeTotal, setNewFeeTotal] = useState(1450);
  const [newFeeDeposit, setNewFeeDeposit] = useState(400);
  const [newFeeInstallments, setNewFeeInstallments] = useState('3 installments of $350');
  const [newFeeIncludes, setNewFeeIncludes] = useState('Uniform kit, Tournament fees, Gym rentals');

  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [newPolicyTitle, setNewPolicyTitle] = useState('');
  const [newPolicyCategory, setNewPolicyCategory] = useState<'Bylaws' | 'Code of Conduct' | 'Athlete Safety' | 'Refund Policy' | 'General'>('Code of Conduct');
  const [newPolicyContent, setNewPolicyContent] = useState('');

  React.useEffect(() => {
    setClubInfo(data.clubInfo);
    setAnnouncements(data.announcements || []);
    setTryouts(data.tryouts || []);
    setRegistrations(data.registrations || []);
    setTeams(data.teams || []);
    setCoaches(data.coaches || []);
    setFees(data.fees || []);
    setPolicies(data.policies || []);
  }, [data]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = data.clubInfo.adminPasscode || 'admin123';
    if (passcode === valid) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect passcode. Please try again.');
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setSaveSuccess(false);

    const updated: WildcardsClubData = {
      ...data,
      clubInfo,
      announcements,
      tryouts,
      registrations,
      teams,
      coaches,
      fees,
      policies,
    };

    const ok = await onUpdateClubData(updated);
    setSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // --- NEWS CRUD ---
  const handleAddNews = () => {
    if (!newNewsTitle.trim()) return;
    const newPost: Announcement = {
      id: `news-${Date.now()}`,
      title: newNewsTitle.trim(),
      slug: newNewsTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: newNewsCategory,
      summary: newNewsSummary.trim() || newNewsTitle,
      content: newNewsContent.trim() || newNewsSummary.trim() || newNewsTitle,
      date: new Date().toISOString().split('T')[0],
      author: 'Wildcards Staff',
      imageUrl: newNewsImage.trim() || undefined,
    };
    setAnnouncements([newPost, ...announcements]);
    setNewNewsTitle('');
    setNewNewsSummary('');
    setNewNewsContent('');
    setNewNewsImage('');
    setShowAddNews(false);
  };

  const handleUpdateNewsItem = (id: string, updatedFields: Partial<Announcement>) => {
    setAnnouncements(announcements.map((a) => (a.id === id ? { ...a, ...updatedFields } : a)));
  };

  const handleDeleteNews = (id: string) => {
    setAnnouncements(announcements.filter((a) => a.id !== id));
  };

  // --- TRYOUTS CRUD ---
  const handleAddTryout = () => {
    if (!newTryoutDate.trim()) return;
    const newSess: TryoutSession = {
      id: `tryout-${Date.now()}`,
      ageGroup: newTryoutAge,
      gender: newTryoutGender,
      date: newTryoutDate.trim(),
      time: newTryoutTime.trim(),
      venue: newTryoutVenue.trim(),
      address: clubInfo.mainGymAddress,
      fee: newTryoutFee.trim(),
      status: 'Registration Open',
    };
    setTryouts([newSess, ...tryouts]);
    setShowAddTryout(false);
  };

  const handleUpdateTryoutItem = (id: string, updatedFields: Partial<TryoutSession>) => {
    setTryouts(tryouts.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)));
  };

  const handleDeleteTryout = (id: string) => {
    setTryouts(tryouts.filter((t) => t.id !== id));
  };

  // --- TEAMS CRUD ---
  const handleAddTeam = () => {
    if (!newTeamName.trim()) return;
    const newT: TeamRosterInfo = {
      id: `team-${Date.now()}`,
      name: newTeamName.trim(),
      division: newTeamDivision.trim(),
      ageGroup: newTeamDivision.split(' ')[0] || 'U14',
      gender: newTeamDivision.includes('Boys') ? 'Boys' : 'Girls',
      badgeColor: newTeamBadgeColor,
      headCoach: newTeamHeadCoach.trim() || 'Staff Coach',
      practiceSchedule: newTeamPractice.trim() || 'TBD',
      homeGym: clubInfo.mainGymAddress,
      rosterCount: 12,
      teamPhotoUrl: newTeamPhotoUrl.trim() || undefined,
    };
    setTeams([...teams, newT]);
    setNewTeamName('');
    setNewTeamPhotoUrl('');
    setShowAddTeam(false);
  };

  const handleUpdateTeamItem = (id: string, updatedFields: Partial<TeamRosterInfo>) => {
    setTeams(teams.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)));
  };

  const handleDeleteTeam = (id: string) => {
    setTeams(teams.filter((t) => t.id !== id));
  };

  // --- COACHES CRUD ---
  const handleAddCoach = () => {
    if (!newCoachName.trim()) return;
    const newC: CoachProfile = {
      id: `coach-${Date.now()}`,
      name: newCoachName.trim(),
      role: newCoachRole as any,
      teamAssigned: newCoachTeam.trim(),
      email: newCoachEmail.trim() || clubInfo.email,
      certifications: newCoachCerts.split(',').map((c) => c.trim()).filter(Boolean),
      bio: newCoachBio.trim() || 'Experienced volleyball coach dedicated to athlete growth.',
      photoUrl: newCoachPhotoUrl.trim() || undefined,
    };
    setCoaches([...coaches, newC]);
    setNewCoachName('');
    setNewCoachPhotoUrl('');
    setShowAddCoach(false);
  };

  const handleUpdateCoachItem = (id: string, updatedFields: Partial<CoachProfile>) => {
    setCoaches(coaches.map((c) => (c.id === id ? { ...c, ...updatedFields } : c)));
  };

  const handleDeleteCoach = (id: string) => {
    setCoaches(coaches.filter((c) => c.id !== id));
  };

  // --- FEES CRUD ---
  const handleAddFee = () => {
    const newF: FeeItem = {
      id: `fee-${Date.now()}`,
      division: newFeeDivision.trim(),
      ageGroup: newFeeDivision.split(' ')[0] || 'U14',
      totalFee: Number(newFeeTotal) || 1400,
      depositAmount: Number(newFeeDeposit) || 400,
      monthlyPayments: newFeeInstallments.trim(),
      includes: newFeeIncludes.split(',').map((i) => i.trim()).filter(Boolean),
    };
    setFees([...fees, newF]);
    setShowAddFee(false);
  };

  const handleUpdateFeeItem = (id: string, updatedFields: Partial<FeeItem>) => {
    setFees(fees.map((f) => (f.id === id ? { ...f, ...updatedFields } : f)));
  };

  const handleDeleteFee = (id: string) => {
    setFees(fees.filter((f) => f.id !== id));
  };

  // --- POLICIES CRUD ---
  const handleAddPolicy = () => {
    if (!newPolicyTitle.trim()) return;
    const newP: ClubPolicy = {
      id: `policy-${Date.now()}`,
      title: newPolicyTitle.trim(),
      category: newPolicyCategory,
      summary: newPolicyTitle.trim(),
      content: newPolicyContent.trim() || newPolicyTitle.trim(),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setPolicies([...policies, newP]);
    setNewPolicyTitle('');
    setNewPolicyContent('');
    setShowAddPolicy(false);
  };

  const handleUpdatePolicyItem = (id: string, updatedFields: Partial<ClubPolicy>) => {
    setPolicies(policies.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)));
  };

  const handleDeletePolicy = (id: string) => {
    setPolicies(policies.filter((p) => p.id !== id));
  };

  // Export CSV
  const handleExportRegistrations = () => {
    if (registrations.length === 0) return alert('No tryout registrations to export yet.');

    const headers = ['Athlete Name', 'Age Group', 'Birth Year', 'Parent Name', 'Parent Email', 'Parent Phone', 'Position', 'Registered At'];
    const rows = registrations.map((r) => [
      `"${r.athleteName}"`,
      `"${r.ageGroup}"`,
      `"${r.birthYear}"`,
      `"${r.parentName}"`,
      `"${r.parentEmail}"`,
      `"${r.parentPhone}"`,
      `"${r.preferredPosition}"`,
      `"${r.registeredAt}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Wildcards_Tryout_Registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col h-[92vh]">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-black border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-black border border-zinc-800 p-0.5 shadow-md overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="Rocky Wildcards Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Executive Content Manager (CMS)
                {isAuthenticated && (
                  <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                    Authenticated
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400">Edit, create, and update all news, tryouts, rosters, coaches, fees & bylaws</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Area */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-10 flex-1 flex items-center justify-center">
            <form onSubmit={handleLogin} className="max-w-md w-full bg-black p-6 sm:p-8 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
              <div className="text-center space-y-1">
                <div className="h-12 w-12 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Key className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-white">Master Admin Access</h4>
                <p className="text-xs text-zinc-400">Enter passcode to unlock edit & creation controls</p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Passcode</label>
                <input
                  type="password"
                  placeholder="Enter passcode (Default: admin123)"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow-lg transition-all"
              >
                Unlock Executive CMS
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Tabs Navigation */}
            <div className="bg-black border-b border-zinc-800 px-4 py-2 flex items-center justify-between shrink-0 overflow-x-auto">
              <div className="flex items-center space-x-1">
                {[
                  { id: 'news', label: 'News Posts', icon: ShieldCheck },
                  { id: 'tryouts', label: 'Tryout Schedules', icon: Calendar },
                  { id: 'registrations', label: `Sign-ups (${registrations.length})`, icon: FileText },
                  { id: 'teams', label: 'Teams & Rosters', icon: Trophy },
                  { id: 'coaches', label: 'Coaches', icon: Users },
                  { id: 'fees', label: 'Athlete Fees', icon: DollarSign },
                  { id: 'policies', label: 'Policies & Bylaws', icon: FileText },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                        isActive
                          ? 'bg-red-600 text-white font-black'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Save All Changes & Sanity Studio button */}
              <div className="flex items-center space-x-2 shrink-0 ml-2">
                <a
                  href="/studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Sanity Studio CMS</span>
                </a>
                {saveSuccess && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Saved!</span>
                  </span>
                )}
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span>Save All Changes</span>
                </button>
              </div>
            </div>

            {/* Tab Panel Contents */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              
              {/* ======================================================== */}
              {/* TAB 1: NEWS POSTS */}
              {/* ======================================================== */}
              {activeTab === 'news' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Announcements & News Posts ({announcements.length})</h4>
                    <button
                      onClick={() => setShowAddNews(!showAddNews)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create News Post</span>
                    </button>
                  </div>

                  {/* Create News Form */}
                  {showAddNews && (
                    <div className="bg-black border border-red-500/40 p-4 rounded-2xl space-y-3 animate-in fade-in duration-200">
                      <h5 className="text-xs font-bold text-red-500">Create New Announcement</h5>
                      <input
                        type="text"
                        placeholder="Article Title"
                        value={newNewsTitle}
                        onChange={(e) => setNewNewsTitle(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={newNewsCategory}
                          onChange={(e) => setNewNewsCategory(e.target.value as any)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        >
                          <option value="General">General</option>
                          <option value="Tryouts">Tryouts</option>
                          <option value="Tournaments">Tournaments</option>
                          <option value="Club News">Club News</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Short Summary"
                          value={newNewsSummary}
                          onChange={(e) => setNewNewsSummary(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Full Article Content..."
                        value={newNewsContent}
                        onChange={(e) => setNewNewsContent(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white"
                      />

                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          placeholder="Featured Article Image URL (or upload below)..."
                          value={newNewsImage}
                          onChange={(e) => setNewNewsImage(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <label className="shrink-0 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl cursor-pointer text-xs font-bold transition-all">
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageFileUpload(e, (url) => setNewNewsImage(url))}
                          />
                        </label>
                      </div>
                      {newNewsImage && (
                        <div className="h-20 w-36 rounded-xl overflow-hidden border border-zinc-800 relative bg-black">
                          <img src={newNewsImage} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      )}

                      <button
                        onClick={handleAddNews}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
                      >
                        Publish Post
                      </button>
                    </div>
                  )}

                  {/* List of News Items with Edit & Delete */}
                  <div className="space-y-3">
                    {announcements.map((post) => {
                      const isEditing = editingNewsId === post.id;
                      return (
                        <div key={post.id} className="bg-black p-4 rounded-2xl border border-zinc-800 space-y-3">
                          {!isEditing ? (
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] bg-red-600/10 text-red-500 px-2 py-0.5 rounded font-bold">{post.category}</span>
                                  <span className="text-xs text-zinc-500">{post.date}</span>
                                </div>
                                <h5 className="text-sm font-bold text-white">{post.title}</h5>
                                <p className="text-xs text-zinc-400 line-clamp-2">{post.summary}</p>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  onClick={() => setEditingNewsId(post.id)}
                                  className="p-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-red-500/50"
                                  title="Edit Post"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteNews(post.id)}
                                  className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                                  title="Delete Post"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Inline Edit Form for News */
                            <div className="space-y-2 pt-1 border-t border-zinc-800 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-red-400">Editing Post: {post.title}</span>
                                <button
                                  onClick={() => setEditingNewsId(null)}
                                  className="text-xs text-zinc-400 hover:text-white"
                                >
                                  Close Editor
                                </button>
                              </div>
                              <input
                                type="text"
                                value={post.title}
                                onChange={(e) => handleUpdateNewsItem(post.id, { title: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                              />
                              <div className="flex flex-col sm:flex-row items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Article Banner Photo URL..."
                                  value={post.imageUrl || ''}
                                  onChange={(e) => handleUpdateNewsItem(post.id, { imageUrl: e.target.value })}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                />
                                <label className="shrink-0 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl cursor-pointer text-xs font-bold transition-all">
                                  Upload Photo
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageFileUpload(e, (url) => handleUpdateNewsItem(post.id, { imageUrl: url }))}
                                  />
                                </label>
                              </div>
                              {post.imageUrl && (
                                <div className="h-20 w-36 rounded-xl overflow-hidden border border-zinc-800 relative bg-black">
                                  <img src={post.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  value={post.category}
                                  onChange={(e) => handleUpdateNewsItem(post.id, { category: e.target.value as any })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                >
                                  <option value="General">General</option>
                                  <option value="Tryouts">Tryouts</option>
                                  <option value="Tournaments">Tournaments</option>
                                  <option value="Club News">Club News</option>
                                </select>
                                <input
                                  type="text"
                                  value={post.date}
                                  onChange={(e) => handleUpdateNewsItem(post.id, { date: e.target.value })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                />
                              </div>
                              <textarea
                                rows={2}
                                value={post.summary}
                                onChange={(e) => handleUpdateNewsItem(post.id, { summary: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-white"
                                placeholder="Summary..."
                              />
                              <textarea
                                rows={4}
                                value={post.content}
                                onChange={(e) => handleUpdateNewsItem(post.id, { content: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-white"
                                placeholder="Full Content..."
                              />
                              <button
                                onClick={async () => {
                                  setEditingNewsId(null);
                                  await handleSaveChanges();
                                }}
                                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md"
                              >
                                <span>Save & Apply Changes</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 2: TRYOUT SCHEDULES */}
              {/* ======================================================== */}
              {activeTab === 'tryouts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Tryout Sessions ({tryouts.length})</h4>
                    <button
                      onClick={() => setShowAddTryout(!showAddTryout)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Tryout Session</span>
                    </button>
                  </div>

                  {showAddTryout && (
                    <div className="bg-black border border-red-500/40 p-4 rounded-2xl space-y-3 animate-in fade-in duration-200">
                      <h5 className="text-xs font-bold text-red-500">New Tryout Session</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <select
                          value={newTryoutAge}
                          onChange={(e) => setNewTryoutAge(e.target.value as any)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        >
                          {['U13', 'U14', 'U15', 'U16', 'U17', 'U18'].map((a) => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                        <select
                          value={newTryoutGender}
                          onChange={(e) => setNewTryoutGender(e.target.value as any)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        >
                          <option value="Girls">Girls</option>
                          <option value="Boys">Boys</option>
                          <option value="Co-ed">Co-ed</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Date (e.g. Sept 20, 2026)"
                          value={newTryoutDate}
                          onChange={(e) => setNewTryoutDate(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="Time (e.g. 1:00 PM - 3:00 PM)"
                          value={newTryoutTime}
                          onChange={(e) => setNewTryoutTime(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <button
                        onClick={handleAddTryout}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
                      >
                        Add Tryout
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {tryouts.map((t) => {
                      const isEditing = editingTryoutId === t.id;
                      return (
                        <div key={t.id} className="bg-black p-4 rounded-2xl border border-zinc-800 space-y-3">
                          {!isEditing ? (
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="bg-red-600/10 text-red-500 text-xs font-black px-2 py-0.5 rounded">{t.ageGroup} {t.gender}</span>
                                  <span className="text-xs text-red-400 font-bold">{t.status}</span>
                                </div>
                                <p className="text-sm font-bold text-white mt-1">{t.date} • {t.time}</p>
                                <p className="text-xs text-zinc-400">{t.venue} ({t.fee})</p>
                              </div>

                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => setEditingTryoutId(t.id)}
                                  className="p-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-red-500/50"
                                  title="Edit Tryout"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTryout(t.id)}
                                  className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                                  title="Delete Tryout"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Inline Edit Form for Tryout */
                            <div className="space-y-2 pt-1 border-t border-zinc-800 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-red-400">Editing Tryout: {t.ageGroup} {t.gender}</span>
                                <button onClick={() => setEditingTryoutId(null)} className="text-xs text-zinc-400 hover:text-white">
                                  Close Editor
                                </button>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <select
                                  value={t.ageGroup}
                                  onChange={(e) => handleUpdateTryoutItem(t.id, { ageGroup: e.target.value as any })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                >
                                  {['U13', 'U14', 'U15', 'U16', 'U17', 'U18'].map((a) => (
                                    <option key={a} value={a}>{a}</option>
                                  ))}
                                </select>
                                <select
                                  value={t.gender}
                                  onChange={(e) => handleUpdateTryoutItem(t.id, { gender: e.target.value as any })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                >
                                  <option value="Girls">Girls</option>
                                  <option value="Boys">Boys</option>
                                  <option value="Co-ed">Co-ed</option>
                                </select>
                                <input
                                  type="text"
                                  value={t.date}
                                  onChange={(e) => handleUpdateTryoutItem(t.id, { date: e.target.value })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                  placeholder="Date..."
                                />
                                <input
                                  type="text"
                                  value={t.time}
                                  onChange={(e) => handleUpdateTryoutItem(t.id, { time: e.target.value })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                  placeholder="Time..."
                                />
                                <input
                                  type="text"
                                  value={t.venue}
                                  onChange={(e) => handleUpdateTryoutItem(t.id, { venue: e.target.value })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                  placeholder="Venue Name..."
                                />
                                <input
                                  type="text"
                                  value={t.address || ''}
                                  onChange={(e) => handleUpdateTryoutItem(t.id, { address: e.target.value })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                  placeholder="Address..."
                                />
                                <input
                                  type="text"
                                  value={t.fee || ''}
                                  onChange={(e) => handleUpdateTryoutItem(t.id, { fee: e.target.value })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                  placeholder="Fee (e.g. $20)..."
                                />
                                <select
                                  value={t.status}
                                  onChange={(e) => handleUpdateTryoutItem(t.id, { status: e.target.value as any })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                >
                                  <option value="Registration Open">Registration Open</option>
                                  <option value="Upcoming">Upcoming</option>
                                  <option value="Closed">Closed</option>
                                  <option value="Full">Full</option>
                                </select>
                              </div>
                              <input
                                type="text"
                                value={t.notes || ''}
                                onChange={(e) => handleUpdateTryoutItem(t.id, { notes: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                placeholder="Special notes (e.g. Bring water and indoor shoes)..."
                              />
                              <button
                                onClick={() => setEditingTryoutId(null)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
                              >
                                Done Editing
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 3: REGISTRATIONS VIEWER */}
              {/* ======================================================== */}
              {activeTab === 'registrations' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Athlete Registrations ({registrations.length})</h4>
                      <p className="text-xs text-zinc-400">List of all athletes registered online for tryouts</p>
                    </div>
                    <button
                      onClick={handleExportRegistrations}
                      className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-red-400 border border-zinc-700 font-bold text-xs rounded-xl flex items-center space-x-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  <div className="bg-black border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold">
                            <th className="p-3">Athlete Name</th>
                            <th className="p-3">Age Group</th>
                            <th className="p-3">Birth Year</th>
                            <th className="p-3">Parent / Contact</th>
                            <th className="p-3">Position</th>
                            <th className="p-3">Registered At</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-zinc-300">
                          {registrations.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-zinc-500 italic">
                                No tryout sign-ups received yet.
                              </td>
                            </tr>
                          ) : (
                            registrations.map((reg) => (
                              <tr key={reg.id} className="hover:bg-zinc-900/40">
                                <td className="p-3 font-bold text-white">{reg.athleteName}</td>
                                <td className="p-3">
                                  <span className="bg-red-600/10 text-red-500 font-bold px-2 py-0.5 rounded">
                                    {reg.ageGroup}
                                  </span>
                                </td>
                                <td className="p-3">{reg.birthYear}</td>
                                <td className="p-3">
                                  <div>{reg.parentName}</div>
                                  <div className="text-[11px] text-zinc-400">{reg.parentEmail} • {reg.parentPhone}</div>
                                </td>
                                <td className="p-3 font-semibold">{reg.preferredPosition}</td>
                                <td className="p-3 text-[11px] text-zinc-400">{new Date(reg.registeredAt).toLocaleDateString()}</td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => setRegistrations(registrations.filter((r) => r.id !== reg.id))}
                                    className="p-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                                    title="Delete Entry"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 4: TEAMS & ROSTERS */}
              {/* ======================================================== */}
              {activeTab === 'teams' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Club Teams ({teams.length})</h4>
                    <button
                      onClick={() => setShowAddTeam(!showAddTeam)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Club Team</span>
                    </button>
                  </div>

                  {showAddTeam && (
                    <div className="bg-black border border-red-500/40 p-4 rounded-2xl space-y-3 animate-in fade-in duration-200">
                      <h5 className="text-xs font-bold text-red-500">New Team Roster</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Team Name (e.g. 14U Red Wildcards)"
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="Division (e.g. 14U Girls Division 1)"
                          value={newTeamDivision}
                          onChange={(e) => setNewTeamDivision(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="Head Coach Name"
                          value={newTeamHeadCoach}
                          onChange={(e) => setNewTeamHeadCoach(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          placeholder="Team Photo URL (or upload below)..."
                          value={newTeamPhotoUrl}
                          onChange={(e) => setNewTeamPhotoUrl(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <label className="shrink-0 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl cursor-pointer text-xs font-bold transition-all">
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageFileUpload(e, (url) => setNewTeamPhotoUrl(url))}
                          />
                        </label>
                      </div>
                      {newTeamPhotoUrl && (
                        <div className="h-20 w-36 rounded-xl overflow-hidden border border-zinc-800 relative bg-black">
                          <img src={newTeamPhotoUrl} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <button
                        onClick={handleAddTeam}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
                      >
                        Create Team
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {teams.map((t) => {
                      const isEditing = editingTeamId === t.id;
                      return (
                        <div key={t.id} className="bg-black p-4 rounded-2xl border border-zinc-800 space-y-3">
                          {!isEditing ? (
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: t.badgeColor }} />
                                  <h5 className="text-sm font-bold text-white">{t.name}</h5>
                                </div>
                                <span className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded inline-block">{t.division}</span>
                                <p className="text-xs text-zinc-400">Head Coach: <strong className="text-white">{t.headCoach}</strong></p>
                                <p className="text-xs text-zinc-400">Practice: {t.practiceSchedule}</p>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  onClick={() => setEditingTeamId(t.id)}
                                  className="p-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-red-500/50"
                                  title="Edit Team"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTeam(t.id)}
                                  className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                                  title="Delete Team"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Inline Edit Form for Team */
                            <div className="space-y-2 pt-1 border-t border-zinc-800 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-red-400">Editing Team: {t.name}</span>
                                <button onClick={() => setEditingTeamId(null)} className="text-xs text-zinc-400 hover:text-white">
                                  Close Editor
                                </button>
                              </div>
                              <input
                                type="text"
                                value={t.name}
                                onChange={(e) => handleUpdateTeamItem(t.id, { name: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                placeholder="Team Name..."
                              />
                              <div className="flex flex-col sm:flex-row items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Team Photo URL..."
                                  value={t.teamPhotoUrl || ''}
                                  onChange={(e) => handleUpdateTeamItem(t.id, { teamPhotoUrl: e.target.value })}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                />
                                <label className="shrink-0 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl cursor-pointer text-xs font-bold transition-all">
                                  Upload Photo
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageFileUpload(e, (url) => handleUpdateTeamItem(t.id, { teamPhotoUrl: url }))}
                                  />
                                </label>
                              </div>
                              {t.teamPhotoUrl && (
                                <div className="h-20 w-36 rounded-xl overflow-hidden border border-zinc-800 relative bg-black">
                                  <img src={t.teamPhotoUrl} alt="Preview" className="h-full w-full object-cover" />
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={t.division}
                                  onChange={(e) => handleUpdateTeamItem(t.id, { division: e.target.value })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                  placeholder="Division..."
                                />
                                <input
                                  type="text"
                                  value={t.headCoach}
                                  onChange={(e) => handleUpdateTeamItem(t.id, { headCoach: e.target.value })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                  placeholder="Head Coach..."
                                />
                              </div>
                              <input
                                type="text"
                                value={t.practiceSchedule}
                                onChange={(e) => handleUpdateTeamItem(t.id, { practiceSchedule: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                placeholder="Practice Schedule..."
                              />
                              <button
                                onClick={async () => {
                                  setEditingTeamId(null);
                                  await handleSaveChanges();
                                }}
                                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md"
                              >
                                <span>Save & Apply Changes</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 5: COACHES */}
              {/* ======================================================== */}
              {activeTab === 'coaches' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Coaching Staff ({coaches.length})</h4>
                    <button
                      onClick={() => setShowAddCoach(!showAddCoach)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Coach Profile</span>
                    </button>
                  </div>

                  {showAddCoach && (
                    <div className="bg-black border border-red-500/40 p-4 rounded-2xl space-y-3 animate-in fade-in duration-200">
                      <h5 className="text-xs font-bold text-red-500">New Coach Profile</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          placeholder="Coach Full Name"
                          value={newCoachName}
                          onChange={(e) => setNewCoachName(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <select
                          value={newCoachRole}
                          onChange={(e) => setNewCoachRole(e.target.value as any)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        >
                          <option value="Head Coach">Head Coach</option>
                          <option value="Assistant Coach">Assistant Coach</option>
                          <option value="Technical Director">Technical Director</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Team Assigned"
                          value={newCoachTeam}
                          onChange={(e) => setNewCoachTeam(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="email"
                          placeholder="Contact Email"
                          value={newCoachEmail}
                          onChange={(e) => setNewCoachEmail(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Certifications (comma separated, e.g. NCCP Level 1, Safe Sport)"
                        value={newCoachCerts}
                        onChange={(e) => setNewCoachCerts(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <textarea
                        rows={2}
                        placeholder="Coach Bio..."
                        value={newCoachBio}
                        onChange={(e) => setNewCoachBio(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-white"
                      />
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          placeholder="Coach Headshot Photo URL (or upload below)..."
                          value={newCoachPhotoUrl}
                          onChange={(e) => setNewCoachPhotoUrl(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <label className="shrink-0 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl cursor-pointer text-xs font-bold transition-all">
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageFileUpload(e, (url) => setNewCoachPhotoUrl(url))}
                          />
                        </label>
                      </div>
                      {newCoachPhotoUrl && (
                        <div className="h-20 w-20 rounded-xl overflow-hidden border border-zinc-800 relative bg-black">
                          <img src={newCoachPhotoUrl} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <button
                        onClick={handleAddCoach}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
                      >
                        Create Profile
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {coaches.map((c) => {
                      const isEditing = editingCoachId === c.id;
                      return (
                        <div key={c.id} className="bg-black p-4 rounded-2xl border border-zinc-800 space-y-3">
                          {!isEditing ? (
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <h5 className="text-sm font-bold text-white">{c.name}</h5>
                                  <span className="text-xs font-bold text-red-500">{c.role}</span>
                                </div>
                                <p className="text-xs text-zinc-400">Team: {c.teamAssigned}</p>
                                {c.certifications && c.certifications.length > 0 && (
                                  <p className="text-[11px] text-amber-400 font-medium">
                                    Certs: {c.certifications.join(', ')}
                                  </p>
                                )}
                                <p className="text-xs text-zinc-500 line-clamp-2">{c.bio}</p>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  onClick={() => setEditingCoachId(c.id)}
                                  className="p-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-red-500/50"
                                  title="Edit Coach"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCoach(c.id)}
                                  className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                                  title="Delete Coach"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Inline Edit Form for Coach */
                            <div className="space-y-2 pt-1 border-t border-zinc-800 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-red-400">Editing Coach: {c.name}</span>
                                <button onClick={() => setEditingCoachId(null)} className="text-xs text-zinc-400 hover:text-white">
                                  Close Editor
                                </button>
                              </div>
                              <input
                                type="text"
                                value={c.name}
                                onChange={(e) => handleUpdateCoachItem(c.id, { name: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                placeholder="Coach Name..."
                              />
                              <div className="flex flex-col sm:flex-row items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Coach Headshot Photo URL..."
                                  value={c.photoUrl || ''}
                                  onChange={(e) => handleUpdateCoachItem(c.id, { photoUrl: e.target.value })}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                />
                                <label className="shrink-0 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl cursor-pointer text-xs font-bold transition-all">
                                  Upload Photo
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageFileUpload(e, (url) => handleUpdateCoachItem(c.id, { photoUrl: url }))}
                                  />
                                </label>
                              </div>
                              {c.photoUrl && (
                                <div className="h-20 w-20 rounded-xl overflow-hidden border border-zinc-800 relative bg-black">
                                  <img src={c.photoUrl} alt="Preview" className="h-full w-full object-cover object-top" />
                                </div>
                              )}
                              <div className="grid grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  value={c.role}
                                  onChange={(e) => handleUpdateCoachItem(c.id, { role: e.target.value as any })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                  placeholder="Role..."
                                />
                                <input
                                  type="text"
                                  value={c.teamAssigned}
                                  onChange={(e) => handleUpdateCoachItem(c.id, { teamAssigned: e.target.value })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                  placeholder="Team Assigned..."
                                />
                                <input
                                  type="email"
                                  value={c.email || ''}
                                  onChange={(e) => handleUpdateCoachItem(c.id, { email: e.target.value })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                  placeholder="Email..."
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-amber-400 block mb-1">Certifications (comma separated)</label>
                                <input
                                  type="text"
                                  value={c.certifications ? c.certifications.join(', ') : ''}
                                  onChange={(e) =>
                                    handleUpdateCoachItem(c.id, {
                                      certifications: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                                    })
                                  }
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                                  placeholder="e.g. NCCP Level 1, Safe Sport Certified"
                                />
                              </div>
                              <textarea
                                rows={3}
                                value={c.bio}
                                onChange={(e) => handleUpdateCoachItem(c.id, { bio: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-white"
                                placeholder="Bio..."
                              />
                              <button
                                onClick={async () => {
                                  setEditingCoachId(null);
                                  await handleSaveChanges();
                                }}
                                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md"
                              >
                                <span>Save & Apply Changes</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 6: FEES */}
              {/* ======================================================== */}
              {activeTab === 'fees' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Athlete Fee Schedules ({fees.length})</h4>
                    <button
                      onClick={() => setShowAddFee(!showAddFee)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Fee Tier</span>
                    </button>
                  </div>

                  {showAddFee && (
                    <div className="bg-black border border-red-500/40 p-4 rounded-2xl space-y-3 animate-in fade-in duration-200">
                      <h5 className="text-xs font-bold text-red-500">New Fee Structure</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          placeholder="Division (e.g. 14U Girls)"
                          value={newFeeDivision}
                          onChange={(e) => setNewFeeDivision(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="number"
                          placeholder="Total Fee ($)"
                          value={newFeeTotal}
                          onChange={(e) => setNewFeeTotal(Number(e.target.value))}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="number"
                          placeholder="Deposit ($)"
                          value={newFeeDeposit}
                          onChange={(e) => setNewFeeDeposit(Number(e.target.value))}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="Installment plan (e.g. 3 monthly payments of $350)"
                          value={newFeeInstallments}
                          onChange={(e) => setNewFeeInstallments(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="What's included (comma separated, e.g. Jersey, Gym Rental, 3 Tournaments, Provincials)"
                        value={newFeeIncludes}
                        onChange={(e) => setNewFeeIncludes(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <button
                        onClick={handleAddFee}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
                      >
                        Create Fee Tier
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {fees.map((f) => {
                      const isEditing = editingFeeId === f.id;
                      return (
                        <div key={f.id} className="bg-black p-4 rounded-2xl border border-zinc-800 space-y-3">
                          {!isEditing ? (
                            <div className="flex items-center justify-between gap-4">
                              <div className="space-y-1">
                                <h5 className="text-sm font-bold text-white">{f.division}</h5>
                                <p className="text-xs text-zinc-400">Total: <strong className="text-red-400">${f.totalFee}</strong> • Deposit: ${f.depositAmount} • {f.monthlyPayments}</p>
                                {f.includes && f.includes.length > 0 && (
                                  <p className="text-[11px] text-zinc-400">Includes: <span className="text-zinc-300">{f.includes.join(', ')}</span></p>
                                )}
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  onClick={() => setEditingFeeId(f.id)}
                                  className="p-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-red-500/50"
                                  title="Edit Fee Tier"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFee(f.id)}
                                  className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                                  title="Delete Fee Tier"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Inline Edit Form for Fee Tier */
                            <div className="space-y-2 pt-1 border-t border-zinc-800 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-red-400">Editing Fee Tier: {f.division}</span>
                                <button onClick={() => setEditingFeeId(null)} className="text-xs text-zinc-400 hover:text-white">
                                  Close Editor
                                </button>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  value={f.division}
                                  onChange={(e) => handleUpdateFeeItem(f.id, { division: e.target.value })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                  placeholder="Division..."
                                />
                                <input
                                  type="number"
                                  value={f.totalFee}
                                  onChange={(e) => handleUpdateFeeItem(f.id, { totalFee: Number(e.target.value) })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                  placeholder="Total Fee..."
                                />
                                <input
                                  type="number"
                                  value={f.depositAmount}
                                  onChange={(e) => handleUpdateFeeItem(f.id, { depositAmount: Number(e.target.value) })}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                  placeholder="Deposit..."
                                />
                              </div>
                              <input
                                type="text"
                                value={f.monthlyPayments}
                                onChange={(e) => handleUpdateFeeItem(f.id, { monthlyPayments: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                placeholder="Installment Schedule..."
                              />
                              <div>
                                <label className="text-[10px] font-bold text-red-400 block mb-1">Fee Inclusions (comma separated)</label>
                                <input
                                  type="text"
                                  value={f.includes ? f.includes.join(', ') : ''}
                                  onChange={(e) =>
                                    handleUpdateFeeItem(f.id, {
                                      includes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                                    })
                                  }
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                                  placeholder="e.g. Volleyball Canada Registration, Sublimated Jersey, Gym Rental"
                                />
                              </div>
                              <button
                                onClick={async () => {
                                  setEditingFeeId(null);
                                  await handleSaveChanges();
                                }}
                                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md"
                              >
                                <span>Save & Apply Changes</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 7: POLICIES & BYLAWS */}
              {/* ======================================================== */}
              {activeTab === 'policies' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Club Policies & Bylaws ({policies.length})</h4>
                    <button
                      onClick={() => setShowAddPolicy(!showAddPolicy)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Policy Document</span>
                    </button>
                  </div>

                  {showAddPolicy && (
                    <div className="bg-black border border-red-500/40 p-4 rounded-2xl space-y-3 animate-in fade-in duration-200">
                      <h5 className="text-xs font-bold text-red-500">New Club Policy Document</h5>
                      <input
                        type="text"
                        placeholder="Policy Title"
                        value={newPolicyTitle}
                        onChange={(e) => setNewPolicyTitle(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <select
                        value={newPolicyCategory}
                        onChange={(e) => setNewPolicyCategory(e.target.value as any)}
                        className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="Bylaws">Bylaws</option>
                        <option value="Code of Conduct">Code of Conduct</option>
                        <option value="Athlete Safety">Athlete Safety</option>
                        <option value="Refund Policy">Refund Policy</option>
                        <option value="General">General</option>
                      </select>
                      <textarea
                        rows={4}
                        placeholder="Policy Content..."
                        value={newPolicyContent}
                        onChange={(e) => setNewPolicyContent(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white"
                      />
                      <button
                        onClick={handleAddPolicy}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
                      >
                        Save Policy
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {policies.map((p) => {
                      const isEditing = editingPolicyId === p.id;
                      return (
                        <div key={p.id} className="bg-black p-4 rounded-2xl border border-zinc-800 space-y-3">
                          {!isEditing ? (
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] bg-red-600/10 text-red-500 px-2 py-0.5 rounded font-bold">{p.category}</span>
                                  <span className="text-xs text-zinc-500">Updated: {p.updatedAt}</span>
                                </div>
                                <h5 className="text-sm font-bold text-white">{p.title}</h5>
                                <p className="text-xs text-zinc-400 line-clamp-2">{p.content}</p>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  onClick={() => setEditingPolicyId(p.id)}
                                  className="p-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-red-500/50"
                                  title="Edit Policy"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePolicy(p.id)}
                                  className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                                  title="Delete Policy"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Inline Edit Form for Policy */
                            <div className="space-y-2 pt-1 border-t border-zinc-800 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-red-400">Editing Policy: {p.title}</span>
                                <button onClick={() => setEditingPolicyId(null)} className="text-xs text-zinc-400 hover:text-white">
                                  Close Editor
                                </button>
                              </div>
                              <input
                                type="text"
                                value={p.title}
                                onChange={(e) => handleUpdatePolicyItem(p.id, { title: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                              />
                              <textarea
                                rows={4}
                                value={p.content}
                                onChange={(e) => handleUpdatePolicyItem(p.id, { content: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-white"
                              />
                              <button
                                onClick={() => setEditingPolicyId(null)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
                              >
                                Done Editing
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 8: SETTINGS & FRONT PAGE CUSTOMIZATION */}
              {/* ======================================================== */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-2xl">
                  
                  {/* Top Announcement / Ticker Bar Section */}
                  <div className="bg-black p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">Top Announcement & Ticker Bar</h4>
                        <p className="text-xs text-zinc-400">Customize the top scrolling text bar (Sponsors, Announcements, Notices)</p>
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={clubInfo.announcementBarEnabled !== false}
                          onChange={(e) => setClubInfo({ ...clubInfo, announcementBarEnabled: e.target.checked })}
                          className="h-4 w-4 rounded accent-red-600"
                        />
                        <span className="text-xs font-bold text-zinc-300">Show Bar</span>
                      </label>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-400 block mb-1">Bar Label / Title</label>
                      <input
                        type="text"
                        placeholder="e.g. THANK YOU TO OUR SPONSORS: or IMPORTANT NOTICE:"
                        value={clubInfo.announcementBarLabel || ''}
                        onChange={(e) => setClubInfo({ ...clubInfo, announcementBarLabel: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-400 block mb-1">Bar Content / Ticker Text</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. RDWC • Icon Energy • Northern Metallic • Quindelle..."
                        value={clubInfo.announcementBarText || ''}
                        onChange={(e) => setClubInfo({ ...clubInfo, announcementBarText: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Front Page Hero Headline Customization */}
                  <div className="bg-black p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">Front Page Hero Headline</h4>
                      <p className="text-xs text-zinc-400">Edit main club titles, badges, and introductory text</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-400 block mb-1">Top Badge Text</label>
                        <input
                          type="text"
                          value={clubInfo.heroBadge || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, heroBadge: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-400 block mb-1">Title Line 1 (Grey)</label>
                        <input
                          type="text"
                          value={clubInfo.heroTitleLine1 || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, heroTitleLine1: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-400 block mb-1">Title Line 2 (Red Accent)</label>
                        <input
                          type="text"
                          value={clubInfo.heroTitleLine2 || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, heroTitleLine2: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-400 block mb-1">Title Line 3 (White Subtitle)</label>
                        <input
                          type="text"
                          value={clubInfo.heroTitleLine3 || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, heroTitleLine3: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-400 block mb-1">Hero Description Paragraph</label>
                      <textarea
                        rows={3}
                        value={clubInfo.heroDescription || ''}
                        onChange={(e) => setClubInfo({ ...clubInfo, heroDescription: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Front Page Featured Callout Card */}
                  <div className="bg-black p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">Front Page Featured Card</h4>
                      <p className="text-xs text-zinc-400">Edit the highlighted tryout / announcement card on the homepage hero</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-400 block mb-1">Card Badge Text</label>
                        <input
                          type="text"
                          value={clubInfo.heroCalloutBadge || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, heroCalloutBadge: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-400 block mb-1">Card Title</label>
                        <input
                          type="text"
                          value={clubInfo.heroCalloutTitle || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, heroCalloutTitle: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-400 block mb-1">Card Detailed Body Text</label>
                      <textarea
                        rows={3}
                        value={clubInfo.heroCalloutText || ''}
                        onChange={(e) => setClubInfo({ ...clubInfo, heroCalloutText: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Quick Metrics */}
                  <div className="bg-black p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">Homepage Quick Metrics</h4>
                      <p className="text-xs text-zinc-400">Edit the three stat boxes under the hero headline</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-400 block mb-1">Metric 1 Value</label>
                        <input
                          type="text"
                          value={clubInfo.metric1Value || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, metric1Value: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <label className="text-[10px] text-zinc-500 block mt-1">Label</label>
                        <input
                          type="text"
                          value={clubInfo.metric1Label || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, metric1Label: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-400 block mb-1">Metric 2 Value</label>
                        <input
                          type="text"
                          value={clubInfo.metric2Value || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, metric2Value: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <label className="text-[10px] text-zinc-500 block mt-1">Label</label>
                        <input
                          type="text"
                          value={clubInfo.metric2Label || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, metric2Label: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-400 block mb-1">Metric 3 Value</label>
                        <input
                          type="text"
                          value={clubInfo.metric3Value || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, metric3Value: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <label className="text-[10px] text-zinc-500 block mt-1">Label</label>
                        <input
                          type="text"
                          value={clubInfo.metric3Label || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, metric3Label: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PowerSchedule Integration Banner */}
                  <div className="bg-black p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">PowerSchedule Integration Banner</h4>
                      <p className="text-xs text-zinc-400">Edit the lower banner on the homepage promoting live schedules</p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-400 block mb-1">Banner Badge Text</label>
                      <input
                        type="text"
                        value={clubInfo.scheduleBannerBadge || ''}
                        onChange={(e) => setClubInfo({ ...clubInfo, scheduleBannerBadge: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-400 block mb-1">Banner Title</label>
                      <input
                        type="text"
                        value={clubInfo.scheduleBannerTitle || ''}
                        onChange={(e) => setClubInfo({ ...clubInfo, scheduleBannerTitle: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-400 block mb-1">Banner Paragraph Text</label>
                      <textarea
                        rows={2}
                        value={clubInfo.scheduleBannerText || ''}
                        onChange={(e) => setClubInfo({ ...clubInfo, scheduleBannerText: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Sub-Page Titles & Subtitles */}
                  <div className="bg-black p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">Sub-Page Titles & Subtitles</h4>
                      <p className="text-xs text-zinc-400">Customize main header titles across all sections</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-red-400 block mb-1">Tryouts Page Header</label>
                        <input
                          type="text"
                          placeholder="Title..."
                          value={clubInfo.tryoutsPageTitle || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, tryoutsPageTitle: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white mb-1"
                        />
                        <input
                          type="text"
                          placeholder="Subtitle..."
                          value={clubInfo.tryoutsPageSubtitle || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, tryoutsPageSubtitle: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 mb-2"
                        />
                        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2 mt-2">
                          <label className="text-[11px] font-bold text-amber-400 block">Tryout Guidelines & Rules Card</label>
                          <input
                            type="text"
                            placeholder="Card Badge / Title (e.g. Volleyball Alberta Signing Rules)"
                            value={clubInfo.tryoutInfoTitle || ''}
                            onChange={(e) => setClubInfo({ ...clubInfo, tryoutInfoTitle: e.target.value })}
                            className="w-full bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                          <textarea
                            rows={2}
                            placeholder="Rules / Guidelines Description Paragraph..."
                            value={clubInfo.tryoutInfoText || ''}
                            onChange={(e) => setClubInfo({ ...clubInfo, tryoutInfoText: e.target.value })}
                            className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                          />
                          <textarea
                            rows={2}
                            placeholder="What to Bring / Requirements Checklist..."
                            value={clubInfo.tryoutRequirementsText || ''}
                            onChange={(e) => setClubInfo({ ...clubInfo, tryoutRequirementsText: e.target.value })}
                            className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-red-400 block mb-1">Teams Page Header</label>
                        <input
                          type="text"
                          placeholder="Title..."
                          value={clubInfo.teamsPageTitle || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, teamsPageTitle: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white mb-1"
                        />
                        <input
                          type="text"
                          placeholder="Subtitle..."
                          value={clubInfo.teamsPageSubtitle || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, teamsPageSubtitle: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-red-400 block mb-1">News Page Header</label>
                        <input
                          type="text"
                          placeholder="Title..."
                          value={clubInfo.newsPageTitle || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, newsPageTitle: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white mb-1"
                        />
                        <input
                          type="text"
                          placeholder="Subtitle..."
                          value={clubInfo.newsPageSubtitle || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, newsPageSubtitle: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-red-400 block mb-1">Coaches Page Header</label>
                        <input
                          type="text"
                          placeholder="Title..."
                          value={clubInfo.coachesPageTitle || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, coachesPageTitle: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white mb-1"
                        />
                        <input
                          type="text"
                          placeholder="Subtitle..."
                          value={clubInfo.coachesPageSubtitle || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, coachesPageSubtitle: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-red-400 block mb-1">Fees Page Header</label>
                        <input
                          type="text"
                          placeholder="Title..."
                          value={clubInfo.feesPageTitle || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, feesPageTitle: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white mb-1"
                        />
                        <input
                          type="text"
                          placeholder="Subtitle..."
                          value={clubInfo.feesPageSubtitle || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, feesPageSubtitle: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-red-400 block mb-1">Policies Page Header</label>
                        <input
                          type="text"
                          placeholder="Title..."
                          value={clubInfo.policiesPageTitle || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, policiesPageTitle: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white mb-1"
                        />
                        <input
                          type="text"
                          placeholder="Subtitle..."
                          value={clubInfo.policiesPageSubtitle || ''}
                          onChange={(e) => setClubInfo({ ...clubInfo, policiesPageSubtitle: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Club General Info & Admin Passcode */}
                  <div className="bg-black p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <h4 className="text-sm font-bold text-white">General Club Info, Footer & Admin Passcode</h4>

                    <div>
                      <label className="text-xs font-bold text-zinc-400 block mb-1">Club Official Email</label>
                      <input
                        type="email"
                        value={clubInfo.email}
                        onChange={(e) => setClubInfo({ ...clubInfo, email: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-400 block mb-1">Main Gymnasium Address</label>
                      <input
                        type="text"
                        value={clubInfo.mainGymAddress}
                        onChange={(e) => setClubInfo({ ...clubInfo, mainGymAddress: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-400 block mb-1">PowerSchedule External Link URL</label>
                      <input
                        type="text"
                        value={clubInfo.schedulePortalUrl}
                        onChange={(e) => setClubInfo({ ...clubInfo, schedulePortalUrl: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-400 block mb-1">Footer Copyright Line</label>
                      <input
                        type="text"
                        value={clubInfo.footerCopyrightText || ''}
                        onChange={(e) => setClubInfo({ ...clubInfo, footerCopyrightText: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-400 block mb-1">Executive Admin Passcode</label>
                      <input
                        type="text"
                        value={clubInfo.adminPasscode}
                        onChange={(e) => setClubInfo({ ...clubInfo, adminPasscode: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
