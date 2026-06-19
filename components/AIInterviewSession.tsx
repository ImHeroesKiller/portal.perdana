
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { updateEmployee } from '../services/db';
import { useEmployees } from '../hooks/useDbQueries';
import { getCurrentUser } from '../services/auth';
import { Employee } from '../types';
import { VideoCameraIcon, MicrophoneIcon, ClockIcon, CheckCircleIcon, PlayCircleIcon, ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { GoogleGenAI, Type } from "@google/genai";

const STAR_STAGES = [
    { id: 'intro', title: 'Introduction', text: "Selamat datang di Interview Online PT Perdana Adi Yuda. Saya Sara, asisten AI rekrutmen Anda. Interview ini akan berlangsung maksimal 5 menit menggunakan metode STAR. Silakan perkenalkan diri Anda secara singkat." },
    { id: 'situation', title: 'Situation', text: "Ceritakan tentang situasi menantang yang pernah Anda hadapi dalam pekerjaan sebelumnya atau saat organisasi." },
    { id: 'task', title: 'Task', text: "Apa tanggung jawab spesifik Anda dalam situasi tersebut? Apa yang diharapkan dari Anda?" },
    { id: 'action', title: 'Action', text: "Tindakan konkret apa yang Anda ambil untuk mengatasi situasi tersebut? Jelaskan langkah-langkahnya." },
    { id: 'result', title: 'Result', text: "Bagaimana hasilnya? Apa dampak dari tindakan Anda terhadap perusahaan atau tim?" },
    { id: 'outro', title: 'Closing', text: "Terima kasih telah menyelesaikan sesi interview ini. Data Anda telah kami rekam dan akan dianalisis oleh tim HRD kami. Anda boleh menutup halaman ini." }
];

// Safe access to environment variables
const getEnv = (): any => {
    try {
        // @ts-ignore
        return (import.meta && import.meta.env) ? import.meta.env : {};
    } catch {
        return {};
    }
};

export const AIInterviewSession: React.FC = () => {
    const { employeeId } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [statusState, setStatusState] = useState<'LOADING' | 'READY' | 'EXPIRED' | 'COMPLETED' | 'UNAUTHORIZED'>('LOADING');
    const [statusMessage, setStatusMessage] = useState('');
    
    // Interview Session States
    const [stageIndex, setStageIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [isSpeaking, setIsSpeaking] = useState(false); // AI Speaking
    const [transcript, setTranscript] = useState<Record<string, string>>({});
    
    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const recognitionRef = useRef<any>(null);
    const { data: employees = [], isLoading: employeesLoading } = useEmployees();

    // 1. Authentication & Employee Validation
    useEffect(() => {
        if (employeesLoading) return;

        const validateSession = async () => {
            // A. Check Auth
            const user = getCurrentUser();
            if (!user) {
                // Redirect to login with callback
                navigate(`/login?redirect=/interview-session/${employeeId}`);
                return;
            }

            // B. Load Employee
            const emp = employees.find(e => e.id === employeeId);
            
            if (!emp) {
                alert('Data kandidat tidak ditemukan');
                navigate('/');
                return;
            }

            // C. Check if already completed
            if (emp.aiInterview) {
                setEmployee(emp);
                setStatusState('COMPLETED');
                return;
            }

            // D. Check Time & Expiration (24 Hour Tolerance)
            if (!emp.interviewDate) {
                 setStatusState('UNAUTHORIZED');
                 setStatusMessage('Jadwal interview belum diatur oleh HRD.');
                 return;
            }

            const scheduleDate = new Date(emp.interviewDate);
            const expirationDate = new Date(scheduleDate.getTime() + (24 * 60 * 60 * 1000)); // +24 Hours
            const now = new Date();

            if (now > expirationDate) {
                // EXPIRED LOGIC -> AUTO REJECT
                if (emp.status !== 'REJECTED') {
                     await updateEmployee(emp.id, { 
                         status: 'REJECTED', 
                         hrNotes: (emp.hrNotes || '') + '\n[SYSTEM] Auto-Rejected: Tidak menghadiri Interview Online dalam batas waktu 24 jam.' 
                     });
                }
                setStatusState('EXPIRED');
                return;
            }

            // E. Ready
            setEmployee(emp);
            setStatusState('READY');
        };

        validateSession();
    }, [employeeId, navigate, employees, employeesLoading]);

    // Timer Logic
    useEffect(() => {
        if (statusState === 'READY' && stageIndex > 0 && stageIndex < STAR_STAGES.length - 1) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        finishInterview();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [stageIndex, statusState]);

    // Camera Init (Only if READY)
    useEffect(() => {
        const startCamera = async () => {
            if (statusState !== 'READY') return;
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (err) {
                console.error("Camera Access Error:", err);
                alert("Mohon izinkan akses kamera dan mikrofon untuk melanjutkan interview.");
            }
        };
        startCamera();
        
        return () => {
             if (videoRef.current && videoRef.current.srcObject) {
                 const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                 tracks.forEach(track => track.stop());
             }
        }
    }, [statusState]);

    // Speech Synthesis
    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'id-ID';
            utterance.rate = 1;
            utterance.pitch = 1.1;
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => v.lang.includes('id') && (v.name.includes('Female') || v.name.includes('Google')));
            if (femaleVoice) utterance.voice = femaleVoice;
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        } else {
            setIsSpeaking(true);
            setTimeout(() => setIsSpeaking(false), 3000);
        }
    };

    // Speech Recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition && statusState === 'READY') {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'id-ID';

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        const currentStageId = STAR_STAGES[stageIndex].id;
                        setTranscript(prev => ({
                            ...prev,
                            [currentStageId]: (prev[currentStageId] || '') + ' ' + event.results[i][0].transcript
                        }));
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
            };
        }
    }, [stageIndex, statusState]);

    const startStage = () => {
        const stage = STAR_STAGES[stageIndex];
        speak(stage.text);
        if (stageIndex < STAR_STAGES.length - 1) {
             setTimeout(() => {
                 setIsRecording(true);
                 if (recognitionRef.current) recognitionRef.current.start();
             }, 3000);
        }
    };

    const nextStage = () => {
        setIsRecording(false);
        if (recognitionRef.current) recognitionRef.current.stop();
        if (stageIndex < STAR_STAGES.length - 1) {
            setStageIndex(prev => prev + 1);
        } else {
            finishInterview();
        }
    };

    useEffect(() => {
        if (statusState === 'READY') startStage();
    }, [stageIndex, statusState]);

    const finishInterview = async () => {
        if (!employee) return;
        
        let aiResult;
        try {
            const env = getEnv();
            const API_KEY = env.VITE_GEMINI_API_KEY || '';
            const ai = new GoogleGenAI({ apiKey: API_KEY });
            
            const prompt = `
                Analyze the following candidate interview based on the STAR method.
                
                Context:
                Candidate Name: ${employee.fullName}
                Position: ${employee.positionApplied}
                
                Transcript:
                Situation: ${transcript['situation'] || 'No answer'}
                Task: ${transcript['task'] || 'No answer'}
                Action: ${transcript['action'] || 'No answer'}
                Result: ${transcript['result'] || 'No answer'}
                
                Provide:
                1. A brief analysis for each STAR component.
                2. An overall score (0-100).
                3. A summary of the candidate's performance.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            starAnalysis: {
                                type: Type.OBJECT,
                                properties: {
                                    situation: { type: Type.STRING },
                                    task: { type: Type.STRING },
                                    action: { type: Type.STRING },
                                    result: { type: Type.STRING },
                                }
                            },
                            overallScore: { type: Type.NUMBER },
                            summary: { type: Type.STRING }
                        }
                    }
                }
            });
            
            aiResult = JSON.parse(response.text);
            
        } catch (error) {
            console.error("Gemini Error:", error);
             aiResult = {
                starAnalysis: {
                    situation: transcript['situation'] || 'No input',
                    task: transcript['task'] || 'No input',
                    action: transcript['action'] || 'No input',
                    result: transcript['result'] || 'No input'
                },
                overallScore: 50,
                summary: "Auto-generated: AI Analysis Failed. Please review transcript manually."
            };
        }

        const result = {
            completedAt: new Date().toISOString(),
            durationSeconds: 300 - timeLeft,
            starAnalysis: aiResult.starAnalysis,
            overallScore: aiResult.overallScore,
            summary: aiResult.summary,
            videoUrl: "#"
        };
        await updateEmployee(employee.id, { aiInterview: result });
        alert("Interview Selesai. Terima kasih.");
        navigate('/');
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // --- RENDER STATES ---

    if (statusState === 'LOADING') {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Memuat Sesi...</div>;
    }

    if (statusState === 'EXPIRED') {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-8 max-w-lg text-center shadow-2xl">
                    <ExclamationTriangleIcon className="h-16 w-16 text-red-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Kadaluwarsa</h2>
                    <p className="text-gray-600 mb-6">
                        Maaf, sesi interview ini telah melewati batas waktu toleransi 24 jam dari jadwal yang ditentukan.
                        Status lamaran Anda otomatis ditutup.
                    </p>
                    <button onClick={() => navigate('/')} className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-700">Kembali ke Beranda</button>
                </div>
            </div>
        );
    }

    if (statusState === 'COMPLETED') {
        return (
             <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-8 max-w-lg text-center shadow-2xl">
                    <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Selesai</h2>
                    <p className="text-gray-600 mb-6">Anda sudah menyelesaikan tahap interview ini. Tim HRD kami sedang meninjau hasilnya.</p>
                    <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Kembali ke Beranda</button>
                </div>
            </div>
        );
    }

    if (statusState === 'UNAUTHORIZED') {
         return (
             <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-8 max-w-lg text-center shadow-2xl">
                    <LockClosedIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
                    <p className="text-gray-600 mb-6">{statusMessage}</p>
                    <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Kembali</button>
                </div>
            </div>
        );
    }

    // --- MAIN INTERVIEW UI (READY) ---

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-gray-900 to-black pointer-events-none"></div>

            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 z-10">
                
                {/* AI Avatar Section */}
                <div className="flex flex-col items-center justify-center bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl relative">
                    <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs px-3 py-1 rounded-full uppercase tracking-widest font-bold">
                        AI Recruiter
                    </div>
                    
                    {/* 3D Avatar Placeholder / Visual */}
                    <div className={`relative w-64 h-64 md:w-80 md:h-80 mb-8 rounded-full border-4 ${isSpeaking ? 'border-blue-400 shadow-[0_0_50px_rgba(59,130,246,0.5)]' : 'border-gray-600'} transition-all duration-300 flex items-center justify-center bg-gradient-to-b from-gray-700 to-gray-900 overflow-hidden`}>
                        {/* Placeholder for 3D Character Image */}
                        <img 
                            src="https://img.freepik.com/free-photo/3d-render-young-businesswoman_1057-5126.jpg?t=st=1710000000~exp=1710003600~hmac=fakesignature" 
                            alt="Sara AI Avatar"
                            onError={(e) => { e.currentTarget.style.display='none'; }}
                            className={`w-full h-full object-cover ${isSpeaking ? 'animate-pulse scale-105' : 'scale-100'} transition-transform duration-500`}
                        />
                        {/* Fallback if image fails */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
                        </div>
                    </div>

                    {/* AI Status Text */}
                    <div className="text-center space-y-2 h-24">
                        <h2 className="text-2xl font-bold text-white">Sara</h2>
                        <p className="text-blue-300 text-sm font-medium">Virtual HR Assistant</p>
                        {isSpeaking ? (
                            <div className="flex items-center justify-center gap-1 mt-2">
                                <span className="w-1 h-4 bg-blue-400 animate-bounce"></span>
                                <span className="w-1 h-6 bg-blue-400 animate-bounce delay-75"></span>
                                <span className="w-1 h-3 bg-blue-400 animate-bounce delay-150"></span>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-xs italic">Menunggu respon Anda...</p>
                        )}
                    </div>

                    {/* Captions */}
                    <div className="mt-6 bg-black bg-opacity-50 p-4 rounded-lg border border-gray-700 w-full text-center min-h-[100px] flex items-center justify-center">
                         <p className="text-gray-200 text-sm md:text-base leading-relaxed">
                            "{STAR_STAGES[stageIndex].text}"
                         </p>
                    </div>
                </div>

                {/* User / Interface Section */}
                <div className="flex flex-col space-y-6">
                    {/* User Webcam Feed */}
                    <div className="relative bg-black rounded-2xl overflow-hidden aspect-video border border-gray-700 shadow-lg group">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                        
                        <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 animate-pulse">
                            <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
                        </div>

                        <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 px-3 py-1 rounded text-white text-xs">
                            {employee?.fullName} - {employee?.positionApplied}
                        </div>
                    </div>

                    {/* Controls & Progress */}
                    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-white font-bold text-lg">Metode STAR</h3>
                                <p className="text-gray-400 text-xs">Tahap: {STAR_STAGES[stageIndex].title}</p>
                            </div>
                            <div className={`flex items-center gap-2 text-xl font-mono font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-blue-400'}`}>
                                <ClockIcon className="h-6 w-6" />
                                {formatTime(timeLeft)}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-700 h-2 rounded-full mb-6 overflow-hidden">
                            <div 
                                className="bg-blue-500 h-full transition-all duration-500 ease-out" 
                                style={{ width: `${((stageIndex + 1) / STAR_STAGES.length) * 100}%` }}
                            ></div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {isRecording ? (
                                    <div className="flex items-center gap-2 text-red-400 animate-pulse">
                                        <MicrophoneIcon className="h-5 w-5" />
                                        <span className="text-sm font-bold">Mendengarkan...</span>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 text-sm">AI sedang berbicara...</div>
                                )}
                            </div>

                            {stageIndex < STAR_STAGES.length - 1 ? (
                                <button 
                                    onClick={nextStage} 
                                    disabled={isSpeaking}
                                    className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${isSpeaking ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-900/50'}`}
                                >
                                    Selesai Bicara <PlayCircleIcon className="h-5 w-5" />
                                </button>
                            ) : (
                                <button onClick={() => navigate('/')} className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700">
                                    Tutup Sesi
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
