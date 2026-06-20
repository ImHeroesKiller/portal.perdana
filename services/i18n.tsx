
import React, { createContext, useState, useContext, ReactNode } from 'react';

type Language = 'id' | 'en';

interface Translations {
  [key: string]: {
    id: string;
    en: string;
  };
}

const dictionary: Translations = {
  // Navigation
  nav_home: { id: 'Beranda', en: 'Home' },
  nav_services: { id: 'Layanan', en: 'Services' },
  nav_about: { id: 'Tentang Kami', en: 'About Us' },
  nav_contact: { id: 'Kontak Kami', en: 'Contact Us' },
  nav_login: { id: 'Masuk', en: 'Login' },
  nav_register: { id: 'Daftar', en: 'Register' },
  nav_admin: { id: 'Dashboard Admin', en: 'Admin Dashboard' },
  nav_settings: { id: 'Pengaturan', en: 'Settings' },
  nav_help: { id: 'Bantuan', en: 'Help' },
  nav_logout: { id: 'Keluar', en: 'Logout' },
  nav_vacancies: { id: 'Lowongan', en: 'Vacancies' },
  nav_vacancies_short: { id: 'Lowongan', en: 'Jobs' },
  nav_portal: { id: 'Portal Saya', en: 'My Portal' },
  nav_tagline: { id: 'Solusi SDM & Rekrutmen', en: 'HR & Recruitment Solutions' },
  nav_notifications: { id: 'Notifikasi', en: 'Notifications' },
  nav_mark_all_read: { id: 'Tandai dibaca', en: 'Mark all read' },

  // Home Page
  home_hero_title: { id: 'Bergabung Bersama Kami di', en: 'Join Us at' },
  home_hero_subtitle: { id: 'Kami mencari talenta terbaik untuk tumbuh dan berkembang bersama. Temukan peluang karir yang sesuai dengan minat dan keahlian Anda.', en: 'We are looking for the best talents to grow and develop together. Find career opportunities that match your interests and skills.' },
  home_hero_aria: { id: 'Bagian utama beranda rekrutmen', en: 'Recruitment homepage hero' },
  home_hero_badge: { id: 'Alih Daya & Rekrutmen', en: 'Manpower & Recruitment' },
  home_hero_headline: { id: 'Karier Anda Dimulai di Sini.', en: 'Your Career Starts Here.' },
  home_hero_tagline: {
    id: 'Rekrutmen profesional untuk proyek konstruksi, smelter, dan industri — temukan lowongan yang cocok.',
    en: 'Professional recruitment for construction, smelter, and industrial projects — find the right job.',
  },
  home_hero_jobs_count: { id: '{count} lowongan aktif tersedia saat ini.', en: '{count} active vacancies available now.' },
  home_hero_search_btn: { id: 'Cari', en: 'Search' },
  home_hero_apply_btn: { id: 'Daftar Sekarang', en: 'Apply Now' },
  home_cta_button: { id: 'Lihat Semua Lowongan', en: 'View All Vacancies' },
  home_stat_pos: { id: 'Posisi Tersedia', en: 'Positions Available' },
  home_stat_pos_hint: { id: 'Lowongan aktif hari ini', en: 'Active openings today' },
  home_stat_app: { id: 'Pelamar', en: 'Applicants' },
  home_stat_app_hint: { id: 'Talenta terdaftar di portal', en: 'Talents registered on portal' },
  home_stat_cli: { id: 'Klien Mitra', en: 'Partner Clients' },
  home_stat_cli_hint: { id: 'Perusahaan mitra alih daya', en: 'Outsourcing partner companies' },
  home_stat_proj: { id: 'Proyek Aktif', en: 'Active Projects' },
  home_stat_proj_hint: { id: 'Site & proyek berjalan', en: 'Ongoing sites & projects' },
  home_quick_section_title: { id: 'Layanan & Menu Utama', en: 'Services & Main Menu' },
  home_quick_section_sub: { id: 'Akses cepat ke fitur rekrutmen dan informasi perusahaan', en: 'Quick access to recruitment features and company info' },
  home_quick_vacancies: { id: 'Lihat Lowongan', en: 'Browse Jobs' },
  home_quick_vacancies_sub: { id: 'Cari kerja sesuai minat dan keahlian Anda', en: 'Find jobs matching your skills and interests' },
  home_quick_jobs_sub: { id: '{count} posisi aktif siap dilamar', en: '{count} active positions ready to apply' },
  home_quick_portal: { id: 'Masuk', en: 'Sign In' },
  home_quick_portal_user: { id: 'Portal Saya', en: 'My Portal' },
  home_quick_portal_guest_sub: { id: 'Masuk ke portal pelamar & karyawan', en: 'Sign in to applicant & employee portal' },
  home_quick_portal_user_sub: { id: 'Kelola lamaran dan data pekerjaan Anda', en: 'Manage your applications and work data' },
  home_quick_about: { id: 'Tentang Kami', en: 'About Us' },
  home_quick_about_sub: { id: 'Visi, misi & profil perusahaan', en: 'Vision, mission & company profile' },
  home_quick_contact: { id: 'Kontak Kami', en: 'Contact Us' },
  home_quick_contact_sub: { id: 'Telegram, WhatsApp & bantuan HR', en: 'Telegram, WhatsApp & HR support' },
  home_sectors_section_title: { id: 'Sektor Alih Daya', en: 'Outsourcing Sectors' },
  home_sectors_section_sub: { id: 'Ketuk sektor untuk melihat lowongan terkait', en: 'Tap a sector to view related vacancies' },
  home_sector_construction: { id: 'Konstruksi & Site', en: 'Construction & Site' },
  home_sector_construction_desc: { id: 'Operator, mandor, tukang, crew lapangan', en: 'Operators, foremen, trades, field crews' },
  home_sector_mfg: { id: 'Manufaktur', en: 'Manufacturing' },
  home_sector_mfg_desc: { id: 'Pabrik, smelter, produksi & QC', en: 'Plants, smelters, production & QC' },
  home_sector_office: { id: 'Perkantoran', en: 'Office' },
  home_sector_office_desc: { id: 'Admin, finance, HR & back office', en: 'Admin, finance, HR & back office' },
  home_sector_logistics: { id: 'Logistik & Teknis', en: 'Logistics & Technical' },
  home_sector_logistics_desc: { id: 'Gudang, mekanik, engineering support', en: 'Warehouse, mechanics, engineering support' },
  home_sector_security: { id: 'Keamanan', en: 'Security' },
  home_sector_security_desc: { id: 'Satpam, security officer, patroli', en: 'Guards, security officers, patrol' },
  home_sector_cleaning: { id: 'Kebersihan', en: 'Cleaning' },
  home_sector_cleaning_desc: { id: 'Cleaning service & housekeeping', en: 'Cleaning service & housekeeping' },
  home_sector_fnb: { id: 'F&B / Catering', en: 'F&B / Catering' },
  home_sector_fnb_desc: { id: 'Dapur, kitchen crew & catering site', en: 'Kitchen, crew & site catering' },
  home_news_section_title: { id: 'Informasi Terkini', en: 'Latest Updates' },
  home_news_badge: { id: 'Pengumuman', en: 'Announcement' },
  home_news_title: { id: 'Informasi Rekrutmen Terbaru', en: 'Latest Recruitment Updates' },
  home_news_desc: {
    id: 'Update lowongan site Morowali, Palu, dan proyek industri lainnya.',
    en: 'Updates on Morowali, Palu, and other industrial project vacancies.',
  },
  home_vac_title: { id: 'Lowongan Tersedia', en: 'Available Vacancies' },
  home_vac_desc: { id: 'Pilih posisi yang sesuai dengan kualifikasi Anda.', en: 'Choose a position that matches your qualifications.' },
  home_search_placeholder: { id: 'Cari lowongan berdasarkan judul atau deskripsi...', en: 'Search vacancies by title or description...' },
  home_btn_location: { id: 'Lihat Lokasi', en: 'View Location' },
  home_btn_apply: { id: 'Lamar', en: 'Apply' },
  home_empty_search: { id: 'Tidak ditemukan lowongan yang sesuai.', en: 'No matching vacancies found.' },
  home_qualifications: { id: 'Kualifikasi:', en: 'Qualifications:' },
  home_read_more: { id: 'Selengkapnya', en: 'Read More' },
  home_hide: { id: 'Sembunyikan', en: 'Hide' },

  // About Page
  about_title: { id: 'Tentang Kami', en: 'About Us' },
  about_hero_desc: { id: 'Mitra strategis terpercaya dalam solusi pengelolaan tenaga kerja.', en: 'Trusted strategic partner in workforce management solutions.' },
  about_who_title: { id: 'Siapa Kami?', en: 'Who We Are?' },
  about_who_desc1: { 
    id: 'PT Perdana Adi Yuda didirikan dengan semangat untuk menjembatani kebutuhan industri akan tenaga kerja berkualitas.', 
    en: 'PT Perdana Adi Yuda was founded with the spirit to bridge the industry needs for quality workforce.' 
  },
  about_who_desc2: { 
    id: 'Kami berkomitmen memberikan solusi Manpower Service yang terpadu, profesional, dan berkualitas.', 
    en: 'We are committed to providing integrated, professional, and high-quality Manpower Service solutions.' 
  },
  about_visi_title: { id: 'Visi Kami', en: 'Our Vision' },
  about_visi_desc: { 
    id: 'Menjadi perusahaan penyedia jasa tenaga kerja terdepan yang profesional dan terpercaya.', 
    en: 'To be the leading, professional, and trusted workforce service provider company.' 
  },
  about_misi_title: { id: 'Misi Kami', en: 'Our Mission' },
  about_misi_1: { id: 'Layanan berkualitas dan efisien.', en: 'Quality and efficient services.' },
  about_misi_2: { id: 'Meningkatkan kompetensi tenaga kerja.', en: 'Improving workforce competency.' },
  about_misi_3: { id: 'Membangun hubungan kemitraan jangka panjang.', en: 'Building long-term partnership relationships.' },
  about_val_title: { id: 'Nilai Perusahaan', en: 'Core Values' },
  about_val_integrity: { id: 'Integritas', en: 'Integrity' },
  about_val_integrity_desc: { id: 'Menjunjung tinggi kejujuran.', en: 'Upholding honesty.' },
  about_val_pro: { id: 'Profesionalisme', en: 'Professionalism' },
  about_val_pro_desc: { id: 'Bekerja dengan standar tinggi.', en: 'Working with high standards.' },
  about_val_inn: { id: 'Inovasi', en: 'Innovation' },
  about_val_inn_desc: { id: 'Beradaptasi dengan teknologi.', en: 'Adapting to technology.' },

  // Contact Page
  contact_title: { id: 'Hubungi Kami', en: 'Contact Us' },
  contact_desc: { id: 'Kami siap membantu kebutuhan rekrutmen Anda.', en: 'We are ready to help with your recruitment needs.' },
  contact_office: { id: 'Kantor Pusat', en: 'Head Office' },
  contact_address: { id: 'Alamat', en: 'Address' },
  contact_phone: { id: 'Telepon & WhatsApp', en: 'Phone & WhatsApp' },
  contact_form_title: { id: 'Kirim Pesan', en: 'Send Message' },
  contact_form_desc: { id: 'Silakan isi formulir di bawah ini.', en: 'Please fill out the form below.' },
  contact_field_name: { id: 'Nama Lengkap', en: 'Full Name' },
  contact_field_subject: { id: 'Subjek', en: 'Subject' },
  contact_field_msg: { id: 'Pesan', en: 'Message' },
  contact_btn_send: { id: 'Kirim Pesan', en: 'Send Message' },
  contact_sent_alert: { id: 'Pesan Anda telah terkirim!', en: 'Your message has been sent!' },

  // Footer
  footer_desc: { 
    id: 'Perusahaan yang bergerak di bidang jasa pengelolaan tenaga kerja dan kegiatan pendukung lainnya.', 
    en: 'Company engaged in workforce management services and other supporting activities.' 
  },
  footer_rights: { id: 'Hak cipta dilindungi undang-undang.', en: 'All rights reserved.' },
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('id');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'id' ? 'en' : 'id'));
  };

  const t = (key: string): string => {
    return dictionary[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
