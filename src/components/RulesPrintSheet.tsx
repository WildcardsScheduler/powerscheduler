'use client';

import React from 'react';

interface RulesPrintSheetProps {
  rules: string; // Markdown-style rules text (# headings, - bullets, 1. lists, **bold**)
  leagueName: string;
}

const withBold = (text: string) =>
  text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  );

/**
 * League rules laid out for paper (always light). Every block is marked data-break-ok so a
 * PDF page break can fall between blocks rather than through a line of text.
 */
export const RulesPrintSheet: React.FC<RulesPrintSheetProps> = ({ rules, leagueName }) => {
  const lines = rules.split('\n').map((l) => l.trim()).filter(Boolean);
  const hasTitle = lines[0]?.startsWith('# ');

  return (
    <div className="rules-sheet">
      {!hasTitle && <h1 data-break-ok>League Rules</h1>}
      <p className="rs-eyebrow" data-break-ok>
        {leagueName}
      </p>
      {lines.map((line, idx) => {
        if (line.startsWith('# ')) return <h1 key={idx} data-break-ok>{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={idx} data-break-ok>{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={idx} data-break-ok>{line.slice(4)}</h3>;
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <div key={idx} className="rs-item" data-break-ok>
              <span className="rs-dot">•</span>
              <span>{withBold(line.slice(2))}</span>
            </div>
          );
        const numbered = line.match(/^(\d+\.)\s(.*)/);
        if (numbered)
          return (
            <div key={idx} className="rs-item" data-break-ok>
              <span className="rs-num">{numbered[1]}</span>
              <span>{withBold(numbered[2])}</span>
            </div>
          );
        return (
          <p key={idx} data-break-ok>
            {withBold(line)}
          </p>
        );
      })}

      <style jsx>{`
        .rules-sheet {
          background: #fff;
          color: #0f172a;
          font-size: 10pt;
          line-height: 1.45;
        }
        .rules-sheet :global(strong) {
          font-weight: 700;
        }
        h1 {
          font-size: 19pt;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.15;
          padding-bottom: 6px;
          border-bottom: 3px solid #0f172a;
        }
        .rs-eyebrow {
          margin-top: 4px;
          margin-bottom: 6px;
          font-size: 8pt;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #64748b;
        }
        h1 + .rs-eyebrow {
          margin-top: 6px;
        }
        h2 {
          margin-top: 14px;
          padding-bottom: 3px;
          font-size: 12.5pt;
          font-weight: 800;
          color: #b45309;
          border-bottom: 1px solid #e2e8f0;
        }
        h3 {
          margin-top: 10px;
          font-size: 11pt;
          font-weight: 800;
        }
        p {
          margin-top: 6px;
        }
        .rs-item {
          display: flex;
          gap: 8px;
          margin-top: 5px;
          padding-left: 4px;
        }
        .rs-dot {
          color: #d97706;
          font-weight: 900;
          flex: none;
        }
        .rs-num {
          color: #b45309;
          font-weight: 800;
          flex: none;
          min-width: 18px;
        }
      `}</style>
    </div>
  );
};
