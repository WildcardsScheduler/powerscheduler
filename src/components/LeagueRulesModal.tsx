'use client';

import React, { useState } from 'react';
import { LeagueSeason } from '@/types/league';
import { DEFAULT_LEAGUE_RULES } from '@/data/defaultRules';
import {
  X,
  BookOpen,
  Edit3,
  Check,
  Copy,Search,
  ShieldCheck,
  RotateCcw,
  Save
} from 'lucide-react';

interface LeagueRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  league: LeagueSeason;
  isAdmin: boolean;
  onSaveRules: (rulesText: string) => void;
}

export const LeagueRulesModal: React.FC<LeagueRulesModalProps> = ({
  isOpen,
  onClose,
  league,
  isAdmin,
  onSaveRules,
}) => {
  const currentRules = league.rulesContent || DEFAULT_LEAGUE_RULES;
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(currentRules);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reset the editor when the modal opens or the saved rules change
  // (state adjusted during render, per React's "reset state when a prop changes" pattern)
  const resetKey = `${isOpen}|${league.rulesContent ?? ''}`;
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setEditText(currentRules);
    setIsEditing(false);
    setSaveSuccess(false);
  }

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveRules(editText);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 600);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentRules);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  const handleResetDefault = () => {
    if (window.confirm('Reset rules text to the standard default template?')) {
      setEditText(DEFAULT_LEAGUE_RULES);
    }
  };

  // Simple Markdown-like Renderer for headings, bold, bullet points, and numbered lists
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');

    return (
      <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-2" />;
          }

          // Search highlight helper
          const isHighlighted =
            searchQuery.trim().length > 1 &&
            trimmed.toLowerCase().includes(searchQuery.toLowerCase().trim());

          // H1 Heading (# Heading)
          if (trimmed.startsWith('# ')) {
            return (
              <h1
                key={idx}
                className={`text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-4 pb-2 border-b border-slate-200 dark:border-slate-800 tracking-tight flex items-center gap-2 ${
                  isHighlighted ? 'bg-amber-500/20 px-2 rounded' : ''
                }`}
              >
                <span>{trimmed.substring(2)}</span>
              </h1>
            );
          }

          // H2 Heading (## Heading)
          if (trimmed.startsWith('## ')) {
            return (
              <h2
                key={idx}
                className={`text-base sm:text-lg font-extrabold text-amber-600 dark:text-amber-400 pt-3 pb-1 tracking-tight flex items-center gap-2 ${
                  isHighlighted ? 'bg-amber-500/20 px-2 rounded' : ''
                }`}
              >
                <span>{trimmed.substring(3)}</span>
              </h2>
            );
          }

          // H3 Heading (### Heading)
          if (trimmed.startsWith('### ')) {
            return (
              <h3
                key={idx}
                className={`text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 pt-2 pb-1 ${
                  isHighlighted ? 'bg-amber-500/20 px-2 rounded' : ''
                }`}
              >
                {trimmed.substring(4)}
              </h3>
            );
          }

          // Bullet Points (- Item or * Item)
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const itemText = trimmed.substring(2);
            return (
              <div
                key={idx}
                className={`flex items-start space-x-2.5 ml-2 ${
                  isHighlighted ? 'bg-amber-500/20 p-1.5 rounded' : ''
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400 mt-2 shrink-0" />
                <span className="text-slate-800 dark:text-slate-200">
                  {formatBoldInline(itemText)}
                </span>
              </div>
            );
          }

          // Numbered lists (1. Item)
          if (/^\d+\.\s/.test(trimmed)) {
            const match = trimmed.match(/^(\d+\.)\s(.*)/);
            if (match) {
              return (
                <div
                  key={idx}
                  className={`flex items-start space-x-2 ml-2 ${
                    isHighlighted ? 'bg-amber-500/20 p-1.5 rounded' : ''
                  }`}
                >
                  <span className="text-amber-600 dark:text-amber-400 font-mono font-bold text-xs shrink-0 mt-0.5">
                    {match[1]}
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {formatBoldInline(match[2])}
                  </span>
                </div>
              );
            }
          }

          // Standard Paragraph
          return (
            <p
              key={idx}
              className={`text-slate-700 dark:text-slate-300 ${
                isHighlighted ? 'bg-amber-500/20 p-1 rounded' : ''
              }`}
            >
              {formatBoldInline(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  // Helper to format **bold** in lines
  const formatBoldInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-slate-900 dark:text-white font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[90vh] flex flex-col transition-colors duration-150">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Official League Rules & Guidelines
                </h3>
                <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {league.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official rules, scoring formats, eligibility, and code of conduct
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Controls & Search Toolbar */}
        <div className="p-3.5 bg-slate-100/70 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {!isEditing ? (
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search rules (e.g. forfeit, net, scoring)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 shadow-xs"
              />
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
              <Edit3 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span>Admin Rules Editor (Supports Markdown & Plain Text)</span>
            </div>
          )}

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {!isEditing ? (
              <>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
                  title="Copy Full Rules to Clipboard"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md shadow-violet-600/20 flex items-center space-x-1.5 transition-all"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit / Paste Rules</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleResetDefault}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Default Template</span>
                </button>

                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-all"
                >
                  {saveSuccess ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                  <span>{saveSuccess ? 'Saved!' : 'Save Rules'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <div className="p-3 bg-violet-500/10 border border-violet-500/30 rounded-2xl text-xs text-violet-800 dark:text-violet-300 flex items-start space-x-2">
                <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <strong>League Admin Rule Editor:</strong> Paste your official league rules, guidelines, substitution policies, and code of conduct below. You can use standard formatting such as <code># Header</code>, <code>## Subheader</code>, <code>- Bullet Points</code>, and <code>**Bold Text**</code>.
                </div>
              </div>

              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={18}
                placeholder="Paste your league rules and policies here..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed resize-y shadow-xs"
              />
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              {renderFormattedContent(currentRules)}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span>Active for <strong className="text-slate-800 dark:text-slate-200">{league.name}</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs shadow-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
