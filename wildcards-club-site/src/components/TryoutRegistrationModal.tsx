'use client';

import React, { useState } from 'react';
import { X, Calendar, User, Mail, Phone, CheckCircle2, Loader2 } from 'lucide-react';
import { TryoutSession } from '@/types/club';
import confetti from 'canvas-confetti';

interface TryoutRegistrationModalProps {
  session: TryoutSession | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TryoutRegistrationModal: React.FC<TryoutRegistrationModalProps> = ({
  session,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [athleteName, setAthleteName] = useState('');
  const [ageGroup, setAgeGroup] = useState('U14');
  const [birthYear, setBirthYear] = useState('2012');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [preferredPosition, setPreferredPosition] = useState('Outside Hitter');
  const [experienceYears, setExperienceYears] = useState('1-2 years');
  const [medicalNotes, setMedicalNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    if (session) {
      setAgeGroup(session.ageGroup);
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteName.trim() || !parentEmail.trim() || !parentPhone.trim()) {
      setErrorMsg('Please fill in athlete name, parent email, and phone number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/tryout-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          athleteName,
          ageGroup,
          birthYear,
          parentName,
          parentEmail,
          parentPhone,
          preferredPosition,
          experienceYears,
          medicalNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit registration');
      }

      setSubmitted(true);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-black border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Tryout Registration</h3>
              <p className="text-xs text-red-400 font-bold">
                {session.ageGroup} {session.gender} • {session.date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="h-16 w-16 bg-red-600/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>
              <h4 className="text-lg font-bold text-white">Registration Confirmed!</h4>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Thank you for registering <strong className="text-white">{athleteName}</strong> for the {session.ageGroup} tryout. A confirmation email will be sent to <strong className="text-red-400">{parentEmail}</strong>.
              </p>
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="bg-black p-3.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1">
                <p><strong>Venue:</strong> {session.venue}</p>
                <p><strong>Time:</strong> {session.time}</p>
                <p><strong>Fee:</strong> {session.fee}</p>
              </div>

              {/* Athlete Info */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 block">Athlete Name *</label>
                <div className="relative">
                  <User className="h-4 w-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="First & Last Name"
                    value={athleteName}
                    onChange={(e) => setAthleteName(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Birth Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2012"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Preferred Position</label>
                  <select
                    value={preferredPosition}
                    onChange={(e) => setPreferredPosition(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="Outside Hitter">Outside Hitter</option>
                    <option value="Setter">Setter</option>
                    <option value="Middle Blocker">Middle Blocker</option>
                    <option value="Opposite Hitter">Opposite Hitter</option>
                    <option value="Libero">Libero</option>
                    <option value="Utility / Undecided">Utility / Undecided</option>
                  </select>
                </div>
              </div>

              {/* Parent Contact */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="text-xs font-bold text-zinc-300 block">Parent / Guardian Name</label>
                <input
                  type="text"
                  placeholder="Parent Full Name"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Parent Email *</label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="parent@example.com"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Parent Phone *</label>
                  <div className="relative">
                    <Phone className="h-4 w-4 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="(403) 555-0000"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Additional notes */}
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Medical or Special Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Any allergies, medical notes, or requests..."
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting Registration...</span>
                    </>
                  ) : (
                    <span>Confirm Tryout Registration</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
