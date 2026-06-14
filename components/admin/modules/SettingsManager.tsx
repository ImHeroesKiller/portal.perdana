import React, { useState, useEffect } from 'react';
import { Cog6ToothIcon, DevicePhoneMobileIcon, TableCellsIcon, ChartBarIcon, BellAlertIcon, MagnifyingGlassIcon, ShieldCheckIcon, EnvelopeIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { seedAllDemoData } from '../../../services/db';
import { getGmailAccessToken, authorizeGmailAdmin } from '../../../services/gmail';
import { getCompanySettings, saveCompanySettings, BranchOffice, CompanySettings } from '../../../services/companySettings';

export const SettingsManager: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('konfigurasi');
    const [searchTerm, setSearchTerm] = useState('');
    const [telegramTemplate, setTelegramTemplate] = useState('Status Laporan: Operasional harian berjalan normal');
    const [telegramLink, setTelegramLink] = useState('');
    const [telegramImageUrl, setTelegramImageUrl] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [gmailConnected, setGmailConnected] = useState<boolean>(!!getGmailAccessToken());

    // Company Settings State
    const [compSettings, setCompSettings] = useState<CompanySettings>(() => getCompanySettings());
    const [isAddingBranch, setIsAddingBranch] = useState(false);
    const [branchForm, setBranchForm] = useState<Partial<BranchOffice>>({ name: '', address: '', lat: -2.8227, lng: 122.1462 });
    const [editingBranchId, setEditingBranchId] = useState<string | null>(null);

    const handleConnectGmail = async () => {
        try {
            await authorizeGmailAdmin();
            setGmailConnected(true);
            alert('Koneksi Gmail berhasil! Akun Google Anda terhubung sebagai admin pengirim notifikasi.');
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/popup-closed-by-user') {
                return;
            }
            alert('Gagal menghubungkan akun Gmail. Pastikan email Anda terdaftar sebagai penguji di Google Cloud Console: ' + (error.message || error));
        }
    };

    const categories = [
        { id: 'konfigurasi', label: 'Konfigurasi & Cabang', icon: Cog6ToothIcon },
        { id: 'aplikasi', label: 'Aplikasi', icon: DevicePhoneMobileIcon },
        { id: 'data', label: 'Data', icon: TableCellsIcon },
        { id: 'gl', label: 'General Ledger', icon: ChartBarIcon },
        { id: 'telegram', label: 'Telegram', icon: BellAlertIcon },
        { id: 'gmail', label: 'Gmail Admin', icon: EnvelopeIcon },
        { id: 'hak_akses', label: 'Hak Akses', icon: ShieldCheckIcon },
    ];

    const filteredCategories = categories.filter(cat =>
        cat.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = () => {
        alert(`${activeCategory.toUpperCase()} settings saved successfully!`);
    };

    const handleSaveGeneralSettings = (e: React.FormEvent) => {
        e.preventDefault();
        saveCompanySettings(compSettings);
        alert('Informasi Perusahaan berhasil diperbarui!');
    };

    const handleAddBranch = () => {
        setBranchForm({ name: '', address: '', lat: -2.8227, lng: 122.1462 });
        setEditingBranchId(null);
        setIsAddingBranch(true);
    };

    const handleEditBranch = (branch: BranchOffice) => {
        setBranchForm(branch);
        setEditingBranchId(branch.id);
        setIsAddingBranch(true);
    };

    const handleDeleteBranch = (id: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus cabang ini?')) {
            const updatedBranches = compSettings.branches.filter(b => b.id !== id);
            const updated = { ...compSettings, branches: updatedBranches };
            setCompSettings(updated);
            saveCompanySettings(updated);
            alert('Cabang berhasil dihapus!');
        }
    };

    const handleSaveBranch = () => {
        if (!branchForm.name || !branchForm.address) {
            alert('Nama cabang dan Alamat wajib diisi!');
            return;
        }

        let updatedBranches = [...compSettings.branches];
        if (editingBranchId) {
            updatedBranches = updatedBranches.map(b => b.id === editingBranchId ? {
                id: b.id,
                name: branchForm.name!,
                address: branchForm.address!,
                lat: Number(branchForm.lat) || 0,
                lng: Number(branchForm.lng) || 0
            } : b);
        } else {
            const newBranchObj: BranchOffice = {
                id: 'branch-' + Date.now(),
                name: branchForm.name!,
                address: branchForm.address!,
                lat: Number(branchForm.lat) || 0,
                lng: Number(branchForm.lng) || 0
            };
            updatedBranches.push(newBranchObj);
        }

        const updated = { ...compSettings, branches: updatedBranches };
        setCompSettings(updated);
        saveCompanySettings(updated);
        setIsAddingBranch(false);
        setEditingBranchId(null);
        alert(editingBranchId ? 'Cabang berhasil diperbarui!' : 'Cabang baru berhasil ditambahkan!');
    };

    const handleTestTelegram = async () => {
        try {
            const simulatedMessage = `[SIMULASI] ${telegramTemplate}\nLink: ${telegramLink || 'N/A'}\nImage: ${telegramImageUrl || 'N/A'}\nTimestamp: ${new Date().toLocaleString()}`;
            const response = await fetch('/api/send-telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: simulatedMessage })
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                alert(`Test message sent successfully:\n\n${simulatedMessage}`);
            } else {
                const errorMsg = data.error || data.message || "Telegram configuration may be missing or invalid.";
                alert(`Failed to send test message: ${errorMsg}`);
            }
        } catch (error: any) {
            console.error(error);
            alert(`Error sending test message: ${error.message || error}`);
        }
    };

    const renderContent = () => {
        switch (activeCategory) {
            case 'konfigurasi':
                return (
                    <div className="space-y-6">
                        {/* 1. General Company Settings Form */}
                        <form onSubmit={handleSaveGeneralSettings} className="space-y-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-b pb-1">Informasi Landing Page & Kontak Utama</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Nama Perusahaan
                                    <input 
                                        className="w-full mt-1 p-2 border border-gray-200 bg-white rounded-lg text-xs font-sans text-gray-800 focus:ring-2 focus:ring-blue-500" 
                                        value={compSettings.companyName}
                                        onChange={(e) => setCompSettings({ ...compSettings, companyName: e.target.value })}
                                        required
                                    />
                                </label>
                                
                                <label className="block text-xs font-semibold text-slate-700">
                                    Email Kontak Utama
                                    <input 
                                        type="email"
                                        className="w-full mt-1 p-2 border border-gray-200 bg-white rounded-lg text-xs font-sans text-gray-800 focus:ring-2 focus:ring-blue-500" 
                                        value={compSettings.email}
                                        onChange={(e) => setCompSettings({ ...compSettings, email: e.target.value })}
                                        required
                                    />
                                </label>

                                <label className="block text-xs font-semibold text-slate-700">
                                    Nomor Telp / WhatsApp
                                    <input 
                                        className="w-full mt-1 p-2 border border-gray-200 bg-white rounded-lg text-xs font-sans text-gray-800 focus:ring-2 focus:ring-blue-500" 
                                        value={compSettings.phone}
                                        onChange={(e) => setCompSettings({ ...compSettings, phone: e.target.value })}
                                        placeholder="cth: 0858 9366 1683"
                                        required
                                    />
                                </label>

                                <label className="block text-xs font-semibold text-slate-700">
                                    Alamat Website URL
                                    <input 
                                        className="w-full mt-1 p-2 border border-gray-200 bg-white rounded-lg text-xs font-sans text-gray-800 focus:ring-2 focus:ring-blue-500" 
                                        value={compSettings.website}
                                        onChange={(e) => setCompSettings({ ...compSettings, website: e.target.value })}
                                        placeholder="cth: https://perada.net"
                                    />
                                </label>
                            </div>

                            <label className="block text-xs font-semibold text-slate-700">
                                Alamat Kantor Pusat
                                <textarea 
                                    className="w-full mt-1 p-2 border border-gray-200 bg-white rounded-lg text-xs font-sans text-gray-800 focus:ring-2 focus:ring-blue-500" 
                                    rows={3}
                                    value={compSettings.headOfficeAddress}
                                    onChange={(e) => setCompSettings({ ...compSettings, headOfficeAddress: e.target.value })}
                                    required
                                />
                            </label>

                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition">
                                Simpan Informasi Utama
                            </button>
                        </form>

                        {/* 2. Branch Offices CRUD Section */}
                        <div className="p-5 bg-white rounded-xl border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Cabang & Kantor Perwakilan</h4>
                                    <p className="text-[10px] text-gray-500 mt-0.5">Kelola daftar cabang yang akan terpampang langsung di peta dan info kontak.</p>
                                </div>
                                <button 
                                    onClick={handleAddBranch}
                                    className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 flex items-center gap-1 transition"
                                >
                                    <PlusIcon className="h-4 w-4" /> Tambah Cabang
                                </button>
                            </div>

                            {/* Branch List Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-150 bg-slate-50 text-slate-500 font-semibold">
                                            <th className="p-2.5">Nama Kantor</th>
                                            <th className="p-2.5">Alamat</th>
                                            <th className="p-2.5">Koordinat (Lat / Lng)</th>
                                            <th className="p-2.5 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {compSettings.branches.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-gray-400">Belum ada cabang terdaftar.</td>
                                            </tr>
                                        ) : (
                                            compSettings.branches.map(branch => (
                                                <tr key={branch.id} className="border-b border-gray-100 hover:bg-gray-25">
                                                    <td className="p-2.5 font-semibold text-gray-800">{branch.name}</td>
                                                    <td className="p-2.5 text-gray-600 max-w-xs truncate whitespace-pre-wrap">{branch.address}</td>
                                                    <td className="p-2.5 text-gray-500 font-mono text-[10px]">
                                                        {branch.lat}, {branch.lng}
                                                    </td>
                                                    <td className="p-2.5 text-center flex justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleEditBranch(branch)}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                            title="Edit"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteBranch(branch.id)}
                                                            className="p-1 text-red-650 hover:bg-red-50 rounded"
                                                            title="Hapus"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Add/Edit Form Overlay */}
                            {isAddingBranch && (
                                <div className="mt-5 p-4 border border-blue-100 bg-blue-25/50 rounded-xl space-y-3">
                                    <h5 className="text-xs font-bold text-blue-900">
                                        {editingBranchId ? 'Edit Cabang' : 'Tambah Cabang Baru'}
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <label className="block text-[11px] font-semibold text-gray-700">
                                            Nama Cabang
                                            <input 
                                                className="w-full mt-1 p-2 border rounded text-xs bg-white" 
                                                placeholder="cth: Kantor Perwakilan Morowali"
                                                value={branchForm.name}
                                                onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                                            />
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <label className="block text-[11px] font-semibold text-gray-700">
                                                Latitude Map
                                                <input 
                                                    type="number"
                                                    step="any"
                                                    className="w-full mt-1 p-2 border rounded text-xs bg-white font-mono" 
                                                    value={branchForm.lat}
                                                    onChange={e => setBranchForm({ ...branchForm, lat: parseFloat(e.target.value) || 0 })}
                                                />
                                            </label>
                                            <label className="block text-[11px] font-semibold text-gray-700">
                                                Longitude Map
                                                <input 
                                                    type="number"
                                                    step="any"
                                                    className="w-full mt-1 p-2 border rounded text-xs bg-white font-mono" 
                                                    value={branchForm.lng}
                                                    onChange={e => setBranchForm({ ...branchForm, lng: parseFloat(e.target.value) || 0 })}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <label className="block text-[11px] font-semibold text-gray-700">
                                        Alamat Cabang Lengkap
                                        <textarea 
                                            className="w-full mt-1 p-2 border rounded text-xs bg-white" 
                                            rows={2}
                                            placeholder="Alamat lengkap, kode pos..."
                                            value={branchForm.address}
                                            onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
                                        />
                                    </label>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleSaveBranch}
                                            className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-700 transition"
                                        >
                                            Simpan Cabang
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setIsAddingBranch(false);
                                                setEditingBranchId(null);
                                            }}
                                            className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-200 transition"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'aplikasi':
                return (
                    <div className="space-y-4">
                        <label className="block text-xs font-semibold text-slate-700">Versi Aplikasi <input className="w-full mt-1 p-2 border rounded text-xs" defaultValue="v1.0.0" disabled /></label>
                        <label className="block text-xs font-semibold text-slate-700">API Gateway URL <input className="w-full mt-1 p-2 border rounded text-xs" defaultValue="https://api.perdana.co.id" /></label>
                        <label className="block text-xs font-semibold text-slate-700">Ukuran Halaman (Pagination) <input type="number" className="w-full mt-1 p-2 border rounded text-xs" defaultValue="20" /></label>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">Periksa Update Otomatis</span>
                            <input type="checkbox" className="h-4 w-4" defaultChecked />
                        </div>
                        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-blue-700">Simpan Perubahan</button>
                    </div>
                );
            case 'data':
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-900 border-b pb-2">Pengaturan Data</h4>
                            <label className="block text-xs font-semibold text-slate-700">Frekuensi Backup <select className="w-full mt-1 p-2 border rounded text-xs"><option>Harian</option><option>Mingguan</option><option>Bulanan</option></select></label>
                            <label className="block text-xs font-semibold text-slate-700">Format Ekspor Default <select className="w-full mt-1 p-2 border rounded text-xs"><option>CSV</option><option>JSON</option><option>XLSX</option></select></label>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-700">Hapus Log Lama (30 Hari)</span>
                                <input type="checkbox" className="h-4 w-4" defaultChecked />
                            </div>
                            <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-blue-700">Simpan Perubahan</button>
                        </div>
                        
                        <div className="space-y-3 pt-5 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-900">Inisialisasi & Simulasi Data</h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                Jika database Firebase Anda dalam keadaan kosong di Vercel, klik tombol di bawah untuk memasukkan kembali 35 data simulasi pelamar (termasuk 16 pelamar di kolom Applied) secara utuh ke database Firestore Anda (termasuk data klien B2B, proyek, dan daftar lowongan).
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                                <button 
                                    onClick={async (e) => {
                                        const btn = e.currentTarget;
                                        if (window.confirm("Apakah Anda yakin ingin memasukkan kembali 35 data simulasi pelamar baru ke database Firebase Anda?")) {
                                            btn.disabled = true;
                                            const originalText = btn.innerText;
                                            btn.innerText = "Sourcing & Seeding...";
                                            try {
                                                await seedAllDemoData();
                                                alert("Sukses! 35 data simulasi berhasil dimasukkan ke database Firebase Anda. Halaman akan dimuat ulang.");
                                                window.location.reload();
                                            } catch (error: any) {
                                                alert("Gagal menginisialisasi data: " + (error.message || error));
                                                btn.disabled = false;
                                                btn.innerText = originalText;
                                            }
                                        }
                                    }}
                                    className="bg-emerald-600 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-emerald-700 transition"
                                >
                                    Masukkan 35 Data Pelamar Simulasi ke Firebase
                                </button>
                                <button 
                                    onClick={() => {
                                        if (window.confirm("Apakah Anda yakin ingin membersihkan seluruh cache & local storage aplikasi pada browser ini?")) {
                                            localStorage.clear();
                                            alert("Cache lokal dibersihkan.");
                                            window.location.reload();
                                        }
                                    }}
                                    className="bg-slate-100 text-slate-750 border border-slate-250 px-4 py-2 rounded text-xs font-semibold hover:bg-slate-200 transition"
                                >
                                    Bersihkan Cache & Reload
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'gl':
                return (
                    <div className="space-y-4">
                        <label className="block text-xs font-semibold text-slate-700">Mata Uang Utama <input className="w-full mt-1 p-2 border rounded text-xs" defaultValue="IDR" /></label>
                        <label className="block text-xs font-semibold text-slate-700">NPWP Perusahaan <input className="w-full mt-1 p-2 border rounded text-xs" defaultValue="00.000.000.0-000.000" /></label>
                        <label className="block text-xs font-semibold text-slate-700">Awal Tahun Fiskal <input type="month" className="w-full mt-1 p-2 border rounded text-xs" defaultValue="2026-01" /></label>
                        <label className="block text-xs font-semibold text-slate-700">Presisi Desimal <input type="number" className="w-full mt-1 p-2 border rounded text-xs" defaultValue="2" /></label>
                        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-blue-700">Simpan Perubahan</button>
                    </div>
                );
            case 'telegram':
                return (
                    <div className="space-y-4">
                        <div className="p-3 bg-slate-50 rounded border border-slate-200">
                             <h4 className="text-xs font-bold text-slate-800 mb-2">Telegram System Monitor</h4>
                             <div className="flex justify-between items-center text-xs text-slate-600">
                                 <span>Status:</span>
                                 <span className="text-green-600 font-semibold">Active</span>
                             </div>
                             <div className="flex justify-between items-center text-xs text-slate-600 mt-1">
                                 <span>Last Sync:</span>
                                 <span>Just now</span>
                             </div>
                        </div>
                        <label className="block text-xs font-semibold text-slate-700">Bot Token <input type="password" className="w-full mt-1 p-2 border rounded text-xs" defaultValue="8145648117:..." /></label>
                        <label className="block text-xs font-semibold text-slate-700">Chat ID <input className="w-full mt-1 p-2 border rounded text-xs" defaultValue="123456789" /></label>
                        <label className="block text-xs font-semibold text-slate-700">Template Pesan Default <select className="w-full mt-1 p-2 border rounded text-xs" value={telegramTemplate} onChange={(e) => setTelegramTemplate(e.target.value)}>
                            <option value="Status Laporan: Operasional harian berjalan normal">Status Laporan: Operasional harian berjalan normal</option>
                            <option value="Pelamar Baru: Telah masuk aplikasi baru ke sistem">Pelamar Baru: Telah masuk aplikasi baru ke sistem</option>
                            <option value="Status Interview: Kandidat berpindah ke tahap Interview">Status Interview: Kandidat berpindah ke tahap Interview</option>
                            <option value="Kandidat Hire: Selamat, kandidat telah diterima!">Kandidat Hire: Selamat, kandidat telah diterima!</option>
                            <option value="Kandidat Rejected: Mohon maaf, kandidat tidak lolos">Kandidat Rejected: Mohon maaf, kandidat tidak lolos</option>
                            <option value="Alert: Server mengalami gangguan koneksi">Alert: Server mengalami gangguan koneksi</option>
                        </select></label>
                        <label className="block text-xs font-semibold text-slate-700">Link Lampiran <input className="w-full mt-1 p-2 border rounded text-xs" value={telegramLink} onChange={(e) => setTelegramLink(e.target.value)} placeholder="https://..." /></label>
                        <label className="block text-xs font-semibold text-slate-700">Image URL <input className="w-full mt-1 p-2 border rounded text-xs" value={telegramImageUrl} onChange={(e) => setTelegramImageUrl(e.target.value)} placeholder="https://..." /></label>
                        <label className="block text-xs font-semibold text-slate-700">Tipe Notifikasi <select className="w-full mt-1 p-2 border rounded text-xs"><option>Detail</option><option>Ringkasan</option></select></label>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">Notifikasi Status Perubahan</span>
                            <input type="checkbox" className="h-4 w-4" defaultChecked />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-xs text-xs font-semibold hover:bg-blue-700">Simpan Perubahan</button>
                          <button onClick={handleTestTelegram} className="bg-slate-600 text-white px-4 py-2 rounded-xs text-xs font-semibold hover:bg-slate-700">Test Connection</button>
                          <button onClick={() => setShowPreview(!showPreview)} className="bg-emerald-600 text-white px-4 py-2 rounded-xs text-xs font-semibold hover:bg-emerald-700">{showPreview ? 'Hide Preview' : 'Preview'}</button>
                        </div>
                        {showPreview && (
                            <div className="p-4 bg-white border rounded shadow-md mt-4">
                                <h5 className="text-xs font-bold text-slate-800 mb-2">Message Preview:</h5>
                                <p className="text-xs text-slate-700 whitespace-pre-wrap">{telegramTemplate}</p>
                                {telegramLink && <a href={telegramLink} className="text-xs text-blue-600 underline block mt-2" target="_blank" rel="noopener noreferrer">{telegramLink}</a>}
                                {telegramImageUrl && <img src={telegramImageUrl} alt="Preview" className="mt-2 max-w-full h-auto rounded" />}
                            </div>
                        )}
                    </div>
                );
            case 'gmail':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <h4 className="text-xs font-bold text-slate-800 mb-1">Status Gmail Admin</h4>
                            <p className="text-[11px] text-slate-500 mb-3">Akun Ary Wibowo (ary.wibowo@perada.net) digunakan untuk mengirim notifikasi sistem.</p>
                            
                            {gmailConnected ? (
                                <div className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded border border-emerald-200">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                    Gmail Terhubung
                                </div>
                            ) : (
                                <button 
                                    onClick={handleConnectGmail}
                                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded transition"
                                >
                                    Hubungkan Kembali Gmail
                                </button>
                            )}
                        </div>
                        <div className="p-4 bg-sky-50 rounded-lg border border-sky-100">
                            <h4 className="text-xs font-bold text-sky-900 mb-1">Catatan Penting</h4>
                            <p className="text-[11px] text-sky-700 leading-relaxed">
                                Jika muncul error "Access blocked: ... has not completed the Google verification process", silakan buka Google Cloud Console Anda, cari project ID <code>gen-lang-client-0987251808</code>, navigasi ke "OAuth consent screen", dan tambahkan email <code>ary.wibowo@perada.net</code> ke dalam daftar "Test users".
                            </p>
                        </div>
                    </div>
                );
            case 'hak_akses':
                return (
                    <div className="space-y-4">
                        <label className="block text-xs font-semibold text-slate-700">Level Akses Default <select className="w-full mt-1 p-2 border rounded text-xs"><option>Viewer</option><option>Editor</option><option>Admin</option></select></label>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">Aktifkan Autentikasi 2-Faktor</span>
                            <input type="checkbox" className="h-4 w-4" defaultChecked />
                        </div>
                        <label className="block text-xs font-semibold text-slate-700">Masa Berlaku Sesi (Menit) <input type="number" className="w-full mt-1 p-2 border rounded text-xs" defaultValue="60" /></label>
                        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-blue-700">Simpan Perubahan</button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-160px)] gap-6">
            {/* Sidebar */}
            <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Cari setting..."
                        className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>

                <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
                    {filteredCategories.map(cat => {
                        const Icon = cat.icon;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-3 py-2 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                                    activeCategory === cat.id
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                <Icon className="h-4 w-4 flex-shrink-0" />
                                {cat.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-grow p-6 bg-white rounded-lg shadow-sm border border-gray-100 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
                    {categories.find(c => c.id === activeCategory)?.label || 'Settings'}
                </h3>
                {renderContent()}
            </div>
        </div>
    );
};
