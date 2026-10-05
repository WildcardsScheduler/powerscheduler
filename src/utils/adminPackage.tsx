'use client';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { LeagueSeason } from '@/types/league';
import { buildTeamCalendar, matchLocationName, safeFileName } from '@/utils/teamCalendar';
import { CaptainPacketSheet } from '@/components/CaptainPacketSheet';
import { TeamPrintSheet } from '@/components/PrintScheduleModal';
import { RulesPrintSheet } from '@/components/RulesPrintSheet';
import { DEFAULT_LEAGUE_RULES } from '@/data/defaultRules';

/**
 * Admin package: a zip with one folder per team holding that team's schedule, captain quick
 * start (with the team PIN) and league rules as PDFs, plus a calendar file. Built entirely in the
 * browser; the PDF/zip libraries load only when an admin asks for a package.
 */

// US Letter with 0.5in margins. Sheets are laid out at 96 CSS px per inch.
const PAGE_W_IN = 8.5;
const PAGE_H_IN = 11;
const MARGIN_IN = 0.5;
const PX_PER_IN = 96;
const CONTENT_W_PX = (PAGE_W_IN - 2 * MARGIN_IN) * PX_PER_IN; // 720
const CONTENT_H_PX = (PAGE_H_IN - 2 * MARGIN_IN) * PX_PER_IN; // 960
const RENDER_SCALE = 2; // sharp enough to print

export interface PackageProgress {
  done: number;
  total: number;
  label: string;
}

// ---------------------------------------------------------------------------
// Rendering sheets to PDF
// ---------------------------------------------------------------------------

type Libraries = {
  JSZip: typeof import('jszip');
  jsPDF: typeof import('jspdf').jsPDF;
  htmlToImage: typeof import('html-to-image');
};

async function loadLibraries(): Promise<Libraries> {
  const [jszip, jspdf, htmlToImage] = await Promise.all([import('jszip'), import('jspdf'), import('html-to-image')]);
  return { JSZip: jszip.default, jsPDF: jspdf.jsPDF, htmlToImage };
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 30)));

/** Renders a sheet off-screen at paper width and returns the element, plus a cleanup function. */
async function mountSheet(sheet: React.ReactNode): Promise<{ element: HTMLElement; unmount: () => void }> {
  const host = document.createElement('div');
  // .force-light keeps the sheet in light colours even when the app is in dark mode
  host.className = 'force-light';
  host.style.cssText = `position:fixed;left:-20000px;top:0;width:${CONTENT_W_PX}px;background:#fff;color:#0f172a;pointer-events:none;`;
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(<div style={{ width: CONTENT_W_PX, background: '#fff' }}>{sheet}</div>);
  await nextFrame();
  await nextFrame();
  await document.fonts?.ready;
  await Promise.all(
    Array.from(host.querySelectorAll('img')).map((img) => (img.complete ? null : img.decode().catch(() => null)))
  );
  return {
    element: host.firstElementChild as HTMLElement,
    unmount: () => {
      root.unmount();
      host.remove();
    },
  };
}

/** True when a pixel row of the image is a single flat colour (blank space, a background band or a rule line). */
function isBlankRow(ctx: CanvasRenderingContext2D, y: number, width: number): boolean {
  const row = ctx.getImageData(0, y, width, 1).data;
  const [r, g, b] = [row[0], row[1], row[2]];
  for (let i = 4; i < row.length; i += 4) {
    if (Math.abs(row[i] - r) > 10 || Math.abs(row[i + 1] - g) > 10 || Math.abs(row[i + 2] - b) > 10) return false;
  }
  return true;
}

/**
 * Page break positions (in image pixels). Breaks prefer the end of a table row or text block, and
 * are always checked against the rendered image so they land on blank space, never through text.
 */
function pageBreaks(element: HTMLElement, canvas: HTMLCanvasElement, fitOnePage: boolean): number[] {
  const height = canvas.height;
  const ratio = canvas.height / element.scrollHeight;
  const pageHeight = Math.floor(CONTENT_H_PX * ratio);
  if (fitOnePage || height <= pageHeight) return [height];

  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const top = element.getBoundingClientRect().top;
  const preferred = Array.from(element.querySelectorAll('tbody, tr, [data-break-ok]'))
    .map((el) => Math.round((el.getBoundingClientRect().bottom - top) * ratio))
    .sort((a, b) => b - a);

  // A blank row at (or just around) y, if there is one
  const blankNear = (y: number, reach: number) => {
    for (let d = 0; d <= reach; d++) {
      if (y - d > 0 && isBlankRow(ctx, y - d, canvas.width)) return y - d;
      if (d > 0 && y + d < height && isBlankRow(ctx, y + d, canvas.width)) return y + d;
    }
    return -1;
  };

  const breaks: number[] = [];
  let start = 0;
  while (height - start > pageHeight) {
    const limit = start + pageHeight;
    const minimum = start + Math.floor(pageHeight * 0.5);
    let end = -1;
    // 1. The lowest row/block end that fits and sits on blank space
    for (const y of preferred) {
      if (y > limit || y < minimum) continue;
      const blank = blankNear(y, 6);
      if (blank > minimum && blank <= limit) {
        end = blank;
        break;
      }
    }
    // 2. Otherwise the lowest blank pixel row that fits
    for (let y = limit; end === -1 && y > minimum; y--) {
      if (isBlankRow(ctx, y, canvas.width)) end = y;
    }
    if (end === -1) end = limit;
    breaks.push(end);
    start = end;
  }
  breaks.push(height);
  return breaks;
}

