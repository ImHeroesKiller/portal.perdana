import React, { useState, useEffect, useMemo } from 'react';
import { Client, NewClient } from '../../../types';
import { createClient, deleteClient, updateClient, uploadFileMock } from '../../../services/db';
import { useClients, useRefreshDb } from '../../../hooks/useDbQueries';
import { Input } from '../../ui/Input';
import { 
    BuildingOfficeIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon, 
    PencilSquareIcon, DocumentCheckIcon, ShieldCheckIcon, DocumentArrowDownIcon,
    ArrowUpTrayIcon, EyeIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon,
    ScaleIcon, CalendarDaysIcon
} from '@heroicons/react/24/outline';

export const ClientManager: React.FC = () => {
    const { data: clients = [], isFetching: loading } = useClients();
    const refreshDb = useRefreshDb();
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<'name' | 'industry'>('name');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    
    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        address: '',
        contactPerson: '',
        npwpNumber: '',
        npwpDocPath: '',
        ndaNumber: '',
        ndaDocPath: '',
        paktaIntegritasDocPath: '',
        partnershipStartDate: '',
        partnershipEndDate: '',
        isActive: true
    });

    // Temp file uploading indicator
    const [uploadingField, setUploadingField] = useState<string | null>(null);

    // Document Preview Iframe Modal state
    const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
    const [previewDocTitle, setPreviewDocTitle] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const loadData = async () => {
        await refreshDb();
    };

    // Derived stats for metrics panel
    const stats = useMemo(() => {
        const total = clients.length;
        const active = clients.filter(c => c.isActive !== false).length;
        const completeNPWP = clients.filter(c => c.npwpNumber || c.npwpDocPath).length;
        const activeNDA = clients.filter(c => c.ndaNumber || c.ndaDocPath).length;
        const signedPakta = clients.filter(c => c.paktaIntegritasDocPath).length;
        return { total, active, completeNPWP, activeNDA, signedPakta };
    }, [clients]);

    // Filtered & sorted client collection
    const filteredClients = useMemo(() => {
        let res = clients.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                                  c.industry.toLowerCase().includes(search.toLowerCase()) ||
                                  c.contactPerson.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' ? true :
                                  statusFilter === 'active' ? c.isActive !== false : c.isActive === false;
            return matchesSearch && matchesStatus;
        });
        return res.sort((a,b) => {
            if (sort === 'name') return a.name.localeCompare(b.name);
            return a.industry.localeCompare(b.industry);
        });
    }, [clients, search, sort, statusFilter]);

    // Handle Open Modal for Add
    const handleOpenAdd = () => {
        setEditingClient(null);
        setFormData({
            name: '',
            industry: '',
            address: '',
            contactPerson: '',
            npwpNumber: '',
            npwpDocPath: '',
            ndaNumber: '',
            ndaDocPath: '',
            paktaIntegritasDocPath: '',
            partnershipStartDate: '',
            partnershipEndDate: '',
            isActive: true
        });
        setIsModalOpen(true);
    };

    // Handle Open Modal for Edit
    const handleOpenEdit = (c: Client) => {
        setEditingClient(c);
        setFormData({
            name: c.name,
            industry: c.industry,
            address: c.address,
            contactPerson: c.contactPerson,
            npwpNumber: c.npwpNumber || '',
            npwpDocPath: c.npwpDocPath || '',
            ndaNumber: c.ndaNumber || '',
            ndaDocPath: c.ndaDocPath || '',
            paktaIntegritasDocPath: c.paktaIntegritasDocPath || '',
            partnershipStartDate: c.partnershipStartDate || '',
            partnershipEndDate: c.partnershipEndDate || '',
            isActive: c.isActive !== false
        });
        setIsModalOpen(true);
    };

    // High efficiency upload trigger
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'npwpDocPath' | 'ndaDocPath' | 'paktaIntegritasDocPath') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingField(fieldName);
        try {
            const dataUrl = await uploadFileMock(file);
            setFormData(prev => ({ ...prev, [fieldName]: dataUrl }));
        } catch (err) {
            alert("Gagal memproses berkas unggahan: " + err);
        } finally {
            setUploadingField(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingClient) {
                // Update operation
                await updateClient(editingClient.id, formData);
                alert(`Klien ${formData.name} berhasil diperbarui!`);
            } else {
                // Create operation
                await createClient(formData);
                alert(`Klien ${formData.name} berhasil didaftarkan!`);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Gagal menyimpan data klien:", error);
            alert("Kesalahan penyimpanan database");
        }
    };

    // Quick inline file uploader for cards to simplify workflows
    const handleCardDirectUpload = async (file: File, client: Client, fieldName: 'npwpDocPath' | 'ndaDocPath' | 'paktaIntegritasDocPath') => {
        try {
            const dataUrl = await uploadFileMock(file);
            await updateClient(client.id, { [fieldName]: dataUrl });
            loadData();
            alert("Dokumen berhasil ditambahkan ke database!");
        } catch (err) {
            alert("Gagal mengunggah berkas: " + err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Executive Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-9 border border-slate-100 bg-white p-4 rounded-xl shadow-xs flex flex-col justify-between h-24 hover:scale-[1.01] transition">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Masing-Masing Klien</span>
                    <div className="flex justify-between items-baseline mt-1">
                        <span className="text-2xl font-black text-slate-900">{stats.total}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">{stats.active} Aktif</span>
                    </div>
                </div>
                <div className="bg-slate-9 border border-slate-100 bg-white p-4 rounded-xl shadow-xs flex flex-col justify-between h-24 hover:scale-[1.01] transition">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">NPWP Terdaftar</span>
                    <div className="flex justify-between items-baseline mt-1">
                        <span className="text-2xl font-black text-indigo-950">{stats.completeNPWP}</span>
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">{((stats.completeNPWP / stats.total) * 100 || 0).toFixed(0)}%</span>
                    </div>
                </div>
                <div className="bg-slate-9 border border-slate-100 bg-white p-4 rounded-xl shadow-xs flex flex-col justify-between h-24 hover:scale-[1.01] transition">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Perjanjian NDA Selesai</span>
                    <div className="flex justify-between items-baseline mt-1">
                        <span className="text-2xl font-black text-violet-950">{stats.activeNDA}</span>
                        <span className="text-[10px] text-violet-600 font-bold bg-violet-50 px-2 py-0.5 rounded-full">{((stats.activeNDA / stats.total) * 100 || 0).toFixed(0)}%</span>
                    </div>
                </div>
                <div className="bg-slate-9 border border-slate-100 bg-white p-4 rounded-xl shadow-xs flex flex-col justify-between h-24 hover:scale-[1.01] transition">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pakta Integritas TTD</span>
                    <div className="flex justify-between items-baseline mt-1">
                        <span className="text-2xl font-black text-teal-950">{stats.signedPakta}</span>
                        <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-full">{((stats.signedPakta / stats.total) * 100 || 0).toFixed(0)}%</span>
                    </div>
                </div>
            </div>

            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 gap-3">
                <div className="flex flex-wrap gap-2 items-center flex-1">
                    <div className="relative flex-1 sm:max-w-xs">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-slate-400" />
                        <input 
                            className="w-full border border-slate-200 bg-slate-50 focus:bg-white pl-10 pr-3 py-2 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                            placeholder="Cari korporat klien / penanggung jawab..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            id="client-search-box"
                        />
                    </div>
                    <select 
                        className="border border-slate-200 bg-white rounded-lg px-2 py-2 text-xs text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={sort} 
                        onChange={e => setSort(e.target.value as any)}
                        id="client-sort-select"
                    >
                        <option value="name">Sort by: Nama Klien A-Z</option>
                        <option value="industry">Sort by: Bidang Industri</option>
                    </select>
                    <select 
                        className="border border-slate-200 bg-white rounded-lg px-2 py-2 text-xs text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={statusFilter} 
                        onChange={e => setStatusFilter(e.target.value as any)}
                        id="client-status-filter-select"
                    >
                        <option value="all">Semua Status Klien</option>
                        <option value="active">Klien Aktif</option>
                        <option value="inactive">Klien Non-Aktif</option>
                    </select>
                </div>
                <button 
                    onClick={handleOpenAdd} 
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold text-white px-4 py-2 rounded-lg flex items-center justify-center text-xs shadow-xs transition"
                    id="add-client-modal-btn"
                >
                    <PlusIcon className="h-4.5 w-4.5 mr-1 stroke-[2]" /> Registrasi Klien Baru
                </button>
            </div>

            {/* Grid display clients */}
            {loading ? (
                <div className="text-center py-16 text-slate-400 font-semibold animate-pulse">Menghubungkan ke database Firestore...</div>
            ) : filteredClients.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-medium">
                    Klien tidak ditemukan. Klik tombol untuk mendaftarkan mitra bisnis pertambangan/perbankan Anda.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map(client => {
                        const getCooperationStatus = () => {
                            if (!client.partnershipStartDate) return { label: 'Tanpa Periode', css: 'text-slate-500 bg-slate-50 border border-slate-100' };
                            const now = new Date();
                            const start = new Date(client.partnershipStartDate);
                            const end = client.partnershipEndDate ? new Date(client.partnershipEndDate) : null;
                            if (now < start) return { label: 'Kerjasama Mendatang', css: 'text-amber-700 bg-amber-50 border border-amber-150' };
                            if (end && now > end) return { label: 'Kerjasama Berakhir (Riwayat)', css: 'text-rose-800 bg-rose-50 border border-rose-100 font-bold' };
                            if (end) {
                              const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
                              if (daysLeft <= 30) return { label: `Segera Berakhir (${daysLeft} Hari)`, css: 'text-amber-800 bg-amber-50 border border-amber-200 animate-pulse font-extrabold' };
                              return { label: `Aktif (${daysLeft} Hari Lagi)`, css: 'text-emerald-700 bg-emerald-50 border border-emerald-100 font-extrabold' };
                            }
                            return { label: 'Kontrak Selamanya', css: 'text-emerald-700 bg-emerald-50 border border-emerald-100 font-bold' };
                        };
                        const pBadge = getCooperationStatus();

                        return (
                        <div key={client.id} className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition duration-200 relative overflow-hidden group">
                            
                            {/* Card Header */}
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-base leading-tight tracking-tight group-hover:text-indigo-600 transition">{client.name}</h3>
                                        <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                                            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">{client.industry}</span>
                                            {client.isActive !== false ? (
                                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">Aktif</span>
                                            ) : (
                                                <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider">Non-Aktif</span>
                                            )}
                                            <span className={`text-[9px] px-2 py-0.5 rounded uppercase tracking-wider font-sans font-bold ${pBadge.css}`}>{pBadge.label}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex gap-1.5">
                                        <button 
                                            onClick={() => handleOpenEdit(client)} 
                                            className="text-slate-400 hover:text-indigo-600 transition p-1 rounded-md hover:bg-slate-50"
                                            title="Ubah & Lengkapi Data"
                                            id={`edit-client-${client.id}`}
                                        >
                                            <PencilSquareIcon className="h-4 w-4" />
                                        </button>
                                        {deleteConfirmId === client.id ? (
                                            <div className="flex items-center gap-1">
                                                <button 
                                                    onClick={async () => { 
                                                        await deleteClient(client.id); 
                                                        setDeleteConfirmId(null);
                                                        loadData(); 
                                                    }} 
                                                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 text-[10px] rounded animate-pulse"
                                                    id={`delete-client-confirm-${client.id}`}
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
                                                onClick={() => setDeleteConfirmId(client.id)} 
                                                className="text-slate-400 hover:text-red-600 transition p-1 rounded-md hover:bg-slate-50"
                                                title="Hapus Klien"
                                                id={`delete-client-${client.id}`}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Base info contact */}
                                <div className="space-y-1.5 border-t border-slate-100 pt-3.5 mt-3.5 text-xs text-slate-600">
                                    <p className="flex justify-between">
                                        <span className="text-slate-400 font-medium">Perwakilan PIC:</span> 
                                        <span className="font-semibold text-slate-800">{client.contactPerson}</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span className="text-slate-400 font-medium font-sans">Kantor Pusat:</span> 
                                        <span className="font-medium text-slate-500 text-right truncate max-w-[180px]" title={client.address}>{client.address}</span>
                                    </p>
                                    <p className="flex justify-between items-center text-[11px] text-indigo-700 bg-indigo-50/60 rounded px-2 py-1 border border-indigo-100/50 mt-1">
                                        <span className="font-bold flex items-center gap-1">📅 Periode:</span> 
                                        <span className="font-bold font-mono">
                                            {client.partnershipStartDate ? `${client.partnershipStartDate} s/d ${client.partnershipEndDate || 'Selamanya'}` : 'Dinamis'}
                                        </span>
                                    </p>
                                </div>

                                {/* Collapsible Legal document details */}
                                <div className="space-y-2 mt-4 pt-4 border-t border-dashed border-slate-150">
                                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Berkas Kerjasama Legal</h4>
                                    
                                    {/* NPWP Indicator */}
                                    <div className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-1.5">
                                            <DocumentCheckIcon className="h-4 w-4 text-slate-400" />
                                            <div>
                                                <p className="font-bold text-slate-700 text-[10px] leading-none">NPWP Korporat</p>
                                                <p className="text-[9px] text-slate-400 font-mono tracking-tight mt-0.5">{client.npwpNumber || 'Nomor Belum Diinput'}</p>
                                            </div>
                                        </div>
                                        {client.npwpDocPath ? (
                                            <button 
                                                onClick={() => { setPreviewDocUrl(client.npwpDocPath!); setPreviewDocTitle(`NPWP - ${client.name}`); }}
                                                className="bg-emerald-50 text-emerald-700 font-bold text-[9px] px-2 py-1 rounded border border-emerald-200/60 flex items-center gap-1 hover:bg-emerald-100/60 transition shrink-0"
                                                id={`preview-npwp-${client.id}`}
                                            >
                                                <EyeIcon className="h-3 w-3" /> Preview
                                            </button>
                                        ) : (
                                            <label className="cursor-pointer bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border hover:bg-slate-300 transition shrink-0">
                                                <span>+ Unggah</span>
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleCardDirectUpload(file, client, 'npwpDocPath');
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>

                                    {/* NDA Agreement */}
                                    <div className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-1.5">
                                            <ScaleIcon className="h-4 w-4 text-slate-400" />
                                            <div>
                                                <p className="font-bold text-slate-700 text-[10px] leading-none">Perjanjian NDA</p>
                                                <p className="text-[9px] text-slate-400 font-mono tracking-tight mt-0.5">{client.ndaNumber || 'No NDA Belum Diinput'}</p>
                                            </div>
                                        </div>
                                        {client.ndaDocPath ? (
                                            <button 
                                                onClick={() => { setPreviewDocUrl(client.ndaDocPath!); setPreviewDocTitle(`Perjanjian NDA - ${client.name}`); }}
                                                className="bg-emerald-50 text-emerald-700 font-bold text-[9px] px-2 py-1 rounded border border-emerald-200/60 flex items-center gap-1 hover:bg-emerald-100/60 transition shrink-0"
                                                id={`preview-nda-${client.id}`}
                                            >
                                                <EyeIcon className="h-3 w-3" /> Preview
                                            </button>
                                        ) : (
                                            <label className="cursor-pointer bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border hover:bg-slate-300 transition shrink-0">
                                                <span>+ Unggah</span>
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleCardDirectUpload(file, client, 'ndaDocPath');
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>

                                    {/* Integrity Pact */}
                                    <div className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-1.5">
                                            <ShieldCheckIcon className="h-4 w-4 text-slate-400" />
                                            <div>
                                                <p className="font-bold text-slate-700 text-[10px] leading-none">Pakta Integritas</p>
                                                <p className="text-[9px] text-slate-400 tracking-tight mt-0.5">{client.paktaIntegritasDocPath ? 'Ditandatangani (Aktif)' : 'Belum Ditandatangani'}</p>
                                            </div>
                                        </div>
                                        {client.paktaIntegritasDocPath ? (
                                            <button 
                                                onClick={() => { setPreviewDocUrl(client.paktaIntegritasDocPath!); setPreviewDocTitle(`Pakta Integritas - ${client.name}`); }}
                                                className="bg-emerald-50 text-emerald-700 font-bold text-[9px] px-2 py-1 rounded border border-emerald-200/60 flex items-center gap-1 hover:bg-emerald-100/60 transition shrink-0"
                                                id={`preview-pakta-${client.id}`}
                                            >
                                                <EyeIcon className="h-3 w-3" /> Preview
                                            </button>
                                        ) : (
                                            <label className="cursor-pointer bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border hover:bg-slate-300 transition shrink-0">
                                                <span>+ Unggah</span>
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleCardDirectUpload(file, client, 'paktaIntegritasDocPath');
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>

                                 {/* Executive Admin actions for Client card */}
                                 <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-150">
                                     <button
                                         type="button"
                                         onClick={() => {
                                             alert(`Saran Evaluasi Kepuasan Pelanggan (CSat) dikirim ke PIC ${client.contactPerson} (${client.name})!\n\nTipe: Survey Tahunan Alih Daya.`);
                                         }}
                                         className="flex items-center justify-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold py-1.5 px-2 rounded text-[10px] border border-indigo-150 transition active:scale-95"
                                     >
                                         ⭐ Survey CSat
                                     </button>
                                     <button
                                         type="button"
                                         onClick={() => {
                                             alert(`Mengunduh Rangkuman Eksekutif Kemitraan PT Perdana Adi Yuda dengan ${client.name}...\n\nSektor: ${client.industry}\nStatus Pajak: ${client.npwpNumber ? 'Lengkap' : 'Belum Lengkap'}`);
                                         }}
                                         className="flex items-center justify-center gap-1 bg-white hover:bg-slate-55 text-slate-700 font-bold py-1.5 px-2 rounded text-[10px] border border-slate-200 transition active:scale-95"
                                     >
                                         📊 Cetak Riwayat
                                     </button>
                                 </div>

                                </div>
                            </div>

                        </div>
                    );
                    })}
                </div>
            )}

            {/* Modal for Add or Edit client with comprehensive forms */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                     <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto border animate-fadeIn">
                        <h2 className="text-lg font-black text-slate-800 border-b pb-3 mb-4">{editingClient ? 'Sunting Data Klien' : 'Registrasi Klien (Mitra Utama) Baru'}</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Nama Klien (Korporat)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Contoh: PT Poso Energy" />
                                <Input label="Sektor Industri" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} required placeholder="Contoh: Pertambangan / Smelter / Perbankan" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Perwakilan Korporat (PIC)" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} required placeholder="Nama kontak resmi" />
                                <Input label="Alamat Kantor Pusat" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required placeholder="Jl. Trans Sulawesi, Luwuk" />
                             </div>

                             {/* Partnership Period Section */}
                             <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                                 <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5"><CalendarDaysIcon className="h-4 w-4 text-indigo-500" /> Periode & Kerja Sama</h3>
                                 <div className="grid grid-cols-2 gap-4">
                                     <Input label="Tanggal Mulai Kerjasama" type="date" value={formData.partnershipStartDate || ''} onChange={e => setFormData({...formData, partnershipStartDate: e.target.value})} />
                                     <Input label="Tanggal Berakhir Kerjasama" type="date" value={formData.partnershipEndDate || ''} onChange={e => setFormData({...formData, partnershipEndDate: e.target.value})} />
                                 </div>
                             </div>

                            {/* NPWP Section */}
                            <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                                <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5"><DocumentCheckIcon className="h-4 w-4 text-indigo-500" /> Profil Pajak & NPWP</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Nomor Pokok Wajib Pajak (NPWP)" value={formData.npwpNumber} onChange={e => setFormData({...formData, npwpNumber: e.target.value})} placeholder="Contoh: 01.332.xxx.x" />
                                    <div>
                                        <span className="block text-gray-700 font-semibold mb-1">Unggah Dokumen NPWP</span>
                                        <div className="flex items-center gap-2">
                                            <label className="cursor-pointer text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-xs flex items-center gap-1">
                                                <ArrowUpTrayIcon className="h-4 w-4"/> {formData.npwpDocPath ? 'Ganti File NPWP' : 'Unggah File NPWP'}
                                                <input type="file" className="hidden" onChange={e => handleFileChange(e, 'npwpDocPath')} />
                                            </label>
                                            {uploadingField === 'npwpDocPath' && <span className="text-[10px] text-slate-400 font-semibold">Mengompres...</span>}
                                            {formData.npwpDocPath && <span className="text-[10px] text-emerald-600 font-bold">✓ Ready</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* NDA Agreement Section */}
                            <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                                <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5"><ScaleIcon className="h-4 w-4 text-indigo-500" /> Perjanjian Kerahasiaan (NDA)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Nomor Perjanjian NDA" value={formData.ndaNumber} onChange={e => setFormData({...formData, ndaNumber: e.target.value})} placeholder="Contoh: NDA/BPD/2026/02" />
                                    <div>
                                        <span className="block text-gray-700 font-semibold mb-1">Unggah Kesepakatan NDA</span>
                                        <div className="flex items-center gap-2">
                                            <label className="cursor-pointer text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-xs flex items-center gap-1">
                                                <ArrowUpTrayIcon className="h-4 w-4"/> {formData.ndaDocPath ? 'Ganti File NDA' : 'Unggah File NDA'}
                                                <input type="file" className="hidden" onChange={e => handleFileChange(e, 'ndaDocPath')} />
                                            </label>
                                            {uploadingField === 'ndaDocPath' && <span className="text-[10px] text-slate-400 font-semibold animate-pulse">Memroses...</span>}
                                            {formData.ndaDocPath && <span className="text-[10px] text-emerald-600 font-bold">✓ Ready</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                             {/* Integrity Pact Section */}
                            <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                                <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5"><ShieldCheckIcon className="h-4 w-4 text-indigo-500" /> Pakta Integritas (Anti-Korupsi & K3LH)</h3>
                                <div>
                                    <span className="block text-gray-700 font-semibold mb-1">Pakta Integritas Ter-tandatangani</span>
                                    <div className="flex items-center gap-3">
                                        <label className="cursor-pointer text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-xs flex items-center gap-1">
                                            <ArrowUpTrayIcon className="h-4 w-4"/> {formData.paktaIntegritasDocPath ? 'Ganti Berkas Pakta' : 'Unggah Berkas Pakta'}
                                            <input type="file" className="hidden" onChange={e => handleFileChange(e, 'paktaIntegritasDocPath')} />
                                        </label>
                                        {uploadingField === 'paktaIntegritasDocPath' && <span className="text-[10px] text-slate-400 font-semibold">Mengunggah...</span>}
                                        {formData.paktaIntegritasDocPath && <span className="text-[10px] text-emerald-600 font-bold">✓ Tersimpan & Valid</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Status Kemitraan */}
                            <div className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between">
                                <div>
                                    <span className="block font-bold text-slate-800">Status Kemitraan Aktif</span>
                                    <span className="block text-[10px] text-slate-400 font-medium">Nonaktifkan klien jika kerjasama selesai/ditangguhkan tanpa menghapus rekam data.</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.isActive} 
                                        onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                        className="sr-only peer"
                                        id="client-active-toggle"
                                    />
                                    <div className="w-10 h-5 bg-slate-250 border rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-bold text-slate-600 transition">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow-md shadow-indigo-100">
                                    {editingClient ? 'Simpan Perubahan' : 'Daftarkan Klien'}
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
                                title="Visualizer Berkas Alih Daya"
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
