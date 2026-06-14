
import { Employee, OfferingDetails } from '../types';
import { sendTelegramMessage } from './telegram';
import { sendGmail } from './gmail';

// --- UTILS ---
export const sendEmail = async (to: string, subject: string, body: string) => {
    try {
        await sendGmail(to, subject, body);
    } catch(e) {
        console.error('Email sending failed:', e);
        throw e; // rethrow so the caller knows it failed
    }
};

// --- TEMPLATES ---

const formatCurrency = (val: string) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(val));

const getInterviewTemplate = (
    emp: Employee, 
    date: string, 
    type: 'online' | 'offline', 
    detail: { link?: string; locName?: string; address?: string; pic?: string }
) => {
    const formattedDate = new Date(date).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
    let locationDetail = '';
    if (type === 'online') {
        locationDetail = `
Metode: Online (Virtual Meeting)
Link Interview: ${detail.link || 'https://meet.google.com/abc-defg-hij'}`;
    } else {
        locationDetail = `
Metode: Offline (Tatap Muka)
Nama Lokasi: ${detail.locName || 'Kantor Pusat PT Perdana Adi Yuda'}
Alamat Lengkap: ${detail.address || 'Jl. Jenderal Sudirman No. 123, Palu'}
PIC Interviewer: ${detail.pic || 'HR Recruitment Team'}`;
    }

    return `Halo ${emp.fullName},
Kami dari PT Perdana Adi Yuda mengundang Anda untuk Interview kerja posisi ${emp.positionApplied}.

Hari/Tanggal: ${formattedDate}${locationDetail}

PENTING - VIDEO INTERVIEW ONLINE:
Sebelum hadir, Anda WAJIB menyelesaikan sesi interview online AI (Max 5 Menit).

1. Klik Link: https://perada.net/#/interview-session/${emp.id}
2. Anda akan diminta LOGIN (Gunakan akun saat mendaftar). Jika belum punya akun, silakan Register.
3. Link ini HANYA BERLAKU 24 JAM dari jadwal interview di atas.
4. Jika melewati batas waktu, lamaran otomatis GUGUR (Rejected).

Mohon konfirmasi kehadiran Anda. Terima kasih.
`;
};

const getRejectionTemplate = (emp: Employee) => `
Halo ${emp.fullName},
Terima kasih atas minat Anda bergabung dengan PT Perdana Adi Yuda.
Mohon maaf, kualifikasi Anda saat ini belum sesuai dengan kebutuhan kami untuk posisi ${emp.positionApplied}.
Data Anda telah kami simpan di database kami untuk kesempatan di masa mendatang.

Semangat dan sukses selalu!
`;

const getPassedInterviewTemplate = (emp: Employee) => `
Halo ${emp.fullName},
Selamat! Kami dengan senang hati menginformasikan bahwa Anda dinyatakan LOLOS seleksi interview untuk posisi ${emp.positionApplied} di PT Perdana Adi Yuda.

Tahap berikutnya adalah proses Penawaran Kerja resmi (Offering Letter) yang akan dikirimkan kepada Anda melalui email/kontak terdaftar.

Mohon tunggu informasi penawaran detail kami berikutnya. Terima kasih atas partisipasi aktif Anda!
`;

const getOfferingTemplate = (emp: Employee, offer: OfferingDetails) => `
SELAMAT! Anda Lolos Tahap Seleksi.

Halo ${emp.fullName},
Kami dengan senang hati menawarkan posisi ${emp.positionApplied} di PT Perdana Adi Yuda.

Detail Penawaran:
- Gaji Pokok: ${formatCurrency(offer.salary)}
- Tunjangan: ${formatCurrency(offer.allowance)}
- Benefit: ${offer.benefits}
- Durasi Kontrak: ${offer.contractDuration}
- Lokasi: ${offer.placementLocation}
- Tanggal Mulai: ${new Date(offer.startDate).toLocaleDateString('id-ID')}

Silakan cek EMAIL Anda untuk melihat Dokumen Offering Letter lengkap dan melakukan konfirmasi (Terima/Tolak).
`;

const getContractTemplate = (emp: Employee) => `
Halo ${emp.fullName},
Selamat Bergabung!
Berikut kami lampirkan dokumen Kontrak Kerja (PKWT) Anda. Silakan pelajari dan tandatangani dokumen yang telah dikirimkan ke email Anda.

Hubungi PIC HR jika ada pertanyaan.
`;

// --- ACTIONS ---

export const sendInterviewNotification = async (
    emp: Employee, 
    date: string, 
    type: 'online' | 'offline',
    detail: { link?: string; locName?: string; address?: string; pic?: string }
) => {
    const msg = getInterviewTemplate(emp, date, type, detail);
    
    // 1. Telegram
    if (emp.telegramId) {
        try {
            await sendTelegramMessage(emp.telegramId, `*UNDANGAN INTERVIEW*\n${msg}`);
        } catch (e) {
            console.error("Failed to send Telegram notification:", e);
        }
    }

    // 2. WhatsApp (Open Link)
    try {
        const waUrl = `https://wa.me/${emp.whatsappNumber.replace(/^0/, '62').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
    } catch (e) {
        console.warn("Could not open WhatsApp Web in iframe sandbox. Fallback logging messaging instead:", e);
    }

    // 3. Email
    await sendEmail(emp.email, 'Undangan Interview', msg);
    console.log(`[EMAIL SENT to ${emp.email}]\nSubject: Undangan Interview\nBody: ${msg}`);
};

export const sendPassedInterviewNotification = async (emp: Employee) => {
    const msg = getPassedInterviewTemplate(emp);

    if (emp.telegramId) {
        try {
            await sendTelegramMessage(emp.telegramId, `*STATUS LAMARAN: LOLOS INTERVIEW*\n${msg}`);
        } catch (e) {
            console.error("Failed to send Telegram status update:", e);
        }
    }
    
    try {
        const waUrl = `https://wa.me/${emp.whatsappNumber.replace(/^0/, '62').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
    } catch (e) {
        console.warn("Could not open WhatsApp Web in iframe sandbox:", e);
    }

    await sendEmail(emp.email, 'Hasil Seleksi Interview', msg);
    console.log(`[EMAIL SENT to ${emp.email}]\nSubject: Hasil Seleksi Interview\nBody: ${msg}`);
};

