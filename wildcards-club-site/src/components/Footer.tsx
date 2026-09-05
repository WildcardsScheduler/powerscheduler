'use client';

import React from 'react';
import { Volleyball, MapPin, Mail, Phone, ExternalLink, Heart } from 'lucide-react';
import { ClubInfo } from '@/types/club';

interface FooterProps {
  clubInfo: ClubInfo;
  setActiveTab: (tab: string) => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  clubInfo,
  setActiveTab,
  onOpenAdmin,
}) => {
  return (
    <footer className="bg-black border-t border-zinc-800 text-zinc-400 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Col 1: Club Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-2xl bg-black p-1 flex items-center justify-center shadow-lg shadow-red-600/20 border border-zinc-800 overflow-hidden">
                <img src="/logo.png" alt="Rocky Wildcards Logo" className="h-full w-full object-contain" />
              </div>
              <div className="text-lg font-black tracking-tight flex items-center space-x-1.5">
                <span className="text-white">ROCKY</span>
                <span className="text-red-500">WILDCARDS</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
              {clubInfo.description}
            </p>
            <div className="pt-2 flex items-center space-x-3 text-xs text-zinc-300">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 font-semibold text-red-400">
                Volleyball Alberta Member Club
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white border-b border-red-600 pb-1 inline-block">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveTab('home')} className="hover:text-red-500 transition-colors">
                  Club Home
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('tryouts')} className="hover:text-red-500 transition-colors">
                  Tryouts & Sign-Up
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('teams')} className="hover:text-red-500 transition-colors">
                  Teams & Rosters
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('coaches')} className="hover:text-red-500 transition-colors">
                  Coaching Staff
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('fees')} className="hover:text-red-500 transition-colors">
                  Athlete Fees & Financials
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('policies')} className="hover:text-red-500 transition-colors">
                  Bylaws & Policies
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Facility */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white border-b border-red-600 pb-1 inline-block">Contact & Gymnasium</h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span>{clubInfo.mainGymAddress}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-red-500 shrink-0" />
                <a href={`mailto:${clubInfo.email}`} className="hover:text-white transition-colors">
                  {clubInfo.email}
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-red-500 shrink-0" />
                <span>{clubInfo.phone}</span>
              </div>
            </div>

            <div className="pt-3">
              <a
                href={clubInfo.schedulePortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 text-red-400 border border-red-600/30 font-bold text-xs hover:bg-red-600/20 transition-all"
              >
                <span>Live PowerSchedule Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright & admin portal shortcut */}
        <div className="mt-12 pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} {clubInfo.footerCopyrightText || 'ROCKY WILDCARDS VOLLEYBALL CLUB. All rights reserved.'}</p>
          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenAdmin}
              className="text-zinc-400 hover:text-red-400 font-semibold underline transition-colors"
            >
              Executive Admin Portal
            </button>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <span>Crafted for</span>
              <Heart className="h-3 w-3 text-red-500 fill-red-500" />
              <span>Youth Sports</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
