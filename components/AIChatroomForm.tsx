import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Phone, 
  GraduationCap, 
  Paperclip,
  ChevronLeft,
  MapPin,
  ArrowRight,
  Trash2,
  Inbox,
  Sparkles
} from 'lucide-react';
import { uploadFileMock } from '../services/db';
import { useJobs, createCandidate } from '../hooks/useDbQueries';
import { getCurrentUser, updateUserProfile } from '../services/auth';
import { sendTelegramMessage } from '../services/telegram';
import { NewEmployee, JobVacancy } from '../types';
import { extractFieldsFromChat, isReadyForPreview } from '../lib/sara-chat-extract';
import { findJsonInText } from '../lib/candidate-payload';
import { MarketingPageShell } from './layout/MarketingPageLayout';
import { SaraChatPanel } from './recruitment/SaraChatPanel';
import { SaraLiveDataSync, computeSyncProgress } from './recruitment/SaraLiveDataSync';
import { ApplySuccessPage, type ApplySuccessData } from './recruitment/recruitmentUi';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

export interface AIChatroomFormProps {
  initialPosition?: string;
  initialJobId?: string;
  onSwitchToManual?: () => void;
}

export const AIChatroomForm: React.FC<AIChatroomFormProps> = ({
  initialPosition = '',
  initialJobId = '',
  onSwitchToManual,
}) => {
  const navigate = useNavigate();
  const welcomeMessage = initialPosition
    ? `Hai! 👋 Aku Sara dari PT Perdana Adi Yuda. Kamu mau lamar *${initialPosition}*, ya? Kita isi formulirnya sambil ngobrol aja — santai.\n\nBoleh kenalan? Nama lengkap kamu siapa?`
    : 'Hai! 👋 Aku Sara dari PT Perdana Adi Yuda. Kita isi lamaran sambil ngobrol ya, gampang kok.\n\nKamu mau lamar posisi apa? Sekalian nama lengkapnya boleh~';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const { data: jobs = [] } = useJobs({ activeOnly: true });
  
  // Stages: 'chat' | 'preview' | 'documents' | 'success'
  const [formStage, setFormStage] = useState<'chat' | 'preview' | 'documents' | 'success'>('chat');
  
  // Parsed structured data
  const [extractedData, setExtractedData] = useState<Partial<NewEmployee>>({
    ...(initialPosition ? { positionApplied: initialPosition } : {}),
  });

  useEffect(() => {
    if (initialPosition) {
      setExtractedData((prev) => ({
        ...prev,
        positionApplied: prev.positionApplied || initialPosition,
      }));
    }
  }, [initialPosition]);

  // Tahap 4 uploads
  const [files, setFiles] = useState<{
    applicationLetter: File | null;
    cv: File | null;
    ktp: File | null;
    diploma: File | null;
    photo: File | null;
    kk: File | null;
    certificate: File | null;
  }>({
    applicationLetter: null,
    cv: null,
    ktp: null,
    diploma: null,
    photo: null,
    kk: null,
    certificate: null,
  });
  const [uploadProgress, setUploadProgress] = useState(false);

  const [errorText, setErrorText] = useState<string | null>(null);
  const [saraSessionId, setSaraSessionId] = useState<string | null>(null);
  const [syncOpen, setSyncOpen] = useState(false);
  const [successData, setSuccessData] = useState<ApplySuccessData | null>(null);

  const syncPct = useMemo(() => computeSyncProgress(extractedData).pct, [extractedData]);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Live-sync: parse JSON + incremental field extraction from chat turns
  useEffect(() => {
    const fromChat = extractFieldsFromChat(
      messages.map((m) => ({ role: m.role, content: m.content }))
    );

    setExtractedData((prev) => ({
      ...prev,
      ...fromChat,
      positionApplied:
        fromChat.positionApplied ||
        prev.positionApplied ||
        initialPosition ||
        undefined,
    }));

    if (isReadyForPreview(fromChat)) {
      setFormStage('preview');
    }
  }, [messages, initialPosition]);

  const cleanTextOfJson = (text: string): string => {
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const prefix = text.substring(0, startIdx).trim();
      const suffix = text.substring(endIdx + 1).trim();
      return `${prefix}\n\n${suffix}`.trim();
    }
    return text;
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || loadingChat) return;

    setErrorText(null);
    const userMessageContent = inputText.trim();
    setInputText('');

    const newMsg: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: userMessageContent,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setLoadingChat(true);

    try {
      const currentUser = getCurrentUser();
      const payloadMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const requestBody = saraSessionId
        ? {
            sessionId: saraSessionId,
            message: userMessageContent,
            userId: currentUser?.id,
          }
        : {
            messages: payloadMessages,
            userId: currentUser?.id,
          };

      const res = await fetch('/api/recruitment-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Terjadi gangguan koneksi ke AI Recruiter');
      }

      const resData = await res.json();
      const rawReply = resData.reply;

      if (resData.sessionId) {
        setSaraSessionId(resData.sessionId);
      }
      if (resData.candidateData && typeof resData.candidateData === 'object') {
        setExtractedData((prev) => ({
          ...prev,
          ...resData.candidateData,
          positionApplied:
            resData.candidateData.positionApplied ||
            prev.positionApplied ||
            initialPosition ||
            undefined,
        }));
      }

      // Check if this answer completed stage 1-3
      const potentialJson = findJsonInText(rawReply);
      let assistantContent = rawReply;

      if (potentialJson) {
        try {
          const parsed = JSON.parse(potentialJson);
          setExtractedData(prev => ({ ...prev, ...parsed }));
          
          const cleanText = cleanTextOfJson(rawReply);
          assistantContent = cleanText || 'Terima kasih atas kelengkapan datanya! Saya telah memproses seluruh data pendaftaran Anda. Hubungan kerja PT Perdana Adi Yuda selalu mengedepankan akurasi. Silakan tinjau kembali data Anda pada panel review di bawah sebelum mengirimkannya.';
          
          setFormStage('preview');
        } catch (e) {
          // Ignore
        }
      }

      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date()
        }
      ]);

    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Maaf, Sara sedang sibuk. Silakan coba kirim pesan kembali.');
    } finally {
      setLoadingChat(false);
    }
  };

  // Skip chat direct to form preview (Only if they want manual override or previewing)
  const handleForcePreview = () => {
    setFormStage('preview');
  };

  // Handle edit fields manually in preview check panel
  const handleExtractedFieldChange = (key: keyof NewEmployee, value: any) => {
    setExtractedData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFiles(prev => ({
        ...prev,
        [key]: file
      }));
    }
  };

  const triggerFileSelect = (key: string) => {
    fileInputRefs.current[key]?.click();
  };

  // Submit collected stages to Firestore
  const handleSubmitFinalApplicant = async () => {
    setErrorText(null);
    setUploadProgress(true);

    // Mandatories check
    const mandatories = [
      { key: 'fullName', label: 'Nama Lengkap' },
      { key: 'nik', label: 'NIK (16 Digit)' },
      { key: 'kkNumber', label: 'Nomor Kartu Keluarga (KK)' },
      { key: 'whatsappNumber', label: 'Nomor WhatsApp (+62...)' },
      { key: 'email', label: 'Email' },
      { key: 'positionApplied', label: 'Posisi yang Dilamar' },
    ];

    const missing = mandatories.filter(m => !extractedData[m.key as keyof NewEmployee]);
    if (missing.length > 0) {
      setErrorText(`Wajib menyertakan data penting berikut: ${missing.map(m => m.label).join(', ')}. Silakan lengkapi pada formulir di bawah.`);
      setUploadProgress(false);
      return;
    }

    // Tahap 4 files verification
    if (!files.applicationLetter || !files.cv || !files.ktp || !files.photo) {
      setErrorText('Tahap 4 Dokumen: Mohon unggah dokumen utama yang wajib (Surat Lamaran, CV, KTP, dan Foto Diri) sebelum mengirimkan lamaran.');
      setUploadProgress(false);
      return;
    }

    try {
      // 1. Upload simulated files
      const filePaths: Record<string, string> = {};
      for (const [key, fileObj] of Object.entries(files)) {
        if (fileObj) {
          filePaths[`${key}Path`] = await uploadFileMock(fileObj);
        } else {
          filePaths[`${key}Path`] = '';
        }
      }

      // 2. Resolve Country Codes/WA
      let cleanWA = (extractedData.whatsappNumber || '').replace(/[^0-9+]/g, '');
      if (!cleanWA.startsWith('+')) {
        if (cleanWA.startsWith('0')) {
          cleanWA = '+62' + cleanWA.substring(1);
        } else if (cleanWA.startsWith('62')) {
          cleanWA = '+' + cleanWA;
        } else {
          cleanWA = '+62' + cleanWA;
        }
      }

      let cleanEM = (extractedData.emergencyPhone || '').replace(/[^0-9+]/g, '');
      if (cleanEM && !cleanEM.startsWith('+')) {
        if (cleanEM.startsWith('0')) {
          cleanEM = '+62' + cleanEM.substring(1);
        } else if (cleanEM.startsWith('62')) {
          cleanEM = '+' + cleanEM;
        } else {
          cleanEM = '+62' + cleanEM;
        }
      }

      const formattedDomicile = extractedData.domicileAddress || 
        `${extractedData.addressLine || 'Alamat Domisili'}, Desa ${extractedData.desa || '-'}, Kec. ${extractedData.kecamatan || '-'}, ${extractedData.kabupaten || '-'}, ${extractedData.provinsi || '-'}, RT ${extractedData.rt || '0'} RW ${extractedData.rw || '0'}`;

      const finalPayload: NewEmployee = {
        // Fallback default identities
        positionApplied: extractedData.positionApplied || 'Staff Operasional',
        fullName: extractedData.fullName || 'Pelamar AI',
        nik: extractedData.nik || '',
        kkNumber: extractedData.kkNumber || '',
        npwp: extractedData.npwp || '',
        placeOfBirth: extractedData.placeOfBirth || '-',
        dateOfBirth: extractedData.dateOfBirth || new Date().toISOString().split('T')[0],
        gender: extractedData.gender || 'Laki-laki',
        religion: extractedData.religion || 'Islam',
        maritalStatus: extractedData.maritalStatus || 'Belum Menikah',
        willingToRelocate: extractedData.willingToRelocate || '',
        certifications: extractedData.certifications || '',
        
        email: extractedData.email || '',
        whatsappNumber: cleanWA,
        domicileAddress: formattedDomicile,
        latitude: parseFloat(extractedData.latitude as any) || -0.9489, 
        longitude: parseFloat(extractedData.longitude as any) || 119.8707, // Default Map Coordinates (Palu/Central)
        
        telegramId: extractedData.telegramId || '',
        facebook: extractedData.facebook || '',
        instagram: extractedData.instagram || '',
        twitter: extractedData.twitter || '',
        linkedin: extractedData.linkedin || '',

        lastEducation: extractedData.lastEducation || '-',
        institutionName: extractedData.institutionName || '-',
        major: extractedData.major || '-',
        graduationYear: Number(extractedData.graduationYear) || new Date().getFullYear(),
        skills: extractedData.skills || '',
        workExperience: extractedData.workExperience || '-',

        bankName: extractedData.bankName || '-',
        accountNumber: extractedData.accountNumber || '-',

        emergencyName: extractedData.emergencyName || '-',
        emergencyRelation: extractedData.emergencyRelation || '-',
        emergencyPhone: cleanEM || '-',

        // Asset uploaded paths
        applicationLetterPath: filePaths['applicationLetterPath'] || '',
        cvPath: filePaths['cvPath'] || '',
        ktpPath: filePaths['ktpPath'] || '',
        diplomaPath: filePaths['diplomaPath'] || '',
        photoPath: filePaths['photoPath'] || '',
        kkPath: filePaths['kkPath'] || '',
        certificatePath: filePaths['certificatePath'] || '',
        jobId: initialJobId || undefined,
      };

      const result = await createCandidate(finalPayload, 'ai-sara');
      const currentUser = getCurrentUser();
      if (currentUser) {
        updateUserProfile(finalPayload);
      }
      
      // Dispatch Telegram update if they supplied contact
      if (finalPayload.telegramId) {
        await sendTelegramMessage(finalPayload.telegramId, `🔴 *Pendaftaran Baru via AI Chatroom*\n\nSelamat ${finalPayload.fullName}!\nLamaran Anda sebagai *${finalPayload.positionApplied}* berhasil kami rekam di database PT Perdana Adi Yuda.\n\n_Asisten Sara_`);
      }

      setSuccessData({
        fullName: finalPayload.fullName || '',
        position: finalPayload.positionApplied,
        nik: finalPayload.nik,
        email: finalPayload.email,
        whatsapp: finalPayload.whatsappNumber,
        referenceId: result.id,
      });
      setFormStage('success');
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Gagal menyimpan dan mendaftarkan berkas lamaran Anda.');
    } finally {
      setUploadProgress(false);
    }
  };

  // Helper lists for dynamic select rendering
  const genderOptions = ['Laki-laki', 'Perempuan'];
  const religionOptions = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu', 'Lainnya'];
  const maritalOptions = ['Belum Menikah', 'Menikah', 'Cerai Hidup', 'Cerai Mati'];
  const relocateOptions = ['Ya', 'Tidak'];

  const handleCloseChat = () => {
    if (onSwitchToManual) onSwitchToManual();
    else navigate(-1);
  };

  if (formStage === 'success' && successData) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans antialiased">
        <MarketingPageShell className="px-6 pb-10 pt-6 sm:px-6 sm:py-8">
          <ApplySuccessPage
            data={successData}
            onViewStatus={() => navigate('/portal')}
            onApplyOther={() => navigate('/vacancies')}
            onGoHome={() => navigate('/')}
          />
        </MarketingPageShell>
      </div>
    );
  }

  return (
    <div
      className={
        formStage === 'chat'
          ? 'fixed inset-0 z-50 flex flex-col bg-slate-100 md:static md:z-auto md:mx-auto md:h-auto md:max-w-7xl md:px-4 md:py-6'
          : 'mx-auto w-full max-w-7xl px-4 py-8'
      }
    >
      {/* Visual Header — desktop chat keeps compact bar; hidden on mobile immersive chat */}
      <div
        className={`mb-4 flex-col items-center justify-between border-b border-gray-200 pb-4 md:mb-6 md:flex md:flex-row ${
          formStage === 'chat' ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-blue-600 animate-pulse" />
            AI Smart Recruitment Room
          </h1>
          <p className="text-gray-500 text-sm mt-1">PT Perdana Adi Yuda — Virtual Career Guide</p>
        </div>
        
        {formStage === 'chat' && (
          <div className="flex flex-wrap gap-2">
            {onSwitchToManual && (
              <button
                type="button"
                onClick={onSwitchToManual}
                className="rounded-xl border border-[#003087]/25 px-4 py-2 text-sm font-semibold text-[#003087] transition hover:bg-blue-50 active:scale-95"
              >
                Form Manual
              </button>
            )}
            <button
              type="button"
              onClick={handleForcePreview}
              className="rounded-xl border border-[#003087] px-4 py-2 text-sm font-semibold text-[#003087] transition hover:bg-blue-50 active:scale-95"
              id="btn_manual_review"
            >
              Tinjau Data
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        
        {/* CHAT — full-height immersive layout */}
        {formStage === 'chat' && (
          <motion.div
            key="chat-room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-0 flex-1 flex-col md:grid md:h-[calc(100dvh-10rem)] md:grid-cols-[minmax(0,1fr)_240px] md:gap-4 lg:grid-cols-[minmax(0,1fr)_260px]"
            id="section_chatroom"
          >
            <div className="flex min-h-0 flex-1 flex-col">
              <SaraChatPanel
                className="min-h-0 flex-1"
                messages={messages}
                loadingChat={loadingChat}
                errorText={errorText}
                inputText={inputText}
                onInputChange={setInputText}
                onSubmit={handleSendMessage}
                positionHint={initialPosition || extractedData.positionApplied}
                onClose={handleCloseChat}
                onToggleSync={() => setSyncOpen((v) => !v)}
                syncOpen={syncOpen}
                syncPct={syncPct}
                syncDrawer={
                  <SaraLiveDataSync
                    variant="drawer"
                    data={extractedData}
                    onEdit={handleForcePreview}
                  />
                }
              />
            </div>

            <aside className="hidden min-h-0 md:block">
              <div className="sticky top-0">
                <SaraLiveDataSync
                  variant="sidebar"
                  data={extractedData}
                  onEdit={handleForcePreview}
                  defaultExpanded
                />
              </div>
            </aside>
          </motion.div>
        )}

        {/* PREVIEW AND SELECTION REVIEW TABLE */}
        {formStage === 'preview' && (
          <motion.div 
            key="preview-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden p-6 md:p-8"
            id="section_preview_verify"
          >
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-4 border-b">
              <div>
                <span className="text-xs uppercase bg-blue-50 text-blue-800 font-bold px-3 py-1.5 rounded-full border border-blue-150">
                  Konfirmasi Akhir Data Rekrutmen
                </span>
                <p className="text-gray-500 text-xs mt-2">
                  Sebelum kita beralih ke Tahap 4 (Dokumen Unggahan), mohon baca dan pastikan data transkrip obrolan Anda yang telah diekstrak oleh Sara sudah benar. Anda juga dapat menyesuaikan isian jika terdapat kesalahan ketik!
                </p>
              </div>
              <button 
                onClick={() => setFormStage('chat')} 
                className="mt-4 md:mt-0 px-4 py-2 text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 font-semibold rounded-xl flex items-center gap-1"
              >
                ← Kembali ke Chat
              </button>
            </div>

            {errorText && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700 text-xs font-sans rounded">
                {errorText}
              </div>
            )}

            <div className="space-y-8">
              
              {/* TAHAP 1: IDENTITAS */}
              <div>
                <h4 className="font-extrabold text-blue-900 text-sm tracking-wider uppercase mb-4 border-b pb-1">
                  M-I. TAHAP 1 (IDENTITAS DIRI)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Posisi yang Dilamar *</label>
                    <select
                      value={extractedData.positionApplied || ''}
                      onChange={(e) => handleExtractedFieldChange('positionApplied', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-sans focus:outline-none focus:bg-white"
                    >
                      <option value="">Pilih Posisi...</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={j.title}>{j.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nama Lengkap *</label>
                    <input 
                      type="text"
                      value={extractedData.fullName || ''}
                      onChange={(e) => handleExtractedFieldChange('fullName', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nomor Induk Kependudukan (NIK) *</label>
                    <input 
                      type="text"
                      maxLength={16}
                      value={extractedData.nik || ''}
                      onChange={(e) => handleExtractedFieldChange('nik', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nomor Kartu Keluarga (KK) *</label>
                    <input 
                      type="text"
                      maxLength={16}
                      value={extractedData.kkNumber || ''}
                      onChange={(e) => handleExtractedFieldChange('kkNumber', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">NPWP (Jika Ada)</label>
                    <input 
                      type="text"
                      value={extractedData.npwp || ''}
                      onChange={(e) => handleExtractedFieldChange('npwp', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tempat Lahir *</label>
                    <input 
                      type="text"
                      value={extractedData.placeOfBirth || ''}
                      onChange={(e) => handleExtractedFieldChange('placeOfBirth', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tanggal Lahir *</label>
                    <input 
                      type="date"
                      value={extractedData.dateOfBirth || ''}
                      onChange={(e) => handleExtractedFieldChange('dateOfBirth', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Gender *</label>
                    <select
                      value={extractedData.gender || ''}
                      onChange={(e) => handleExtractedFieldChange('gender', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none"
                    >
                      <option value="">Pilih Gender...</option>
                      {genderOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Agama *</label>
                    <select
                      value={extractedData.religion || ''}
                      onChange={(e) => handleExtractedFieldChange('religion', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none"
                    >
                      <option value="">Pilih Agama...</option>
                      {religionOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status Pernikahan *</label>
                    <select
                      value={extractedData.maritalStatus || ''}
                      onChange={(e) => handleExtractedFieldChange('maritalStatus', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none"
                    >
                      <option value="">Pilih Status...</option>
                      {maritalOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Kesediaan Relokasi? *</label>
                    <select
                      value={extractedData.willingToRelocate || ''}
                      onChange={(e) => handleExtractedFieldChange('willingToRelocate', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none"
                    >
                      {relocateOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Sertifikasi & Lisensi</label>
                    <input 
                      type="text"
                      placeholder="Contoh: K3 Umum, Lisensi Kimia, SIO..."
                      value={extractedData.certifications || ''}
                      onChange={(e) => handleExtractedFieldChange('certifications', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white"
                    />
                  </div>

                </div>
              </div>

              {/* TAHAP 2: KONTAK & ALAMAT */}
              <div>
                <h4 className="font-extrabold text-blue-900 text-sm tracking-wider uppercase mb-4 border-b pb-1">
                  M-II. TAHAP 2 (INFORMASI KONTAK & ALAMAT)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-sans">
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nomor WhatsApp *</label>
                    <input 
                      type="text"
                      placeholder="Contoh: +628123456789"
                      value={extractedData.whatsappNumber || ''}
                      onChange={(e) => handleExtractedFieldChange('whatsappNumber', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Alamat Email *</label>
                    <input 
                      type="email"
                      value={extractedData.email || ''}
                      onChange={(e) => handleExtractedFieldChange('email', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Provinsi *</label>
                    <input 
                      type="text"
                      value={extractedData.provinsi || ''}
                      onChange={(e) => handleExtractedFieldChange('provinsi', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Kabupaten / Kota *</label>
                    <input 
                      type="text"
                      value={extractedData.kabupaten || ''}
                      onChange={(e) => handleExtractedFieldChange('kabupaten', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Kecamatan *</label>
                    <input 
                      type="text"
                      value={extractedData.kecamatan || ''}
                      onChange={(e) => handleExtractedFieldChange('kecamatan', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Desa / Kelurahan *</label>
                    <input 
                      type="text"
                      value={extractedData.desa || ''}
                      onChange={(e) => handleExtractedFieldChange('desa', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">RT *</label>
                      <input 
                        type="text"
                        value={extractedData.rt || ''}
                        onChange={(e) => handleExtractedFieldChange('rt', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">RW *</label>
                      <input 
                        type="text"
                        value={extractedData.rw || ''}
                        onChange={(e) => handleExtractedFieldChange('rw', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Alamat Baris Rinci *</label>
                    <input 
                      type="text"
                      value={extractedData.addressLine || ''}
                      onChange={(e) => handleExtractedFieldChange('addressLine', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Latitude</label>
                      <input 
                        type="text"
                        value={extractedData.latitude || ''}
                        onChange={(e) => handleExtractedFieldChange('latitude', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Longitude</label>
                      <input 
                        type="text"
                        value={extractedData.longitude || ''}
                        onChange={(e) => handleExtractedFieldChange('longitude', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* TAHAP 3: PROFESIONAL & PAYROLL */}
              <div>
                <h4 className="font-extrabold text-blue-900 text-sm tracking-wider uppercase mb-4 border-b pb-1">
                  M-III. TAHAP 3 (PROFESIONAL, PERBANKAN & DARURAT)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Pendidikan Terakhir *</label>
                    <input 
                      type="text"
                      placeholder="Contoh: SMA/SMK, D3, S1 Teknik..."
                      value={extractedData.lastEducation || ''}
                      onChange={(e) => handleExtractedFieldChange('lastEducation', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nama Institusi/Sekolah *</label>
                    <input 
                      type="text"
                      value={extractedData.institutionName || ''}
                      onChange={(e) => handleExtractedFieldChange('institutionName', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Jurusan / Bidang Studi *</label>
                    <input 
                      type="text"
                      value={extractedData.major || ''}
                      onChange={(e) => handleExtractedFieldChange('major', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tahun Kelulusan *</label>
                    <input 
                      type="number"
                      value={extractedData.graduationYear || ''}
                      onChange={(e) => handleExtractedFieldChange('graduationYear', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nama Bank Payroll *</label>
                    <input 
                      type="text"
                      placeholder="Contoh: Mandiri, BRI, BCA..."
                      value={extractedData.bankName || ''}
                      onChange={(e) => handleExtractedFieldChange('bankName', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nomor Rekening Payroll *</label>
                    <input 
                      type="text"
                      value={extractedData.accountNumber || ''}
                      onChange={(e) => handleExtractedFieldChange('accountNumber', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nama Kontak Darurat *</label>
                    <input 
                      type="text"
                      value={extractedData.emergencyName || ''}
                      onChange={(e) => handleExtractedFieldChange('emergencyName', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Hubungan Darurat *</label>
                    <input 
                      type="text"
                      placeholder="Contoh: Orangtua, Suami/Istri, Saudara..."
                      value={extractedData.emergencyRelation || ''}
                      onChange={(e) => handleExtractedFieldChange('emergencyRelation', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Telepon Darurat *</label>
                    <input 
                      type="text"
                      value={extractedData.emergencyPhone || ''}
                      onChange={(e) => handleExtractedFieldChange('emergencyPhone', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Keahlian (Skills) *</label>
                    <textarea 
                      rows={2}
                      value={extractedData.skills || ''}
                      onChange={(e) => handleExtractedFieldChange('skills', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Riwayat Pengalaman Kerja singkat *</label>
                    <textarea 
                      rows={3}
                      value={extractedData.workExperience || ''}
                      onChange={(e) => handleExtractedFieldChange('workExperience', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none"
                    />
                  </div>

                </div>
              </div>

            </div>

            {/* Footer buttons to advance to documents upload */}
            <div className="mt-10 pt-6 border-t flex justify-end gap-4">
              <button
                onClick={() => setFormStage('chat')}
                className="px-6 py-3 border border-gray-200 hover:bg-gray-50 rounded-2xl text-gray-600 font-semibold text-sm transition-all shadow-xs"
              >
                Ganti Obrolan Chat
              </button>
              <button
                onClick={() => {
                  setErrorText(null);
                  // Quick validations
                  if (!extractedData.fullName || !extractedData.nik || !extractedData.whatsappNumber || !extractedData.email) {
                    setErrorText('Nama Lengkap, NIK, WhatsApp, dan Email wajib diisi sebelum beralih ke menu Dokumen.');
                    return;
                  }
                  if (extractedData.nik.replace(/[^0-9]/g, '').length !== 16) {
                    setErrorText('Validasi: NIK harus berupa 16 digit angka.');
                    return;
                  }
                  if (extractedData.kkNumber && extractedData.kkNumber.replace(/[^0-9]/g, '').length !== 16) {
                    setErrorText('Validasi: Nomor KK harus berupa 16 digit angka.');
                    return;
                  }
                  setFormStage('documents');
                }}
                className="px-8 py-3 bg-blue-900 hover:bg-indigo-950 text-white font-bold rounded-2xl flex items-center gap-2 transition-all shadow-md active:scale-95"
                id="btn_continue_to_docs"
              >
                Lanjut ke Tahap 4 (Dokumen) <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* TAHAP 4: DOCUMENT UPLOADER GATEWAY */}
        {formStage === 'documents' && (
          <motion.div 
            key="documents-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden p-6 md:p-8 max-w-4xl mx-auto"
            id="section_documents_upload"
          >
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-4 border-b">
              <div>
                <span className="text-xs uppercase bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-full border border-emerald-150">
                  Tahap 4: Mengunggah Dokumen Pendukung
                </span>
                <p className="text-gray-500 text-xs mt-2">
                  Sebagai bagian akhir dari seleksi PT Perdana Adi Yuda, mohon sediakan salinan fisik dokumen resmi Anda. Berkas Anda disandikan secara rahasia dan aman.
                </p>
              </div>
              <button 
                onClick={() => setFormStage('preview')} 
                className="mt-4 md:mt-0 px-4 py-2 text-xs border border-gray-250 text-gray-500 hover:bg-gray-50 font-semibold rounded-xl"
              >
                ← Edit Data Identitas
              </button>
            </div>

            {errorText && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700 text-xs font-sans rounded">
                {errorText}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Application Letter */}
              <div className="p-4 rounded-2xl border border-gray-200">
                <label className="block text-sm font-bold text-gray-800 mb-1">Surat Lamaran (Wajib) *</label>
                <div 
                  onClick={() => triggerFileSelect('applicationLetter')}
                  className="mt-2 border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-blue-25/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer min-h-[90px] text-center transition-all"
                >
                  <Paperclip className="h-6 w-6 text-gray-400 mb-1" />
                  <span className="text-xs font-bold text-blue-700 truncate max-w-full">
                    {files.applicationLetter ? files.applicationLetter.name : 'Pilih Surat Lamaran Anda (PDF/JPG)'}
                  </span>
                  <input 
                    type="file"
                    ref={(el) => fileInputRefs.current['applicationLetter'] = el}
                    onChange={(e) => handleFileChange(e, 'applicationLetter')}
                    className="hidden"
                  />
                </div>
              </div>

              {/* CV */}
              <div className="p-4 rounded-2xl border border-gray-200">
                <label className="block text-sm font-bold text-gray-800 mb-1">Curriculum Vitae (CV) (Wajib) *</label>
                <div 
                  onClick={() => triggerFileSelect('cv')}
                  className="mt-2 border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-blue-25/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer min-h-[90px] text-center transition-all"
                >
                  <Paperclip className="h-6 w-6 text-gray-400 mb-1" />
                  <span className="text-xs font-bold text-blue-700 truncate max-w-full">
                    {files.cv ? files.cv.name : 'Pilih Curriculum Vitae/CV (PDF/JPG)'}
                  </span>
                  <input 
                    type="file"
                    ref={(el) => fileInputRefs.current['cv'] = el}
                    onChange={(e) => handleFileChange(e, 'cv')}
                    className="hidden"
                  />
                </div>
              </div>

              {/* KTP */}
              <div className="p-4 rounded-2xl border border-gray-200">
                <label className="block text-sm font-bold text-gray-800 mb-1">KTP (Wajib) *</label>
                <div 
                  onClick={() => triggerFileSelect('ktp')}
                  className="mt-2 border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-blue-25/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer min-h-[90px] text-center transition-all"
                >
                  <Paperclip className="h-6 w-6 text-gray-400 mb-1" />
                  <span className="text-xs font-bold text-blue-700 truncate max-w-full">
                    {files.ktp ? files.ktp.name : 'Metode Foto KTP Jelas (JPEG/PNG)'}
                  </span>
                  <input 
                    type="file"
                    ref={(el) => fileInputRefs.current['ktp'] = el}
                    onChange={(e) => handleFileChange(e, 'ktp')}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Foto Diri */}
              <div className="p-4 rounded-2xl border border-gray-200">
                <label className="block text-sm font-bold text-gray-800 mb-1">Foto Belakang Diri Pas (Wajib) *</label>
                <div 
                  onClick={() => triggerFileSelect('photo')}
                  className="mt-2 border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-blue-25/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer min-h-[90px] text-center transition-all"
                >
                  <Paperclip className="h-6 w-6 text-gray-400 mb-1" />
                  <span className="text-xs font-bold text-blue-700 truncate max-w-full">
                    {files.photo ? files.photo.name : 'Pilih Foto Profil PNG/JPG Warna Formal'}
                  </span>
                  <input 
                    type="file"
                    ref={(el) => fileInputRefs.current['photo'] = el}
                    onChange={(e) => handleFileChange(e, 'photo')}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Ijazah */}
              <div className="p-4 rounded-2xl border border-gray-250">
                <label className="block text-sm font-bold text-gray-800 mb-1">Ijazah Terakhir (Opsional)</label>
                <div 
                  onClick={() => triggerFileSelect('diploma')}
                  className="mt-2 border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-blue-25/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer min-h-[90px] text-center transition-all"
                >
                  <Paperclip className="h-6 w-6 text-gray-400 mb-1" />
                  <span className="text-xs font-bold text-blue-700 truncate max-w-full">
                    {files.diploma ? files.diploma.name : 'Pilih Salinan Ijazah Terakhir PDF'}
                  </span>
                  <input 
                    type="file"
                    ref={(el) => fileInputRefs.current['diploma'] = el}
                    onChange={(e) => handleFileChange(e, 'diploma')}
                    className="hidden"
                  />
                </div>
              </div>

              {/* KK */}
              <div className="p-4 rounded-2xl border border-gray-250">
                <label className="block text-sm font-bold text-gray-800 mb-1">Kartu Keluarga (Opsional)</label>
                <div 
                  onClick={() => triggerFileSelect('kk')}
                  className="mt-2 border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-blue-25/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer min-h-[90px] text-center transition-all"
                >
                  <Paperclip className="h-6 w-6 text-gray-400 mb-1" />
                  <span className="text-xs font-bold text-blue-700 truncate max-w-full">
                    {files.kk ? files.kk.name : 'Pilih Salinan Kartu Keluarga PDF'}
                  </span>
                  <input 
                    type="file"
                    ref={(el) => fileInputRefs.current['kk'] = el}
                    onChange={(e) => handleFileChange(e, 'kk')}
                    className="hidden"
                  />
                </div>
              </div>

            </div>

            {/* Final Submit Actions form */}
            <div className="mt-10 pt-6 border-t flex justify-end gap-4">
              <button
                type="button"
                disabled={uploadProgress}
                onClick={() => setFormStage('preview')}
                className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-2xl transition-all"
              >
                Kembali Edit Data
              </button>
              <button
                type="button"
                onClick={handleSubmitFinalApplicant}
                disabled={uploadProgress}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2"
                id="btn_submit_applicant"
              >
                {uploadProgress ? 'Memproses Berkas...' : 'Kirim Berkas Pendaftaran Resmi'}
              </button>
            </div>
          </motion.div>
        )}
        
      </AnimatePresence>

    </div>
  );
};
