import React, { useState, useEffect, useMemo } from 'react';
import { Project, NewProject, Client } from '../../../types';
import { getProjects, createProject, deleteProject, updateProject, getClients, uploadFileMock } from '../../../services/db';
import { Input, Select, TextArea } from '../../ui/Input';
import { 
    PlusIcon, TrashIcon, MagnifyingGlassIcon, CalendarDaysIcon,
    PencilSquareIcon, EyeIcon, DocumentTextIcon, FolderPlusIcon,
    BriefcaseIcon, BanknotesIcon, ArrowUpTrayIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';

export const ProjectManager: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [loading, setLoading] = useState(false);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        clientId: '',
        description: '',
        startDate: '',
        endDate: '',
        poNumber: '',
        poDocPath: '',
        spkNumber: '',
        spkDocPath: '',
        contractValue: 0,
        isActive: true
    });

    // Temp uploading field indicator
    const [uploadingField, setUploadingField] = useState<string | null>(null);

    // Document Preview Iframe modal
    const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
    const [previewDocTitle, setPreviewDocTitle] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [p, c] = await Promise.all([getProjects(), getClients()]);
            setProjects(p); 
            setClients(c);
        } catch (error) {
            console.error("Gagal memuat data proyek alih daya:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate executive finance stats
    const stats = useMemo(() => {
        const total = projects.length;
        const active = projects.filter(p => p.isActive !== false).length;
        const totalValuation = projects.reduce((acc, curr) => acc + (curr.contractValue || 0), 0);
        const completePO = projects.filter(p => p.poNumber && p.poDocPath).length;
        const completeSPK = projects.filter(p => p.spkNumber && p.spkDocPath).length;
        return { total, active, totalValuation, completePO, completeSPK };
    }, [projects]);

    // Filter projects logic
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchName = p.name.toLowerCase().includes(search.toLowerCase());
            const client = clients.find(c => c.id === p.clientId);
            const matchClient = client ? client.name.toLowerCase().includes(search.toLowerCase()) : false;
            
            const isProjectActive = p.isActive !== false;
            const matchesStatus = statusFilter === 'all' ? true : 
                                  statusFilter === 'active' ? isProjectActive : !isProjectActive;
            
            return (matchName || matchClient) && matchesStatus;
        });
    }, [projects, clients, search, statusFilter]);

    // Handle Open Add Modal
    const handleOpenAdd = () => {
        setEditingProject(null);
        const actClients = clients.filter(c => c.isActive !== false);
        setFormData({
            name: '',
            clientId: actClients[0]?.id || clients[0]?.id || '',
            description: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            poNumber: '',
            poDocPath: '',
            spkNumber: '',
            spkDocPath: '',
            contractValue: 0,
            isActive: true
        });
        setIsModalOpen(true);
    };

    // Handle Open Edit Modal
    const handleOpenEdit = (p: Project) => {
        setEditingProject(p);
        setFormData({
            name: p.name,
            clientId: p.clientId,
            description: p.description,
            startDate: p.startDate,
            endDate: p.endDate || '',
            poNumber: p.poNumber || '',
            poDocPath: p.poDocPath || '',
            spkNumber: p.spkNumber || '',
            spkDocPath: p.spkDocPath || '',
            contractValue: p.contractValue || 0,
            isActive: p.isActive !== false
        });
        setIsModalOpen(true);
    };

    // File uploading process
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'poDocPath' | 'spkDocPath') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingField(fieldName);
        try {
            const dataUrl = await uploadFileMock(file);
            setFormData(prev => ({ ...prev, [fieldName]: dataUrl }));
        } catch (err) {
            alert("Gagal mengompres gambar berkas proyek: " + err);
        } finally {
            setUploadingField(null);
        }
    };

    // Card-level quick upload
    const handleCardDirectUpload = async (file: File, project: Project, fieldName: 'poDocPath' | 'spkDocPath') => {
        try {
            const dataUrl = await uploadFileMock(file);
            await updateProject(project.id, { [fieldName]: dataUrl });
            loadData();
            alert("Dokumen berhasil disinkronisasikan ke kontrak proyek!");
        } catch (err) {
            alert("Gagal mengunggah berkas proyek: " + err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProject) {
                await updateProject(editingProject.id, formData);
                alert(`Proyek ${formData.name} berhasil diperbarui!`);
            } else {
                await createProject(formData);
                alert(`Proyek ${formData.name} berhasil didaftarkan!`);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Gagal menulis data proyek:", error);
            alert("Terjadi kesalahan penyimpanan)");
        }
    };

    const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Unknown Client';

    const formatIDR = (num: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    };

    return (
        <div className="space-y-6">
            
            {/* Executive Projects Dashboard Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex flex-col justify-between h-24 hover:scale-[1.01] transition">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Proyek Lapangan</span>
                    <div className="flex justify-between items-baseline mt-1">
                        <span className="text-2xl font-black text-slate-900">{stats.total}</span>
                        <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">{stats.active} Aktif</span>
                    </div>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex flex-col justify-between h-24 hover:scale-[1.01] transition">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Nilai Kontrak Terkelola</span>
                    <div className="flex justify-between items-baseline mt-1">
                        <span className="text-lg font-black text-emerald-750">{formatIDR(stats.totalValuation)}</span>
                    </div>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex flex-col justify-between h-24 hover:scale-[1.01] transition">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Kelengkapan PO Kerja</span>
                    <div className="flex justify-between items-baseline mt-1">
                        <span className="text-2xl font-black text-slate-800">{stats.completePO}</span>
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">{((stats.completePO / stats.total) * 100 || 0).toFixed(0)}% PO</span>
                    </div>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex flex-col justify-between h-24 hover:scale-[1.01] transition">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Kelengkapan SPK Resmi</span>
                    <div className="flex justify-between items-baseline mt-1">
                        <span className="text-2xl font-black text-slate-800">{stats.completeSPK}</span>
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">{((stats.completeSPK / stats.total) * 100 || 0).toFixed(0)}% SPK</span>
                    </div>
                </div>
            </div>

            {/* Filter and Command Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 gap-3">
                <div className="flex flex-wrap gap-2 items-center flex-1">
                    <div className="relative flex-1 sm:max-w-xs">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-slate-400"/>
                        <input 
                            className="w-full border border-slate-200 bg-slate-50 focus:bg-white pl-10 pr-3 py-2 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                            placeholder="Cari nama proyek alih daya / klien..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            id="project-search-box"
                        />
                    </div>
                    <select 
                        className="border border-slate-200 bg-white rounded-lg px-2 py-2 text-xs text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={statusFilter} 
                        onChange={e => setStatusFilter(e.target.value as any)}
                        id="project-status-filter-select"
                    >
                        <option value="all">Semua Status Proyek</option>
                        <option value="active">Proyek Aktif</option>
                        <option value="inactive">Proyek Non-Aktif</option>
                    </select>
                </div>
                <button 
                    onClick={handleOpenAdd} 
                    className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg flex items-center text-xs shadow-xs transition"
                    id="add-project-modal-btn"
                >
                    <FolderPlusIcon className="h-4.5 w-4.5 mr-1 stroke-[2]" /> Registrasi Proyek Baru
                </button>
            </div>

            {/* Projects Grid Render */}
            {loading ? (
                <div className="text-center py-16 text-slate-400 font-bold animate-pulse">Menghubungkan ke database Firebase...</div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-medium">
                    Tidak ada proyek lapangan alih daya yang cocok. Hubungkan kontrak baru menggunakan tombol diatas.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map(proj => (
                        <div key={proj.id} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition duration-200 group">
                            
                            <div>
                                <div className="flex justify-between items-start mb-2.5">
                                    <div>
                                        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight leading-snug group-hover:text-indigo-600 transition">{proj.name}</h3>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                                                <BriefcaseIcon className="h-3 w-3 inline" /> {getClientName(proj.clientId)}
                                            </span>
                                            {proj.isActive !== false ? (
                                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">Aktif</span>
                                            ) : (
                                                <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider">Non-Aktif</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Edit / Trash Actions */}
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => handleOpenEdit(proj)} 
                                            className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-50 transition"
                                            title="Ubah & Lengkapi Data Proyek"
                                            id={`edit-proj-${proj.id}`}
                                        >
                                            <PencilSquareIcon className="h-4 w-4" />
                                        </button>
                                        {deleteConfirmId === proj.id ? (
                                            <div className="flex items-center gap-1">
                                                <button 
                                                    onClick={async () => { 
                                                        await deleteProject(proj.id); 
                                                        setDeleteConfirmId(null);
                                                        loadData(); 
                                                    }} 
                                                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 text-[10px] rounded animate-pulse"
                                                    id={`delete-proj-confirm-${proj.id}`}
                                                >
                                                    Hapus
                                                </button>
                                                <button 
                                                    onClick={() => setDeleteConfirmId(null)} 
                                                    className="bg-slate-100 text-slate-500 font-bold px-1.5 py-1 text-[10px] rounded hover:bg-slate-200"
                                                >
                                                    Batal
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => setDeleteConfirmId(proj.id)} 
                                                className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-50 transition"
                                                title="Hapus Proyek"
                                                id={`delete-proj-${proj.id}`}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3.5 mt-3.5">
                                    <p className="flex justify-between">
                                        <span className="text-slate-400 font-medium">Nilai Kontrak:</span>
                                        <span className="font-bold text-slate-800">{formatIDR(proj.contractValue || 0)}</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span className="text-slate-400 font-medium flex items-center gap-1"><CalendarDaysIcon className="h-3.5 w-3.5"/> Tanggal Mulai:</span>
                                        <span className="font-semibold text-slate-800">{proj.startDate}</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span className="text-slate-400 font-medium flex items-center gap-1"><CalendarDaysIcon className="h-3.5 w-3.5"/> Tanggal Selesai:</span>
                                        <span className="font-semibold text-slate-800">{proj.endDate || 'Berjalan'}</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-2 leading-relaxed italic pr-2">"{proj.description}"</p>
                                </div>

                                {/* Purchase Order & SPK Upload Status Checklist */}
                                <div className="space-y-2.5 mt-4 pt-4 border-t border-dashed border-slate-150">
                                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dokumen Operasional Alih Daya</h4>

                                    {/* PO Doc Area */}
                                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <BanknotesIcon className="h-4.5 w-4.5 text-slate-400" />
                                            <div>
                                                <p className="font-bold text-slate-700 text-[10px] leading-none">Purchase Order (PO)</p>
                                                <p className="text-[9px] text-slate-400 font-mono tracking-tight mt-0.5">{proj.poNumber || 'Belum Dilampirkan'}</p>
                                            </div>
                                        </div>
                                        {proj.poDocPath ? (
                                            <button 
                                                onClick={() => { setPreviewDocUrl(proj.poDocPath!); setPreviewDocTitle(`Purchase Order - ${proj.name}`); }}
                                                className="bg-emerald-50 text-emerald-700 font-bold text-[9px] px-2 py-1 rounded border border-emerald-200/60 flex items-center gap-1 hover:bg-emerald-100/60 transition"
                                                id={`preview-po-${proj.id}`}
                                            >
                                                <EyeIcon className="h-3 w-3" /> Preview
                                            </button>
                                        ) : (
                                            <label className="cursor-pointer bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border hover:bg-slate-300 transition">
                                                <span>+ Unggah</span>
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={e => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleCardDirectUpload(file, proj, 'poDocPath');
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>

                                    {/* SPK Doc Area */}
                                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <DocumentTextIcon className="h-4.5 w-4.5 text-slate-400" />
                                            <div>
                                                <p className="font-bold text-slate-700 text-[10px] leading-none">Dokumen SPK</p>
                                                <p className="text-[9px] text-slate-400 font-mono tracking-tight mt-0.5">{proj.spkNumber || 'Belum Diunggah'}</p>
                                            </div>
                                        </div>
                                        {proj.spkDocPath ? (
                                            <button 
                                                onClick={() => { setPreviewDocUrl(proj.spkDocPath!); setPreviewDocTitle(`SPK Resmi - ${proj.name}`); }}
                                                className="bg-emerald-50 text-emerald-700 font-bold text-[9px] px-2 py-1 rounded border border-emerald-200/60 flex items-center gap-1 hover:bg-emerald-100/60 transition"
                                                id={`preview-spk-${proj.id}`}
                                            >
                                                <EyeIcon className="h-3 w-3" /> Preview
                                            </button>
                                        ) : (
                                            <label className="cursor-pointer bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border hover:bg-slate-300 transition">
                                                <span>+ Unggah</span>
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={e => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleCardDirectUpload(file, proj, 'spkDocPath');
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Executive Project Action Buttons */}
                                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-150">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const crewName = prompt("Masukkan nama/email staff alih daya untuk dialokasikan ke proyek ini:", "");
                                            if (crewName) {
                                                alert(`Staff ${crewName} berhasil ditetapkan/dialokasikan ke proyek: ${proj.name}!\n\nStatus: Terverifikasi oleh tim Lapangan.`);
                                            }
                                        }}
                                        className="flex items-center justify-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold py-1.5 px-2 rounded text-[10px] border border-indigo-150 transition active:scale-95"
                                    >
                                        ➕ Alokasikan Staff
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            alert(`Mengunduh lembar evaluasi performa operasional lapangan untuk proyek: ${proj.name}...\n\nJumlah Tenaga Kerja Lapangan: Aktif.`);
                                        }}
                                        className="flex items-center justify-center gap-1 bg-white hover:bg-slate-55 text-slate-700 font-bold py-1.5 px-2 rounded text-[10px] border border-slate-200 transition active:scale-95"
                                    >
                                        📊 Evaluasi Performa
                                    </button>
                                </div>

                            </div>

                        </div>
                    ))}
                </div>
            )}

            {/* Modal for registering or editing projects */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                     <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto border animate-fadeIn">
                        <h2 className="text-base font-black text-slate-800 border-b pb-3 mb-4">{editingProject ? 'Perbarui Proyek' : 'Registrasi Proyek Alih Daya Baru'}</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Nama Proyek Lapangan" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Contoh: Pengamanan PLTA Poso" />
                                <Select label="Klien Utama (Partner)" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} options={clients.filter(c => c.isActive !== false || c.id === formData.clientId).map(c => ({ value: c.id, label: c.name }))} required />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <Input label="Mulai Proyek" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
                                <Input label="Selesai Proyek" type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                                <Input label="Nilai Kontrak (Rp)" type="number" value={formData.contractValue.toString()} onChange={e => setFormData({...formData, contractValue: Number(e.target.value)})} placeholder="Nilai kontrak" />
                            </div>

                            <TextArea label="Tujuan & Deskripsi Teknis Proyek" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required placeholder="Uraikan detail pekerjaan alih daya di lapangan..." />

                            {/* Purchase Order (PO) Section */}
                            <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                                <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5"><BanknotesIcon className="h-4 w-4 text-indigo-500" /> Purchase Order (PO) Tagihan</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Nomor Purchase Order (PO)" value={formData.poNumber} onChange={e => setFormData({...formData, poNumber: e.target.value})} placeholder="Contoh: PO-POSO-ENERGY-H9" />
                                    <div>
                                        <span className="block text-gray-700 font-semibold mb-1">Unggah Dokumen PO</span>
                                        <div className="flex items-center gap-2">
                                            <label className="cursor-pointer text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-xs flex items-center gap-1">
                                                <ArrowUpTrayIcon className="h-4 w-4"/> {formData.poDocPath ? 'Ganti File PO' : 'Unggah File PO'}
                                                <input type="file" className="hidden" onChange={e => handleFileChange(e, 'poDocPath')} />
                                            </label>
                                            {uploadingField === 'poDocPath' && <span className="text-[10px] text-slate-400 font-semibold animate-pulse">Memuat...</span>}
                                            {formData.poDocPath && <span className="text-[10px] text-emerald-600 font-bold">✓ Ready</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SPK Section */}
                            <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                                <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5"><DocumentTextIcon className="h-4 w-4 text-indigo-500" /> Surat Perintah Kerja (SPK)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Nomor Surat Surat Perintah Kerja (SPK)" value={formData.spkNumber} onChange={e => setFormData({...formData, spkNumber: e.target.value})} placeholder="Contoh: SPK/SNI-PERDANA/2026" />
                                    <div>
                                        <span className="block text-gray-700 font-semibold mb-1">Unggah Dokumen SPK</span>
                                        <div className="flex items-center gap-2">
                                            <label className="cursor-pointer text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-xs flex items-center gap-1">
                                                <ArrowUpTrayIcon className="h-4 w-4"/> {formData.spkDocPath ? 'Ganti File SPK' : 'Unggah File SPK'}
                                                <input type="file" className="hidden" onChange={e => handleFileChange(e, 'spkDocPath')} />
                                            </label>
                                            {uploadingField === 'spkDocPath' && <span className="text-[10px] text-slate-400 font-semibold">Mengompres...</span>}
                                            {formData.spkDocPath && <span className="text-[10px] text-emerald-600 font-bold">✓ Ready</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status Proyek */}
                            <div className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between">
                                <div>
                                    <span className="block font-bold text-slate-800">Status Operasional Proyek Aktif</span>
                                    <span className="block text-[10px] text-slate-400 font-medium">Nonaktifkan proyek apabila seluruh pekerjaan alih daya telah selesai/ditutup.</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.isActive} 
                                        onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                        className="sr-only peer"
                                        id="project-active-toggle"
                                    />
                                    <div className="w-10 h-5 bg-slate-250 border rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-bold text-slate-600 transition">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow-md shadow-indigo-100">
                                    {editingProject ? 'Simpan Proyek' : 'Daftarkan Proyek'}
                                </button>
                            </div>
                        </form>
                     </div>
                </div>
            )}

            {/* Simulated Digital Viewer overlay */}
            {previewDocUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                     <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border flex flex-col h-[85vh] animate-fadeIn">
                        <div className="bg-slate-900 text-slate-100 p-4 flex justify-between items-center border-b border-slate-800">
                            <div className="flex items-center gap-2 text-xs">
                                <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                                <span className="font-extrabold tracking-tight text-sm uppercase">{previewDocTitle}</span>
                            </div>
                            <button onClick={() => { setPreviewDocUrl(null); setPreviewDocTitle(null); }} className="text-white/85 hover:text-white text-base">✕</button>
                        </div>
                        <div className="flex-1 bg-slate-100">
                             <iframe 
                                title="Visualizer Surat Kontrak Kerja"
                                src={previewDocUrl} 
                                className="w-full h-full border-none"
                             />
                        </div>
                     </div>
                </div>
            )}

        </div>
    );
};
