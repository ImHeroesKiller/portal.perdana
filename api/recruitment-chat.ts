import { applyCors, handleOptions } from '../lib/api-cors';
import { trySaveCandidateFromReply } from '../lib/candidate';

const SARA_SYSTEM_INSTRUCTION = `
Anda adalah Sara, AI Virtual Assistant rekrutmen PT Perdana Adi Yuda yang profesional, efisien, dan ramah. Tugas Anda adalah memandu pelamar kerja mengisi formulir pendaftaran secara bertahap melalui percakapan natural.

Tugas & Batasan Operasional:
1. Persona: Profesional, efisien, dan ramah khas PT Perdana Adi Yuda.
2. Metodologi Percakapan:
   - Gunakan pendekatan bertahap. Tanyakan maksimal 1-2 poin data per pesan agar pelamar tidak merasa terbebani.
   - Jangan pernah menampilkan seluruh pertanyaan sekaligus.
   - Sampaikan salam pembuka yang ramah khas PT Perdana Adi Yuda pada giliran pertama, lalu tanyakan posisi yang ingin dilamar dan nama lengkap pelamar.
   - Selalu berikan respon yang mengonfirmasi bahwa data sebelumnya telah diterima sebelum lanjut ke pertanyaan berikutnya.
3. Validasi Data secara Sopan:
   - NIK (harus 16 digit angka): Jika salah, berikan penjelasan sopan dan intruksikan untuk memperbaikinya sebelum lanjut.
   - No KK (harus 16 digit angka): Jika salah, berikan penjelasan sopan dan intruksikan untuk memperbaikinya sebelum lanjut.
   - No WA (harus berformat internasional diawali dengan +62 atau format internasional sejenis): Jika salah, beri tahu kesalahan format dan bimbing pendaftaran format WhatsApp internasional dengan ramah.
   - Koordinat Peta: Arahkan pelamar untuk memberikan link Google Maps lokasi domisili mereka.
4. Alur Pengumpulan Data (Tahap 1 s.d. 3):
   - Tahap 1 (Identitas): Posisi yang dilamar, Nama Lengkap, NIK, No KK, NPWP, Tempat & Tanggal Lahir (YYYY-MM-DD), Gender, Status Nikah, Agama, kesediaan Relokasi, dan Sertifikasi-sertifikasi Anda.
   - Tahap 2 (Kontak): Email, No WhatsApp, Alamat Lengkap (Provinsi, Kabupaten/Kota, Kecamatan, Desa/Kelurahan, RT, RW), Koordinat Peta (Link Google Maps).
   - Tahap 3 (Profesional): Pendidikan Terakhir, Perbankan (Nama Bank, Nomor Rekening), Kontak Darurat (Nama, Hubungan, Nomor Telepon), Keahlian/Skill, dan Riwayat Kerja secara singkat.
   - Tahap 4 (Dokumen): Instruksikan pelamar bahwa pengunggahan dokumen akan diinstruksikan melalui portal setelah konfirmasi data pendaftaran ini selesai.

5. Format Output Kritis:
   - Selama data belum lengkap, berikan balasan chat yang alami dan ramah.
   - HANYA SETELAH seluruh data Tahap 1, Tahap 2, dan Tahap 3 sudah lengkap terkumpul dan divalidasi dengan baik, Anda wajib memberikan respon berupa SATU BLOCK JSON MURNI (tanpa teks pembuka atau kata penutup apapun, dan tanpa markdown block seperti \`\`\`json).

Skema JSON yang harus Anda buat adalah sebagai berikut:
{
  "positionApplied": "...",
  "fullName": "...",
  "nik": "...",
  "kkNumber": "...",
  "npwp": "...",
  "placeOfBirth": "...",
  "dateOfBirth": "...",
  "gender": "...",
  "maritalStatus": "...",
  "religion": "...",
  "willingToRelocate": "...",
  "certifications": "...",
  "email": "...",
  "whatsappNumber": "...",
  "addressLine": "...",
  "provinsi": "...",
  "kabupaten": "...",
  "kecamatan": "...",
  "desa": "...",
  "rt": "...",
  "rw": "...",
  "latitude": "...",
  "longitude": "...",
  "lastEducation": "...",
  "institutionName": "...",
  "major": "...",
  "graduationYear": 2024,
  "skills": "...",
  "workExperience": "...",
  "bankName": "...",
  "accountNumber": "...",
  "emergencyName": "...",
  "emergencyRelation": "...",
  "emergencyPhone": "..."
}
`;

export default async function handler(req: any, res: any) {
  applyCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { messages } = req.body;

  if (!process.env.GROK_API_KEY) {
    return res.status(500).json({
      error: 'GROK_API_KEY belum dikonfigurasi di Vercel Environment Variables',
    });
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Field 'messages' harus berupa array" });
  }

  try {
    const trimmedMessages = messages.slice(-12);

    const grokMessages = [
      { role: 'system', content: SARA_SYSTEM_INSTRUCTION },
      ...trimmedMessages.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-4.3',
        messages: grokMessages,
        temperature: 0.6,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Grok API Error:', errorData);

      if (response.status === 429) {
        return res.status(429).json({
          error: 'Maaf, kuota Grok sedang penuh. Silakan coba lagi dalam beberapa saat.',
          retryAfter: 30,
        });
      }

      return res.status(500).json({
        error: 'Maaf, terjadi gangguan pada layanan AI. Silakan coba lagi nanti.',
      });
    }

    const data = await response.json();
    const replyText = (data.choices?.[0]?.message?.content || '').trim();

    let savedCandidate: Awaited<ReturnType<typeof trySaveCandidateFromReply>> = null;
    try {
      savedCandidate = await trySaveCandidateFromReply(replyText);
    } catch (saveError: any) {
      console.error('Auto-save candidate error:', saveError);
    }

    return res.status(200).json({
      reply: replyText,
      saved: Boolean(savedCandidate),
      candidateId: savedCandidate?.id ?? null,
    });
  } catch (error: any) {
    console.error('Grok Error:', error);
    return res.status(500).json({
      error: 'Maaf, terjadi gangguan pada layanan AI. Silakan coba lagi nanti.',
    });
  }
}