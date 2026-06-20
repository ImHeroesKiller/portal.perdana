import type { JobVacancy } from '../types';
import { getJobDetailFields } from './job-display';

export const SITE_URL = 'https://portal.perada.net';
export const SITE_NAME = 'ePortal — PT Perdana Adi Yuda';
export const ORG_NAME = 'PT Perdana Adi Yuda';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/icons/icon-512.png`;
export const DEFAULT_KEYWORDS_ID =
  'lowongan kerja, rekrutmen, PT Perdana Adi Yuda, tenaga kerja konstruksi, smelter, jasa ketenagakerjaan, karir Indonesia, portal perada';
export const DEFAULT_KEYWORDS_EN =
  'job vacancies, recruitment, PT Perdana Adi Yuda, construction workforce, smelter jobs, HR outsourcing, careers Indonesia, perada portal';

export type SeoLocale = 'id' | 'en';

export type SeoConfig = {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  path: string;
  locale: SeoLocale;
  robots?: string;
  ogType?: string;
  ogImage?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

type PageSeoEntry = {
  id: Omit<SeoConfig, 'canonical' | 'path' | 'locale'>;
  en: Omit<SeoConfig, 'canonical' | 'path' | 'locale'>;
  robots?: string;
};

const PUBLIC_PAGES: Record<string, PageSeoEntry> = {
  '/': {
    id: {
      title: 'ePortal — Rekrutmen & Lowongan Kerja PT Perdana Adi Yuda',
      description:
        'Portal resmi rekrutmen PT Perdana Adi Yuda. Temukan lowongan kerja konstruksi, smelter, dan industri. Lamar online, pantau status lamaran, dan akses portal karyawan.',
      keywords: DEFAULT_KEYWORDS_ID,
      ogType: 'website',
    },
    en: {
      title: 'ePortal — Recruitment & Jobs at PT Perdana Adi Yuda',
      description:
        'Official recruitment portal of PT Perdana Adi Yuda. Find construction, smelter, and industrial job vacancies. Apply online and track your application.',
      keywords: DEFAULT_KEYWORDS_EN,
      ogType: 'website',
    },
  },
  '/vacancies': {
    id: {
      title: 'Lowongan Kerja Terbaru — PT Perdana Adi Yuda',
      description:
        'Daftar lowongan kerja aktif PT Perdana Adi Yuda di seluruh Indonesia. Operator alat berat, konstruksi, smelter, administrasi, dan posisi industri lainnya.',
      keywords: 'lowongan kerja terbaru, karir konstruksi, lowongan smelter, rekrutmen perdana adi yuda',
      ogType: 'website',
    },
    en: {
      title: 'Latest Job Vacancies — PT Perdana Adi Yuda',
      description:
        'Browse active job openings at PT Perdana Adi Yuda across Indonesia. Construction, smelter, operations, and industrial roles.',
      keywords: 'job vacancies, construction careers, smelter jobs, perdana adi yuda recruitment',
      ogType: 'website',
    },
  },
  '/services': {
    id: {
      title: 'Layanan Tenaga Kerja & Rekrutmen — PT Perdana Adi Yuda',
      description:
        'Layanan rekrutmen, seleksi, pelatihan, penempatan tenaga kerja, dan administrasi ketenagakerjaan profesional dari PT Perdana Adi Yuda.',
      keywords: 'jasa tenaga kerja, outsourcing, rekrutmen profesional, pelatihan kerja',
      ogType: 'website',
    },
    en: {
      title: 'Workforce & Recruitment Services — PT Perdana Adi Yuda',
      description:
        'Professional recruitment, training, workforce placement, and HR administration services by PT Perdana Adi Yuda.',
      keywords: 'workforce services, outsourcing, professional recruitment, job training',
      ogType: 'website',
    },
  },
  '/about': {
    id: {
      title: 'Tentang Kami — PT Perdana Adi Yuda',
      description:
        'Profil PT Perdana Adi Yuda: perusahaan jasa pengelolaan tenaga kerja dengan komitmen integritas, profesionalisme, dan kualitas layanan.',
      keywords: 'tentang perdana adi yuda, profil perusahaan, jasa ketenagakerjaan',
      ogType: 'website',
    },
    en: {
      title: 'About Us — PT Perdana Adi Yuda',
      description:
        'Learn about PT Perdana Adi Yuda — a workforce management company committed to integrity, professionalism, and service quality.',
      keywords: 'about perdana adi yuda, company profile, workforce services',
      ogType: 'website',
    },
  },
  '/contact': {
    id: {
      title: 'Hubungi Kami — PT Perdana Adi Yuda',
      description:
        'Hubungi PT Perdana Adi Yuda untuk informasi lowongan, layanan rekrutmen, dan kerja sama tenaga kerja. Kantor pusat Bekasi & cabang Morowali.',
      keywords: 'kontak perdana adi yuda, alamat kantor, hubungi HR',
      ogType: 'website',
    },
    en: {
      title: 'Contact Us — PT Perdana Adi Yuda',
      description:
        'Contact PT Perdana Adi Yuda for job information, recruitment services, and workforce partnerships. Head office Bekasi & Morowali branch.',
      keywords: 'contact perdana adi yuda, office address, HR contact',
      ogType: 'website',
    },
  },
  '/apply': {
    id: {
      title: 'Formulir Lamaran Kerja — Lamar Online',
      description:
        'Isi formulir lamaran kerja PT Perdana Adi Yuda secara online. Wizard step-by-step, validasi data, atau gunakan asisten AI Sara.',
      keywords: 'lamar kerja online, formulir lamaran, apply job perdana adi yuda',
      ogType: 'website',
    },
    en: {
      title: 'Job Application Form — Apply Online',
      description:
        'Submit your job application to PT Perdana Adi Yuda online. Step-by-step wizard with validation or AI assistant Sara.',
      keywords: 'apply online, job application form, perdana adi yuda careers',
      ogType: 'website',
    },
  },
  '/help': {
    id: {
      title: 'Bantuan & FAQ — ePortal Perdana Adi Yuda',
      description: 'Pusat bantuan ePortal: panduan lamaran kerja, login portal, dan pertanyaan umum seputar rekrutmen.',
      keywords: 'bantuan rekrutmen, FAQ lamaran kerja, panduan eportal',
      ogType: 'website',
    },
    en: {
      title: 'Help & FAQ — ePortal Perdana Adi Yuda',
      description: 'ePortal help center: job application guides, portal login, and recruitment FAQs.',
      keywords: 'recruitment help, job application FAQ, eportal guide',
      ogType: 'website',
    },
  },
  '/register': {
    id: {
      title: 'Daftar Akun Portal — PT Perdana Adi Yuda',
      description: 'Buat akun portal karyawan dan pelamar PT Perdana Adi Yuda untuk melacak lamaran dan mengakses layanan internal.',
      keywords: 'daftar portal, registrasi pelamar, akun karyawan',
      ogType: 'website',
      robots: 'noindex, follow',
    },
    en: {
      title: 'Register Portal Account — PT Perdana Adi Yuda',
      description: 'Create a candidate or employee portal account to track applications and access internal services.',
      keywords: 'portal registration, candidate account, employee portal signup',
      ogType: 'website',
      robots: 'noindex, follow',
    },
  },
  '/login': {
    id: {
      title: 'Masuk Portal — ePortal Perdana Adi Yuda',
      description: 'Login ke portal pelamar dan karyawan PT Perdana Adi Yuda untuk melacak status lamaran dan dokumen.',
      keywords: 'login portal, masuk eportal, pelamar perdana adi yuda',
      ogType: 'website',
      robots: 'noindex, follow',
    },
    en: {
      title: 'Sign In — ePortal Perdana Adi Yuda',
      description: 'Sign in to the PT Perdana Adi Yuda candidate and employee portal to track applications.',
      keywords: 'portal login, sign in eportal, perdana adi yuda applicant',
      ogType: 'website',
      robots: 'noindex, follow',
    },
  },
};

const PRIVATE_ROUTE_PREFIXES = ['/admin', '/portal', '/settings', '/interview-session'];

export function parseSeoLocale(search: string): SeoLocale {
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    return params.get('lang') === 'en' ? 'en' : 'id';
  } catch {
    return 'id';
  }
}

export function buildCanonicalUrl(path: string, locale: SeoLocale, search = ''): string {
  const base = `${SITE_URL}/#${path.startsWith('/') ? path : `/${path}`}`;
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  params.delete('lang');
  if (locale === 'en') params.set('lang', 'en');
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function buildAlternateUrls(path: string, search = ''): { id: string; en: string } {
  return {
    id: buildCanonicalUrl(path, 'id', search),
    en: buildCanonicalUrl(path, 'en', search),
  };
}

