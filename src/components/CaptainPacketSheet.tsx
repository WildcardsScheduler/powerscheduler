'use client';

import React from 'react';
import { Team } from '@/types/league';

interface CaptainPacketSheetProps {
  team: Team;
  divisionName?: string;
}

// One-page Team Captain Quick Start, pre-filled with the team's name and login PIN.
// Styled as a fixed "paper" page (always light) so the screen preview matches the print.
export const CaptainPacketSheet: React.FC<CaptainPacketSheetProps> = ({ team, divisionName }) => {
  const pinDigits = (team.accessPin || '').padEnd(4, ' ').slice(0, 4).split('');

  return (
    <div className="captain-packet">
      <header className="cp-header">
        <div className="cp-titles">
          <div className="cp-eyebrow">
            Rocky Wildcards Volleyball League{divisionName ? ` · ${divisionName}` : ''}
          </div>
          <h1>Team Captain Quick Start</h1>
          <p className="cp-lead">
            The schedule, scores and standings all live at <b>schedule.rockywildcards.com</b>. Captains log in to
            enter scores. Players can view the schedule and standings without logging in, so share the link with your
            team.
          </p>
        </div>
        <div className="cp-qr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/qr-schedule.png" alt="QR code for schedule.rockywildcards.com" />
          <span>Scan to open the schedule</span>
        </div>
      </header>

      <div className="cp-fill">
        <span className="cp-team">
          <b>Team</b>
          <span className={`cp-team-name${team.name.length > 22 ? " cp-long" : ""}`}>{team.name}</span>
        </span>
        <span className="cp-pin">
          <b>PIN</b>
          <span className="cp-pin-boxes">
            {pinDigits.map((d, i) => (
              <i key={i}>{d.trim()}</i>
            ))}
          </span>
        </span>
        <small>Keep your PIN to yourself and your co-captain. Anyone with it can enter scores for your team.</small>
      </div>

      <div className="cp-cols">
        <div>
          <section>
            <h2><span className="cp-n">1</span>Log in as captain</h2>
            <ol>
              <li>Go to <b>schedule.rockywildcards.com</b>.</li>
              <li>Tap <b>Team / Admin Login</b> at the top (on a phone it just says <b>Log In</b>).</li>
              <li>Choose <b>Team Captain PIN</b>.</li>
              <li>Pick your team and enter your 4-digit PIN.</li>
              <li>Tap <b>Log In as Team Captain</b> to open your team&apos;s dashboard.</li>
            </ol>
          </section>

          <section>
            <h2><span className="cp-n">2</span>Put it on your phone</h2>
            <p className="cp-muted">No app store needed. It opens full-screen like any other app.</p>
            <table className="cp-wrap">
              <tbody>
                <tr><td>iPhone / iPad</td><td>In <b>Safari</b>, tap <b>Share</b>, then <b>Add to Home Screen</b>, then <b>Add</b>.</td></tr>
                <tr><td>Android</td><td>In <b>Chrome</b>, tap <b>⋮</b>, then <b>Install app</b> or <b>Add to Home screen</b>.</td></tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2><span className="cp-n">3</span>Game night: enter the score</h2>
            <p className="cp-callout">The winning team&apos;s captain enters the score after each match.</p>
            <ol>
              <li>Log in and tap <b>Open Scorekeeper</b> on tonight&apos;s match (or <b>Report Score</b> in your season list).</li>
              <li>Enter the points for each set played.</li>
              <li>Tap <b>Verify &amp; Save Match Score</b>. Standings update right away.</li>
            </ol>
            <ul>
              <li><b>Tied on sets?</b> The app won&apos;t save until you enter the deciding set.</li>
              <li><b>Exhibition</b> games are recorded but don&apos;t count in the standings.</li>
              <li><b>Saved a wrong score?</b> Tap <b>Edit Score</b> on the match, fix it, and save. If captains disagree on a score, contact Rocky Wildcards.</li>
            </ul>
          </section>
        </div>

        <div>
          <section>
            <h2>How standings points work</h2>
            <p>
              All three sets are usually played, but the first two decide most of it. Win both and it&apos;s a sweep:
              the third set doesn&apos;t change the result. If the first two are split 1–1, the third set decides the
              match.
            </p>
            <table className="cp-pts">
              <tbody>
                <tr><th>Result</th><th>Points</th></tr>
                <tr><td>Win sets 1 and 2 (sweep)</td><td>3</td></tr>
                <tr><td>Split sets 1 and 2, win set 3</td><td>2</td></tr>
                <tr><td>Split sets 1 and 2, lose set 3</td><td>1</td></tr>
                <tr><td>Lose sets 1 and 2</td><td>0</td></tr>
              </tbody>
            </table>
            <p>
              <b>+/- (point differential)</b> counts points from sets 1 and 2 only. Third-set scores are recorded but
              don&apos;t count toward +/-.
            </p>
            <p className="cp-muted">The app works all of this out when the score is saved. Just enter every set as it was played.</p>
          </section>

          <section>
            <h2>What else is on your dashboard</h2>
            <table className="cp-wrap">
              <tbody>
                <tr><td>Next match &amp; season</td><td>Shown as soon as you log in: date, time, court, and the score buttons.</td></tr>
                <tr><td>Captains Directory</td><td>Phone and email for every captain. Tap to call, text or email. Only visible to captains logged in with a PIN.</td></tr>
                <tr><td>Captain PIN</td><td>See or change your team&apos;s PIN.</td></tr>
              </tbody>
            </table>
            <p className="cp-rules">
              <b>League rules:</b> tap <b>Rules</b> at the top of any page (the book icon on a phone). No login needed.
            </p>
          </section>
        </div>
      </div>

      <section className="cp-help">
        <h2>Need help? Contact Rocky Wildcards</h2>
        <div className="cp-grid">
          <div><strong>Forgot or lost your PIN</strong>Contact Rocky Wildcards for a new one.</div>
          <div><strong>Score entered wrong</strong>The winning captain taps <b>Edit Score</b>, fixes it and saves again. Contact Rocky Wildcards if it&apos;s disputed.</div>
          <div><strong>Can&apos;t find your match</strong>The full schedule is public, no login needed. Open the site and look for your team&apos;s name.</div>
          <div><strong>Game time or court changed</strong>The app always shows the latest. Reprint your schedule if you use paper.</div>
        </div>
      </section>

      <style jsx>{`
        .captain-packet {
          background: #fff;
          color: #0f172a;
          font-size: 9pt;
          line-height: 1.32;
          width: 100%;
          max-width: 7.6in;
          margin: 0 auto;
          padding: 0.15in 0.1in;
          display: flex;
          flex-direction: column;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .captain-packet :global(b), .captain-packet :global(strong) { font-weight: 700; }
        .cp-header { display: flex; align-items: center; gap: 18px; padding-bottom: 11px; border-bottom: 3px solid #0f172a; }
        .cp-titles { flex: 1; }
        .cp-eyebrow { font-size: 7.5pt; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: #64748b; }
        h1 { font-size: 20pt; font-weight: 900; letter-spacing: -.02em; line-height: 1.1; margin-top: 3px; }
        .cp-lead { margin-top: 5px; font-size: 9.2pt; color: #334155; max-width: 4.6in; }
        .cp-qr { text-align: center; flex: none; }
        .cp-qr img { width: 1in; height: 1in; display: block; image-rendering: pixelated; }
        .cp-qr span { display: block; font-size: 7pt; font-weight: 700; color: #475569; margin-top: 2px; }

        .cp-fill { margin-top: 11px; display: flex; gap: 22px; align-items: center; padding: 8px 14px; border: 1.5px solid #0f172a; border-radius: 8px; background: #fffbeb; }
        .cp-fill b { font-size: 8.5pt; text-transform: uppercase; letter-spacing: .06em; color: #475569; }
        .cp-team { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .cp-team-name { font-size: 14pt; font-weight: 900; color: #0f172a; line-height: 1.1; max-width: 3in; }
        .cp-team-name.cp-long { font-size: 11pt; }
        .cp-pin { display: flex; align-items: center; gap: 8px; }
        .cp-pin-boxes { display: inline-flex; gap: 5px; }
        .cp-pin-boxes i { width: 24px; height: 28px; border: 1.5px solid #0f172a; border-radius: 4px; background: #fff; display: inline-flex; align-items: center; justify-content: center; font-style: normal; font-size: 14pt; font-weight: 900; font-variant-numeric: tabular-nums; }
        .cp-fill small { flex: 1; text-align: right; font-size: 7.6pt; color: #475569; }

        .cp-cols { margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
        section { margin-bottom: 8px; }
        h2 { font-size: 10.8pt; font-weight: 800; display: flex; align-items: center; gap: 8px; margin-bottom: 5px; padding-bottom: 4px; border-bottom: 1px solid #cbd5e1; }
        .cp-n { display: inline-flex; align-items: center; justify-content: center; width: 19px; height: 19px; border-radius: 50%; background: #f59e0b; color: #0f172a; font-size: 9pt; font-weight: 900; flex: none; }
        p + p, p + ol, p + table, ol + ul, table + p { margin-top: 5px; }
        ol { list-style: decimal; padding-left: 17px; }
        ul { list-style: disc; padding-left: 17px; }
        li { margin: 1px 0; }
        li::marker { font-weight: 700; color: #64748b; }
        .cp-muted { color: #475569; font-size: 8.5pt; }
        .cp-callout { background: #fffbeb; border-left: 3px solid #f59e0b; padding: 5px 9px; border-radius: 0 6px 6px 0; font-weight: 600; }
        .cp-rules { margin-top: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 9px; }

        table { width: 100%; border-collapse: collapse; font-size: 8.6pt; }
        th { text-align: left; font-size: 7pt; text-transform: uppercase; letter-spacing: .08em; color: #64748b; font-weight: 700; padding: 3px 6px; border-bottom: 1.5px solid #94a3b8; }
        td { padding: 3px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        td:first-child { font-weight: 700; white-space: nowrap; }
        .cp-wrap td:first-child { white-space: normal; width: 30%; }
        .cp-pts td:last-child, .cp-pts th:last-child { text-align: center; width: 48px; }
        .cp-pts td:last-child { font-size: 12pt; font-weight: 900; }
        .cp-pts tr:nth-child(even) td { background: #f8fafc; }

        .cp-help { margin-bottom: 0; }
        .cp-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; }
        .cp-grid div { font-size: 8.2pt; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; }
        .cp-grid strong { display: block; color: #0f172a; font-size: 8.5pt; margin-bottom: 2px; }
      `}</style>
    </div>
  );
};
