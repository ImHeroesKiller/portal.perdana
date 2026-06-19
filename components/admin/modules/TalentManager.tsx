import React, { useState, useEffect, useMemo } from 'react';
import { Employee, JobVacancy, ApplicationStatus, Client, Project } from '../../../types';
import { updateEmployee, createJob, updateJob, deleteJob, deleteEmployee, createEmployee } from '../../../services/db';
import { useEmployees, useJobs, useClients, useProjects, useRefreshDb } from '../../../hooks/useDbQueries';
import { createCredentialsForCandidateSubmit } from '../../../services/auth';
import { sendCandidateCredentialsNotification } from '../../../services/notifications';
import { analyzeCandidate, ScoreBadge, StatusBadge, LoadingSpinner } from '../shared/Utils';
import { LocationSearch } from '../shared/LocationSearch';
import { CandidateModal } from '../modals/CandidateModal';
import { 
    UsersIcon, BriefcaseIcon, RectangleStackIcon, TableCellsIcon, 
    FunnelIcon, MagnifyingGlassIcon, ArrowDownTrayIcon, ArrowPathIcon,
    SparklesIcon, AcademicCapIcon, MapPinIcon, Squares2X2Icon, PlusIcon
} from '@heroicons/react/24/outline';

const getEmployeeSkillsString = (emp: Employee): string => {
    if (!emp.skills) return '';
    if (Array.isArray(emp.skills)) return emp.skills.join(', ');
    if (typeof emp.skills === 'string') return emp.skills;
    return String(emp.skills);
};

