'use client';

import React from 'react';
import { X, Calendar, User } from 'lucide-react';
import { Announcement } from '@/types/club';

interface NewsReaderModalProps {
  article: Announcement | null;
  isOpen: boolean;
  onClose: () => void;
}

export const NewsReaderModal: React.FC<NewsReaderModalProps> = ({
  article,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-black border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600/10 text-red-500 border border-red-500/20">
              {article.category}
            </span>
            {article.isPinned && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                📌 Pinned
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-4 flex-1">
          {article.imageUrl && (
            <div className="h-56 w-full rounded-2xl bg-black border border-zinc-800 overflow-hidden relative mb-4">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
            {article.title}
          </h2>

          <div className="flex items-center space-x-4 text-xs text-zinc-400 border-b border-zinc-800 pb-3">
            <span className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5 text-red-500" />
              <span>{article.date}</span>
            </span>
            <span className="flex items-center space-x-1">
              <User className="h-3.5 w-3.5 text-red-500" />
              <span>{article.author}</span>
            </span>
          </div>

          <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line pt-2">
            {article.content}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-black border-t border-zinc-800 flex items-center justify-between shrink-0 text-xs text-zinc-400">
          <span>Rocky Wildcards Volleyball Club Media</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-all"
          >
            Close Reader
          </button>
        </div>

      </div>
    </div>
  );
};
