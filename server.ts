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
import { initSentryServer, captureServerError } from "./lib/sentry-server";
import { extractPureJsonReply } from "./lib/candidate";
import {
  callKomodoSaraChat,
  SaraKomodoError,
  saraKomodoErrorResponse,
  type SaraChatMessage,
} from "./lib/sara-komodo-chat";

async function startServer() {
  initSentryServer();

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

  // API route for recruitment AI chat assistant (Komodo-7B via Hugging Face)
  app.post("/api/recruitment-chat", async (req, res) => {
    if (!guardApi(req, res, { rateLimit: RATE_LIMITS.chat, requireOrigin: true })) return;
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Field 'messages' harus berupa array" });
    }

    try {
      const trimmedMessages: SaraChatMessage[] = messages.slice(-12).map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content ?? ""),
      }));

      let replyText = await callKomodoSaraChat(trimmedMessages);
      const pureJson = extractPureJsonReply(replyText);
      if (pureJson) replyText = pureJson;

      res.json({
        reply: replyText,
        isPureJson: Boolean(pureJson),
        model: "komodo-ai/Komodo-7B-Instruct",
      });
    } catch (error: unknown) {
      if (error instanceof SaraKomodoError) {
        const { status, body } = saraKomodoErrorResponse(error);
        console.error("Komodo HF Error:", error.code, error.message);
        return res.status(status).json(body);
      }
      console.error("Recruitment chat error:", error);
      res.status(500).json({
        error: "Maaf, terjadi gangguan pada layanan AI Sara. Silakan coba lagi nanti.",
        code: "API_ERROR",
      });
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
