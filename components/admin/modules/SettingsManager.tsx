import React, { useState } from 'react';
import { Cog6ToothIcon, DevicePhoneMobileIcon, TableCellsIcon, ChartBarIcon, BellAlertIcon, MagnifyingGlassIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export const SettingsManager: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('konfigurasi');
    const [searchTerm, setSearchTerm] = useState('');

    const categories = [
        { id: 'konfigurasi', label: 'Konfigurasi', icon: Cog6ToothIcon },
        { id: 'aplikasi', label: 'Aplikasi', icon: DevicePhoneMobileIcon },
        { id: 'data', label: 'Data', icon: TableCellsIcon },
        { id: 'gl', label: 'General Ledger', icon: ChartBarIcon },
        { id: 'telegram', label: 'Telegram', icon: BellAlertIcon },
        { id: 'hak_akses', label: 'Hak Akses', icon: ShieldCheckIcon },
    ];

    const filteredCategories = categories.filter(cat =>
        cat.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = () => {
        alert(`${activeCategory.toUpperCase()} settings saved successfully!`);
    };

    const renderContent = () => {
        switch (activeCategory) {
            case 'konfigurasi':
                return (
                    <div className="space-y-4">
                        <label className="block text-xs font-semibold text-slate-700">Nama Perusahaan <input className="w-full mt-1 p-2 border rounded text-xs" defaultValue="PT Perdana Recruitment" /></label>
                        <label className="block text-xs font-semibold text-slate-700">Email Kontak <input type="email" className="w-full mt-1 p-2 border rounded text-xs" defaultValue="contact@perdana.co.id" /></label>
                        <label className="block text-xs font-semibold text-slate-700">Alamat <textarea className="w-full mt-1 p-2 border rounded text-xs" defaultValue="Jl. Sudirman No. 1, Jakarta" /></label>
                        <label className="block text-xs font-semibold text-slate-700">Zona Waktu <select className="w-full mt-1 p-2 border rounded text-xs"><option>WIB (Jakarta)</option><option>WITA</option><option>WIT</option></select></label>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">Mode Maintenance</span>
                            <input type="checkbox" className="h-4 w-4" />
                        </div>
                        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-blue-700">Simpan Perubahan</button>
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
                    <div className="space-y-4">
                        <label className="block text-xs font-semibold text-slate-700">Frekuensi Backup <select className="w-full mt-1 p-2 border rounded text-xs"><option>Harian</option><option>Mingguan</option><option>Bulanan</option></select></label>
                        <label className="block text-xs font-semibold text-slate-700">Format Ekspor Default <select className="w-full mt-1 p-2 border rounded text-xs"><option>CSV</option><option>JSON</option><option>XLSX</option></select></label>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">Hapus Log Lama (30 Hari)</span>
                            <input type="checkbox" className="h-4 w-4" defaultChecked />
                        </div>
                        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-blue-700">Simpan Perubahan</button>
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
                        <label className="block text-xs font-semibold text-slate-700">Bot Token <input type="password" className="w-full mt-1 p-2 border rounded text-xs" defaultValue="8145648117:AAFEa53g..." /></label>
                        <label className="block text-xs font-semibold text-slate-700">Chat ID <input className="w-full mt-1 p-2 border rounded text-xs" /></label>
                        <label className="block text-xs font-semibold text-slate-700">Tipe Notifikasi <select className="w-full mt-1 p-2 border rounded text-xs"><option>Detail</option><option>Ringkasan</option></select></label>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">Notifikasi Status Perubahan</span>
                            <input type="checkbox" className="h-4 w-4" defaultChecked />
                        </div>
                        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-blue-700">Simpan Perubahan</button>
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
        <div className="flex h-[calc(100vh-160px)] gap-6">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0 flex flex-col gap-4">
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

                <nav className="flex flex-col gap-1">
                    {filteredCategories.map(cat => {
                        const Icon = cat.icon;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-3 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                                    activeCategory === cat.id
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {cat.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-grow p-6 bg-white rounded-lg shadow-sm border border-gray-100 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-800 mb-4">
                    {categories.find(c => c.id === activeCategory)?.label || 'Settings'}
                </h3>
                {renderContent()}
            </div>
        </div>
    );
};
