import React, { useState } from 'react';
import { 
  BriefcaseIcon, 
  UserGroupIcon, 
  AcademicCapIcon, 
  SparklesIcon, 
  CheckCircleIcon, 
  ArrowRightIcon, 
  ArrowPathIcon,
  ShieldCheckIcon,
  PresentationChartBarIcon,
  UserPlusIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../services/i18n';

interface ServiceDetail {
  id: string;
  title: { id: string; en: string };
  desc: { id: string; en: string };
  icon: React.ComponentType<any>;
  items: { id: string; en: string }[];
  accentColor: string;
  bgLight: string;
}

export const Services: React.FC = () => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('business-support');

  const servicesData: ServiceDetail[] = [
    {
      id: 'business-support',
      title: { id: 'Business Support', en: 'Business Support' },
      desc: {
        id: 'Sumber Daya Manusia merupakan salah satu aspek penting dalam hal operasional perusahaan. Kami menyediakan SDM terbaik dan berpengalaman di bidangnya, melalui proses rekrutmen dan seleksi yang cepat kami dapat memberikan dukungan profesional dan kompetensi tinggi untuk kebutuhan bisnis Anda.',
        en: 'Human Resources is one of the important aspects of company operations. We provide the best and most experienced HR in their fields; through a fast recruitment and selection process, we can provide professional support and high competence for your business needs.'
      },
      icon: BriefcaseIcon,
      accentColor: 'text-blue-600 border-blue-600 bg-blue-50',
      bgLight: 'bg-blue-50/50',
      items: [
        { id: 'Komunikasi Pemasaran (Marketing Communication)', en: 'Marketing Communication' },
        { id: 'Sales Force / Tim Penjualan', en: 'Sales Force / Sales Team' },
        { id: 'Staff Perkantoran', en: 'Office Staff' },
        { id: 'Staff Forwarding / Logistik', en: 'Forwarding / Logistics Staff' },
        { id: 'Staff Administrasi', en: 'Administrative Staff' },
        { id: 'Receptionist / Resepsionis', en: 'Receptionist' },
        { id: 'Professional Driver / Pengemudi', en: 'Professional Driver' },
        { id: 'Dan posisi pendukung operasional lainnya', en: 'And other operational support positions' }
      ]
    },
    {
      id: 'recruitment',
      title: { id: 'Recruitment', en: 'Recruitment' },
      desc: {
        id: 'Kami fokus kepada pencarian karyawan untuk posisi-posisi non-management untuk membantu perusahaan Anda menjalankan aturan dan prosedur yang ada secara andal dan tepat sasaran.',
        en: 'We focus on searching for employees for non-management positions to help your company run the existing rules and procedures reliably and right on target.'
      },
      icon: UserGroupIcon,
      accentColor: 'text-emerald-600 border-emerald-600 bg-emerald-50',
      bgLight: 'bg-emerald-50/40',
      items: [
        { id: 'Pencarian Tenaga Kerja Non-Manajemen', en: 'Non-Management Talent Sourcing' },
        { id: 'Sistem Seleksi Terstandarisasi', en: 'Standardized Selection System' },
        { id: 'Pemeriksaan Referensi Lengkap', en: 'Comprehensive Reference Checks' },
        { id: 'Penilaian Kompetensi & Karakter', en: 'Competency & Character Evaluation' },
        { id: 'Pemenuhan Kebutuhan Skala Besar', en: 'High-Volume Staffing Solutions' }
      ]
    },
    {
      id: 'training',
      title: { id: 'Training & Development', en: 'Training & Development' },
      desc: {
        id: 'Kami menyediakan berbagai program pelatihan untuk membangun dan mengembangkan bakat tim Anda. Setiap program dipimpin oleh pelatih (trainer) yang kompeten yang dapat menciptakan pembelajaran yang nyaman untuk mendapatkan hasil yang maksimal bagi kemajuan perusahaan.',
        en: "We provide various training programs to build and develop your team's talent. Each program is led by a competent trainer who can create a comfortable learning environment to obtain maximum results for the company's progress."
      },
      icon: AcademicCapIcon,
      accentColor: 'text-purple-600 border-purple-600 bg-purple-50',
      bgLight: 'bg-purple-50/30',
      items: [
        { id: 'Inhouse / Exhouse Training', en: 'In-house / Ex-house Training' },
        { id: 'Training Skill & Motivation (Keahlian & Motivasi)', en: 'Skill & Motivation Training' },
        { id: 'Supervisory Management (Manajemen Penyelia)', en: 'Supervisory Management' },
        { id: 'Outdoor Training: Outbond Training', en: 'Outdoor Training: Outbound Activities' },
        { id: 'Employee & Family Gathering', en: 'Employee & Family Gathering' }
      ]
    },
    {
      id: 'event-management',
      title: { id: 'Event Management', en: 'Event Management' },
      desc: {
        id: 'Kami merancang dan melaksanakan setiap Event Anda dengan keahlian dan penuh dedikasi, menciptakan pengalaman yang luar biasa bagi semua peserta untuk mendukung citra publik yang positif.',
        en: 'We design and execute each of your events with expertise and full dedication, creating outstanding experiences for all attendees to support a positive public image.'
      },
      icon: SparklesIcon,
      accentColor: 'text-amber-600 border-amber-600 bg-amber-50',
      bgLight: 'bg-amber-50/35',
      items: [
        { id: 'MICE (Meetings, Incentives, Conferences, Exhibitions)', en: 'MICE (Meetings, Incentives, Conferences, Exhibitions)' },
        { id: 'Brand Activation (Aktivasi Merek)', en: 'Brand Activation' },
        { id: 'Product Launching (Peluncuran Produk)', en: 'Product Launching' },
        { id: 'Corporation Gathering / Pertemuan Perusahaan', en: 'Corporate Gathering' },
        { id: 'FOB (Field / Festival of Business)', en: 'FOB (Field / Festival of Business)' },
        { id: 'Sales Promotion Girl/Boy (SPG/SPB) Sourcing', en: 'Sales Promotion Girl/Boy (SPG/SPB) Management' },
        { id: 'Penyelenggaraan Event Corporate & Public', en: 'Corporate & Public Event Organizing' }
      ]
    }
  ];

  // Specific flow for Recruitment from Page 5
  const recruitFlow = [
    { title: { id: 'Identifikasi kebutuhan posisi', en: 'Identify position needs' }, step: 'Step 1' },
    { title: { id: 'Membuat strategi perekrutan', en: 'Create recruitment strategy' }, step: 'Step 2' },
    { title: { id: 'Publikasi lowongan pekerjaan', en: 'Publish job vacancies' }, step: 'Step 3' },
    { title: { id: 'Screening', en: 'Screening / Filtering' }, step: 'Step 4' },
    { title: { id: 'Test & Interview', en: 'Test & Interview' }, step: 'Step 5' },
    { title: { id: 'Asses, Reference check & Verify', en: 'Assess, Reference check & Verify' }, step: 'Step 6' },
    { title: { id: 'Shortlist & offering', en: 'Shortlist & offering' }, step: 'Step 7' },
    { title: { id: 'On boarding or client interview', en: 'Onboarding or client interview' }, step: 'Step 8' }
  ];

  // General Lifecycle "Our Process" from Page 7
  const ourProcessSteps = [
    {
      num: '1',
      title: { id: 'Recruitment & Assessment', en: 'Recruitment & Assessment' },
      detail: { id: 'Seleksi ketat dan evaluasi kompetensi calon tenaga kerja.', en: 'Strict selection and evaluation of prospective workers competency.' }
    },
    {
      num: '2',
      title: { id: 'Training / Pelatihan', en: 'Training & Induction' },
      detail: { id: 'Pembekalan keahlian kerja dan penyelarasan budaya kerja mitra.', en: 'Provision of work skills and alignment of partners work culture.' }
    },
    {
      num: '3',
      title: { id: 'Placement & Delivery', en: 'Placement & Delivery' },
      detail: { id: 'Penempatan serta koordinasi operasional awal di lokasi kerja.', en: 'Placement and coordination of initials operation on site.' }
    },
    {
      num: '4',
      title: { id: 'Mentoring / Bimbingan', en: 'Ongoing Mentoring' },
      detail: { id: 'Pendampingan berkelanjutan bagi karyawan untuk stabilitas kerja.', en: 'Continuous mentoring for employees to ensure work stability.' }
    },
    {
      num: '5',
      title: { id: 'Development / Pengembangan', en: 'Talent Development' },
      detail: { id: 'Up-skilling dan pengembangan karir karyawan di lapangan.', en: 'Up-skilling and career development of field employees.' }
    },
    {
      num: '6',
      title: { id: 'Performance Evaluation', en: 'Performance Evaluation' },
      detail: { id: 'Evaluasi kinerja berkala (KPI) bersama klien mitra resmi.', en: 'Periodic performance evaluation (KPI) with official partner client.' }
    },
    {
      num: '7',
      title: { id: 'Termination or Renewal', en: 'Termination or Renewal' },
      detail: { id: 'Manajemen akhir kontrak kerja atau perpanjangan masa tugas.', en: 'Management of contract termination or service term renewal.' }
    }
  ];

  return (
    <div id="services-page" className="bg-slate-50 min-h-screen">
      {/* Services Hero Header */}
      <div className="relative bg-gradient-to-r from-blue-900 to-indigo-950 text-white py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-900/[0.1] bg-[bottom_left] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <span className="bg-blue-800 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            PT PERDANA ADI YUDA
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl mt-4">
            {language === 'id' ? 'Layanan Solusi Tenaga Kerja' : 'Manpower Solution Services'}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-blue-100 max-w-2xl mx-auto">
            {language === 'id' 
              ? 'Layanan pengelolaan tenaga kerja terintegrasi, profesional, dan andal untuk mendukung efisiensi operasional bisnis Anda.' 
              : 'Integrated, professional, and reliable workforce management services to support your business operational efficiency.'}
          </p>
        </div>
      </div>

      {/* Product & Services Categories Section */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-950">
            {language === 'id' ? 'Solusi Layanan Terpadu' : 'Comprehensive Services'}
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mt-2 max-w-3xl mx-auto">
            {language === 'id' 
              ? 'Kami menyajikan empat pilar utama layanan pendukung bisnis yang dirancang profesional sesuai kebutuhan mitra korporasi kami.' 
              : 'We present four main pillars of business support services professionally designed to suit our corporate partner needs.'}
          </p>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {servicesData.map((service) => {
            const IconComponent = service.icon;
            const isTabActive = activeTab === service.id;
            return (
              <button
                key={service.id}
                id={`tab-btn-${service.id}`}
                onClick={() => setActiveTab(service.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 border ${
                  isTabActive
                    ? 'bg-blue-900 border-blue-900 text-white shadow-md'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <IconComponent className="h-4.5 w-4.5" />
                <span>{language === 'id' ? service.title.id : service.title.en}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Category Feature Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-500">
          {servicesData.map((service) => {
            if (service.id !== activeTab) return null;
            const IconComponent = service.icon;
            return (
              <div key={service.id} id={`panel-${service.id}`} className="p-6 sm:p-10 lg:p-12">
                <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-start">
                  
                  {/* Text Description Left Column */}
                  <div className="lg:col-span-7">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-xl bg-blue-100/85 text-blue-900`}>
                        <IconComponent className="h-7 w-7" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {language === 'id' ? service.title.id : service.title.en}
                      </h3>
                    </div>
                    
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed text-justify mb-6">
                      {language === 'id' ? service.desc.id : service.desc.en}
                    </p>

                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-4 flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                        <span>
                          {language === 'id' ? 'Item Cakupan Kerja:' : 'Work Scope Deliverables:'}
                        </span>
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {service.items.map((item, idx) => (
                          <div 
                            key={idx} 
                            id={`desc-item-${service.id}-${idx}`}
                            className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors"
                          >
                            <span className="font-bold text-blue-800 text-xs sm:text-sm">✓</span>
                            <span className="text-xs sm:text-sm text-gray-700 leading-tight">
                              {language === 'id' ? item.id : item.en}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Side Visual Highlight Column */}
                  <div className="lg:col-span-5 mt-8 lg:mt-0">
                    <div className={`rounded-2xl p-6 border border-slate-100 ${service.bgLight} h-full flex flex-col justify-between`}>
                      <div>
                        <h4 className="text-sm font-bold text-blue-950 uppercase tracking-widest mb-3">
                          {language === 'id' ? 'Mengapa Memilih Kami?' : 'Why Choose Our Solutions?'}
                        </h4>
                        <div className="space-y-4">
                          <div className="flex gap-3">
                            <span className="text-lg">🤝</span>
                            <div>
                              <h5 className="font-bold text-xs sm:text-sm text-gray-900">
                                {language === 'id' ? 'Kepatuhan Hukum Penuh' : 'Full Legal Compliance'}
                              </h5>
                              <p className="text-xs text-gray-500 mt-1">
                                {language === 'id' ? 'Menjunjung peraturan ketenagakerjaan resmi.' : 'Adhere perfectly with formal Indonesian labor laws.'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <span className="text-lg">⏳</span>
                            <div>
                              <h5 className="font-bold text-xs sm:text-sm text-gray-900">
                                {language === 'id' ? 'Respon & Seleksi Cepat' : 'Rapid SLA Response & Selection'}
                              </h5>
                              <p className="text-xs text-gray-500 mt-1">
                                {language === 'id' ? 'Proses sourcing ringkas untuk minimalisasi downtime.' : 'Short sourcing process to minimize operational downtime.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <span className="text-lg">👑</span>
                            <div>
                              <h5 className="font-bold text-xs sm:text-sm text-gray-900">
                                {language === 'id' ? 'Garansi Penggantian' : 'Replacement Guarantee'}
                              </h5>
                              <p className="text-xs text-gray-500 mt-1">
                                {language === 'id' ? 'Garansi penggantian personil jika tidak memenuhi kualifikasi.' : 'Replacement terms provided if the personnel does not meet standards.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-gray-200/60 text-center">
                        <p className="text-xs text-gray-600 mb-3 font-medium">
                          {language === 'id' ? 'Perlu konsultasi lebih mendalam?' : 'Need more personalized explanations?'}
                        </p>
                        <a 
                          href="#/contact" 
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition shadow-sm"
                        >
                          <span>{language === 'id' ? 'Hubungi Admin' : 'Contact Admin'}</span>
                          <ArrowRightIcon className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recruitment Flow Flowchart Step Section */}
      <div className="bg-white border-y border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-950">
              {language === 'id' ? 'Alur Perekrutan (Recruitment Flow)' : 'Our Recruitment Workflow'}
            </h2>
            <p className="text-gray-500 text-sm mt-2 max-w-3xl mx-auto">
              {language === 'id' 
                ? 'Prosedur bertahap 8 langkah dalam mengkurasi talenta non-manajemen berkualitas dari pencarian awal hingga proses onboarding resmi.' 
                : 'A systematic 8-step blueprint to filter premium non-management recruits from initial identification to official workplace integration.'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recruitFlow.map((flow, idx) => (
              <div 
                key={idx} 
                id={`recruit-step-${idx}`}
                className="relative bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between hover:shadow-sm hover:border-blue-400 transition"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    {flow.step}
                  </span>
                  <span className="text-xs font-bold text-gray-300">0{idx + 1}</span>
                </div>
                <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug">
                  {language === 'id' ? flow.title.id : flow.title.en}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Business Process Lifecycle (Our Process Page 7) */}
      <div className="bg-slate-50 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-950">
              {language === 'id' ? 'Siklus Manajemen Tenaga Kerja' : 'End-to-End Enterprise Lifecycle'}
            </h2>
            <p className="text-gray-500 text-sm mt-2 max-w-3xl mx-auto">
              {language === 'id' 
                ? 'Kami tidak hanya merekrut. Kami mengelola seluruh siklus hidup ketenagakerjaan (Our Process) untuk memastikan produktivitas konstan.' 
                : 'We do not just hire. We manage the complete manpower lifecycle (Our Process) to guarantee constant high performance.'}
            </p>
          </div>

          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-7 md:gap-3">
            {ourProcessSteps.map((step) => (
              <div 
                key={step.num}
                id={`lifeycle-step-${step.num}`}
                className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center flex flex-col justify-between hover:border-indigo-400 transition relative"
              >
                <div>
                  <div className="w-8 h-8 rounded-full bg-indigo-900 border border-indigo-700 text-white flex items-center justify-center mx-auto mb-3 font-bold text-xs">
                    {step.num}
                  </div>
                  <h4 className="font-extrabold text-xs text-gray-950 tracking-tight leading-snug mb-2">
                    {language === 'id' ? step.title.id : step.title.en}
                  </h4>
                </div>
                <p className="text-[10.5px] text-gray-500 leading-tight">
                  {language === 'id' ? step.detail.id : step.detail.en}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trusted Clients Brand Section */}
      <div className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold">
              {language === 'id' ? 'Pengalaman Operasional & Mitra Klien' : 'Operational Management Experience & Partners'}
            </h3>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-60">
            <span className="font-extrabold text-gray-700 tracking-wider text-sm sm:text-base">INDOSAT OOREDOO</span>
            <span className="font-extrabold text-gray-700 tracking-wider text-sm sm:text-base">LINTASARTA</span>
            <span className="font-extrabold text-gray-700 tracking-wider text-sm sm:text-base">TRANSVISION</span>
            <span className="font-extrabold text-gray-700 tracking-wider text-sm sm:text-base">TVS SUPPLY CHAIN</span>
            <span className="font-extrabold text-gray-700 tracking-wider text-sm sm:text-base">HKTI SULTENG</span>
            <span className="font-extrabold text-gray-700 tracking-wider text-sm sm:text-base font-serif">DYANDRA</span>
          </div>
        </div>
      </div>

    </div>
  );
};
