import { client } from './lib/client';
import { urlForImage } from './lib/image';
import { WildcardsClubData, CoachProfile, TeamRosterInfo, Announcement, TryoutSession, FeeItem } from '@/types/club';

export async function fetchSanityClubData(): Promise<Partial<WildcardsClubData> | null> {
  try {
    const groq = `{
      "coaches": *[_type == "coach"] | order(_createdAt desc) {
        _id,
        name,
        role,
        teamAssigned,
        email,
        bio,
        certifications,
        photo
      },
      "teams": *[_type == "team"] | order(division asc) {
        _id,
        name,
        division,
        badgeColor,
        headCoach,
        assistantCoach,
        practiceSchedule,
        homeGym,
        teamPhoto
      },
      "news": *[_type == "news"] | order(date desc) {
        _id,
        title,
        category,
        date,
        summary,
        content,
        author,
        image
      },
      "tryouts": *[_type == "tryout"] {
        _id,
        ageGroup,
        date,
        time,
        location,
        fee,
        status
      },
      "fees": *[_type == "fee"] {
        _id,
        division,
        totalFee,
        depositAmount,
        monthlyPayments,
        includes
      }
    }`;

    const sanityRes = await client.fetch(groq);
    if (!sanityRes) return null;

    const coaches: CoachProfile[] = (sanityRes.coaches || []).map((c: any) => ({
      id: c._id,
      name: c.name,
      role: c.role || 'Head Coach',
      teamAssigned: c.teamAssigned || 'TBD',
      email: c.email || '',
      bio: c.bio || '',
      certifications: c.certifications || [],
      photoUrl: c.photo ? urlForImage(c.photo)?.url() : undefined,
    }));

    const teams: TeamRosterInfo[] = (sanityRes.teams || []).map((t: any) => ({
      id: t._id,
      name: t.name,
      division: t.division || '14U',
      ageGroup: t.division ? t.division.split(' ')[0] : '14U',
      gender: t.division && t.division.includes('Boys') ? 'Boys' : 'Girls',
      badgeColor: t.badgeColor || '#dc2626',
      headCoach: t.headCoach || 'TBD',
      assistantCoach: t.assistantCoach || '',
      practiceSchedule: t.practiceSchedule || '',
      homeGym: t.homeGym || 'TBD',
      rosterCount: 12,
      teamPhotoUrl: t.teamPhoto ? urlForImage(t.teamPhoto)?.url() : undefined,
    }));

    const announcements: Announcement[] = (sanityRes.news || []).map((n: any) => ({
      id: n._id,
      title: n.title,
      slug: n.title ? n.title.toLowerCase().replace(/\s+/g, '-') : n._id,
      category: n.category || 'General',
      date: n.date || new Date().toISOString().split('T')[0],
      summary: n.summary || '',
      content: n.content || n.summary || '',
      author: n.author || 'Club Admin',
      imageUrl: n.image ? urlForImage(n.image)?.url() : undefined,
    }));

    const tryouts: TryoutSession[] = (sanityRes.tryouts || []).map((tr: any) => ({
      id: tr._id,
      ageGroup: tr.ageGroup ? (tr.ageGroup.split(' ')[0] as any) : 'U14',
      gender: tr.ageGroup && tr.ageGroup.includes('Boys') ? 'Boys' : 'Girls',
      date: tr.date || '',
      time: tr.time || '',
      venue: tr.location || 'Main Gym',
      address: tr.location || '',
      fee: tr.fee || '$25',
      status: tr.status === 'Open' ? 'Registration Open' : 'Closed',
    }));

    const fees: FeeItem[] = (sanityRes.fees || []).map((f: any) => ({
      id: f._id,
      division: f.division,
      ageGroup: f.division ? f.division.split(' ')[0] : '14U',
      totalFee: f.totalFee || 1400,
      depositAmount: f.depositAmount || 400,
      monthlyPayments: f.monthlyPayments || '',
      includes: f.includes || [],
    }));

    const result: Partial<WildcardsClubData> = {};
    if (coaches.length > 0) result.coaches = coaches;
    if (teams.length > 0) result.teams = teams;
    if (announcements.length > 0) result.announcements = announcements;
    if (tryouts.length > 0) result.tryouts = tryouts;
    if (fees.length > 0) result.fees = fees;

    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.warn('Sanity fetch failed or empty, falling back to JSON state:', error);
    return null;
  }
}
