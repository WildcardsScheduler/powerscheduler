'use client';

import React, { useState } from 'react';

export const MIN_TEAM_COUNT = 2;
export const MAX_TEAM_COUNT = 64;

interface TeamCountInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  ariaLabel?: string;
}

const clamp = (n: number) => Math.min(MAX_TEAM_COUNT, Math.max(MIN_TEAM_COUNT, Math.round(n)));

/**
 * Number box for a team capacity. Lets the field be cleared while typing and
 * settles on a whole number between MIN_TEAM_COUNT and MAX_TEAM_COUNT when it loses focus.
 */
export const TeamCountInput: React.FC<TeamCountInputProps> = ({ value, onChange, className, ariaLabel }) => {
  const [draft, setDraft] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);

  // Follow outside changes (e.g. switching to a different league to edit)
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(String(value));
  }

  const commit = () => {
    const parsed = Number(draft);
    const next = draft.trim() === '' || !Number.isFinite(parsed) ? value : clamp(parsed);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      min={MIN_TEAM_COUNT}
      max={MAX_TEAM_COUNT}
      step={1}
      value={draft}
      aria-label={ariaLabel}
      onChange={(e) => {
        setDraft(e.target.value);
        const parsed = Number(e.target.value);
        if (e.target.value.trim() !== '' && Number.isInteger(parsed) && parsed >= MIN_TEAM_COUNT && parsed <= MAX_TEAM_COUNT) {
          setLastValue(parsed);
          onChange(parsed);
        }
      }}
      onBlur={commit}
      className={className}
    />
  );
};
