
import React, { useState } from 'react';
import { Employee, JobVacancy, ApplicationStatus, OfferingDetails } from '../../../types';
import { analyzeCandidate, ScoreBadge, StatusBadge } from '../shared/Utils';
import { UserIcon, RectangleStackIcon, ChartBarIcon, CheckCircleIcon, ArrowDownTrayIcon, PhoneIcon, EnvelopeIcon, DocumentTextIcon, XCircleIcon, BriefcaseIcon, VideoCameraIcon, StarIcon, TrashIcon } from '@heroicons/react/24/outline';
import { sendInterviewNotification, sendRejectionNotification, sendOfferingLetter, sendContractDocument, sendHiredNotification, sendPassedInterviewNotification } from '../../../services/notifications';
import { uploadFileMock } from '../../../services/db';
import { OfferingModal } from './OfferingModal';

interface CandidateModalProps { 
    employee: Employee; 
    job?: JobVacancy; 
    onClose: () => void;
    onStatusUpdate: (id: string, status: ApplicationStatus, notes?: string, date?: string, extraData?: any) => void;
    onDelete?: (id: string) => void;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({ employee, job, onClose, onStatusUpdate, onDelete }) => {
  const analysis = job ? analyzeCandidate(employee, job) : null;
  
  // State for Inputs
  const [notes, setNotes] = useState(employee.hrNotes || '');
  const [interviewDate, setInterviewDate] = useState(employee.interviewDate ? employee.interviewDate.slice(0, 16) : '');
  const [interviewLoc, setInterviewLoc] = useState(employee.interviewLocation || 'Kantor Pusat PT Perdana Adi Yuda');
  
  // Advanced Interview States (Online vs Offline)
  const [interviewType, setInterviewType] = useState<'online' | 'offline'>(employee.interviewType || 'online');
  const [interviewLink, setInterviewLink] = useState(employee.interviewLink || 'https://meet.google.com/abc-defg-hij');
  const [interviewLocName, setInterviewLocName] = useState(employee.interviewLocName || 'Kantor Pusat PT Perdana Adi Yuda');
  const [interviewAddress, setInterviewAddress] = useState(employee.interviewAddress || 'Jl. Jenderal Sudirman No. 123, Palu');
  const [interviewPic, setInterviewPic] = useState(employee.interviewPic || 'HR Team PT Perdana');

  const [previewInfo, setPreviewInfo] = useState<{url: string; type: 'image' | 'pdf' | 'unsupported'} | null>(null);

  // Helper to detect file type
  const getFileType = (url: string): 'image' | 'pdf' | 'unsupported' => {
      const lower = url.toLowerCase();
      if (lower.endsWith('.pdf')) return 'pdf';
      if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.gif') || lower.endsWith('.webp')) return 'image';
      return 'unsupported';
  }

  // Workflow Handlers
  const [showOfferingForm, setShowOfferingForm] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Custom Confirmation Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'success' | 'info';
  } | null>(null);

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'danger' | 'success' | 'info' = 'info',
    confirmText = 'Ya',
    cancelText = 'Batal'
  ) => {
    setConfirmConfig({ title, message, onConfirm, type, confirmText, cancelText });
  };

  // Workflow Handlers

  const handleInviteInterview = async () => {
    if (!interviewDate) return alert('Mohon isi tanggal dan waktu interview');
    if (interviewType === 'online' && !interviewLink) return alert('Mohon isi link video interview online');
    if (interviewType === 'offline' && (!interviewLocName || !interviewAddress || !interviewPic)) {
        return alert('Mohon lengkapi nama lokasi, alamat lengkap dan PIC interview offline');
    }

    setLoadingAction(true);
    try {
        const detail = interviewType === 'online' 
            ? { link: interviewLink } 
            : { locName: interviewLocName, address: interviewAddress, pic: interviewPic };
        
        await sendInterviewNotification(employee, interviewDate, interviewType, detail);
        
        onStatusUpdate(employee.id, 'INTERVIEW', notes, interviewDate, {
            interviewType,
            interviewLink: interviewType === 'online' ? interviewLink : '',
            interviewLocName: interviewType === 'offline' ? interviewLocName : '',
            interviewAddress: interviewType === 'offline' ? interviewAddress : '',
            interviewPic: interviewType === 'offline' ? interviewPic : '',
            interviewLocation: interviewType === 'online' ? 'Online Interview' : `${interviewLocName} (${interviewAddress})`
        });
    } catch (err) {
        console.error("Gagal mengirim undangan:", err);
    } finally {
        setLoadingAction(false);
    }
  };

  const handleInterviewResult = (passed: boolean) => {
    triggerConfirm(
        passed ? "Loloskan Interview" : "Tolak Kandidat",
        passed ? "Apakah Anda yakin ingin meloloskan kandidat ke tahap Offering?" : "Apakah Anda yakin ingin menolak kandidat ini?",
        async () => {
            setLoadingAction(true);
            try {
                if (passed) {
                    onStatusUpdate(employee.id, 'OFFERING', notes + '\n[System] Lolos Interview.');
                    sendPassedInterviewNotification(employee).catch(err => console.error("Passed notification error:", err));
                } else {
                    onStatusUpdate(employee.id, 'REJECTED', notes + '\n[System] Tidak Lolos Interview.');
                    sendRejectionNotification(employee).catch(err => console.error("Rejection notification error:", err));
                }
            } catch (err) {
                console.error("Gagal memproses hasil interview:", err);
            } finally {
                setLoadingAction(false);
            }
        },
        passed ? 'success' : 'danger',
        passed ? 'Loloskan' : 'Tolak'
    );
  };

  const handleSendOffering = async (offerData: OfferingDetails) => {
      setShowOfferingForm(false);
      setLoadingAction(true);
      onStatusUpdate(employee.id, 'OFFERING', notes, undefined, { offeringData: offerData });
      sendOfferingLetter(employee, offerData).catch(err => console.error("Offering Letter error:", err));
      setLoadingAction(false);
  };

  const handleAcceptOffer = () => {
     triggerConfirm(
         "Konfirmasi Persetujuan",
         "Apakah kandidat telah secara resmi menyetujui dokumen Offering Letter?",
         async () => {
             const updatedOffer = { ...employee.offeringData!, status: 'ACCEPTED' as const };
             onStatusUpdate(employee.id, 'HIRED', notes + '\n[System] Kandidat Menerima Offering.', undefined, { offeringData: updatedOffer });
             sendHiredNotification(employee).catch(err => console.error("Hired notification error:", err));
         },
         'success',
         'Setujui'
     );
  };

  const handleRejectOffer = () => {
       triggerConfirm(
           "Konfirmasi Penolakan",
           "Apakah kandidat menolak surat penawaran kerja (Offering Letter) ini?",
           () => {
               const updatedOffer = { ...employee.offeringData!, status: 'DECLINED' as const };
               onStatusUpdate(employee.id, 'REJECTED', notes + '\n[System] Kandidat Menolak Offering.', undefined, { offeringData: updatedOffer });
           },
           'danger',
           'Ya, Tolak'
       );
  };

  const handleSendContract = async (file?: File) => {
      if (!file) return alert("Upload dokumen kontrak dulu!");
      setLoadingAction(true);
      const path = await uploadFileMock(file);
      onStatusUpdate(employee.id, 'CONTRACT', notes, undefined, { contractDocPath: path });
      sendContractDocument(employee, path).catch(err => console.error("Contract document error:", err));
      setLoadingAction(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col relative">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
                  {employee.photoPath ? <img src={employee.photoPath} alt="Foto" className="h-full w-full object-cover"/> : <UserIcon className="h-8 w-8" />}
              </div>
              <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">{employee.fullName} <StatusBadge status={employee.status} /></h2>
                  <p className="text-sm text-gray-500">{employee.positionApplied} - {employee.nik}</p>
              </div>
          </div>
          <button onClick={onClose} className="text-3xl text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        
        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Workflow Actions */}
            <div className="space-y-6 md:col-span-1 border-r pr-6">
                
                {/* 1. APPLIED / SCREENING ACTION */}
                {(employee.status === 'APPLIED' || employee.status === 'SCREENING') && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
                        <h3 className="font-bold text-sm text-blue-900 border-b border-blue-100 pb-1">Jadwalkan Interview</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Tanggal & Waktu</label>
                                <input type="datetime-local" className="w-full border rounded p-2 text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} />
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Metode Wawancara</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setInterviewType('online')} 
                                        className={`py-1.5 px-3 rounded text-xs font-bold transition-all border ${interviewType === 'online' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-250'}`}
                                    >
                                        🖥️ Online
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setInterviewType('offline')} 
                                        className={`py-1.5 px-3 rounded text-xs font-bold transition-all border ${interviewType === 'offline' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-250'}`}
                                    >
                                        🏢 Offline
                                    </button>
                                </div>
                            </div>

                            {interviewType === 'online' ? (
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Link Interview (Virtual Meeting)</label>
                                    <input 
                                        type="text" 
                                        className="w-full border rounded p-2 text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500" 
                                        placeholder="cth: https://meet.google.com/abc-defg-hij" 
                                        value={interviewLink} 
                                        onChange={e => setInterviewLink(e.target.value)} 
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Lokasi</label>
                                        <input 
                                            type="text" 
                                            className="w-full border rounded p-2 text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500" 
                                            placeholder="cth: Kantor Cabang PT Perdana" 
                                            value={interviewLocName} 
                                            onChange={e => setInterviewLocName(e.target.value)} 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Alamat Lengkap</label>
                                        <textarea 
                                            rows={2}
                                            className="w-full border rounded p-2 text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500" 
                                            placeholder="cth: Jl. Jenderal Sudirman No. 123, Palu" 
                                            value={interviewAddress} 
                                            onChange={e => setInterviewAddress(e.target.value)} 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama PIC</label>
                                        <input 
                                            type="text" 
                                            className="w-full border rounded p-2 text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500" 
                                            placeholder="cth: Bpk. Budiman (HR)" 
                                            value={interviewPic} 
                                            onChange={e => setInterviewPic(e.target.value)} 
                                        />
                                    </div>
                                </div>
                            )}

                            <button onClick={handleInviteInterview} disabled={loadingAction} className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 flex justify-center items-center gap-2 mt-2 transition font-semibold active:scale-95">
                                <EnvelopeIcon className="h-4 w-4"/> Kirim Undangan WA
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. INTERVIEW RESULT ACTION */}
                {employee.status === 'INTERVIEW' && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 space-y-3">
                        <h3 className="font-bold text-purple-900 border-b border-purple-200 pb-1">Hasil & Detail Interview</h3>
                        <div className="text-xs space-y-1.5 text-slate-700 bg-white p-2.5 rounded border border-purple-200 leading-snug">
                            <div><span className="font-bold text-slate-500">Waktu:</span> {employee.interviewDate ? new Date(employee.interviewDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</div>
                            <div><span className="font-bold text-slate-500">Metode:</span> {employee.interviewType === 'online' ? '🔴 Online' : '🏢 Offline'}</div>
                            
                            {employee.interviewType === 'online' ? (
                                <div>
                                    <span className="font-bold text-slate-500 block">Link Wawancara:</span>
                                    <a href={employee.interviewLink} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline font-semibold break-all">{employee.interviewLink || '-'}</a>
                                </div>
                            ) : (
                                <div className="space-y-1 pt-1 border-t border-slate-100">
                                    <div><span className="font-semibold text-slate-500">Lokasi:</span> {employee.interviewLocName || '-'}</div>
                                    <div><span className="font-semibold text-slate-500">Alamat:</span> {employee.interviewAddress || '-'}</div>
                                    <div><span className="font-semibold text-slate-500">PIC:</span> {employee.interviewPic || '-'}</div>
                                </div>
                            )}
                        </div>
                        
                        {employee.aiInterview && (
                             <div className="bg-white p-2.5 rounded border border-purple-200">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-xs text-purple-700 flex items-center gap-1"><VideoCameraIcon className="h-3 w-3"/> AI Video Interview</span>
                                    <span className="text-xs font-bold bg-purple-100 px-1 rounded">{employee.aiInterview.overallScore}/100</span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 italic">"{employee.aiInterview.summary}"</p>
                             </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <button onClick={() => handleInterviewResult(true)} disabled={loadingAction} className="bg-green-600 text-white py-2 rounded text-xs font-bold hover:bg-green-700 transition active:scale-95 shadow-sm">Lolos (Next stage)</button>
                            <button onClick={() => handleInterviewResult(false)} disabled={loadingAction} className="bg-red-600 text-white py-2 rounded text-xs font-bold hover:bg-red-700 transition active:scale-95 shadow-sm">Gagal (Tolak)</button>
                        </div>
                    </div>
                )}

                {/* 3. OFFERING ACTION */}
                {employee.status === 'OFFERING' && !employee.offeringData && (
                     <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                        <h3 className="font-bold mb-3 text-orange-900">Offering Letter</h3>
                        <button onClick={() => setShowOfferingForm(true)} disabled={loadingAction} className="w-full bg-orange-600 text-white py-2 rounded text-sm hover:bg-orange-700 flex justify-center gap-2">
                             <DocumentTextIcon className="h-4 w-4"/> Buat Penawaran
                        </button>
                    </div>
                )}

                {/* 3b. OFFERING CONFIRMATION */}
                {employee.status === 'OFFERING' && employee.offeringData && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                         <h3 className="font-bold mb-2 text-yellow-900">Menunggu Konfirmasi</h3>
                         <p className="text-xs mb-3">Offering sent: {new Date(employee.offeringData.sentAt).toLocaleDateString()}</p>
                         <div className="space-y-2">
                            <button onClick={handleAcceptOffer} className="w-full bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700">Kandidat Menerima</button>
                            <button onClick={handleRejectOffer} className="w-full border border-red-300 text-red-700 py-2 rounded text-sm hover:bg-red-50">Kandidat Menolak</button>
                         </div>
                    </div>
                )}

                {/* 4. HIRED / CONTRACT ACTION */}
                {(employee.status === 'HIRED' || employee.status === 'CONTRACT') && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100 space-y-4">
                        <div>
                             <h3 className="font-bold mb-1 text-green-900 flex items-center gap-2"><BriefcaseIcon className="h-5 w-5"/> Karyawan Aktif</h3>
                             <p className="text-xs text-green-700">Mulai: {employee.offeringData?.startDate}</p>
                        </div>
                        
                        <div className="border-t border-green-200 pt-3">
                            <h4 className="font-bold text-sm mb-2">Kontrak Kerja (PKWT)</h4>
                            {employee.contractDocPath ? (
                                <a href={employee.contractDocPath} target="_blank" className="flex items-center text-sm text-blue-600 hover:underline mb-2"><ArrowDownTrayIcon className="h-4 w-4 mr-1"/> Lihat Kontrak</a>
                            ) : (
                                <div className="space-y-2">
                                    <input type="file" onChange={e => handleSendContract(e.target.files?.[0] || undefined)} className="text-xs w-full" />
                                </div>
                            )}
                        </div>

                        {/* Additional Fast Action buttons for Active Employees */}
                        <div className="border-t border-green-200 pt-3.5 space-y-2">
                            <h4 className="font-bold text-[10px] uppercase text-green-800 tracking-wider">Tindakan Karir Staff</h4>
                            <button
                                type="button"
                                onClick={() => {
                                    alert(`Slip Gaji periode ini berhasil disimpan!\n\nNama: ${employee.fullName}\nEmail target: ${employee.email}\nGaji Pokok: Rp ${new Intl.NumberFormat('id-ID').format(Number(employee.offeringData?.salary || 4800000))}\nTunjangan: Rp ${new Intl.NumberFormat('id-ID').format(Number(employee.offeringData?.allowance || 500000))}`);
                                }}
                                className="w-full bg-white hover:bg-slate-100 text-slate-700 font-bold py-1.5 px-3 rounded text-[11px] border border-slate-200 shadow-xs transition text-left flex items-center gap-1.5"
                            >
                                💵 Kirim Slip Gaji (Payroll)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const reason = prompt("Silakan masukkan alasan Surat Peringatan (SP):", "Sering mematikan GPS saat jam kerja lapang / site");
                                    if(reason) {
                                        alert(`Surat Peringatan Resmi (SP-1) berhasil dikirim via WA Karyawan ke ${employee.whatsappNumber}!\n\nAlasan: ${reason}`);
                                    }
                                }}
                                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-1.5 px-3 rounded text-[11px] border border-rose-200 shadow-xs transition text-left flex items-center gap-1.5"
                            >
                                ⚠️ Ambil Tindakan Disiplin (SP)
                            </button>
                        </div>
                    </div>
                )}

                {/* Constant WhatsApp Communication Hub for Candidate/Workers */}
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 mt-4 space-y-2">
                    <h4 className="font-bold text-xs text-emerald-900 flex items-center gap-1">💬 Komunikasi Alih Daya</h4>
                    <p className="text-[10px] text-emerald-600 leading-snug">Simulasikan pengiriman notifikasi/pengumuman status langsung ke WA Kandidat.</p>
                    <button
                        type="button"
                        onClick={() => {
                            alert(`Notifikasi Whatsapp berhasil disimulasikan!\n\nTujuan: ${employee.fullName} (${employee.whatsappNumber})\nPesan: Informasi kelanjutan rekrutmen PT Perdana Adi Yuda untuk posisi ${employee.positionApplied} telah kami publikasikan.`);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-2 rounded text-xs flex justify-center items-center gap-1.5 transition active:scale-95"
                    >
                        Kirim Notifikasi WA
                    </button>
                </div>

                {/* Administrative Quick Actions (Reject and Delete) */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4 space-y-2.5">
                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1">⚙️ Tindakan Administrasi</h4>
                    <div className="flex flex-col gap-2">
                        {employee.status !== 'REJECTED' && (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (confirm("Apakah Anda yakin ingin MENOLAK kandidat ini? Sesi whatsapp penolakan akan disiapkan secara otomatis.")) {
                                        setLoadingAction(true);
                                        try {
                                            onStatusUpdate(employee.id, 'REJECTED', notes + '\n[System] Ditolak oleh HR.');
                                            sendRejectionNotification(employee).catch(e => console.error(e));
                                        } catch (e) {
                                            console.error(e);
                                        } finally {
                                            setLoadingAction(false);
                                        }
                                    }
                                }}
                                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold py-2 px-3 rounded-lg border border-rose-200 text-xs flex items-center justify-center gap-1.5 transition active:scale-95 duration-100 cursor-pointer"
                            >
                                <XCircleIcon className="h-4 w-4 text-rose-500" /> Tolak Pelamar (Reject)
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                if (onDelete) {
                                    onDelete(employee.id);
                                } else {
                                    alert("Handler penghapusan tidak ditemukan.");
                                }
                            }}
                            className="w-full bg-white hover:bg-slate-100 text-slate-700 font-extrabold py-2 px-3 rounded-lg border border-slate-300 text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 duration-100 cursor-pointer"
                        >
                            <TrashIcon className="h-4 w-4 text-slate-500" /> Hapus Pelamar (Delete)
                        </button>
                    </div>
                </div>

                {/* 5. REJECTED */}
                {employee.status === 'REJECTED' && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-center gap-2 text-red-700 mt-4">
                        <XCircleIcon className="h-6 w-6"/>
                        <span className="font-bold text-sm">Kandidat Tidak Lolos</span>
                    </div>
                )}

                <div className="mt-6 pt-6 border-t">
                    <h4 className="font-bold text-gray-700 mb-2">Catatan HR</h4>
                    <textarea 
                        className="w-full border rounded p-2 text-sm h-32" 
                        placeholder="Tulis catatan internal..." 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)}
                        onBlur={() => onStatusUpdate(employee.id, employee.status, notes)} 
                    />
                </div>
                
                {analysis && (
                    <div className="mt-6 bg-gray-50 p-4 rounded border">
                         <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-xs uppercase text-gray-500">AI Match Score</span>
                            <ScoreBadge score={analysis.score} />
                        </div>
                        <ul className="text-xs space-y-1 text-gray-600">{analysis.matches.slice(0,3).map((m, i) => <li key={i}>• {m}</li>)}</ul>
                    </div>
                )}
            </div>

            {/* Right Column: Details */}
            <div className="md:col-span-2 space-y-6">
                 {/* Detail Cards Grid */}
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                         <h3 className="font-bold border-b pb-2 mb-2">Info Pribadi</h3>
                         <div className="text-sm space-y-2">
                             <DetailRow label="Email" value={employee.email} />
                             <DetailRow label="No WA" value={employee.whatsappNumber} />
                             <DetailRow label="Gender" value={employee.gender} />
                             <DetailRow label="Usia" value={`${new Date().getFullYear() - new Date(employee.dateOfBirth).getFullYear()} Tahun`} />
                             <DetailRow label="Domisili" value={employee.domicileAddress} />
                         </div>
                    </div>
                    <div>
                        <h3 className="font-bold border-b pb-2 mb-2">Pendidikan & Skill</h3>
                         <div className="text-sm space-y-2">
                             <DetailRow label="Pendidikan" value={employee.lastEducation} />
                             <DetailRow label="Institusi" value={employee.institutionName} />
                             <DetailRow label="Jurusan" value={employee.major} />
                             <div className="mt-2">
                                <span className="text-gray-500 text-xs block mb-1">Skills:</span>
                                <div className="flex flex-wrap gap-1">
                                    {(() => {
                                        if (!employee.skills) return null;
                                        const arr = Array.isArray(employee.skills) 
                                            ? employee.skills 
                                            : typeof employee.skills === 'string'
                                                ? employee.skills.split(',')
                                                : [];
                                        return arr.map((s: any, i: number) => (
                                            <span key={i} className="bg-gray-100 px-2 py-0.5 rounded text-xs border">
                                                {typeof s === 'string' ? s.trim() : String(s)}
                                             </span>
                                        ));
                                    })()}
                                </div>
                             </div>
                         </div>
                    </div>
                 </div>
                 
                 {/* AI Interview Results Panel (New) */}
                 {employee.aiInterview && (
                     <div className="bg-indigo-50 border border-indigo-200 rounded p-4">
                        <h3 className="font-bold text-indigo-900 mb-2 border-b border-indigo-200 pb-1 flex justify-between">
                            <span>Laporan Video Interview (Metode STAR)</span>
                            <span className="text-xs bg-indigo-200 px-2 py-0.5 rounded">{employee.aiInterview.durationSeconds}s</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-3">
                             <div>
                                 <strong className="block text-indigo-700">Situation</strong>
                                 <p className="text-gray-600 italic bg-white p-2 rounded mt-1 border border-indigo-100">{employee.aiInterview.starAnalysis.situation}</p>
                             </div>
                             <div>
                                 <strong className="block text-indigo-700">Task</strong>
                                 <p className="text-gray-600 italic bg-white p-2 rounded mt-1 border border-indigo-100">{employee.aiInterview.starAnalysis.task}</p>
                             </div>
                             <div>
                                 <strong className="block text-indigo-700">Action</strong>
                                 <p className="text-gray-600 italic bg-white p-2 rounded mt-1 border border-indigo-100">{employee.aiInterview.starAnalysis.action}</p>
                             </div>
                             <div>
                                 <strong className="block text-indigo-700">Result</strong>
                                 <p className="text-gray-600 italic bg-white p-2 rounded mt-1 border border-indigo-100">{employee.aiInterview.starAnalysis.result}</p>
                             </div>
                        </div>
                        <div className="mt-3 text-right">
                             <button className="text-indigo-600 text-xs font-bold hover:underline flex items-center justify-end gap-1 ml-auto">
                                <VideoCameraIcon className="h-4 w-4"/> Tonton Rekaman
                             </button>
                        </div>
                     </div>
                 )}

                 {/* Scheduled Interview Details Section (Online has link, Offline has locName, address, pic) */}
                 {employee.interviewType && (
                     <div className="bg-purple-50/60 border border-purple-200 rounded p-4 space-y-3">
                         <h3 className="font-bold text-purple-900 border-b border-purple-200 pb-1 flex items-center gap-1.5 text-sm uppercase tracking-wide">
                             🗓️ Detail Jadwal Interview
                         </h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed">
                             <DetailRow label="Tanggal & Waktu" value={employee.interviewDate ? new Date(employee.interviewDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'} />
                             <DetailRow label="Tipe / Metode" value={employee.interviewType === 'online' ? '🔴 Online (Video Session)' : '🏢 Offline (Tatap Muka)'} />
                             {employee.interviewType === 'online' ? (
                                 <div className="sm:col-span-2 bg-white p-2.5 rounded border border-purple-100">
                                     <span className="text-purple-600 font-bold block mb-0.5">Link Interview:</span>
                                     <a href={employee.interviewLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold break-all text-xs">{employee.interviewLink || '-'}</a>
                                 </div>
                             ) : (
                                 <div className="sm:col-span-2 bg-white p-2.5 rounded border border-purple-100 space-y-1.5">
                                     <div><span className="text-purple-600 font-bold">Nama Lokasi:</span> <span className="font-medium text-slate-800">{employee.interviewLocName || '-'}</span></div>
                                     <div><span className="text-purple-600 font-bold block">Alamat Lengkap:</span> <span className="font-medium text-slate-800 leading-snug block mt-0.5">{employee.interviewAddress || '-'}</span></div>
                                     <div><span className="text-purple-600 font-bold">Interviewer PIC:</span> <span className="font-medium text-slate-800">{employee.interviewPic || '-'}</span></div>
                                 </div>
                             )}
                         </div>
                     </div>
                 )}

                 {/* Experience */}
                 <div>
                    <h3 className="font-bold border-b pb-2 mb-2">Pengalaman Kerja</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded">{employee.workExperience}</p>
                 </div>

                 {/* Offering Details (If exists) */}
                 {employee.offeringData && (
                     <div className="bg-green-50 border border-green-200 rounded p-4">
                         <h3 className="font-bold text-green-800 mb-2 border-b border-green-200 pb-1">Detail Kontrak & Offering</h3>
                         <div className="grid grid-cols-2 gap-4 text-sm">
                             <DetailRow label="Gaji" value={new Intl.NumberFormat('id-ID').format(Number(employee.offeringData.salary))} />
                             <DetailRow label="Tunjangan" value={new Intl.NumberFormat('id-ID').format(Number(employee.offeringData.allowance))} />
                             <DetailRow label="Durasi" value={employee.offeringData.contractDuration} />
                             <DetailRow label="Mulai" value={employee.offeringData.startDate} />
                             <DetailRow label="Lokasi" value={employee.offeringData.placementLocation} />
                             <DetailRow label="PIC Client" value={employee.offeringData.picClient} />
                         </div>
                     </div>
                 )}

                 {/* Documents */}
                 <div>
                     <h3 className="font-bold border-b pb-2 mb-3">Dokumen Lampiran</h3>
                     <div className="grid grid-cols-3 gap-3">
                        <DocButton label="CV / Resume" url={employee.cvPath} onPreview={() => setPreviewInfo({url: employee.cvPath!, type: getFileType(employee.cvPath!)})} />
                        <DocButton label="KTP" url={employee.ktpPath} onPreview={() => setPreviewInfo({url: employee.ktpPath!, type: getFileType(employee.ktpPath!)})} />
                        <DocButton label="Ijazah" url={employee.diplomaPath} onPreview={() => setPreviewInfo({url: employee.diplomaPath!, type: getFileType(employee.diplomaPath!)})} />
                        <DocButton label="Kartu Keluarga" url={employee.kkPath} onPreview={() => setPreviewInfo({url: employee.kkPath!, type: getFileType(employee.kkPath!)})} />
                        <DocButton label="Surat Lamaran" url={employee.applicationLetterPath} onPreview={() => setPreviewInfo({url: employee.applicationLetterPath!, type: getFileType(employee.applicationLetterPath!)})} />
                        <DocButton label="Foto" url={employee.photoPath} onPreview={() => setPreviewInfo({url: employee.photoPath!, type: getFileType(employee.photoPath!)})} />
                     </div>
                 </div>
            </div>
        </div>

        {/* Action Loading Overlay */}
        {loadingAction && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-20">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600 mb-2"></div>
                    <p className="font-bold text-blue-600">Memproses & Mengirim Notifikasi...</p>
                </div>
            </div>
        )}

        {/* Document Previewer */}
        {previewInfo && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b">
                        <h4 className="font-bold">Preview Dokumen</h4>
                        <div className="flex items-center gap-3">
                            <a href={previewInfo.url} download target="_blank" rel="noopener noreferrer" className="text-xs font-black text-blue-600 hover:text-blue-800 underline">
                                Download
                            </a>
                            <button onClick={() => setPreviewInfo(null)} className="text-2xl hover:text-red-500">&times;</button>
                        </div>
                    </div>
                    <div className="flex-grow overflow-auto p-2 bg-gray-100 flex items-center justify-center">
                        {previewInfo.type === 'image' ? (
                            <img src={previewInfo.url} alt="Document Preview" className="max-w-full mx-auto" />
                        ) : previewInfo.type === 'pdf' ? (
                            <iframe src={previewInfo.url} title="PDF Preview" className="w-full h-[70vh]" />
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-gray-600 mb-4">Format file tidak mendukung preview langsung.</p>
                                <a href={previewInfo.url} download target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded font-bold">
                                    Unduh File
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Offering Modal Form */}
        {showOfferingForm && (
            <OfferingModal 
                onSave={handleSendOffering} 
                onCancel={() => setShowOfferingForm(false)} 
            />
        )}

        {/* Custom Confirmation Dialog Overlay */}
        {confirmConfig && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-100 animate-fadeIn">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                            confirmConfig.type === 'danger' ? 'bg-rose-50 text-rose-600' :
                            confirmConfig.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-blue-50 text-blue-600'
                        }`}>
                            {confirmConfig.type === 'danger' ? <XCircleIcon className="h-6 w-6"/> :
                             confirmConfig.type === 'success' ? <CheckCircleIcon className="h-6 w-6"/> :
                             <UserIcon className="h-6 w-6"/>}
                        </div>
                        <h3 className="font-extrabold text-base text-slate-800">{confirmConfig.title}</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        {confirmConfig.message}
                    </p>
                    <div className="flex justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={() => setConfirmConfig(null)}
                            className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded text-slate-600 transition"
                        >
                            {confirmConfig.cancelText || 'Batal'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                confirmConfig.onConfirm();
                                setConfirmConfig(null);
                            }}
                            className={`px-3.5 py-1.5 text-xs font-extrabold text-white rounded transition ${
                                confirmConfig.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800' :
                                confirmConfig.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800' :
                                'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                            }`}
                        >
                            {confirmConfig.confirmText || 'Konfirmasi'}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

const DetailRow = ({label, value}: {label:string, value: string}) => (
    <div className="flex">
        <span className="text-gray-500 w-24 flex-shrink-0">{label}:</span>
        <span className="font-medium text-gray-900">{value || '-'}</span>
    </div>
);

const DocButton = ({label, url, onPreview}: {label:string, url?: string, onPreview: () => void}) => {
    if (!url) return null;
    return (
        <button type="button" onClick={onPreview} className="flex items-center w-full p-3 border rounded hover:bg-gray-50 transition text-sm text-blue-600 text-left">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400"/> {label}
        </button>
    )
}