async function sheetToPdf(
  libs: Libraries,
  sheet: React.ReactNode,
  fontEmbedCSS: { value?: string },
  options: { fitOnePage?: boolean; title: string }
): Promise<Blob> {
  const { element, unmount } = await mountSheet(sheet);
  try {
    // Web fonts are embedded once and reused for every sheet (the slowest part of capturing)
    if (fontEmbedCSS.value === undefined) {
      fontEmbedCSS.value = await libs.htmlToImage.getFontEmbedCSS(element).catch(() => '');
    }
    const canvas = await libs.htmlToImage.toCanvas(element, {
      pixelRatio: RENDER_SCALE,
      backgroundColor: '#ffffff',
      fontEmbedCSS: fontEmbedCSS.value,
      width: CONTENT_W_PX,
    });
    // Breaks are in image pixels; ratio converts them back to CSS px for page sizing
    const breaks = pageBreaks(element, canvas, Boolean(options.fitOnePage));
    const ratio = canvas.height / element.scrollHeight;

    const pdf = new libs.jsPDF({ unit: 'in', format: 'letter', orientation: 'portrait', compress: true });
    pdf.setProperties({ title: options.title, creator: 'PowerSchedule' });
    let start = 0;
    breaks.forEach((end, pageIndex) => {
      if (pageIndex > 0) pdf.addPage();
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = Math.max(1, end - start);
      const ctx = slice.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, start, canvas.width, slice.height, 0, 0, slice.width, slice.height);

      // Fit to the printable area (a one-page sheet that runs long is scaled down, not cut)
      const maxW = PAGE_W_IN - 2 * MARGIN_IN;
      const maxH = PAGE_H_IN - 2 * MARGIN_IN;
      let w = maxW;
      let h = (end - start) / ratio / PX_PER_IN;
      if (h > maxH) {
        w = (maxW * maxH) / h;
        h = maxH;
      }
      pdf.addImage(slice, 'PNG', MARGIN_IN + (maxW - w) / 2, MARGIN_IN, w, h, undefined, 'FAST');
      start = end;
    });
    return pdf.output('blob');
  } finally {
    unmount();
  }
}

// ---------------------------------------------------------------------------
// Package
// ---------------------------------------------------------------------------

export async function buildAdminPackage(
  league: LeagueSeason,
  onProgress?: (progress: PackageProgress) => void
): Promise<{ blob: Blob; fileName: string; teamCount: number }> {
  const libs = await loadLibraries();
  const zip = new libs.JSZip();
  const rootName = safeFileName(`${league.name} - Team Packages`);
  const root = zip.folder(rootName)!;
  const fontEmbedCSS: { value?: string } = {};
  const leagueName = league.name;

  const divisionOrder = new Map(league.divisions.map((d, i) => [d.id, i]));
  const teams = [...league.teams].sort(
    (a, b) =>
      (divisionOrder.get(a.divisionId) ?? 99) - (divisionOrder.get(b.divisionId) ?? 99) || a.name.localeCompare(b.name)
  );
  const total = teams.length * 3 + 1;
  let done = 0;
  const step = (label: string) => onProgress?.({ done, total, label });

  // The rules are the same for every team: render once, copy into each folder
  step('League rules');
  const rulesPdf = await sheetToPdf(
    libs,
    <RulesPrintSheet rules={league.rulesContent || DEFAULT_LEAGUE_RULES} leagueName={leagueName} />,
    fontEmbedCSS,
    { title: `${leagueName} - League Rules` }
  );
  done++;

  const usedFolderNames = new Set<string>();
  for (const team of teams) {
    const division = league.divisions.find((d) => d.id === team.divisionId);
    let folderName = safeFileName(team.name);
    for (let n = 2; usedFolderNames.has(folderName.toLowerCase()); n++) folderName = safeFileName(`${team.name} (${n})`);
    usedFolderNames.add(folderName.toLowerCase());
    const folder = root.folder(folderName)!;
    const fileBase = safeFileName(team.name);

    step(`${team.name}: schedule`);
    const schedulePdf = await sheetToPdf(
      libs,
      <TeamPrintSheet
        teamId={team.id}
        matches={league.matches.filter((m) => m.divisionId === team.divisionId)}
        teams={league.teams}
        locations={league.locations}
        currentDivisionName={division?.name}
        leagueName={leagueName}
        getMatchLocationName={(m) => matchLocationName(league, m)}
      />,
      fontEmbedCSS,
      { title: `${team.name} - Schedule` }
    );
    folder.file(`${fileBase} - Schedule.pdf`, schedulePdf);
    done++;

    step(`${team.name}: captain quick start`);
    const quickStartPdf = await sheetToPdf(
      libs,
      <CaptainPacketSheet team={team} divisionName={division?.name} />,
      fontEmbedCSS,
      { fitOnePage: true, title: `${team.name} - Captain Quick Start` }
    );
    folder.file(`${fileBase} - Captain Quick Start.pdf`, quickStartPdf);
    done++;

    folder.file(`${fileBase} - League Rules.pdf`, rulesPdf);
    folder.file(`${fileBase} - Calendar.ics`, buildTeamCalendar(league, team));
    done++;
  }

  step('Zipping');
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const today = new Date();
  const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return { blob, fileName: `${rootName} ${stamp}.zip`, teamCount: teams.length };
}
