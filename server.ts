import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import { GoogleGenAI, Type } from "@google/genai";
import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb, isAdminConfigured, testAdminConnection } from "./lib/firebase-admin";
import { applyNoStoreHeaders } from "./lib/api-cache";
import { applySecurityHeaders, applyApiSecurityHeaders } from "./lib/security-headers";
import { guardApi, sanitizeServerError } from "./lib/api-security";
import { RATE_LIMITS } from "./lib/api-rate-limit";
import {
  listCollection,
  listJobs,
  setDocument,
  updateDocument,
  deleteDocument,
  seedAllCollections,
} from "./lib/db-api";
import { formatFirebaseError, toHttpStatus } from "./lib/firebase-errors";
import { JOBS_COLLECTION, normalizeJobFromFirestore } from "./lib/job-record";

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
   - Koordinat Peta: Arahkan pelamar untuk memberikan link Google Maps lokasi domisili mereka. (Ekstrak url tersebut menjadi koordinat latitude dan longitude jika bisa, atau simpan saja link tersebut).
4. Alur Pengumpulan Data (Tahap 1 s.d. 3):
   - Tahap 1 (Identitas): Posisi yang dilamar, Nama Lengkap, NIK, No KK, NPWP, Tempat & Tanggal Lahir (YYYY-MM-DD), Gender, Status Nikah, Agama, kesediaan Relokasi, dan Sertifikasi-sertifikasi Anda.
   - Tahap 2 (Kontak): Email, No WhatsApp, Alamat Lengkap (Provinsi, Kabupaten/Kota, Kecamatan, Desa/Kelurahan, RT, RW), Koordinat Peta (Link Google Maps).
   - Tahap 3 (Profesional): Pendidikan Terakhir, Perbankan (Nama Bank, Nomor Rekening), Kontak Darurat (Nama, Hubungan, Nomor Telepon), Keahlian/Skill, dan Riwayat Kerja secara singkat.
   - Tahap 4 (Dokumen): Instruksikan pelamar bahwa pengunggahan dokumen (Surat Lamaran, CV, KTP, KK, Ijazah, Foto Diri) akan diinstruksikan melalui portal setelah konfirmasi data pendaftaran ini selesai.