export function getOrganizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: ORG_NAME,
    alternateName: ['Perdana Adi Yuda', 'ePortal'],
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512.png`,
    image: `${SITE_URL}/assets/hero/site_workers.jpg`,
    description:
      'Perusahaan jasa pengelolaan tenaga kerja dan rekrutmen untuk sektor konstruksi, smelter, dan industri di Indonesia.',
    email: 'info@perada.net',
    telephone: '+62-858-9366-1683',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Plaza Summarecon Bekasi Lt. 7, Jl. Bulevar Ahmad Yani',
      addressLocality: 'Bekasi Utara',
      addressRegion: 'Jawa Barat',
      postalCode: '17142',
      addressCountry: 'ID',
    },
    sameAs: ['https://perada.net'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'recruitment',
      email: 'info@perada.net',
      telephone: '+62-858-9366-1683',
      availableLanguage: ['Indonesian', 'English'],
    },
  };
}

export function getWebSiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: ['id-ID', 'en-US'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/#/vacancies?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

function mapEmploymentType(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('part')) return 'PART_TIME';
  if (t.includes('contract')) return 'CONTRACTOR';
  if (t.includes('intern')) return 'INTERN';
  return 'FULL_TIME';
}

export function buildJobPostingJsonLd(job: JobVacancy): Record<string, unknown> {
  const fields = getJobDetailFields(job);
  const path = `/vacancies/${job.id}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: fields.title,
    description: fields.description || fields.requirements.join('. '),
    identifier: {
      '@type': 'PropertyValue',
      name: ORG_NAME,
      value: job.id,
    },
    datePosted: job.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    validThrough: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    employmentType: mapEmploymentType(fields.type),
    hiringOrganization: {
      '@type': 'Organization',
      name: ORG_NAME,
      sameAs: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512.png`,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: fields.location,
        addressCountry: 'ID',
      },
    },
    applicantLocationRequirements: {
      '@type': 'Country',
      name: 'Indonesia',
    },
    url: `${SITE_URL}/#${path}`,
    directApply: true,
    industry: fields.department,
  };
}