export const sendRejectionNotification = async (emp: Employee) => {
    const msg = getRejectionTemplate(emp);

    if (emp.telegramId) {
        try {
            await sendTelegramMessage(emp.telegramId, `*UPDATE LAMARAN*\n${msg}`);
        } catch (e) {
            console.error("Failed to send Telegram rejection update:", e);
        }
    }
    
    try {
        const waUrl = `https://wa.me/${emp.whatsappNumber.replace(/^0/, '62').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
    } catch (e) {
        console.warn("Could not open WhatsApp Web in iframe sandbox:", e);
    }

    await sendEmail(emp.email, 'Update Lamaran', msg);
    console.log(`[EMAIL SENT to ${emp.email}]\nSubject: Update Lamaran\nBody: ${msg}`);
};

export const sendOfferingLetter = async (emp: Employee, offer: OfferingDetails) => {
    const msg = getOfferingTemplate(emp, offer);
    const emailBody = `
        ${msg}
        
        [TOMBOL: SAYA MENERIMA TAWARAN INI] -> Link ke sistem (Simulasi)
        [TOMBOL: SAYA MENOLAK] -> Link ke sistem (Simulasi)
        
        PIC Perdana: ${offer.picPerdana}
        PIC Klien: ${offer.picClient}
    `;

    // 1. Telegram Notif
    if (emp.telegramId) {
        try {
            await sendTelegramMessage(emp.telegramId, `*OFFERING LETTER*\n${msg}`);
        } catch (e) {
            console.error("Failed to send Telegram offering update:", e);
        }
    }

    // 2. Email with "Button" simulation
    await sendEmail(emp.email, `OFFICIAL OFFERING LETTER - ${emp.positionApplied}`, emailBody);
    console.log(`[EMAIL SENT to ${emp.email}]\nSubject: OFFICIAL OFFERING LETTER - ${emp.positionApplied}\nBody: ${emailBody}`);
};

export const sendContractDocument = async (emp: Employee, fileUrl: string) => {
    const msg = getContractTemplate(emp);

    // 1. Telegram
    if (emp.telegramId) {
        try {
            await sendTelegramMessage(emp.telegramId, `*DOKUMEN KONTRAK KERJA*\n${msg}`);
        } catch (e) {
            console.error("Failed to send Telegram contract update:", e);
        }
    }

    // 2. Email
    await sendEmail(emp.email, 'KONTRAK KERJA (PKWT)', msg);
    console.log(`[EMAIL SENT to ${emp.email}]\nSubject: KONTRAK KERJA (PKWT)\nAttachment: ${fileUrl}\nBody: ${msg}`);
};

export const sendHiredNotification = async (emp: Employee) => {
    const msg = `Selamat! Anda telah resmi terdaftar sebagai karyawan aktif. Sampai jumpa di hari pertama on-boarding!`;
    if (emp.telegramId) {
        try {
            await sendTelegramMessage(emp.telegramId, `*WELCOME ABOARD*\n${msg}`);
        } catch (e) {
            console.error("Failed to send Telegram hired welcome board:", e);
        }
    }
    await sendEmail(emp.email, 'Welcome Aboard', msg);
    console.log(`[EMAIL SENT] Welcome Email sent to ${emp.email}`);
};

export const sendCandidateCredentialsNotification = async (fullName: string, email: string, valPass: string, position: string) => {
    const subject = `Kredensial Akun Portal Rekrutmen PT Perdana Adi Yuda`;
    const body = `Halo ${fullName},

Terima kasih telah mengajukan lamaran kerja di PT Perdana Adi Yuda untuk posisi ${position}.

Akun Portal Rekrutmen Anda telah otomatis dibuat oleh sistem. Anda wajib login menggunakan akun ini untuk memantau progres lamaran kerja, melengkapi berkas administrasi, dan menaksir tawaran kerja/kontrak di kemudian hari.

Berikut adalah kredensial akses masuk Anda:
- Link Login: https://perada.net/#/login
- Alamat Email (Username): ${email}
- Kata Sandi (Password): ${valPass}

Harap simpan informasi login ini dengan baik dan rahasia. Ketika nanti telah resmi bergabung menjadi karyawan, portal ini juga terbuka penuh untuk akses Slip Gaji (Payroll), Absensi Geo-Location, dan Manajemen Project Anda.

Salam Sukses,
Recruitment & HRD Team
PT Perdana Adi Yuda
`;

    await sendEmail(email, subject, body);
    console.log(`[EMAIL SENT to ${email}] Credentials sent successfully.`);
};