5. Format Output Kritis:
   - Selama data belum lengkap, berikan balasan chat yang alami dan ramah.
   - HANYA SETELAH seluruh data Tahap 1, Tahap 2, dan Tahap 3 sudah lengkap terkumpul dan divalidasi dengan baik, Anda wajib memberikan respon berupa SATU BLOCK JSON MURNI (tanpa teks pembuka atau kata penutup apapun, dan tanpa markdown block seperti \`\`\`json) agar server kami dapat langsung memproses datanya secara terstruktur.
   
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

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 5173;

  app.use(express.json());

  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      applyApiSecurityHeaders(res);
    } else {
      applySecurityHeaders(res);
    }
    next();
  });

  // Initialize server-side Firebase Admin SDK (env-based, firebase-admin v14 modular API)
  let adminDb: Firestore | null = null;
  try {
    if (isAdminConfigured()) {
      adminDb = getAdminDb();
      const health = await testAdminConnection();
      if (health.ok) {
        console.log(
          `🚀 Server-Side Firestore Ready (project: ${health.projectId}, database: ${health.databaseId})`
        );
      } else {
        console.warn("⚠️ Firestore Admin configured but connection test failed:", health.error);
      }
    } else {
      console.warn(
        "⚠️ Firebase Admin not configured — set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
      );
    }
  } catch (err) {
    console.error("❌ Firebase Admin init error:", err);
  }

  app.get("/api/firebase-health", async (req, res) => {
    if (!guardApi(req, res, { rateLimit: RATE_LIMITS.dbRead })) return;
    applyNoStoreHeaders(res);
    const health = await testAdminConnection();
    res.status(health.ok ? 200 : 503).json({
      ok: health.ok,
      timestamp: new Date().toISOString(),
      admin: health,
    });
  });

  // Initialize server-side GoogleGenAI Client
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API route for recruitment AI chat assistant
  app.post("/api/recruitment-chat", async (req, res) => {
    if (!guardApi(req, res, { rateLimit: RATE_LIMITS.chat, requireOrigin: true })) return;
    const { messages } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Server-side GEMINI_API_KEY is not configured yet. Please configure it in Settings > Secrets." });
    }

    try {
      const contents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: SARA_SYSTEM_INSTRUCTION,
          temperature: 0.6,
        },
      });

      const replyText = response.text || "";
      res.json({ reply: replyText.trim() });
    } catch (error: any) {
      console.error("Gemini API Error in Recruitment Chat:", error);
      res.status(500).json({ error: error.message || "Failed to process chat with AI Assistant" });
    }
  });

  app.post("/api/ai-interview-analyze", async (req, res) => {
    if (!guardApi(req, res, { rateLimit: RATE_LIMITS.aiInterview, requireOrigin: true })) return;

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return res.status(503).json({ error: "GEMINI_API_KEY belum dikonfigurasi di server." });
    }

    const { fullName, positionApplied, transcript } = req.body || {};
    if (!transcript || typeof transcript !== "object") {
      return res.status(400).json({ error: "Field 'transcript' wajib berupa object." });
    }

    try {
      const prompt = `
Analyze the following candidate interview based on the STAR method.

Context:
Candidate Name: ${fullName || "Candidate"}
Position: ${positionApplied || "N/A"}

Transcript:
Situation: ${transcript.situation || "No answer"}
Task: ${transcript.task || "No answer"}
Action: ${transcript.action || "No answer"}
Result: ${transcript.result || "No answer"}

Provide:
1. A brief analysis for each STAR component.
2. An overall score (0-100).
3. A summary of the candidate's performance.
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
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
                },
              },
              overallScore: { type: Type.NUMBER },
              summary: { type: Type.STRING },
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.status(200).json({ result: parsed });
    } catch (error: unknown) {
      console.error("ai-interview-analyze error:", error);
      const message = error instanceof Error ? error.message : "Gagal menganalisis interview.";
      return res.status(500).json({ error: sanitizeServerError(message) });
    }
  });

  // API route for Telegram notification
  app.post("/api/send-telegram", async (req, res) => {
    if (!guardApi(req, res, { rateLimit: RATE_LIMITS.telegram, requireOrigin: true })) return;
    const { message } = req.body;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!token || !chatId) {
        return res.status(500).json({ error: "Telegram configuration incomplete" });
    }
    
    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: message
        });
        res.json({ success: true });
    } catch (error) {
        console.error("Telegram error:", error);
        res.status(500).json({ error: "Failed to send message" });
    }
  });

  // REST API routes for robust server-side database CRUD operations
  app.get("/api/db/:collection", async (req, res) => {
    if (!guardApi(req, res, { rateLimit: RATE_LIMITS.dbRead })) return;
    applyNoStoreHeaders(res);
    const { collection } = req.params;
    try {
      if (collection === JOBS_COLLECTION) {
        const list = await listJobs();
        const jobs = list.map((doc) => normalizeJobFromFirestore(doc));
        return res.status(200).json(jobs);
      }
      const list = await listCollection(collection);
      res.status(200).json(list);
    } catch (error: unknown) {
      console.error(`Database admin get error for collection ${collection}:`, error);
      res.status(toHttpStatus(error)).json({
        error: formatFirebaseError(error) || "Failed to fetch collection",
      });
    }
  });

  app.post("/api/db/:collection/:id", async (req, res) => {
    if (!guardApi(req, res, { rateLimit: RATE_LIMITS.dbWrite, requireOrigin: true })) return;
    applyNoStoreHeaders(res);
    const { collection, id } = req.params;
    const data = req.body;
    if (!adminDb) return res.status(500).json({ error: "Database not initialized on server" });
    try {
      const result = await setDocument(collection, id, data);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error(`Database admin set error on collection ${collection}:`, error);
      res.status(500).json({ error: error.message || "Failed to set document" });
    }
  });

  app.put("/api/db/:collection/:id", async (req, res) => {
    if (!guardApi(req, res, { rateLimit: RATE_LIMITS.dbWrite, requireOrigin: true })) return;
    applyNoStoreHeaders(res);
    const { collection, id } = req.params;
    const updates = req.body;
    if (!adminDb) return res.status(500).json({ error: "Database not initialized on server" });
    try {
      const result = await updateDocument(collection, id, updates);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error(`Database admin update error on collection ${collection}:`, error);
      res.status(500).json({ error: error.message || "Failed to update document" });
    }
  });

  app.delete("/api/db/:collection/:id", async (req, res) => {
    if (!guardApi(req, res, { rateLimit: RATE_LIMITS.dbWrite, requireOrigin: true })) return;
    applyNoStoreHeaders(res);
    const { collection, id } = req.params;
    if (!adminDb) return res.status(500).json({ error: "Database not initialized on server" });
    try {
      const result = await deleteDocument(collection, id);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error(`Database admin delete error on collection ${collection}:`, error);
      res.status(500).json({ error: error.message || "Failed to delete document" });
    }
  });

  app.post("/api/db/seed/all", async (req, res) => {
    if (!guardApi(req, res, { rateLimit: RATE_LIMITS.seed, requireAdmin: true })) return;
    applyNoStoreHeaders(res);
    if (!adminDb) return res.status(500).json({ error: "Database not initialized on server" });
    try {
      await seedAllCollections(req.body);
      res.json({ success: true, message: "Database seeded successfully from server-side batch!" });
    } catch (error: any) {
      console.error("Failed to seed database server-side:", error);
      res.status(500).json({ error: error.message || "Failed server-side seeding batch write" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (process.env.NODE_ENV !== "production") {
      console.log(`GA4 debug: http://localhost:${PORT}/#/?ga_debug=1`);
    }
  });
}

startServer();