export function buildJobListJsonLd(jobs: JobVacancy[]): Record<string, unknown> {
  const active = jobs.filter((j) => j.isActive).slice(0, 20);
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Lowongan Kerja PT Perdana Adi Yuda',
    numberOfItems: active.length,
    itemListElement: active.map((job, index) => {
      const fields = getJobDetailFields(job);
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/#/vacancies/${job.id}`,
        name: fields.title,
      };
    }),
  };
}

export function resolvePageSeo(pathname: string, search: string, locale: SeoLocale): SeoConfig {
  const path = pathname || '/';

  if (PRIVATE_ROUTE_PREFIXES.some((p) => path.startsWith(p))) {
    return {
      title: SITE_NAME,
      description: 'Portal internal PT Perdana Adi Yuda',
      keywords: '',
      path,
      locale,
      canonical: buildCanonicalUrl(path, locale, search),
      robots: 'noindex, nofollow',
      ogType: 'website',
    };
  }

  const jobDetailMatch = path.match(/^\/vacancies\/([^/]+)$/);
  if (jobDetailMatch) {
    const fallback =
      locale === 'en'
        ? {
            title: `Job Vacancy — ${ORG_NAME}`,
            description: `Job vacancy details at ${ORG_NAME}. Apply online through ePortal.`,
            keywords: `job vacancy, ${ORG_NAME}, careers`,
          }
        : {
            title: `Lowongan Kerja — ${ORG_NAME}`,
            description: `Detail lowongan kerja di ${ORG_NAME}. Lamar online melalui ePortal.`,
            keywords: `lowongan kerja, ${ORG_NAME}, karir`,
          };
    return {
      ...fallback,
      path,
      locale,
      canonical: buildCanonicalUrl(path, locale, search),
      ogType: 'article',
      robots: 'index, follow',
      jsonLd: [getOrganizationJsonLd()],
    };
  }

  const entry = PUBLIC_PAGES[path];
  if (!entry) {
    return {
      title: SITE_NAME,
      description: 'Portal rekrutmen PT Perdana Adi Yuda',
      keywords: locale === 'en' ? DEFAULT_KEYWORDS_EN : DEFAULT_KEYWORDS_ID,
      path,
      locale,
      canonical: buildCanonicalUrl(path, locale, search),
      ogType: 'website',
      jsonLd: [getOrganizationJsonLd(), getWebSiteJsonLd()],
    };
  }

  const localized = entry[locale];
  return {
    ...localized,
    path,
    locale,
    canonical: buildCanonicalUrl(path, locale, search),
    robots: entry.robots || localized.robots || 'index, follow',
    ogImage: localized.ogImage || DEFAULT_OG_IMAGE,
    jsonLd: [getOrganizationJsonLd(), getWebSiteJsonLd()],
  };
}

export function buildJobDetailSeo(job: JobVacancy, locale: SeoLocale): SeoConfig {
  const fields = getJobDetailFields(job);
  const path = `/vacancies/${job.id}`;
  const title =
    locale === 'en'
      ? `${fields.title} — Job Vacancy | ${ORG_NAME}`
      : `${fields.title} — Lowongan Kerja | ${ORG_NAME}`;
  const snippet = (fields.description || fields.requirements.join('. ')).slice(0, 140);
  const description =
    locale === 'en'
      ? `Apply for ${fields.title} at ${fields.location}. ${fields.department} — ${ORG_NAME}. ${snippet}`
      : `Lamar posisi ${fields.title} di ${fields.location}. ${fields.department} — ${ORG_NAME}. ${snippet}`;

  return {
    title,
    description: description.slice(0, 160),
    keywords:
      locale === 'en'
        ? `${fields.title}, ${fields.location}, job vacancy, ${ORG_NAME}`
        : `${fields.title}, ${fields.location}, lowongan kerja, ${ORG_NAME}`,
    path,
    locale,
    canonical: buildCanonicalUrl(path, locale),
    robots: job.isActive ? 'index, follow' : 'noindex, follow',
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE,
    jsonLd: [getOrganizationJsonLd(), buildJobPostingJsonLd(job)],
  };
}