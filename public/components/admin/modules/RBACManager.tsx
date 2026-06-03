import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheckIcon, UserPlusIcon, PencilIcon, TrashIcon, 
  KeyIcon, CheckIcon, CheckCircleIcon, NoSymbolIcon,
  UsersIcon, BuildingOfficeIcon, ClipboardDocumentListIcon,
  UserGroupIcon, ClockIcon, CreditCardIcon, ScaleIcon,
  WrenchScrewdriverIcon, ChartPieIcon
} from '@heroicons/react/24/outline';
import { 
  getAdminUsers, saveAdminUser, deleteAdminUser, SupplementaryAdmin 
} from '../../../services/auth';

const AVAILABLE_MODULES = [
  { id: 'talent', name: 'Talent & Rekrutmen', desc: 'Sistem rekrutmen ATS, pipeline seleksi, dan penjadwalan interview.', icon: UsersIcon, color: 'text-blue-600 bg-blue-50' },
  { id: 'client', name: 'Mitra & Klien B2B', desc: 'Direktori korporasi klien, berkas NDA, pakta integritas B2B.', icon: BuildingOfficeIcon, color: 'text-emerald-600 bg-emerald-50' },
  { id: 'project', name: 'Proyek Penempatan', desc: 'Manajemen proyek outsource, PO, SPK, dan alokasi personel.', icon: ClipboardDocumentListIcon, color: 'text-purple-600 bg-purple-50' },
  { id: 'employees', name: 'Database Karyawan', desc: 'Remunerasi, skema gaji, data kontrak kerja holding & proyek.', icon: UserGroupIcon, color: 'text-indigo-600 bg-indigo-50' },
  { id: 'attendance', name: 'Presensi GPS Lapangan', desc: 'Peta kehadiran real-time berbasis map & koordinat, data lembur.', icon: ClockIcon, color: 'text-amber-600 bg-amber-50' },
  { id: 'payroll', name: 'Sistem Payroll & Gaji', desc: 'Proses penggajian bulanan, transfer, & ekspor slip gaji karyawan.', icon: CreditCardIcon, color: 'text-rose-600 bg-rose-50' },
  { id: 'finance', name: 'Buku Kas & Finansial', desc: 'Jurnal keuangan operasional, COA, & analisa laba-rugi proyek.', icon: ScaleIcon, color: 'text-teal-600 bg-teal-50' },
  { id: 'assets', name: 'Aset & Logistik Kerja', desc: 'Pemberian, pengembalian, status inventaris kerja karyawan.', icon: WrenchScrewdriverIcon, color: 'text-sky-600 bg-sky-50' },
  { id: 'reports', name: 'Laporan & Analytics', desc: 'Sinkronisasi Telegram, visual audit & ringkasan operasional.', icon: ChartPieIcon, color: 'text-gray-600 bg-gray-50' }
];

