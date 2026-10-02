'use client';

import React from 'react';

/** Card border for exhibition games: dashed amber so they stand out at a glance in a long list. */
export const EXHIBITION_CARD_BORDER = 'border-dashed border-amber-400 dark:border-amber-500/60';

/** Small amber pill marking a game as an exhibition (doesn't count in standings). */
export const ExhibitionBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    title="Exhibition game: not counted in standings"
    className={`inline-flex items-center shrink-0 whitespace-nowrap bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${className}`}
  >
    Exhibition
  </span>
);

/** Pill plus a short explanation, for use on a full-width line of a game card. */
export const ExhibitionNotice: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-amber-700 dark:text-amber-400 ${className}`}>
    <ExhibitionBadge />
    <span className="font-medium">Not counted in standings</span>
  </div>
);