export const TalentManager: React.FC = () => {
    const [view, setView] = useState<'dashboard' | 'pipeline' | 'candidates' | 'talent-pool' | 'jobs'>('dashboard');
    const navItems = [
        { id: 'dashboard' as const, label: 'Dashboard', fullLabel: 'Dashboard & Ringkasan', icon: Squares2X2Icon },
        { id: 'pipeline' as const, label: 'Pipeline', fullLabel: 'Pipeline Rekrutmen', icon: FunnelIcon },
        { id: 'candidates' as const, label: 'Pelamar', fullLabel: 'Semua Pelamar', icon: UsersIcon },
        { id: 'talent-pool' as const, label: 'Pool', fullLabel: 'Pool Talent (Recycle)', icon: SparklesIcon },
        { id: 'jobs' as const, label: 'Lowongan', fullLabel: 'Kelola Lowongan', icon: BriefcaseIcon },
    ];
    const { data: employees = [], isFetching: loading, refetch: refetchEmployees } = useEmployees();
    const { data: jobs = [], refetch: refetchJobs } = useJobs();
    const { data: clients = [] } = useClients();
    const { data: projects = [] } = useProjects();
    const refreshDb = useRefreshDb();

    // Job Vacancy Form State
    const [editingJobId, setEditingJobId] = useState<string | null>(null);
    const [newJobTitle, setNewJobTitle] = useState('');
    const [newJobDept, setNewJobDept] = useState('OPERATOR');
    const [newJobClient, setNewJobClient] = useState('');
    const [newJobProject, setNewJobProject] = useState('');
    const [newJobType, setNewJobType] = useState<'Full-time' | 'Part-time' | 'Contract' | 'Internship'>('Contract');
    const [newJobLoc, setNewJobLoc] = useState('Morowali');
    const [newJobMinEdu, setNewJobMinEdu] = useState('SMA/SMK/Sederajat');
    const [newJobAge, setNewJobAge] = useState<number>(35);
    const [newJobGender, setNewJobGender] = useState<'Laki-laki' | 'Perempuan' | 'Any'>('Any');
    const [newJobSalary, setNewJobSalary] = useState('4.800.000 - 6.000.000 IDR');
    const [newJobDesc, setNewJobDesc] = useState('');
    const [newJobSkills, setNewJobSkills] = useState('');
    const [newJobReqs, setNewJobReqs] = useState('');
    const [formError, setFormError] = useState('');
    const [isJobFormExpanded, setIsJobFormExpanded] = useState<boolean>(false);
    
    // Auto expand form when user click Edit Job
    useEffect(() => {
        if (editingJobId) {
            setIsJobFormExpanded(true);
        }
    }, [editingJobId]);
    
    // Filters
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [filterSkill, setFilterSkill] = useState<string>('');
    const [filterCity, setFilterCity] = useState<string>('All');
    const [sortOrder, setSortOrder] = useState<'newest'|'oldest'>('newest');
    const [mobileActiveStage, setMobileActiveStage] = useState<string>('APPLIED');

    // Modals & Selections
    const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
    const [recycleEmp, setRecycleEmp] = useState<Employee | null>(null);

    // Custom Confirmation Dialog State
    const [tmConfirmConfig, setTmConfirmConfig] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
        confirmText?: string;
        cancelText?: string;
        type?: 'danger' | 'success' | 'info';
    } | null>(null);

    // Manual Candidate Form State
    const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
    const [candidateForm, setCandidateForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        positionApplied: '',
        lastEducation: 'SMA/SMK',
        institutionName: '',
        major: '',
        domicileAddress: 'Morowali'
    });
    const [newCandidateResult, setNewCandidateResult] = useState<{
        fullName: string;
        email: string;
        phone: string;
        password: string;
        whatsappMessage: string;
    } | null>(null);

    const triggerTmConfirm = (
        title: string,
        message: string,
        onConfirm: () => void,
        type: 'danger' | 'success' | 'info' = 'info',
        confirmText = 'Ya',
        cancelText = 'Batal'
    ) => {
        setTmConfirmConfig({ title, message, onConfirm, type, confirmText, cancelText });
    };

    const loadData = async () => {
        await refreshDb();
    };

    // Derived statistics
    const stats = useMemo(() => {
        const total = employees.length;
        const interview = employees.filter(e => e.status === 'INTERVIEW').length;
        const offering = employees.filter(e => e.status === 'OFFERING').length;
        const hired = employees.filter(e => ['HIRED', 'CONTRACT'].includes(e.status)).length;
        const rejected = employees.filter(e => e.status === 'REJECTED').length;
        const talentPool = employees.filter(e => e.isInTalentPool || e.status === 'REJECTED').length;
        const recycledCount = employees.filter(e => e.hrNotes?.includes('[Recycled]')).length;

        return { total, interview, offering, hired, rejected, talentPool, recycledCount };
    }, [employees]);

    // Active Cities extracted from jobs & candidate locations
    const activeCities = useMemo(() => {
        const set = new Set<string>();
        employees.forEach(e => { if (e.placeOfBirth) set.add(e.placeOfBirth); });
        jobs.forEach(j => { if (j.location) set.add(j.location); });
        return Array.from(set);
    }, [employees, jobs]);

    // Optimized filtering using useMemo
    const filteredEmp = useMemo(() => {
        let res = employees;
        
        // Don't show rejected/recycled candidates in the main 'candidates' list if they are in talent pool,
        // or let's keep them and filter by search.
        if (search) {
            const query = search.toLowerCase();
            res = res.filter(e => 
                e.fullName.toLowerCase().includes(query) || 
                getEmployeeSkillsString(e).toLowerCase().includes(query) || 
                e.positionApplied.toLowerCase().includes(query) ||
                e.nik.includes(query) ||
                (e.hrNotes && e.hrNotes.toLowerCase().includes(query))
            );
        }
        
        if (filterStatus !== 'All') {
            if (filterStatus === 'HIRED_OR_CONTRACT') {
                res = res.filter(e => ['HIRED', 'CONTRACT'].includes(e.status));
            } else {
                res = res.filter(e => e.status === filterStatus);
            }
        }

        if (filterCity !== 'All') {
            res = res.filter(e => e.placeOfBirth === filterCity || (e.domicileAddress && e.domicileAddress.includes(filterCity)));
        }

        if (filterSkill) {
            const skillQuery = filterSkill.toLowerCase();
            res = res.filter(e => getEmployeeSkillsString(e).toLowerCase().includes(skillQuery));
        }
        
        return res.sort((a,b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }, [employees, search, filterStatus, filterCity, filterSkill, sortOrder]);

    // Candidates in Talent Pool
    const talentPoolCandidates = useMemo(() => {
        // Talent Pool: Candidates marked as isInTalentPool or status Rejected or containing recycled note
        let res = employees.filter(e => e.isInTalentPool || e.status === 'REJECTED');

        if (search) {
            const query = search.toLowerCase();
            res = res.filter(e => 
                e.fullName.toLowerCase().includes(query) || 
                getEmployeeSkillsString(e).toLowerCase().includes(query) || 
                e.positionApplied.toLowerCase().includes(query)
            );
        }

        if (filterCity !== 'All') {
            res = res.filter(e => e.placeOfBirth === filterCity || (e.domicileAddress && e.domicileAddress.includes(filterCity)));
        }

        if (filterSkill) {
            const skillQuery = filterSkill.toLowerCase();
            res = res.filter(e => getEmployeeSkillsString(e).toLowerCase().includes(skillQuery));
        }

        return res.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [employees, search, filterCity, filterSkill]);

    const handleStatusUpdate = async (id: string, status: ApplicationStatus, notes?: string, date?: string, extraData?: any) => {
        try {
            const extra = { ...extraData };
            if (status === 'REJECTED') {
                extra.isInTalentPool = true;
            }
            await updateEmployee(id, { status, hrNotes: notes, interviewDate: date, ...extra });
            
            const { data: updatedList = [] } = await refetchEmployees();
            
            // Notify Telegram (wrapped in a try-catch to prevent offline or unconfigured server errors from stopping the application)
            try {
                const updatedEmp = updatedList.find(e => e.id === id);
                if (updatedEmp) {
                    await fetch('/api/send-telegram', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: `Status kandidat ${updatedEmp.fullName} telah diperbarui menjadi ${status}.` })
                    });
                }
            } catch (telegramErr) {
                console.warn("Gagal mengirimkan notifikasi status ke bot Telegram:", telegramErr);
            }
            
            // Update the active modal selection securely
            const fresh = updatedList.find(e => e.id === id);
            if (fresh && selectedEmp) {
                setSelectedEmp(fresh);
            }
        } catch (error) {
            console.error("Gagal memperbarui status kandidat:", error);
        }
    };

    const handleDeleteEmployee = async (id: string) => {
        try {
            await deleteEmployee(id);
            await refetchEmployees();
            setSelectedEmp(null);
        } catch (error) {
            console.error("Gagal menghapus data pelamar:", error);
        }
    };

    const handleSaveManualCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!candidateForm.fullName || !candidateForm.email || !candidateForm.phone || !candidateForm.positionApplied) {
            alert('Mohon lengkapi semua field utama!');
            return;
        }

        try {
            // Standardize phone number
            let rawPhone = candidateForm.phone;
            if (rawPhone.startsWith('0')) rawPhone = '62' + rawPhone.slice(1);
            if (!rawPhone.startsWith('+') && !rawPhone.startsWith('62')) rawPhone = '62' + rawPhone;
            const cleanPhone = rawPhone.startsWith('+') ? rawPhone : '+' + rawPhone;

            const newCandidatePayload: any = {
                fullName: candidateForm.fullName,
                email: candidateForm.email.toLowerCase(),
                whatsappNumber: cleanPhone,
                positionApplied: candidateForm.positionApplied,
                lastEducation: candidateForm.lastEducation,
                institutionName: candidateForm.institutionName || '-',
                major: candidateForm.major || '-',
                domicileAddress: candidateForm.domicileAddress,
                status: 'APPLIED',
                createdAt: new Date().toISOString(),
                nik: Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString(), // auto random
                kkNumber: Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString(),
                dateOfBirth: '1998-05-15',
                gender: 'Any',
                religion: 'Islam',
                maritalStatus: 'Lajang',
                lastEducationScore: 3.2,
                skills: 'Ms Office, Komunikasi',
                workExperience: '1 Tahun',
            };

            await createEmployee(newCandidatePayload);

            // Generate Login Credentials
            const credentials = createCredentialsForCandidateSubmit(candidateForm.email, cleanPhone);

            // Send Email Notification Automatically
            try {
                await sendCandidateCredentialsNotification(
                    candidateForm.fullName, 
                    candidateForm.email.toLowerCase(), 
                    credentials.password, 
                    candidateForm.positionApplied
                );
            } catch (gmailErr) {
                console.warn("Gmail API credentials auto-send from admin failed:", gmailErr);
            }

            // WhatsApp Message Template for Admin to manual share (or launch direct api)
            const waMsg = `Halo *${candidateForm.fullName}*,\n\nTerima kasih telah didaftarkan di PT Perdana Adi Yuda untuk posisi *${candidateForm.positionApplied}*.\n\nAkun Portal Rekrutmen Anda telah otomatis dibuat. Anda dapat login untuk melacak progres lamaran kerja & melengkapi berkas administrasi Anda.\n\nBerikut kredensial login Anda:\n- *Situs Portal*: https://perada.net/#/login\n- *Username*: ${candidateForm.email.toLowerCase()}\n- *Password*: ${credentials.password}\n\nSilakan simpan info ini. Terima kasih!`;

            setNewCandidateResult({
                fullName: candidateForm.fullName,
                email: candidateForm.email.toLowerCase(),
                phone: cleanPhone,
                password: credentials.password,
                whatsappMessage: waMsg
            });

            // Reload data
            loadData();

        } catch (error: any) {
            alert('Gagal menambahkan kandidat manual: ' + error.message);
        }
    };

    const exportData = () => {
        const headers = ['Nama,Posisi Terakhir,Status,Email,WA,Kota Asal,Keterangan'];
        const listToExport = view === 'talent-pool' ? talentPoolCandidates : filteredEmp;
        const csv = listToExport.map(e => `"${e.fullName}","${e.positionApplied}","${e.status}","${e.email}","${e.whatsappNumber}","${e.placeOfBirth}","${(e.hrNotes || '').replace(/\n/g, ' ')}"`).join('\n');
        const blob = new Blob([headers + '\n' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = view === 'talent-pool' ? 'talent_pool_perdana.csv' : 'kandidat_rekrutmen.csv'; 
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Header Navigation Tab Menu */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="grid grid-cols-5 md:flex w-full md:w-auto bg-slate-100 p-1.5 rounded-xl gap-1" id="talent-submenu">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = view === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setView(item.id)}
                                className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 p-2 md:px-4 md:py-2 rounded-lg transition-all duration-200 outline-none
                                    ${isActive 
                                        ? 'bg-white text-indigo-700 shadow-sm font-bold scale-[1.02] md:scale-100' 
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
                                    }`}
                                id={`tab-${item.id}`}
                            >
                                <Icon className={`h-6 w-6 md:h-4.5 md:w-4.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <span className="block md:hidden text-[9.5px] font-bold tracking-tight text-center leading-none truncate w-full mt-0.5">
                                    {item.label}
                                </span>
                                <span className="hidden md:block text-sm font-semibold whitespace-nowrap">
                                    {item.fullLabel}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Live Responsive Filters */}
            {view !== 'dashboard' && view !== 'pipeline' && view !== 'jobs' && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-2 w-full items-center">
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                        <input 
                            className="border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-48 bg-slate-50 focus:bg-white" 
                            placeholder="Cari nama, keahlian..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            id="talent-search-input"
                        />
                    </div>
                    {view === 'candidates' && (
                        <select 
                            className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={filterStatus} 
                            onChange={e => setFilterStatus(e.target.value)}
                            id="filter-status-select"
                        >
                            <option value="All">Semua Tahapan</option>
                            <option value="HIRED_OR_CONTRACT">Hired / Kontrak</option>
                            {['APPLIED','INTERVIEW','OFFERING','CONTRACT','HIRED','REJECTED'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    )}
                    <select 
                        className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={filterCity} 
                        onChange={e => setFilterCity(e.target.value)}
                        id="filter-city-select"
                    >
                        <option value="All">Semua Domisili</option>
                        {activeCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input 
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-28 bg-slate-50 focus:bg-white" 
                        placeholder="Keahlian spesifik" 
                        value={filterSkill} 
                        onChange={e => setFilterSkill(e.target.value)} 
                        id="filter-skill-input"
                    />
                    {view === 'candidates' && (
                        <button 
                            onClick={() => {
                                setCandidateForm({
                                    fullName: '',
                                    email: '',
                                    phone: '',
                                    positionApplied: jobs[0]?.title || 'Operator Morowali',
                                    lastEducation: 'SMA/SMK',
                                    institutionName: '',
                                    major: '',
                                    domicileAddress: 'Morowali'
                                });
                                setNewCandidateResult(null);
                                setShowAddCandidateModal(true);
                            }}
                            className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center shadow-xs transition cursor-pointer"
                            id="add-candidate-btn"
                        >
                            <PlusIcon className="h-4 w-4 mr-1"/> Tambah Pelamar
                        </button>
                    )}
                    <button 
                        onClick={exportData} 
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center shadow-xs transition"
                        id="export-csv-btn"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1"/> Ekspor CSV
                    </button>
                </div>
            )}

            {loading && <div className="py-20 flex justify-center"><LoadingSpinner /></div>}

            {/* View 1: Executive Analytics Dashboard */}
            {!loading && view === 'dashboard' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <StatCard 
                            title="Total Pelamar" 
                            value={stats.total} 
                            percentage="100%" 
                            color="slate" 
                            desc="Terdaftar di Cloud" 
                            onClick={() => {
                                setView('candidates');
                                setFilterStatus('All');
                                setSearch('');
                            }}
                        />
                        <StatCard 
                            title="Interview" 
                            value={stats.interview} 
                            percentage={`${((stats.interview/stats.total)*100 || 0).toFixed(0)}%`} 
                            color="indigo" 
                            desc="Tahap Wawancara" 
                            onClick={() => {
                                setView('candidates');
                                setFilterStatus('INTERVIEW');
                                setSearch('');
                            }}
                        />
                        <StatCard 
                            title="Offering" 
                            value={stats.offering} 
                            percentage={`${((stats.offering/stats.total)*100 || 0).toFixed(0)}%`} 
                            color="amber" 
                            desc="Menunggu TTD" 
                            onClick={() => {
                                setView('candidates');
                                setFilterStatus('OFFERING');
                                setSearch('');
                            }}
                        />
                        <StatCard 
                            title="Hired/Kontrak" 
                            value={stats.hired} 
                            percentage={`${((stats.hired/stats.total)*100 || 0).toFixed(0)}%`} 
                            color="emerald" 
                            desc="Karyawan Aktif" 
                            onClick={() => {
                                setView('candidates');
                                setFilterStatus('HIRED_OR_CONTRACT');
                                setSearch('');
                            }}
                        />
                        <StatCard 
                            title="Talent Pool" 
                            value={stats.talentPool} 
                            percentage={`${((stats.talentPool/stats.total)*100 || 0).toFixed(0)}%`} 
                            color="violet" 
                            desc="Database Recycle" 
                            highlight 
                            onClick={() => {
                                setView('talent-pool');
                                setSearch('');
                            }}
                        />
                        <StatCard 
                            title="Tersalurkan" 
                            value={stats.recycledCount} 
                            percentage="Bantu Kerja" 
                            color="rose" 
                            desc="Daur Ulang Karir" 
                            highlight 
                            onClick={() => {
                                setView('candidates');
                                setFilterStatus('All');
                                setSearch('[Recycled]');
                            }}
                        />
                    </div>

                    {/* Integrated Job Vacancy Progress Dashboard */}
                    <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-800 text-lg">Monitoring Kebutuhan Lowongan Kerja & Progres Kandidat</h3>
                                <p className="text-xs text-slate-500">Pantau progres penyerapan tenaga kerja, rasio rekrutmen, dan tahapan pelamar per-lowongan.</p>
                            </div>
                            <button 
                                onClick={() => setView('jobs')} 
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition duration-150 flex items-center gap-1.5"
                                id="btn-add-vacancy-shortcut"
                            >
                                <BriefcaseIcon className="h-4 w-4" /> Kelola & Tambah Lowongan
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
                                    <tr>
                                        <th className="px-5 py-3 text-xs uppercase tracking-wider">Nama Lowongan</th>
                                        <th className="px-5 py-3 text-xs uppercase tracking-wider">Mitra & Proyek Penempatan</th>
                                        <th className="px-5 py-3 text-xs uppercase tracking-wider">Lokasi Kerja</th>
                                        <th className="px-5 py-3 text-center text-xs uppercase tracking-wider">Fase Lamaran (I/O)</th>
                                        <th className="px-5 py-3 text-center text-xs uppercase tracking-wider">Tersalurkan (Hired)</th>
                                        <th className="px-5 py-3 text-center text-xs uppercase tracking-wider">Status Lowongan</th>
                                        <th className="px-5 py-3 text-right text-xs uppercase tracking-wider">Aksi Pelacakan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {jobs.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-8 text-center text-slate-400">Belum ada data lowongan kerja. Silakan tambahkan lowongan baru!</td>
                                        </tr>
                                    ) : (
                                        jobs.map(job => {
                                            const jobCandidates = employees.filter(e => e.jobId === job.id || e.positionApplied.toLowerCase() === job.title.toLowerCase());
                                            const interviewCount = jobCandidates.filter(e => e.status === 'INTERVIEW').length;
                                            const offeringCount = jobCandidates.filter(e => e.status === 'OFFERING').length;
                                            const hiredCount = jobCandidates.filter(e => ['HIRED', 'CONTRACT'].includes(e.status)).length;
                                            const appliedCount = jobCandidates.filter(e => e.status === 'APPLIED').length;

                                            const client = clients.find(c => c.id === job.clientId);
                                            const project = projects.find(p => p.id === job.projectId);

                                            return (
                                                <tr key={job.id} className="hover:bg-slate-50/50 transition">
                                                    <td className="px-5 py-4">
                                                        <div className="font-bold text-slate-800 text-sm leading-snug">{job.title}</div>
                                                        <div className="text-[10px] text-slate-400 font-semibold uppercase">{job.department} • {job.type}</div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {client ? (
                                                            <div className="text-xs font-semibold text-slate-700 leading-snug">{client.name}</div>
                                                        ) : (
                                                            <div className="text-xs text-slate-400 leading-snug">- Tanpa Klien -</div>
                                                        )}
                                                        {project && (
                                                            <div className="text-[10px] text-indigo-600 font-medium">{project.name}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-xs text-slate-500 font-medium">{job.location}</td>
                                                    <td className="px-5 py-4 text-center">
                                                        <div className="flex justify-center items-center gap-1.5">
                                                            <span className="px-2 py-0.5 bg-gray-50 text-slate-600 text-[10px] font-bold rounded border border-gray-200" title="Applied">
                                                                {appliedCount} New
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100" title="Interviewing">
                                                                {interviewCount} Int
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-100" title="Offering">
                                                                {offeringCount} Off
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${hiredCount > 0 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                                                                {hiredCount} Hired
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <button 
                                                            onClick={async () => {
                                                                try {
                                                                    await updateJob(job.id, { isActive: !job.isActive });
                                                                    await refetchJobs();
                                                                } catch (err) {
                                                                    console.error(err);
                                                                }
                                                            }}
                                                            className={`text-[10px] font-bold px-3 py-1 rounded-full transition-colors ${
                                                                job.isActive 
                                                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200' 
                                                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                                                            }`}
                                                        >
                                                            {job.isActive ? '● AKTIF' : '○ NONAKTIF'}
                                                        </button>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <button 
                                                            onClick={() => {
                                                                setSearch(job.title);
                                                                setFilterStatus('All');
                                                                setView('candidates');
                                                            }}
                                                            className="text-xs bg-slate-100 hover:bg-blue-50 text-blue-600 hover:text-blue-800 font-bold px-2.5 py-1 rounded-md transition border hover:border-blue-200 shadow-2xs"
                                                        >
                                                            Pelamar ({jobCandidates.length})
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* View 2: Drag/Click Pipeline Board */}
            {!loading && view === 'pipeline' && (
                <div className="space-y-4">
                    {/* Mobile Stage Selector Tabs (Hidden on Desktop) */}
                    <div className="md:hidden">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Tahapan Pipeline:</label>
                        <div className="flex gap-1.5 overflow-x-auto pb-2 snap-x select-none">
                            {['APPLIED','INTERVIEW','OFFERING','CONTRACT','HIRED'].map(status => {
                                const count = employees.filter(e => e.status === status).length;
                                const isSelected = mobileActiveStage === status;
                                return (
                                    <button
                                        key={status}
                                        onClick={() => setMobileActiveStage(status)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold snap-start whitespace-nowrap transition-all border flex items-center gap-1.5 shadow-2xs ${
                                            isSelected 
                                                ? 'bg-indigo-600 text-white border-indigo-600 font-extrabold' 
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span>{status === 'APPLIED' ? '🆕 APPLIED' : status}</span>
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-150 text-slate-500'}`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Desktop Pipeline Board (Flexible Column Grid) */}
                    <div className="hidden md:flex gap-4 overflow-x-auto pb-4 snap-x">
                        {['APPLIED','INTERVIEW','OFFERING','CONTRACT','HIRED'].map(status => {
                            const stageEmps = employees.filter(e => e.status === status);
                            return (
                                <div key={status} className="min-w-[250px] bg-slate-50 rounded-xl p-3 h-[600px] overflow-y-auto border border-slate-200/60 snap-start flex flex-col">
                                    <div className="sticky top-0 bg-slate-50 pb-2 border-b border-slate-200/80 mb-3 flex justify-between items-center z-10">
                                        <h4 className="font-bold text-xs text-slate-700 tracking-wide uppercase">{status}</h4>
                                        <span className="text-xs font-bold bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full">{stageEmps.length}</span>
                                    </div>
                                    <div className="space-y-2.5 flex-1">
                                        {stageEmps.map(emp => {
                                            const matchedJob = jobs.find(j => j.id === emp.jobId || j.title === emp.positionApplied);
                                            const comparison = matchedJob ? analyzeCandidate(emp, matchedJob) : null;
                                            return (
                                                <div 
                                                    key={emp.id} 
                                                    onClick={() => setSelectedEmp(emp)} 
                                                    className="bg-white p-3.5 rounded-lg shadow-xs hover:shadow-md transition border border-slate-100 hover:border-slate-200 cursor-pointer space-y-2 group"
                                                >
                                                    <div className="font-bold text-sm text-slate-800 truncate group-hover:text-indigo-600 transition">{emp.fullName}</div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-slate-500 truncate max-w-[150px]">{emp.positionApplied}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium">{emp.placeOfBirth}</span>
                                                    </div>
                                                    {comparison && (
                                                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-100">
                                                            <ScoreBadge score={comparison.score} />
                                                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">{emp.lastEducation}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mobile Selection Render: Only render the currently active stage column vertically */}
                    <div className="md:hidden space-y-3">
                        {(() => {
                            const stageEmps = employees.filter(e => e.status === mobileActiveStage);
                            if (stageEmps.length === 0) {
                                return (
                                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-8 text-center text-slate-400 text-xs font-medium">
                                        Tidak ada kandidat di tahapan ini.
                                    </div>
                                );
                            }
                            return (
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center bg-slate-100/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">
                                        <span>Daftar Kandidat (Tahap {mobileActiveStage})</span>
                                        <span>{stageEmps.length} Orang</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        {stageEmps.map(emp => {
                                            const matchedJob = jobs.find(j => j.id === emp.jobId || j.title === emp.positionApplied);
                                            const comparison = matchedJob ? analyzeCandidate(emp, matchedJob) : null;
                                            return (
                                                <div 
                                                    key={emp.id} 
                                                    onClick={() => setSelectedEmp(emp)} 
                                                    className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 active:scale-98 transition duration-150 cursor-pointer space-y-2"
                                                >
                                                    <div className="font-bold text-slate-800 flex justify-between items-center">
                                                        <span>{emp.fullName}</span>
                                                        <span className="text-[10.5px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{emp.placeOfBirth}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-600 font-medium flex justify-between items-center">
                                                        <span>{emp.positionApplied}</span>
                                                        {comparison && <ScoreBadge score={comparison.score} />}
                                                    </div>
                                                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-100 text-[10.5px] text-slate-500">
                                                        <span>Pendidikan: <strong className="text-slate-700">{emp.lastEducation}</strong></span>
                                                        <span className="text-indigo-600 font-bold">Ketuk untuk Detail &rarr;</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* View 3: Data Table View of all Active Candidates */}
            {!loading && view === 'candidates' && (
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
                                <tr>
                                    <th className="px-6 py-4">Nama Pelamar</th>
                                    <th className="px-6 py-4">Lowongan Kerja</th>
                                    <th className="px-6 py-4">Domisili (Kota)</th>
                                    <th className="px-6 py-4">Pendidikan Min</th>
                                    <th className="px-6 py-4">Status Seleksi</th>
                                    <th className="px-6 py-4 text-right">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {filteredEmp.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">Kandidat tidak ditemukan dengan kriteria filter tersebut.</td>
                                    </tr>
                                ) : (
                                    filteredEmp.map(emp => (
                                        <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                                            <td className="px-6 py-4 font-semibold text-slate-800">{emp.fullName}</td>
                                            <td className="px-6 py-4 text-slate-600">{emp.positionApplied}</td>
                                            <td className="px-6 py-4 text-slate-500">{emp.placeOfBirth}</td>
                                            <td className="px-6 py-4 text-xs font-semibold text-slate-500">{emp.lastEducation}</td>
                                            <td className="px-6 py-4"><StatusBadge status={emp.status} /></td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-3">
                                                    {emp.status === 'REJECTED' && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setRecycleEmp(emp); }} 
                                                            className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold px-2 py-1 rounded"
                                                        >
                                                            Salurkan Ulang
                                                        </button>
                                                    )}
                                                    <button onClick={() => setSelectedEmp(emp)} className="text-indigo-600 hover:text-indigo-800 font-bold">Detail</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* View 4: Talent Pool (Rejected and Recyclable Candidates Database) */}
            {!loading && view === 'talent-pool' && (
                <div className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h4 className="font-bold text-indigo-900 flex items-center gap-1.5">
                                <SparklesIcon className="h-5 w-5 text-indigo-600" /> Database Pool Talent Sulawesi Tengah
                            </h4>
                            <p className="text-xs text-indigo-700 leading-relaxed">
                                Halaman ini memuat seluruh kandidat yang berada dalam pool pemulihan (termasuk yang tidak lolos seleksi awal). Anda dapat memantau kecocokan kompetensi mereka dan langsung merekrut atau menyalurkan ulang mereka ke penempatan proyek aktif lain secara instan tanpa perlu mendaftar ulang.
                            </p>
                        </div>
                        <div className="text-sm font-bold text-indigo-900 bg-indigo-200/60 px-3.5 py-1.5 rounded-lg flex-shrink-0 self-start md:self-center">
                            {talentPoolCandidates.length} Kandidat Siap Recycle
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {talentPoolCandidates.length === 0 ? (
                            <div className="col-span-full py-16 text-center text-slate-400 font-medium">
                                Tidak ada kandidat di dalam pool yang memenuhi filter saat ini.
                            </div>
                        ) : (
                            talentPoolCandidates.map(emp => {
                                // Match scoring against original position
                                const origJob = jobs.find(j => j.title === emp.positionApplied);
                                const scoreObj = origJob ? analyzeCandidate(emp, origJob) : { score: 70, matches: [] };
                                
                                return (
                                    <div key={emp.id} className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 space-y-4 hover:shadow-md transition">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="font-bold text-slate-800 text-base">{emp.fullName}</div>
                                                <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                                    <BriefcaseIcon className="h-3 w-3" /> Pilihan Terakhir: {emp.positionApplied}
                                                </div>
                                            </div>
                                            <ScoreBadge score={scoreObj.score} />
                                        </div>

                                        <div className="space-y-2 border-t pt-3 text-xs text-slate-600">
                                            <div className="flex items-center gap-1.5">
                                                <AcademicCapIcon className="h-3.5 w-3.5 text-slate-400" />
                                                <span>{emp.lastEducation} - {emp.major} ({emp.institutionName})</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <MapPinIcon className="h-3.5 w-3.5 text-slate-400" />
                                                <span>Domisili: {emp.placeOfBirth} ({((emp.domicileAddress || '').split(',')[1] || emp.domicileAddress || '').trim() || 'Tidak ada data'})</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Keahlian & Kompetensi</span>
                                            <div className="flex flex-wrap gap-1">
                                                {(Array.isArray(emp.skills) 
                                                    ? emp.skills 
                                                    : typeof emp.skills === 'string' 
                                                        ? emp.skills.split(',') 
                                                        : []
                                                ).slice(0, 4).map((s, idx) => (
                                                    <span key={idx} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] border border-slate-200/60 transition">{s.trim()}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {emp.hrNotes && (
                                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-500 italic line-clamp-2 leading-relaxed">
                                                " {emp.hrNotes} "
                                            </div>
                                        )}

                                        <div className="pt-2 border-t flex justify-between items-center gap-3">
                                            <button 
                                                onClick={() => setSelectedEmp(emp)} 
                                                className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
                                                id={`detail-pool-${emp.id}`}
                                            >
                                                Berkas Lengkap
                                            </button>
                                            <button 
                                                onClick={() => setRecycleEmp(emp)} 
                                                className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1"
                                                id={`recycle-pool-${emp.id}`}
                                            >
                                                <ArrowPathIcon className="h-3 w-3" /> Salurkan Ulang (Recycle)
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* View 5: Kelola Lowongan Kerja & Form Penambahan */}
            {!loading && view === 'jobs' && (
                <div className="space-y-6">
                    {/* Top Panel: Form Tambah/Edit Lowongan (with Collapse/Expand) */}
                    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setIsJobFormExpanded(!isJobFormExpanded)}
                            className="w-full flex justify-between items-center p-5 bg-slate-50/70 hover:bg-slate-50 transition duration-150 outline-none"
                            id="toggle-job-form"
                        >
                            <div className="flex items-center gap-3 text-left">
                                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
                                    <BriefcaseIcon className="h-5.5 w-5.5" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-800 text-base">
                                        {editingJobId ? 'Edit Lowongan Pekerjaan' : 'Buat Lowongan Pekerjaan Baru'}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {editingJobId ? 'Perbarui kriteria dan persyaratan info lowongan terpilih.' : 'Tambah lowongan dari instansi klien & proyek aktif.'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {!isJobFormExpanded && (
                                    <span className="hidden sm:inline bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                        Klik untuk Expand Form
                                    </span>
                                )}
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    strokeWidth={2.5} 
                                    stroke="currentColor" 
                                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isJobFormExpanded ? 'rotate-180' : ''}`}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </button>

                        {isJobFormExpanded && (
                            <div className="p-5 space-y-4 border-t border-slate-100 animate-slide-down">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-extrabold text-slate-700 text-sm">Form Data Lowongan</h4>
                                    
                                    {/* Pre-fill Helper Button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const mockTemplates = [
                                                {
                                                    title: "Operator Dump Truck Sany 95T",
                                                    dept: "OPERATOR",
                                                    client: "1", // PT Sulawesi Nickel Industry
                                                    project: "1", // Smelter Construction Morowali
                                                    location: "Morowali",
                                                    minEdu: "SMA/SMK/Sederajat",
                                                    age: 40,
                                                    gender: "Laki-laki" as const,
                                                    salary: "6.500.000 - 8.200.000 IDR",
                                                    desc: "Pengoperasian armada dump truck tambang tipe berat merek Sany di area smelter Morowali.",
                                                    skills: "SIM BII Umum, K3 Tambang, Mekanik Dasar, Defensive Driving",
                                                    reqs: "Memiliki SIM BII Aktif, Pengalaman minimal 2 tahun, Surat Keterangan Sehat Fisik"
                                                },
                                                {
                                                    title: "Security Satpam Pengamanan Objek",
                                                    dept: "SECURITY",
                                                    client: "3", // PT Poso Energy
                                                    project: "3", // Hydroelectric Security Poso
                                                    location: "Poso",
                                                    minEdu: "SMA/SMK/Sederajat",
                                                    age: 35,
                                                    gender: "Laki-laki" as const,
                                                    salary: "4.500.000 - 5.500.000 IDR",
                                                    desc: "Tugas patroli pengamanan aset turbin, area bendungan dan fasilitas PLTA Sulewana Poso.",
                                                    skills: "Gada Pratama, Bela Diri, Penggunaan Radio HT, P3K Darurat",
                                                    reqs: "Sertifikat diklat Satpam Gada Pratama, Tinggi minimal 168cm, Tidak buta warna"
                                                },
                                                {
                                                    title: "Administrasi Staff Back-Office Teller",
                                                    dept: "ADMINISTRASI",
                                                    client: "2", // Bank Sulteng
                                                    project: "2", // Financial Back-office Sulteng
                                                    location: "Palu",
                                                    minEdu: "Diploma (D3)",
                                                    age: 28,
                                                    gender: "Perempuan" as const,
                                                    salary: "5.000.000 - 5.800.000 IDR",
                                                    desc: "Penyediaan layanan administrasi keuangan perbankan, entri data nasabah korporat Bank Sulteng.",
                                                    skills: "Ms Excel Advance, Akuntansi Dasar, Komunikasi Interpersonal, Bahasa Inggris Pasif",
                                                    reqs: "Lulusan D3/S1 Akuntansi atau Manajemen, Berpenampilan menarik, Ramah & Komunikatif"
                                                }
                                            ];
                                            const randomTpl = mockTemplates[Math.floor(Math.random() * mockTemplates.length)];
                                            setNewJobTitle(randomTpl.title);
                                            setNewJobDept(randomTpl.dept);
                                            setNewJobClient(randomTpl.client);
                                            setNewJobProject(randomTpl.project);
                                            setNewJobLoc(randomTpl.location);
                                            setNewJobMinEdu(randomTpl.minEdu);
                                            setNewJobAge(randomTpl.age);
                                            setNewJobGender(randomTpl.gender);
                                            setNewJobSalary(randomTpl.salary);
                                            setNewJobDesc(randomTpl.desc);
                                            setNewJobSkills(randomTpl.skills);
                                            setNewJobReqs(randomTpl.reqs);
                                        }}
                                        className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1.5 hover:bg-indigo-150 transition"
                                    >
                                        ✨ Autofill Template
                                    </button>
                                </div>

                                {formError && (
                                    <div className="p-3 bg-red-50 text-red-650 rounded-lg text-xs font-semibold animate-shake">
                                        ⚠️ {formError}
                                    </div>
                                )}

                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setFormError('');

                                    if (!newJobTitle.trim()) {
                                        setFormError('Mohon isi Judul Lowongan!');
                                        return;
                                    }
                                    if (!newJobClient) {
                                        setFormError('Silakan pilih Mitra/Klien!');
                                        return;
                                    }
                                    if (!newJobProject) {
                                        setFormError('Silakan hubungkan dengan Kontrak Proyek!');
                                        return;
                                    }

                                    try {
                                        const payload = {
                                            title: newJobTitle,
                                            department: newJobDept,
                                            location: newJobLoc,
                                            clientId: newJobClient,
                                            projectId: newJobProject,
                                            type: newJobType,
                                            description: newJobDesc || `Deskripsi pekerjaan khusus lowongan ${newJobTitle}.`,
                                            salaryRange: newJobSalary,
                                            minEducation: newJobMinEdu,
                                            maxAge: Number(newJobAge),
                                            genderPreference: newJobGender,
                                            requiredSkillsList: newJobSkills.split(',').map(s => s.trim()).filter(Boolean),
                                            requirements: newJobReqs.split(',').map(r => r.trim()).filter(Boolean)
                                        };

                                        if (editingJobId) {
                                            await updateJob(editingJobId, payload);
                                            alert('Berhasil memperbarui Lowongan Kerja!');
                                            setEditingJobId(null);
                                        } else {
                                            await createJob(payload);
                                            alert('Berhasil menerbitkan Lowongan Lapangan baru!');
                                        }
                                        
                                        await refetchJobs();

                                        // Clear forms
                                        setNewJobTitle('');
                                        setNewJobDesc('');
                                        setNewJobSkills('');
                                        setNewJobReqs('');
                                        setIsJobFormExpanded(false); // Collapse on successful save
                                    } catch (err: any) {
                                        setFormError(err.message || 'Terjadi kesalahan server saat menyimpan lowongan.');
                                    }
                                }} className="space-y-4 text-xs font-semibold text-slate-700">
                                    {/* Title & Dept */}
                                    <div className="grid grid-cols-12 gap-3">
                                        <div className="col-span-8 space-y-1">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama / Judul Lowongan</label>
                                            <input 
                                                type="text" 
                                                className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-700"
                                                placeholder="Contoh: Operator Wheel Loader"
                                                value={newJobTitle}
                                                onChange={e => setNewJobTitle(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-4 space-y-1">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Departemen</label>
                                            <select 
                                                className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-700"
                                                value={newJobDept}
                                                onChange={e => setNewJobDept(e.target.value)}
                                            >
                                                <option value="OPERATOR">OPERATOR</option>
                                                <option value="ADMINISTRASI">ADMINISTRASI</option>
                                                <option value="TEKNISI">TEKNISI</option>
                                                <option value="SECURITY">SECURITY</option>
                                                <option value="MANAGEMENT">MANAGEMENT</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Client & Project binding */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Hubungkan Klien (Mitra)</label>
                                            <select 
                                                className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-700"
                                                value={newJobClient}
                                                onChange={e => {
                                                    const selectedCliId = e.target.value;
                                                    setNewJobClient(selectedCliId);
                                                    // Auto-select first project belonging to client if exists and active
                                                    const cliProjs = projects.filter(p => p.clientId === selectedCliId && p.isActive !== false);
                                                    if (cliProjs.length > 0) {
                                                        setNewJobProject(cliProjs[0].id);
                                                    } else {
                                                        setNewJobProject('');
                                                    }
                                                }}
                                            >
                                                <option value="">-- Pilih Klien --</option>
                                                {clients.filter(c => c.isActive !== false).map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pilih Kontrak Proyek</label>
                                            <select 
                                                className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-700"
                                                value={newJobProject}
                                                onChange={e => setNewJobProject(e.target.value)}
                                                disabled={!newJobClient}
                                            >
                                                <option value="">-- Pilih Proyek Penempatan --</option>
                                                {projects.filter(p => p.clientId === newJobClient && p.isActive !== false).map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Location & Employment Type */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Lokasi Kerja</label>
                                            <LocationSearch 
                                                value={newJobLoc}
                                                onChange={setNewJobLoc}
                                                placeholder="Cari Kota/Kabupaten..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status Kontrak</label>
                                            <select 
                                                className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-700"
                                                value={newJobType}
                                                onChange={e => setNewJobType(e.target.value as any)}
                                            >
                                                <option value="Contract">Kontrak Lapangan</option>
                                                <option value="Full-time">Karyawan Tetap (Internal)</option>
                                                <option value="Part-time">Kerja Paruh Waktu</option>
                                                <option value="Internship">Magang Lapangan</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Eligibility Screening Criteria */}
                                    <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="space-y-1">
                                            <label className="block text-[9px] font-bold text-slate-400 uppercase">Min Pendidikan</label>
                                            <select 
                                                className="w-full border border-slate-200 rounded-lg p-1.5 bg-white outline-none text-slate-700"
                                                value={newJobMinEdu}
                                                onChange={e => setNewJobMinEdu(e.target.value)}
                                            >
                                                <option value="SMA/SMK/Sederajat">SMA/SMK</option>
                                                <option value="Diploma (D3)">D3 Diploma</option>
                                                <option value="Sarjana (S1)">S1 Sarjana</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[9px] font-bold text-slate-400 uppercase">Usia Maksimal</label>
                                            <input 
                                                type="number" 
                                                className="w-full border border-slate-200 rounded-lg p-1.5 bg-white outline-none text-slate-700 font-bold"
                                                value={newJobAge}
                                                onChange={e => setNewJobAge(Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[9px] font-bold text-slate-400 uppercase">Kriteria Gender</label>
                                            <select 
                                                className="w-full border border-slate-200 rounded-lg p-1.5 bg-white outline-none text-slate-700"
                                                value={newJobGender}
                                                onChange={e => setNewJobGender(e.target.value as any)}
                                            >
                                                <option value="Any">Bebas (Any)</option>
                                                <option value="Laki-laki">Pria Saja</option>
                                                <option value="Perempuan">Wanita Saja</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Salary, Skills & Descriptions */}
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rentang Gaji Ditawarkan</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white outline-none font-semibold text-slate-850"
                                            placeholder="Contoh: 4.800.000 - 6.000.000 IDR"
                                            value={newJobSalary}
                                            onChange={e => setNewJobSalary(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Keahlian Utama (Pisahkan Koma)</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white outline-none"
                                            placeholder="Contoh: SIM B2, Defensive Driving, K3 Tambang"
                                            value={newJobSkills}
                                            onChange={e => setNewJobSkills(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Persyaratan Kelayakan Lain (Pisahkan Koma)</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white outline-none"
                                            placeholder="Contoh: Sertifikasi Kemnaker, Tinggi min 168cm, Bebas Narkoba"
                                            value={newJobReqs}
                                            onChange={e => setNewJobReqs(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Deskripsi Pekerjaan Terperinci</label>
                                        <textarea 
                                            rows={3}
                                            className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white outline-none text-slate-600 transition"
                                            placeholder="Tuliskan deskripsi tugas, tanggung jawab, and tantangan pekerjaan lapangan di sini..."
                                            value={newJobDesc}
                                            onChange={e => setNewJobDesc(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        {editingJobId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingJobId(null);
                                                    setNewJobTitle('');
                                                    setNewJobDesc('');
                                                    setNewJobSkills('');
                                                    setNewJobReqs('');
                                                    setIsJobFormExpanded(false);
                                                }}
                                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition"
                                            >
                                                Batal Edit
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                                            id="btn-submit-new-job"
                                        >
                                            <BriefcaseIcon className="h-5 w-5" /> {editingJobId ? 'Perbarui Lowongan' : 'Publikasikan Lowongan'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Bottom Panel: Daftar Lowongan Kerja */}
                    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden space-y-4 p-5">
                        <div className="flex justify-between items-center border-b pb-3 border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-base">Daftar Lowongan Pekerjaan Aktif</h3>
                                <p className="text-xs text-slate-500 font-medium font-sans">Kebutuhan yang terpublish di portal internal & eksternal.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[1000px] overflow-y-auto pr-1">
                            {jobs.map(job => {
                                const client = clients.find(c => c.id === job.clientId);
                                const project = projects.find(p => p.id === job.projectId);
                                const jobCandidates = employees.filter(e => e.jobId === job.id || e.positionApplied.toLowerCase() === job.title.toLowerCase());

                                return (
                                    <div key={job.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-xs transition bg-slate-50/50 flex flex-col justify-between space-y-4">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-slate-800 text-sm leading-snug">{job.title}</h4>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                                                        <span className="font-semibold text-indigo-750 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-[10px] uppercase">
                                                            {job.department}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{job.location}</span>
                                                        <span>•</span>
                                                        <span className="font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                                            {job.type}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                await updateJob(job.id, { isActive: !job.isActive });
                                                                await refetchJobs();
                                                            } catch (err) {
                                                                console.error(err);
                                                            }
                                                        }}
                                                        className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                                                            job.isActive 
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                                : 'bg-slate-100 text-slate-500 border-slate-200'
                                                        }`}
                                                    >
                                                        {job.isActive ? 'AKTIF' : 'NONAKTIF'}
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setEditingJobId(job.id);
                                                            setNewJobTitle(job.title);
                                                            setNewJobDept(job.department);
                                                            setNewJobClient(job.clientId);
                                                            setNewJobProject(job.projectId);
                                                            setNewJobType(job.type);
                                                            setNewJobLoc(job.location);
                                                            setNewJobMinEdu(job.minEducation);
                                                            setNewJobAge(job.maxAge);
                                                            setNewJobGender(job.genderPreference);
                                                            setNewJobSalary(job.salaryRange);
                                                            setNewJobDesc(job.description);
                                                            setNewJobSkills(job.requiredSkillsList.join(', '));
                                                            setNewJobReqs(job.requirements.join(', '));
                                                        }}
                                                        className="p-1 bg-blue-50 text-blue-600 rounded border border-blue-100 hover:bg-blue-100 hover:text-blue-700 transition"
                                                        title="Edit Lowongan"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                        </svg>
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            triggerTmConfirm(
                                                                "Hapus Lowongan Kerja",
                                                                `Apakah Anda yakin ingin menghapus lowongan kerja "${job.title}" secara permanen?`,
                                                                async () => {
                                                                    try {
                                                                        await deleteJob(job.id);
                                                                        await refetchJobs();
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                    }
                                                                },
                                                                'danger',
                                                                'Hapus'
                                                            );
                                                        }}
                                                        className="p-1 bg-red-50 text-red-650 rounded border border-red-100 hover:bg-red-100 hover:text-red-700 transition"
                                                        title="Hapus Lowongan Kerja"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Client & Project reference */}
                                            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 border-t border-slate-100 pt-2.5">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Mitra / Klien</span>
                                                    <span className="truncate block text-slate-700">{client ? client.name : 'Secara Langsung (Internal)'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Kontrak Kerja Proyek</span>
                                                    <span className="truncate block text-slate-700">{project ? project.name : '- Penempatan Umum -'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Metrics & Requirements */}
                                        <div className="bg-slate-100/50 p-2.5 rounded-lg border border-slate-200/40 text-xs text-slate-600 flex justify-between items-center font-medium mt-auto">
                                            <div className="flex gap-1.5 items-center">
                                                <span className="text-[10px] font-bold text-slate-500">Syarat:</span>
                                                <span className="bg-white/80 border text-[10px] font-bold px-1.5 py-0.5 rounded text-slate-600">{job.minEducation || 'SMA/SMK'}</span>
                                                <span className="bg-white/80 border text-[10px] font-bold px-1.5 py-0.5 rounded text-slate-600">Maks {job.maxAge || 35} Thn</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border">
                                                {jobCandidates.length} Pelamar
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Candidate Details Modal */}
            {selectedEmp && (
                <CandidateModal 
                    employee={selectedEmp} 
                    job={jobs.find(j => j.title === selectedEmp.positionApplied)} 
                    onClose={() => setSelectedEmp(null)} 
                    onStatusUpdate={handleStatusUpdate} 
                    onDelete={handleDeleteEmployee}
                />
            )}

            {/* Recycler Dialog Selection */}
            {recycleEmp && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-100 animate-fadeIn">
                        <h3 className="font-bold text-lg text-slate-800">Daur Ulang Karir & Salurkan Kandidat</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Salurkan data pelamar **{recycleEmp.fullName}** ke lowongan kerja aktif lain di Sulawesi Tengah. Tindakan ini akan mengupdate pilihan karir terbaru mereka secara terstruktur tanpa perlu mengunggah berkas anyar.
                        </p>
                        
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Arahkan ke Lowongan Aktif</label>
                            <select 
                                id="recycle-job-select"
                                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                                defaultValue=""
                                onChange={async (e) => {
                                    const selectedJobId = e.target.value;
                                    if (!selectedJobId) return;
                                    const targetJob = jobs.find(j => j.id === selectedJobId);
                                    if (!targetJob) return;
                                    
                                    try {
                                        await handleStatusUpdate(recycleEmp.id, 'APPLIED', `[Recycled] Masuk melalui mekanisme Pool Talent. Disalurkan dari posisi sebelumnya (${recycleEmp.positionApplied}) ke penempatan ${targetJob.title} - ${targetJob.location}.`, undefined, {
                                            positionApplied: targetJob.title,
                                            jobId: targetJob.id,
                                            isInTalentPool: false
                                        });
                                        alert(`Kandidat ${recycleEmp.fullName} berhasil disalurkan ke lowongan: ${targetJob.title}!`);
                                        setRecycleEmp(null);
                                    } catch (err) {
                                        console.error("Gagal menyalurkan ulang:", err);
                                    }
                                }}
                            >
                                <option value="" disabled>-- Pilih Lowongan Aktif --</option>
                                {jobs.filter(j => j.isActive).map(j => (
                                    <option key={j.id} value={j.id}>{j.title} ({j.location})</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button onClick={() => setRecycleEmp(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirmation Dialog Overlay */}
            {tmConfirmConfig && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-100 animate-fadeIn text-left">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                                tmConfirmConfig.type === 'danger' ? 'bg-rose-50 text-rose-600' :
                                tmConfirmConfig.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                                'bg-blue-50 text-blue-600'
                            }`}>
                                {tmConfirmConfig.type === 'danger' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                ) : tmConfirmConfig.type === 'success' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 1 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.852l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                    </svg>
                                )}
                            </div>
                            <h3 className="font-extrabold text-base text-slate-800">{tmConfirmConfig.title}</h3>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            {tmConfirmConfig.message}
                        </p>
                        <div className="flex justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setTmConfirmConfig(null)}
                                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded text-slate-600 transition"
                            >
                                {tmConfirmConfig.cancelText || 'Batal'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    tmConfirmConfig.onConfirm();
                                    setTmConfirmConfig(null);
                                }}
                                className={`px-3.5 py-1.5 text-xs font-extrabold text-white rounded transition ${
                                    tmConfirmConfig.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800' :
                                    tmConfirmConfig.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800' :
                                    'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                                }`}
                            >
                                {tmConfirmConfig.confirmText || 'Konfirmasi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 1. Tambah Pelamar Manual Modal */}
            {showAddCandidateModal && !newCandidateResult && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-100 animate-fadeIn relative max-h-[90vh] overflow-y-auto text-left">
                        <button 
                            onClick={() => setShowAddCandidateModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-extrabold text-lg cursor-pointer bg-transparent border-none"
                        >
                            ✕
                        </button>
                        <h3 className="font-black text-xl text-slate-900 tracking-tight mb-2 flex items-center gap-2">
                            <span>🔐</span> Tambah Pelamar Baru
                        </h3>
                        <p className="text-xs text-slate-500 mb-6 leading-relaxed border-b pb-3">
                            Daftarkan pelamar baru dan otomatis buat akun portal rekrutmen. Kredensial akan diusahakan terkirim otomatis lewat email admin (Gmail API). Admin juga dapat menyebarkannya manual via WhatsApp.
                        </p>

                        <form onSubmit={handleSaveManualCandidate} className="space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Nama Lengkap pelamar *</label>
                                    <input 
                                        type="text"
                                        required
                                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                                        placeholder="cth: Ahmad Fauzi"
                                        value={candidateForm.fullName}
                                        onChange={e => setCandidateForm({...candidateForm, fullName: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Email (Untuk login & kirim akun) *</label>
                                        <input 
                                            type="email"
                                            required
                                            className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-mono"
                                            placeholder="cth: fauzi@example.com"
                                            value={candidateForm.email}
                                            onChange={e => setCandidateForm({...candidateForm, email: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">No. WhatsApp/Ponsel *</label>
                                        <input 
                                            type="text"
                                            required
                                            className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                                            placeholder="cth: 08123456789"
                                            value={candidateForm.phone}
                                            onChange={e => setCandidateForm({...candidateForm, phone: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Posisi yang Dilamar *</label>
                                    <select 
                                        required
                                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                                        value={candidateForm.positionApplied}
                                        onChange={e => setCandidateForm({...candidateForm, positionApplied: e.target.value})}
                                    >
                                        {jobs.map(j => (
                                            <option key={j.id} value={j.title}>{j.title} ({j.location})</option>
                                        ))}
                                        {jobs.length === 0 && (
                                            <option value="Operator Morowali">Operator Morowali (Default)</option>
                                        )}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Pendidikan Terakhir</label>
                                        <select 
                                            className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                                            value={candidateForm.lastEducation}
                                            onChange={e => setCandidateForm({...candidateForm, lastEducation: e.target.value})}
                                        >
                                            <option value="SMA/SMK">SMA / SMK / Sederajat</option>
                                            <option value="D3">D3 Akademi</option>
                                            <option value="S1">S1 Sarjana</option>
                                            <option value="S2">S2 Magister</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Domisili Kantor Penempatan</label>
                                        <select 
                                            className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                                            value={candidateForm.domicileAddress}
                                            onChange={e => setCandidateForm({...candidateForm, domicileAddress: e.target.value})}
                                        >
                                            <option value="Morowali">Morowali (Sulawesi Tengah)</option>
                                            <option value="Palu">Palu</option>
                                            <option value="Jakarta">Jakarta Pusat</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Nama Instansi / Sekolah</label>
                                        <input 
                                            type="text"
                                            className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                                            placeholder="cth: Universitas Tadulako"
                                            value={candidateForm.institutionName}
                                            onChange={e => setCandidateForm({...candidateForm, institutionName: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Jurusan / Keahlian</label>
                                        <input 
                                            type="text"
                                            className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                                            placeholder="cth: Teknik Mesin"
                                            value={candidateForm.major}
                                            onChange={e => setCandidateForm({...candidateForm, major: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddCandidateModal(false)}
                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-xl text-slate-600 transition cursor-pointer bg-white"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition"
                                >
                                    Selesai & Buat Akun
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Hasil Tambah Pelamar Kredensial Success Overlay */}
            {newCandidateResult && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-55 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-100 text-left animate-fadeIn">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 mb-4 text-center text-xl pt-0.5">
                            🎉
                        </div>
                        <h3 className="font-black text-lg text-slate-900 tracking-tight text-center mb-1">Kandidat Berhasil Ditambahkan</h3>
                        <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
                            Data pelamar atas nama <b>{newCandidateResult.fullName}</b> telah tersimpan di cloud. Akun akses portal rekrutmen juga telah diaktifkan otomatis!
                        </p>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 mb-6 space-y-3.5 text-left">
                            <div className="flex justify-between items-center border-b pb-1.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">🔐 Akses Kredensial</span>
                                <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded border border-indigo-100">AKTIF</span>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Username / Email</span>
                                    <div className="flex justify-between items-center bg-white border border-slate-150 p-2 rounded-lg mt-0.5">
                                        <span className="text-xs font-mono font-bold text-slate-700 select-all">{newCandidateResult.email}</span>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(newCandidateResult.email);
                                                alert('Username disalin ke clipboard!');
                                            }}
                                            className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer bg-transparent border-none"
                                        >
                                            Salin
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Kata Sandi (Password)</span>
                                    <div className="flex justify-between items-center bg-white border border-slate-150 p-2 rounded-lg mt-0.5">
                                        <span className="text-xs font-mono font-bold text-slate-800 select-all">{newCandidateResult.password}</span>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(newCandidateResult.password);
                                                alert('Password disalin ke clipboard!');
                                            }}
                                            className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer bg-transparent border-none"
                                        >
                                            Salin
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    const encodedText = encodeURIComponent(newCandidateResult.whatsappMessage);
                                    window.open(`https://wa.me/${newCandidateResult.phone}?text=${encodedText}`, '_blank');
                                }}
                                className="w-full py-2.5 bg-[#25D366] hover:bg-[#1ebd5d] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border-none"
                            >
                                💬 Kirim Kredensial via WhatsApp (Manual)
                            </button>
                            <button
                                onClick={() => {
                                    setNewCandidateResult(null);
                                    setShowAddCandidateModal(false);
                                }}
                                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-750 border border-slate-200 rounded-xl text-xs font-extrabold transition text-center cursor-pointer"
                            >
                                Tutup Berhasil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Polished reusable StatCard with sleek indicators
const StatCard = ({ title, value, percentage, color, desc, highlight, onClick }: any) => {
    const colorClasses: Record<string, string> = {
        slate: "border-slate-400 bg-slate-50 text-slate-900 hover:bg-slate-100/50",
        indigo: "border-indigo-500 bg-indigo-50/20 text-indigo-750 hover:bg-indigo-50/40",
        amber: "border-amber-500 bg-amber-50/20 text-amber-750 hover:bg-amber-50/40",
        emerald: "border-emerald-500 bg-emerald-50/20 text-emerald-750 hover:bg-emerald-50/40",
        violet: "border-violet-500 bg-violet-50/30 text-violet-850 hover:bg-violet-50/55",
        rose: "border-rose-500 bg-rose-50/30 text-rose-850 hover:bg-rose-50/55"
    };

    return (
        <div 
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(e) => {
                if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick();
                }
            }}
            className={`p-4 rounded-xl shadow-xs border-l-4 ${colorClasses[color] || 'border-slate-300 bg-white'} flex flex-col justify-between h-28 hover:scale-[1.04] active:scale-[0.98] transition-all duration-200 outline-none select-none ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${highlight ? 'ring-2 ring-indigo-100' : ''}`}
        >
            <div className="flex justify-between items-start">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider leading-none">{title}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/80 border text-slate-600">{percentage}</span>
            </div>
            <div className="space-y-0.5">
                <div className="text-2xl font-black tracking-tight">{value}</div>
                <div className="text-[10px] text-slate-400 font-medium">{desc}</div>
            </div>
        </div>
    );
};
