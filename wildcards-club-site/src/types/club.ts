export interface ClubInfo {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  location: string;
  mainGymAddress: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  schedulePortalUrl: string;
  adminPasscode: string;
  // Top Banner / Announcement Bar Config
  announcementBarLabel?: string;
  announcementBarText?: string;
  announcementBarEnabled?: boolean;
  // Front Page Hero Customization
  heroTitleLine1?: string;
  heroTitleLine2?: string;
  heroTitleLine3?: string;
  heroBadge?: string;
  heroDescription?: string;
  heroCalloutBadge?: string;
  heroCalloutTitle?: string;
  heroCalloutText?: string;
  heroImageUrl?: string;
  // Quick Metrics
  metric1Value?: string;
  metric1Label?: string;
  metric2Value?: string;
  metric2Label?: string;
  metric3Value?: string;
  metric3Label?: string;
  // Schedule Banner Customization
  scheduleBannerBadge?: string;
  scheduleBannerTitle?: string;
  scheduleBannerText?: string;
  // Page Headers & Subtitles Customization
  tryoutsPageTitle?: string;
  tryoutsPageSubtitle?: string;
  tryoutInfoTitle?: string;
  tryoutInfoText?: string;
  tryoutRequirementsText?: string;
  teamsPageTitle?: string;
  teamsPageSubtitle?: string;
  newsPageTitle?: string;
  newsPageSubtitle?: string;
  coachesPageTitle?: string;
  coachesPageSubtitle?: string;
  feesPageTitle?: string;
  feesPageSubtitle?: string;
  policiesPageTitle?: string;
  policiesPageSubtitle?: string;
  // Footer Customization
  footerCopyrightText?: string;
}

export interface Announcement {
  id: string;
  title: string;
  slug: string;
  category: 'General' | 'Tryouts' | 'Tournaments' | 'Club News';
  summary: string;
  content: string;
  date: string;
  author: string;
  isPinned?: boolean;
  imageUrl?: string;
}

export interface TryoutSession {
  id: string;
  ageGroup: 'U13' | 'U14' | 'U15' | 'U16' | 'U17' | 'U18';
  gender: 'Boys' | 'Girls' | 'Co-ed';
  date: string;
  time: string;
  venue: string;
  address: string;
  fee: string;
  notes?: string;
  status: 'Registration Open' | 'Upcoming' | 'Closed' | 'Full';
}

export interface TryoutRegistration {
  id: string;
  sessionId: string;
  athleteName: string;
  ageGroup: string;
  birthYear: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  preferredPosition: string;
  experienceYears: string;
  medicalNotes?: string;
  registeredAt: string;
}

export interface TeamRosterInfo {
  id: string;
  name: string;
  division: string;
  ageGroup: string;
  gender: 'Boys' | 'Girls';
  badgeColor: string;
  headCoach: string;
  assistantCoach?: string;
  practiceSchedule: string;
  homeGym: string;
  rosterCount: number;
  teamPhotoUrl?: string;
}

export interface CoachProfile {
  id: string;
  name: string;
  role: 'Technical Director' | 'Head Coach' | 'Assistant Coach' | 'Development Coach';
  teamAssigned: string;
  certifications: string[];
  bio: string;
  email: string;
  photoUrl?: string;
}

export interface FeeItem {
  id: string;
  division: string;
  ageGroup: string;
  totalFee: number;
  depositAmount: number;
  monthlyPayments: string;
  includes: string[];
}

export interface ClubPolicy {
  id: string;
  title: string;
  category: 'Bylaws' | 'Code of Conduct' | 'Athlete Safety' | 'Refund Policy' | 'General';
  summary: string;
  content: string;
  updatedAt: string;
}

export interface WildcardsClubData {
  clubInfo: ClubInfo;
  announcements: Announcement[];
  tryouts: TryoutSession[];
  registrations: TryoutRegistration[];
  teams: TeamRosterInfo[];
  coaches: CoachProfile[];
  fees: FeeItem[];
  policies: ClubPolicy[];
}
