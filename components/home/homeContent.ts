import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Users,
  Handshake,
  Folder,
  Sparkles,
  LogIn,
  UserCheck,
  Info,
  Phone,
  Factory,
  Building2,
  Construction,
  ShieldCheck,
  Brush,
  Utensils,
  HardHat,
} from 'lucide-react';

export type VacancyFilter = 'Semua' | 'Operasional' | 'Administrasi' | 'Teknis' | 'Lainnya';

export const VACANCY_FILTER_OPTIONS: VacancyFilter[] = [
  'Semua',
  'Operasional',
  'Administrasi',
  'Teknis',
  'Lainnya',
];

/** Brand navy — accent utama halaman utama */
export const BRAND_NAVY = '#003087';

/** Tombol utama — touch target min 48px, tipografi konsisten */
export const BTN_PRIMARY =
  'inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#003087] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 active:scale-[0.98]';

/** Horizontal scroll row — stats & sektor */
export const HOME_H_SCROLL =
  'overflow-x-auto overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export type StatItem = {
  key: 'jobs' | 'applicants' | 'clients' | 'projects';
  icon: LucideIcon;
  labelKey: string;
  hintKey: string;
  color: string;
  bg: string;
  ring: string;
};

export const STAT_ITEMS: StatItem[] = [
  {
    key: 'jobs',
    icon: Briefcase,
    labelKey: 'home_stat_pos',
    hintKey: 'home_stat_pos_hint',
    color: 'text-[#003087]',
    bg: 'bg-blue-50',
    ring: 'ring-blue-100',
  },
  {
    key: 'applicants',
    icon: Users,
    labelKey: 'home_stat_app',
    hintKey: 'home_stat_app_hint',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-100',
  },
  {
    key: 'clients',
    icon: Handshake,
    labelKey: 'home_stat_cli',
    hintKey: 'home_stat_cli_hint',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    ring: 'ring-amber-100',
  },
  {
    key: 'projects',
    icon: Folder,
    labelKey: 'home_stat_proj',
    hintKey: 'home_stat_proj_hint',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    ring: 'ring-purple-100',
  },
];

export type QuickAccessItem = {
  id: string;
  titleKey: string;
  subtitleKey: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  accent: string;
  getPath: (loggedIn: boolean, isAdmin: boolean) => string;
  dynamicSubtitleKey?: 'home_quick_jobs_sub';
};

/** @deprecated Use BRAND_NAVY */
export const QUICK_ACCESS_NAVY = BRAND_NAVY;

export const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    id: 'vacancies',
    titleKey: 'home_quick_vacancies',
    subtitleKey: 'home_quick_vacancies_sub',
    dynamicSubtitleKey: 'home_quick_jobs_sub',
    icon: Sparkles,
    iconBg: 'bg-blue-50',
    iconColor: 'text-[#003087]',
    accent: 'border-l-[#003087]',
    getPath: () => '/vacancies',
  },
  {
    id: 'portal',
    titleKey: 'home_quick_portal',
    subtitleKey: 'home_quick_portal_guest_sub',
    icon: LogIn,
    iconBg: 'bg-blue-50',
    iconColor: 'text-[#003087]',
    accent: 'border-l-[#003087]',
    getPath: (loggedIn, isAdmin) => (loggedIn ? (isAdmin ? '/admin' : '/portal') : '/login'),
  },
  {
    id: 'about',
    titleKey: 'home_quick_about',
    subtitleKey: 'home_quick_about_sub',
    icon: Info,
    iconBg: 'bg-blue-50',
    iconColor: 'text-[#003087]',
    accent: 'border-l-[#003087]',
    getPath: () => '/about',
  },
  {
    id: 'contact',
    titleKey: 'home_quick_contact',
    subtitleKey: 'home_quick_contact_sub',
    icon: Phone,
    iconBg: 'bg-blue-50',
    iconColor: 'text-[#003087]',
    accent: 'border-l-[#003087]',
    getPath: () => '/contact',
  },
];

export type JobSector = {
  id: string;
  titleKey: string;
  descKey: string;
  filter: VacancyFilter;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

export const JOB_SECTORS: JobSector[] = [
  {
    id: 'konstruksi',
    titleKey: 'home_sector_construction',
    descKey: 'home_sector_construction_desc',
    filter: 'Operasional',
    icon: HardHat,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
  {
    id: 'manufaktur',
    titleKey: 'home_sector_mfg',
    descKey: 'home_sector_mfg_desc',
    filter: 'Operasional',
    icon: Factory,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    id: 'perkantoran',
    titleKey: 'home_sector_office',
    descKey: 'home_sector_office_desc',
    filter: 'Administrasi',
    icon: Building2,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'logistik',
    titleKey: 'home_sector_logistics',
    descKey: 'home_sector_logistics_desc',
    filter: 'Teknis',
    icon: Construction,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    id: 'keamanan',
    titleKey: 'home_sector_security',
    descKey: 'home_sector_security_desc',
    filter: 'Lainnya',
    icon: ShieldCheck,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    id: 'kebersihan',
    titleKey: 'home_sector_cleaning',
    descKey: 'home_sector_cleaning_desc',
    filter: 'Lainnya',
    icon: Brush,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
  {
    id: 'fnb',
    titleKey: 'home_sector_fnb',
    descKey: 'home_sector_fnb_desc',
    filter: 'Lainnya',
    icon: Utensils,
    iconBg: 'bg-pink-50',
    iconColor: 'text-pink-600',
  },
];

export function resolveQuickAccessTitle(
  item: QuickAccessItem,
  loggedIn: boolean,
  t: (key: string) => string
): string {
  if (item.id === 'portal' && loggedIn) {
    return t('home_quick_portal_user');
  }
  return t(item.titleKey);
}

export function resolveQuickAccessSubtitle(
  item: QuickAccessItem,
  loggedIn: boolean,
  jobCount: number,
  t: (key: string) => string
): string {
  if (item.id === 'portal' && loggedIn) {
    return t('home_quick_portal_user_sub');
  }
  if (item.dynamicSubtitleKey && jobCount > 0) {
    return t(item.dynamicSubtitleKey).replace('{count}', String(jobCount));
  }
  return t(item.subtitleKey);
}

export function resolveQuickAccessIcon(
  item: QuickAccessItem,
  loggedIn: boolean
): LucideIcon {
  if (item.id === 'portal' && loggedIn) {
    return UserCheck;
  }
  return item.icon;
}