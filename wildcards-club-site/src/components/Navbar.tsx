'use client';

import React from 'react';
import { Volleyball, Calendar, Trophy, Users, ShieldCheck, DollarSign, FileText, Lock, ExternalLink, Menu, X, Heart } from 'lucide-react';
import { ClubInfo } from '@/types/club';

interface NavbarProps {
  clubInfo: ClubInfo;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  clubInfo,
  activeTab,
  setActiveTab,
  onOpenAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Volleyball },
    { id: 'tryouts', label: 'Tryouts', icon: Calendar },
    { id: 'teams', label: 'Our Teams', icon: Trophy },
    { id: 'news', label: 'News', icon: ShieldCheck },
    { id: 'coaches', label: 'Coaches', icon: Users },
    { id: 'fees', label: 'Fees', icon: DollarSign },
    { id: 'policies', label: 'Club Policies', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-zinc-800 shadow-2xl">
      
      {/* Official Top Announcement / Sponsor Bar */}
      {clubInfo.announcementBarEnabled !== false && (
        <div className="bg-zinc-950 border-b border-zinc-900 py-1.5 px-4 text-[11px] font-bold overflow-x-auto whitespace-nowrap scrollbar-none flex items-center justify-center gap-3">
          <span className="text-amber-400 font-black tracking-wider uppercase shrink-0 flex items-center gap-1">
            <Heart className="h-3 w-3 fill-amber-400" />
            <span>{clubInfo.announcementBarLabel || 'Thank You To Our Sponsors:'}</span>
          </span>
          <span className="text-zinc-400 font-medium tracking-wide">
            {clubInfo.announcementBarText || 'RDWC • Icon Energy • Northern Metallic • Quindelle • InPlay Oil • R.D.O.T • JC Inspections • A.P. Industries • Spartan Delta • Terra Firma • Rocky Credit Union • Hymark'}
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Name */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center space-x-3.5 cursor-pointer group"
          >
            <div className="h-12 w-12 rounded-2xl bg-black p-1 shadow-lg shadow-red-600/20 border border-zinc-800 group-hover:border-red-500/60 group-hover:scale-105 transition-all flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Rocky Wildcards Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight leading-none flex items-center space-x-1.5">
                <span className="text-white">{clubInfo.heroTitleLine1 || 'ROCKY'}</span>
                <span className="text-red-500">{clubInfo.heroTitleLine2 || 'WILDCARDS'}</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase block mt-0.5">
                {clubInfo.heroTitleLine3 || 'VOLLEYBALL CLUB'} • ALBERTA YOUTH
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-red-600 text-white font-extrabold shadow-md shadow-red-600/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions: Live Schedule Button & Admin Auth */}
          <div className="hidden sm:flex items-center space-x-3">
            <a
              href={clubInfo.schedulePortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm group"
              title="Open Live League Schedule Portal"
            >
              <span>PowerSchedule</span>
              <ExternalLink className="h-3.5 w-3.5 text-red-500 group-hover:translate-x-0.5 transition-transform" />
            </a>

            <button
              onClick={onOpenAdmin}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 active:scale-98 transition-all flex items-center space-x-1.5"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Admin CMS</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={onOpenAdmin}
              className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center space-x-1"
            >
              <Lock className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-black border-b border-zinc-800 px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full p-3 rounded-xl text-sm font-bold flex items-center space-x-3 ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          
          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <a
              href={clubInfo.schedulePortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-3 rounded-xl bg-zinc-900 text-red-400 border border-zinc-800 font-bold text-sm flex items-center justify-between"
            >
              <span>Live PowerSchedule Portal</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