export const RBACManager: React.FC = () => {
  const [admins, setAdmins] = useState<SupplementaryAdmin[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<SupplementaryAdmin | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [errorLocal, setErrorLocal] = useState('');

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = () => {
    setAdmins(getAdminUsers());
  };

  const openCreateModal = () => {
    setEditingAdmin(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormPermissions([]);
    setFormIsActive(true);
    setErrorLocal('');
    setShowAddModal(true);
  };

  const openEditModal = (admin: SupplementaryAdmin) => {
    setEditingAdmin(admin);
    setFormName(admin.name);
    setFormUsername(admin.username);
    setFormPassword(admin.password || '');
    setFormPermissions(admin.permissions || []);
    setFormIsActive(admin.isActive);
    setErrorLocal('');
    setShowAddModal(true);
  };

  const handleTogglePermission = (moduleId: string) => {
    if (formPermissions.includes(moduleId)) {
      setFormPermissions(formPermissions.filter(p => p !== moduleId));
    } else {
      setFormPermissions([...formPermissions, moduleId]);
    }
  };

  const handleSelectAllPerms = () => {
    if (formPermissions.length === AVAILABLE_MODULES.length) {
      setFormPermissions([]);
    } else {
      setFormPermissions(AVAILABLE_MODULES.map(m => m.id));
    }
  };

  const handleSubmitAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal('');

    if (!formName || !formUsername || !formPassword) {
      setErrorLocal('Mohon lengkapi seluruh kolom wajib.');
      return;
    }

    if (formUsername.trim().toLowerCase() === 'admin') {
      setErrorLocal("Username 'admin' dicadangkan khusus untuk superadmin.");
      return;
    }

    // Check uniqueness of username
    const exists = admins.some(a => a.username.toLowerCase() === formUsername.toLowerCase() && (!editingAdmin || a.id !== editingAdmin.id));
    if (exists) {
      setErrorLocal('Username/Email admin ini sudah digunakan.');
      return;
    }

    if (formPermissions.length === 0) {
      setErrorLocal('Pilih minimal satu modul hak akses untuk admin ini.');
      return;
    }

    const payload: SupplementaryAdmin = {
      id: editingAdmin ? editingAdmin.id : `adm-${Math.random().toString(36).substr(2, 9)}`,
      name: formName.trim(),
      username: formUsername.trim().toLowerCase(),
      password: formPassword,
      role: 'admin',
      permissions: formPermissions,
      isActive: formIsActive,
      createdAt: editingAdmin ? editingAdmin.createdAt : new Date().toISOString()
    };

    saveAdminUser(payload);
    loadAdmins();
    setShowAddModal(false);
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus sistem akses untuk administrator "${name}"?`)) {
      deleteAdminUser(id);
      loadAdmins();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden text-slate-800 animate-fade-in" id="rbac-manager-viewport">
      {/* Header section with Superadmin Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 text-white relative">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-blue-500/20 text-blue-300 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest border border-blue-500/30">
              Superadmin Console (RBAC Engine)
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
              Otoritas & Hak Akses Administrator
            </h2>
            <p className="text-slate-300 text-xs mt-1 max-w-3xl leading-relaxed">
              Sebagai Superadmin utama, Anda memegang hak prerogatif mutlak untuk mendaftarkan akun staf admin asisten dan mendelegasikan izin akses modular sesuai deskripsi pekerjaan (Job-Desc) divisi operasional, keuangan, atau rekrutmen.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-5 py-3 rounded-xl transition duration-155 flex items-center gap-2 shadow-lg active:scale-95 shrink-0 cursor-pointer"
          >
            <UserPlusIcon className="h-4.5 w-4.5 stroke-[2.5]" />
            Tambah Akun Admin Baru
          </button>
        </div>
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-6 translate-x-6">
          <ShieldCheckIcon className="h-64 w-64" />
        </div>
      </div>

      {/* Main Admin List Workspace */}
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex justify-between items-center bg-slate-50 border p-4 rounded-xl">
          <p className="text-xs text-slate-500 font-bold leading-relaxed">
            ℹ️ Setiap kali akun asisten admin masuk ke dashboard admin, sistem otomatis mendeteksi konfigurasi token di bawah ini dan menyembunyikan modul-modul di luar wewenangnya guna memproteksi data korporasi.
          </p>
          <span className="text-[10px] text-indigo-700 bg-indigo-50 font-black px-3 py-1 rounded-full uppercase tracking-wider shrink-0 hidden md:block">
            {admins.length} Admin Delegator Aktif
          </span>
        </div>

        {/* Admin Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border border-dashed border-indigo-200 bg-indigo-50/20 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden min-h-[220px]">
            <div className="space-y-2">
              <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded tracking-wider">
                Role Prerogative Mutlak
              </span>
              <h4 className="font-extrabold text-sm text-slate-900 mt-1">Superadmin Root (admin)</h4>
              <p className="text-[10px] text-gray-500 font-bold">Username master: <span className="font-mono text-gray-800">admin</span></p>
            </div>
            
            <div className="my-3 text-[10px] bg-white border border-indigo-100 rounded-lg p-2.5 text-indigo-950 leading-relaxed">
              ✓ Akses ke seluruh 9 modul utama<br />
              ✓ Satu-satunya wewenang manajemen izin (RBAC) <br />
              ✓ Status: <b>Aktif Permanen</b>
            </div>

            <div className="text-[10px] text-indigo-400 font-bold">
              * Sandi master dideklarasikan aman di server.
            </div>
          </div>

          {admins.map(adm => (
            <div key={adm.id} className="border bg-white rounded-2xl hover:shadow-md hover:border-slate-300 transition duration-150 flex flex-col justify-between p-6">
              <div className="space-y-3.5">
                <div className="flex justify-between items-start">
                  <span className={`px-2 py-0.5 font-black text-[9px] uppercase rounded tracking-wider ${
                    adm.isActive 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {adm.isActive ? '● SEDANG AKTIF' : '⏹ DINONAKTIFKAN'}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEditModal(adm)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Izin & Akun"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(adm.id, adm.name)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Hak Akses"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis">{adm.name}</h4>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                    Username: <span className="font-mono text-indigo-700 font-bold">{adm.username}</span> | Sandi: <span className="font-mono text-gray-700">{adm.password}</span>
                  </p>
                </div>

                {/* Badge list of permitted modules */}
                <div>
                  <p className="text-[9px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Hak Akses Modul ({adm.permissions.length}):</p>
                  <div className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto">
                    {adm.permissions.map(permId => {
                      const mod = AVAILABLE_MODULES.find(m => m.id === permId);
                      return (
                        <span key={permId} className="px-2 py-0.5 bg-slate-100 font-bold text-[9px] text-gray-700 border border-slate-200 rounded">
                          {mod ? mod.name : permId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t text-[10px] text-gray-400 font-mono">
                Terdaftar: {new Date(adm.createdAt).toLocaleDateString('id-ID')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DIALOG MODAL ADD / EDIT ADMIN ACCESS */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 text-xs text-slate-800"
          >
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 font-black text-white flex justify-between items-center border-b">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
                <div>
                  <h4 className="font-black text-sm">{editingAdmin ? 'Perbarui Konfigurasi Admin' : 'Daftarkan Account Admin Baru'}</h4>
                  <p className="text-[10px] text-slate-300 font-bold">Protokol Keamanan & Alokasi Perizinan</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white hover:text-white/80 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmitAdmin} className="p-6 space-y-5 text-left max-h-[85vh] overflow-y-auto">
              {errorLocal && (
                <div className="bg-rose-50 border border-rose-150 text-rose-700 p-3 rounded-xl text-[10px] font-bold text-center">
                  ⚠️ {errorLocal}
                </div>
              )}

              {/* Step 1: Account Profile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-700 font-black mb-1">Nama Lengkap Administrator <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Rian Anggoro (Staf Finance)"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="w-full border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-650 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-black mb-1">Status Keaktifan Akun</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormIsActive(true)}
                        className={`flex-1 py-2.5 rounded-lg text-center font-bold text-[10px] border transition ${
                          formIsActive 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : 'bg-white text-gray-400 hover:bg-slate-50'
                        }`}
                      >
                        ● Aktif (Bisa Log In)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormIsActive(false)}
                        className={`flex-1 py-2.5 rounded-lg text-center font-bold text-[10px] border transition ${
                          !formIsActive 
                            ? 'bg-rose-50 text-rose-800 border-rose-300' 
                            : 'bg-white text-gray-400 hover:bg-slate-50'
                        }`}
                      >
                        ⏹ Dinonaktifkan (Blokir)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-700 font-black mb-1">Email / Username Log In <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: rian.finance @perdana"
                      value={formUsername}
                      onChange={e => setFormUsername(e.target.value)}
                      className="w-full border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-650 bg-white font-mono text-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-black mb-1">Kata Sandi Akun <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Ketik sandi unik rahasia"
                      value={formPassword}
                      onChange={e => setFormPassword(e.target.value)}
                      className="w-full border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-650 bg-white font-mono text-zinc-900"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Permissions Checker Grid */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-black text-slate-905">Petakan Hak Akses Modul Kerja</h5>
                    <p className="text-[10px] text-gray-400">Pilih modul mana yang dapat diakses oleh asisten admin ini.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAllPerms}
                    className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-150 px-3 py-1 rounded hover:bg-blue-100 transition whitespace-nowrap"
                  >
                    {formPermissions.length === AVAILABLE_MODULES.length ? 'Hapus Semua Centang' : 'Pilih / Centang Semua'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {AVAILABLE_MODULES.map(item => {
                    const isChecked = formPermissions.includes(item.id);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTogglePermission(item.id)}
                        className={`flex items-start text-left p-3.5 border rounded-2xl cursor-pointer transition duration-150 ${
                          isChecked 
                            ? 'border-blue-600 bg-blue-50/20 ring-1 ring-blue-500' 
                            : 'border-slate-150 bg-white hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Custom visual checkbox design */}
                        <div className={`mt-0.5 mr-3 p-2 rounded-xl shrink-0 ${isChecked ? 'bg-blue-600 text-white' : item.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-[11px] text-gray-900 leading-none">{item.name}</span>
                            {isChecked && <CheckCircleIcon className="h-4.5 w-4.5 text-blue-600" />}
                          </div>
                          <p className="text-[9.5px] leading-relaxed text-gray-500 font-medium">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row actions */}
              <div className="pt-4 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border rounded-xl text-gray-500 hover:bg-gray-50 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl font-black shadow-lg transition active:scale-95 cursor-pointer"
                >
                  {editingAdmin ? 'Simpan Pembaruan Izin' : 'Daftarkan Admin & Izin'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
